#!/usr/bin/env python3
"""Debug the Bozorth3 matching logic."""

import json
import base64
import tempfile
import subprocess
import os
import time
from datetime import timedelta

try:
    import numpy as np
    print("NumPy imported successfully")
except ImportError:
    print("NumPy not found, continuing without it")
    np = None

# Dictionary to store timing results
timing_results = {}

def measure_time(operation_name):
    """Context manager to measure execution time of operations."""
    class TimingContext:
        def __enter__(self):
            self.start_time = time.time()
            return self
            
        def __exit__(self, exc_type, exc_val, exc_tb):
            elapsed_time = time.time() - self.start_time
            timing_results[operation_name] = elapsed_time
            print(f"⏱️ {operation_name}: {elapsed_time:.4f} seconds")
            
    return TimingContext()

print("===== FINGERPRINT MATCHING DEBUGGING =====")

with measure_time("Loading enrollment template"):
    print("Loading enrollment template...")
with open('docs/fingerprint_reader/test_output/102_6_template.json', 'r') as f:
    enrollment_template = json.load(f)

with measure_time("Loading verification template"):
    print("Loading verification template...")
    with open('docs/fingerprint_reader/test_output/102_6_verification_template.json', 'r') as f:
        verification_template = json.load(f)

# Extract ISO template from enrollment
with measure_time("ISO template extraction"):
    enrollment_iso = enrollment_template['iso_template_base64']
    iso_data = base64.b64decode(enrollment_iso)

    print(f"ISO template binary size: {len(iso_data)} bytes")

    # Decode ISO template to understand its structure
    print("\n=== ISO TEMPLATE STRUCTURE ===")
    print("Header (first 32 bytes):", iso_data[:32].hex())

# Extract minutiae count from header (at position 31)
minutiae_count = iso_data[31] if len(iso_data) > 31 else 0
print(f"Minutiae count from ISO header: {minutiae_count}")

