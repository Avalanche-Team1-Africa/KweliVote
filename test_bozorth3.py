#!/usr/bin/env python3
"""A simple test script for our fix"""

# Import basic modules only
import os
import subprocess
import tempfile

print("Testing XYT minutiae fix")

# Create some sample minutiae with problematic coordinates
minutiae = [(25601, 300, 1), (1, 310, 1), (5121, 320, 1), (10241, 330, 1)]
print(f"Original minutiae: {minutiae}")

# Apply our fix
fixed_minutiae = []
for x, y, theta in minutiae:
    fixed_x = x & 0x3FFF  # Keep only lowest 14 bits
    fixed_y = y & 0x3FFF  # Keep only lowest 14 bits
    
    # Properly normalize X, Y within valid range (0-499)
    fixed_x = min(499, max(0, fixed_x))
    fixed_y = min(499, max(0, fixed_y))
    # Properly normalize angle to 0-179 range for BOZORTH3
    fixed_theta = theta % 180
    
    fixed_minutiae.append((fixed_x, fixed_y, fixed_theta))

print(f"Fixed minutiae: {fixed_minutiae}")

# Optimize minutiae by keeping only the most reliable ones (central minutiae)
if len(fixed_minutiae) > 0:
    # Define center point (assuming 250,250 is center of coordinate space)
    center_x, center_y = 250, 250
    
    # Sort minutiae by distance from center (central minutiae are usually more reliable)
    original_count = len(fixed_minutiae)
    fixed_minutiae.sort(key=lambda m: ((m[0]-center_x)**2 + (m[1]-center_y)**2))
    
    # Keep only a subset of minutiae for faster matching
    max_minutiae = 40  # A good balance between accuracy and speed
    if len(fixed_minutiae) > max_minutiae:
        fixed_minutiae = fixed_minutiae[:max_minutiae]
        print(f"Optimized minutiae count from {original_count} to {len(fixed_minutiae)} for faster matching")

# Test Bozorth3 self-matching with these minutiae
with tempfile.TemporaryDirectory() as temp_dir:
    # Create a temporary XYT file
    xyt_path = os.path.join(temp_dir, "test.xyt")
    with open(xyt_path, 'w') as f:
        for x, y, theta in fixed_minutiae:
            # Ensure coordinates and angles are properly normalized
            clamped_x = min(499, max(0, x))
            clamped_y = min(499, max(0, y))
            clamped_theta = theta % 180
            f.write(f"{clamped_x} {clamped_y} {clamped_theta}\n")
    
    # Try Bozorth3 self-matching
    try:
        result = subprocess.run(
            ['bozorth3', xyt_path, xyt_path],
            capture_output=True, text=True
        )
        
        print(f"Bozorth3 exit code: {result.returncode}")
        print(f"Bozorth3 output: {result.stdout.strip()}")
        
        if result.returncode == 0 and result.stdout.strip():
            match_score = int(result.stdout.strip())
            print(f"Self-matching score: {match_score}")
        else:
            print(f"Bozorth3 error: {result.stderr}")
    except Exception as e:
        print(f"Error running Bozorth3: {str(e)}")

print("Test completed.")
