#!/usr/bin/env python3
"""Debug the Bozorth3 matching logic."""

import json
import base64
import tempfile
import subprocess
import os
import numpy as np

print("Loading enrollment template...")
with open('docs/fingerprint_reader/test_output/102_6_template.json', 'r') as f:
    enrollment_template = json.load(f)

print("Loading verification template...")
with open('docs/fingerprint_reader/test_output/102_6_verification_template.json', 'r') as f:
    verification_template = json.load(f)

# Extract ISO template from enrollment
enrollment_iso = enrollment_template['iso_template_base64']
iso_data = base64.b64decode(enrollment_iso)

print(f"ISO template binary size: {len(iso_data)} bytes")

# Decode ISO template to understand its structure
print("\n=== ISO TEMPLATE STRUCTURE ===")
print("Header (first 32 bytes):", iso_data[:32].hex())

# Extract minutiae count from header (at position 31)
minutiae_count = iso_data[31] if len(iso_data) > 31 else 0
print(f"Minutiae count from ISO header: {minutiae_count}")

# Extract minutiae from ISO template (starting at byte 32, 6 bytes per minutia)
print("\n=== EXTRACTED MINUTIAE FROM ISO ===")
offset = 32
extracted_minutiae = []

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
        
        extracted_minutiae.append((x, y, theta))
        if i < 10:  # Print first 10 minutiae
            print(f"Minutia {i+1}: ({x}, {y}, {theta})")

print(f"Total extracted minutiae: {len(extracted_minutiae)}")

# Compare with verification template XYT data
if 'xyt_data' in verification_template:
    xyt_b64 = verification_template['xyt_data']
    xyt_text = base64.b64decode(xyt_b64).decode('utf-8')
    
    print("\n=== VERIFICATION XYT DATA ===")
    xyt_lines = [line.strip() for line in xyt_text.strip().split('\n') if line.strip()]
    print(f"XYT lines count: {len(xyt_lines)}")
    
    for i, line in enumerate(xyt_lines[:10]):  # Print first 10 lines
        parts = line.split()
        if len(parts) >= 3:
            x, y, theta = int(parts[0]), int(parts[1]), int(parts[2])
            print(f"XYT {i+1}: ({x}, {y}, {theta})")

# NEW: Fix the minutiae coordinates before writing to XYT file
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
    
    # Extract coordinates
    x_coords = np.array([m[0] for m in minutiae_list])
    y_coords = np.array([m[1] for m in minutiae_list])
    theta_vals = np.array([m[2] for m in minutiae_list])
    
    # Check if we need to scale
    need_scaling = np.max(x_coords) > 1000 or np.max(y_coords) > 1000
    
    if need_scaling:
        print("\n=== FIXING SUSPICIOUS COORDINATES ===")
        print(f"Before scaling - X range: {np.min(x_coords)} to {np.max(x_coords)}")
        print(f"Before scaling - Y range: {np.min(y_coords)} to {np.max(y_coords)}")
        
        # Determine if we should normalize or scale down
        if np.max(x_coords) > 10000:  # Very large values - likely bit shift errors
            # We need to properly decode the bit-shifted values
            # These large values might be due to incorrect bit interpretation
            # The most significant bit (MSB) of x_high and y_high should be 0 (sign bit)
            fixed_minutiae = []
            for x, y, theta in minutiae_list:
                # Extract only the proper 14 bits for coordinates (7+8)
                # In ISO/IEC 19794-2 format, coordinates are 14 bits (7+8)
                fixed_x = x & 0x3FFF  # Keep only lowest 14 bits
                fixed_y = y & 0x3FFF  # Keep only lowest 14 bits
                
                # Ensure coordinates are within valid range (0-499)
                fixed_x = min(499, fixed_x)
                fixed_y = min(499, fixed_y)
                
                fixed_minutiae.append((fixed_x, fixed_y, theta))
        else:
            # Simply scale down if needed
            max_x = np.max(x_coords)
            max_y = np.max(y_coords)
            
            if max_x > 499 or max_y > 499:
                # Scale to fit within 0-499 range
                scale_factor_x = 499.0 / max_x if max_x > 499 else 1.0
                scale_factor_y = 499.0 / max_y if max_y > 499 else 1.0
                scale_factor = min(scale_factor_x, scale_factor_y)
                
                fixed_minutiae = []
                for x, y, theta in minutiae_list:
                    fixed_x = int(x * scale_factor)
                    fixed_y = int(y * scale_factor)
                    fixed_minutiae.append((fixed_x, fixed_y, theta))
            else:
                fixed_minutiae = minutiae_list
        
        # Print the results of the fixing
        fixed_x_coords = np.array([m[0] for m in fixed_minutiae])
        fixed_y_coords = np.array([m[1] for m in fixed_minutiae])
        print(f"After fixing - X range: {np.min(fixed_x_coords)} to {np.max(fixed_x_coords)}")
        print(f"After fixing - Y range: {np.min(fixed_y_coords)} to {np.max(fixed_y_coords)}")
        print(f"First 5 fixed minutiae: {fixed_minutiae[:5]}")
        
        return fixed_minutiae
    else:
        # No scaling needed
        return minutiae_list

# Fix the minutiae before writing to XYT files
fixed_minutiae = fix_minutiae_coordinates(extracted_minutiae)

# Test direct Bozorth3 matching using temporary files
print("\n=== TESTING BOZORTH3 MATCHING ===")
with tempfile.TemporaryDirectory() as temp_dir:
    # Create XYT file from verification template with fixed minutiae
    verify_xyt_path = os.path.join(temp_dir, "verify.xyt")
    with open(verify_xyt_path, 'w') as f:
        for x, y, theta in fixed_minutiae:
            f.write(f"{x} {y} {theta}\n")
    
    # Create XYT file from ISO conversion (what we use for matching)
    iso_xyt_path = os.path.join(temp_dir, "iso.xyt")
    with open(iso_xyt_path, 'w') as f:
        for x, y, theta in fixed_minutiae:
            f.write(f"{x} {y} {theta}\n")
    
    print(f"Created XYT files: {verify_xyt_path}, {iso_xyt_path}")
    
    # Test self-matching with Bozorth3
    try:
        result = subprocess.run([
            'bozorth3', verify_xyt_path, iso_xyt_path
        ], capture_output=True, text=True, check=True)
        
        match_score = int(result.stdout.strip())
        print(f"Bozorth3 self-match score: {match_score}")
        
        if match_score == 0:
            print("❌ Self-matching failed! This indicates an issue with XYT format or minutiae data.")
        else:
            print(f"✅ Self-matching successful with score: {match_score}")
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Bozorth3 error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
    except FileNotFoundError:
        print("❌ Bozorth3 not found. Please install NBIS tools.")

# Check if minutiae data looks reasonable
print("\n=== MINUTIAE DATA VALIDATION ===")
x_coords = [m[0] for m in fixed_minutiae]
y_coords = [m[1] for m in fixed_minutiae]
angles = [m[2] for m in fixed_minutiae]

print(f"X coordinate range: {min(x_coords)} - {max(x_coords)}")
print(f"Y coordinate range: {min(y_coords)} - {max(y_coords)}")
print(f"Angle range: {min(angles)} - {max(angles)}")

# Check for obviously wrong data
weird_coords = [(x, y) for x, y, _ in fixed_minutiae if x > 499 or y > 499 or x < 0 or y < 0]
if weird_coords:
    print(f"❌ Found {len(weird_coords)} minutiae with suspicious coordinates: {weird_coords[:5]}")
else:
    print("✅ All minutiae coordinates look reasonable")