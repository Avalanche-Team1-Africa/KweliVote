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
    
    fixed_x = min(499, fixed_x)
    fixed_y = min(499, fixed_y)
    
    fixed_minutiae.append((fixed_x, fixed_y, theta))

print(f"Fixed minutiae: {fixed_minutiae}")

# Test Bozorth3 self-matching with these minutiae
with tempfile.TemporaryDirectory() as temp_dir:
    # Create a temporary XYT file
    xyt_path = os.path.join(temp_dir, "test.xyt")
    with open(xyt_path, 'w') as f:
        for x, y, theta in fixed_minutiae:
            f.write(f"{x} {y} {theta}\n")
    
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