# Validate the minutiae count - sometimes it can be corrupted
if minutiae_count > 200:  # Reasonable upper limit for fingerprint minutiae
    print(f"⚠️ Warning: Unusually high minutiae count ({minutiae_count}), limiting to 100")
    minutiae_count = min(100, (len(iso_data) - 32) // 6)  # Estimate based on file size

# Ensure we don't try to read more minutiae than can fit in the file
max_possible_minutiae = (len(iso_data) - 32) // 6
if minutiae_count > max_possible_minutiae:
    print(f"⚠️ Warning: Minutiae count ({minutiae_count}) exceeds what can fit in the file, limiting to {max_possible_minutiae}")
    minutiae_count = max_possible_minutiae

# Extract minutiae from ISO template (starting at byte 32, 6 bytes per minutia)
with measure_time("Minutiae extraction from ISO"):
    print("\n=== EXTRACTED MINUTIAE FROM ISO ===")
    offset = 32
    extracted_minutiae = []

    for i in range(minutiae_count):
        idx = offset + (i * 6)
        if idx + 6 <= len(iso_data):
            # Extract x, y, and theta from the ISO format
            x_high = iso_data[idx] & 0x7F  # 7 bits from the first byte
            x_low = iso_data[idx+1]        # 8 bits from the second byte
            x = (x_high << 8) | x_low
            
            y_high = iso_data[idx+2] & 0x7F  # 7 bits from the third byte
            y_low = iso_data[idx+3]          # 8 bits from the fourth byte
            y = (y_high << 8) | y_low
            
            theta = iso_data[idx+4]
            
            extracted_minutiae.append((x, y, theta))
            if i < 10:  # Print first 10 minutiae
                print(f"Minutia {i+1}: ({x}, {y}, {theta})")

    print(f"Total extracted minutiae: {len(extracted_minutiae)}")

# Compare with verification template XYT data
with measure_time("XYT data processing"):
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

# Fix the extracted minutiae by properly normalizing coordinates and angles
with measure_time("Minutiae coordinate fixing"):
    fixed_minutiae = []
    for x, y, theta in extracted_minutiae:
        # Extract only the proper 14 bits for coordinates (7 bits high, 8 bits low)
        # In ISO/IEC 19794-2 format, coordinates are 14 bits (7+8)
        fixed_x = x & 0x3FFF  # Keep only lowest 14 bits
        fixed_y = y & 0x3FFF  # Keep only lowest 14 bits
        
        # Properly normalize X, Y within valid range (0-499)
        fixed_x = min(499, max(0, fixed_x))
        fixed_y = min(499, max(0, fixed_y))
        
        # Properly normalize angle to 0-179 range for BOZORTH3
        fixed_theta = theta % 180
        
        fixed_minutiae.append((fixed_x, fixed_y, fixed_theta))

    # Print the fixed minutiae for comparison
    print("\n=== FIXED MINUTIAE ===")
    for i, (x, y, theta) in enumerate(fixed_minutiae[:10]):
        print(f"Fixed Minutia {i+1}: ({x}, {y}, {theta})")
    
    # Optimize minutiae count for performance
    # Select the most reliable minutiae (usually those near the center of the fingerprint)
    # This significantly improves matching speed with minimal impact on accuracy
    with measure_time("Minutiae optimization"):
        # Define center point of coordinate space
        center_x, center_y = 250, 250
        
        # Sort minutiae by distance from center (central minutiae are usually more reliable)
        fixed_minutiae.sort(key=lambda m: ((m[0]-center_x)**2 + (m[1]-center_y)**2))
        
        # Store original count for comparison
        original_minutiae_count = len(fixed_minutiae)
        
        # Keep only a subset of minutiae for faster matching (40-60 is usually sufficient)
        max_minutiae = 50
        if len(fixed_minutiae) > max_minutiae:
            fixed_minutiae = fixed_minutiae[:max_minutiae]
            print(f"⚡ Optimized minutiae count from {original_minutiae_count} to {len(fixed_minutiae)} for faster matching")

# Test direct Bozorth3 matching using temporary files
print("\n=== TESTING BOZORTH3 MATCHING ===")
with measure_time("Bozorth3 matching tests"):
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
        
        # Run multiple Bozorth3 tests with different parameters
        print("\n=== TESTING DIFFERENT BOZORTH3 PARAMETERS ===")
        
        # Test 1: Standard self-matching
        with measure_time("Standard self-matching"):
            try:
                result = subprocess.run([
                    'bozorth3', verify_xyt_path, iso_xyt_path
                ], capture_output=True, text=True, check=True)
                
                match_score = int(result.stdout.strip())
                print(f"Standard self-match score: {match_score}")
                
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
        
        # Test 2: Using a different output format option
        with measure_time("Alternative format test"):
            try:
                result = subprocess.run([
                    'bozorth3', '-A', 'outfmt=sgm', verify_xyt_path, iso_xyt_path
                ], capture_output=True, text=True)
                
                # Handle both success and error cases
                if result.returncode == 0:
                    match_score_str = result.stdout.strip().split()[0] if result.stdout.strip() else "0"
                    match_score = int(match_score_str)
                    print(f"Alternative format self-match score: {match_score}")
                else:
                    print(f"Alternative format: Command exited with code {result.returncode}")
                    print(f"stderr: {result.stderr}")
                    # Try the command without the format option as fallback
                    result = subprocess.run([
                        'bozorth3', verify_xyt_path, iso_xyt_path
                    ], capture_output=True, text=True, check=True)
                    match_score = int(result.stdout.strip())
                    print(f"Fallback score: {match_score}")
            except Exception as e:
                print(f"❌ Alternative format test error: {e}")
        
        # Test 3: With relaxed matching threshold
        with measure_time("Relaxed threshold test"):
            try:
                result = subprocess.run([
                    'bozorth3', '-T', '10', verify_xyt_path, iso_xyt_path
                ], capture_output=True, text=True, check=True)
                
                match_score = int(result.stdout.strip())
                print(f"Relaxed threshold (10) self-match score: {match_score}")
            except Exception as e:
                print(f"❌ Relaxed threshold test error: {e}")
            
        # Test 4: With angle format adjustment for better matching
        with measure_time("Angle format adjustment test"):
            try:
                # Create modified XYT files with angle format adjustment
                # BOZORTH3 angle format is 0-179, some systems may use 0-255 or 0-359
                angle_adjusted_path = os.path.join(temp_dir, "angle_adjusted.xyt")
                with open(angle_adjusted_path, 'w') as f:
                    for x, y, theta in fixed_minutiae:
                        # The angles should already be normalized at this point
                        # but we ensure they're in the 0-179 range as a safeguard
                        adjusted_theta = theta % 180
                        f.write(f"{x} {y} {adjusted_theta}\n")
                        
                result = subprocess.run([
                    'bozorth3', angle_adjusted_path, angle_adjusted_path
                ], capture_output=True, text=True, check=True)
                
                match_score = int(result.stdout.strip())
                print(f"Angle-adjusted self-match score: {match_score}")
            except Exception as e:
                print(f"❌ Angle adjustment test error: {e}")

# Check if minutiae data looks reasonable
with measure_time("Minutiae data validation"):
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

# Print timing summary
print("\n===== TIMING SUMMARY =====")
total_time = sum(timing_results.values())
for operation, duration in sorted(timing_results.items(), key=lambda x: x[1], reverse=True):
    percentage = (duration / total_time) * 100
    print(f"{operation}: {duration:.4f}s ({percentage:.1f}%)")

print(f"\nTotal execution time: {total_time:.4f} seconds")