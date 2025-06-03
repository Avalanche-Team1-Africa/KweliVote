#!/usr/bin/env python3
"""Verify the Bozorth3 matching fix for XYT coordinates."""

import base64
import json
import tempfile
import subprocess
import os

def fix_minutiae_coordinates(minutiae_list):
    """
    Scale and normalize minutiae coordinates to ensure they're within a valid range.
    
    The minutiae data from the ISO template may have extremely large X values that 
    are causing Bozorth3 to fail. This function scales them down to the expected range.
    
    Args:
        minutiae_list: List of (x, y, theta) tuples
        
    Returns:
        List of fixed (x, y, theta) tuples
    """
    if not minutiae_list:
        return []
    
    fixed_minutiae = []
    for x, y, theta in minutiae_list:
        # Extract only the proper 14 bits for coordinates (7 bits high, 8 bits low)
        # In ISO/IEC 19794-2 format, coordinates are 14 bits (7+8)
        fixed_x = x & 0x3FFF  # Keep only lowest 14 bits
        fixed_y = y & 0x3FFF  # Keep only lowest 14 bits
        
        # Ensure coordinates are within valid range (0-499)
        fixed_x = min(499, fixed_x)
        fixed_y = min(499, fixed_y)
        
        fixed_minutiae.append((fixed_x, fixed_y, theta))
    
    print(f"Fixed minutiae coordinates: reduced from range {min([m[0] for m in minutiae_list])}-{max([m[0] for m in minutiae_list])} to {min([m[0] for m in fixed_minutiae])}-{max([m[0] for m in fixed_minutiae])}")
    
    return fixed_minutiae

def extract_minutiae_from_iso(iso_data):
    """Extract minutiae from ISO template binary data."""
    minutiae = []
    offset = 32  # Skip header
    minutiae_count = iso_data[offset-1] if len(iso_data) > 31 else 0
    
    for i in range(minutiae_count):
        idx = offset + (i * 6)
        if idx + 6 <= len(iso_data):
            # Extract x, y, and theta from the ISO format
            x_high = iso_data[idx] & 0x7F
            x_low = iso_data[idx+1]
            x = (x_high << 8) | x_low
            
            y_high = iso_data[idx+2] & 0x7F
            y_low = iso_data[idx+3]
            y = (y_high << 8) | y_low
            
            theta = iso_data[idx+4]
            
            minutiae.append((x, y, theta))
    
    return minutiae

def test_self_matching(template_path):
    """Test if a template matches itself with the fix applied."""
    print(f"Loading template from {template_path}")
    with open(template_path, 'r') as f:
        template = json.load(f)
    
    # Extract ISO template
    if 'iso_template_base64' not in template:
        print("Error: Template does not contain iso_template_base64 field")
        return False
    
    iso_b64 = template['iso_template_base64']
    iso_data = base64.b64decode(iso_b64)
    
    # Extract minutiae
    minutiae = extract_minutiae_from_iso(iso_data)
    print(f"Extracted {len(minutiae)} minutiae points")
    
    # Fix minutiae coordinates
    fixed_minutiae = fix_minutiae_coordinates(minutiae)
    
    # Create XYT files for Bozorth3
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create probe XYT file
        probe_path = os.path.join(temp_dir, "probe.xyt")
        with open(probe_path, 'w') as f:
            for x, y, theta in fixed_minutiae:
                f.write(f"{x} {y} {theta}\n")
        
        # Create gallery XYT file (same as probe for self-matching)
        gallery_path = os.path.join(temp_dir, "gallery.xyt")
        with open(gallery_path, 'w') as f:
            for x, y, theta in fixed_minutiae:
                f.write(f"{x} {y} {theta}\n")
        
        # Run Bozorth3 for matching
        try:
            result = subprocess.run(
                ['bozorth3', probe_path, gallery_path],
                capture_output=True, text=True, check=True
            )
            
            match_score = int(result.stdout.strip())
            print(f"Self-matching score: {match_score}")
            
            if match_score > 0:
                print("✅ Self-matching successful!")
                return True
            else:
                print("❌ Self-matching failed (score = 0)")
                return False
        except Exception as e:
            print(f"Error running Bozorth3: {str(e)}")
            return False

if __name__ == "__main__":
    # Test with the templates from the test output directory
    template_dir = "docs/fingerprint_reader/test_output"
    template_files = [f for f in os.listdir(template_dir) if f.endswith("_template.json")]
    
    success_count = 0
    failure_count = 0
    
    for template_file in template_files:
        print(f"\n=== Testing {template_file} ===")
        template_path = os.path.join(template_dir, template_file)
        if test_self_matching(template_path):
            success_count += 1
        else:
            failure_count += 1
    
    print(f"\n=== SUMMARY ===")
    print(f"Self-matching tests: {success_count} passed, {failure_count} failed")
