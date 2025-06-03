#!/usr/bin/env python3
"""A simple test script for our fix"""

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

print("Test completed.")
