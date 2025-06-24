#!/usr/bin/env python3
"""Debug script to test verification matching."""

import json
import base64
import tempfile
import subprocess
import os
import time
import numpy as np
from datetime import timedelta
import logging
import sys
from contextlib import contextmanager

# Add the backend directory to the path so we can import the iso_fingerprint_template_app
sys.path.append(os.path.join(os.path.dirname(__file__), 'kwelivote-app/backend'))

from iso_fingerprint_template_app.fingerprint_processor import (
    FingerprintProcessor,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    IMAGE_DPI
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Dictionary to store timing results
timing_results = {}

@contextmanager
def measure_time(operation):
    """Context manager to measure execution time"""
    start = time.time()
    yield
    end = time.time()
    duration = end - start
    timing_results[operation] = duration
    print(f"{operation}: {duration:.3f} seconds")

def analyze_minutiae(minutiae_list, title="Minutiae Analysis"):
    """Analyze minutiae points and print statistics."""
    print(f"\n=== {title} ===")
    if not minutiae_list:
        print("No minutiae points found!")
        return
    
    x_coords = [m[0] for m in minutiae_list]
    y_coords = [m[1] for m in minutiae_list]
    angles = [m[2] for m in minutiae_list]
    
    print(f"Total minutiae points: {len(minutiae_list)}")
    print("\nCoordinate Statistics:")
    print(f"X-coordinates: min={min(x_coords)}, max={max(x_coords)}, mean={np.mean(x_coords):.1f}")
    print(f"Y-coordinates: min={min(y_coords)}, max={max(y_coords)}, mean={np.mean(y_coords):.1f}")
    print(f"Angles: min={min(angles)}, max={max(angles)}, mean={np.mean(angles):.1f}")
    
    # Calculate density map
    density_map = np.zeros((550, 500))  # Using 500x550 dimensions
    for x, y, _ in minutiae_list:
        if 0 <= x < 500 and 0 <= y < 550:
            density_map[int(y), int(x)] += 1
    
    dense_regions = np.where(density_map > 1)
    if len(dense_regions[0]) > 0:
        print("\nDense Regions (multiple minutiae):")
        for y, x in zip(*dense_regions):
            count = density_map[y, x]
            print(f"  Position ({x}, {y}): {int(count)} minutiae")
    
    # Analyze angle distribution
    angle_hist = np.histogram(angles, bins=8, range=(0, 180))[0]
    print("\nAngle Distribution (22.5° bins):")
    for i, count in enumerate(angle_hist):
        start_angle = i * 22.5
        end_angle = (i + 1) * 22.5
        print(f"  {start_angle:>3.1f}° - {end_angle:>3.1f}°: {count:>3} minutiae")

def analyze_template(template_data):
    """Analyze an ISO/XYT template and print detailed information."""
    print("\n=== Template Analysis ===")
    
    # Analyze ISO template
    if 'iso_template_base64' in template_data:
        iso_data = base64.b64decode(template_data['iso_template_base64'])
        print("\nISO Template Analysis:")
        print(f"Total size: {len(iso_data)} bytes")
        
        # Parse ISO header (ISO/IEC 19794-2 format)
        if len(iso_data) >= 32:
            header = iso_data[:32]
            print("\nHeader Analysis:")
            # Format ID ('FMR\0' in ASCII)
            format_id = header[:4].decode('ascii', errors='replace')
            print(f"Format ID: {format_id}")
            
            # Version (should be '20\0\0' for version 2.0)
            version = f"{header[4]}.{header[5]}"
            print(f"Version: {version}")
            
            # Record length (4 bytes, little-endian)
            length = int.from_bytes(header[8:12], 'little')
            print(f"Length: {length} bytes")
            
            # Capture device ID (2 bytes, vendor + device type)
            vendor_id = header[12]
            device_type = header[13]
            print(f"Capture device: Vendor 0x{vendor_id:02x}, Type 0x{device_type:02x}")
            
            # Image size (2 bytes each for width/height)
            width = int.from_bytes(header[16:18], 'little')
            height = int.from_bytes(header[18:20], 'little')
            print(f"Image size: {width}x{height} pixels")
            
            # Resolution (2 bytes each for X/Y)
            x_res = int.from_bytes(header[24:26], 'little')
            y_res = int.from_bytes(header[26:28], 'little')
            print(f"Resolution: {x_res}x{y_res} dpi")
            
            # Minutiae count (1 byte)
            minutiae_count = header[31]
            print(f"Minutiae count: {minutiae_count}")
            
            # Additional validation
            if width != IMAGE_WIDTH or height != IMAGE_HEIGHT:
                print(f"⚠️ Warning: Image dimensions {width}x{height} differ from expected {IMAGE_WIDTH}x{IMAGE_HEIGHT}")
            if x_res != IMAGE_DPI or y_res != IMAGE_DPI:
                print(f"⚠️ Warning: Resolution {x_res}x{y_res} dpi differs from expected {IMAGE_DPI} dpi")
    
    # Analyze XYT data
    if 'xyt_data' in template_data:
        try:
            xyt_text = base64.b64decode(template_data['xyt_data']).decode('utf-8')
            minutiae = []
            for line in xyt_text.strip().split('\n'):
                if line.strip():
                    x, y, t = map(int, line.split())
                    minutiae.append((x, y, t))
            
            analyze_minutiae(minutiae, "XYT Data Analysis")
        except Exception as e:
            print(f"Error analyzing XYT data: {e}")
    
    # Analyze metadata
    if 'metadata' in template_data:
        print("\nMetadata Analysis:")
        for key, value in template_data['metadata'].items():
            print(f"{key}: {value}")

def run_bozorth3_test(verify_xyt_path, iso_xyt_path, threshold=None):
    """Run a single Bozorth3 test with given parameters."""
    try:
        cmd = ['bozorth3', verify_xyt_path, iso_xyt_path]
        if threshold is not None:
            cmd.extend(['-T', str(threshold)])
            
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        match_score = int(result.stdout.strip())
        return match_score
    except Exception as e:
        print(f"❌ Bozorth3 error: {e}")
        return 0

def debug_fingerprint_matching(verification_template):
    """Debug fingerprint matching process using the new FingerprintProcessor"""
    print("\n===== FINGERPRINT MATCHING DEBUG =====")
    
    # Extract minutiae from ISO template
    with measure_time("Minutiae extraction from ISO"):
        print("\n=== EXTRACTED MINUTIAE FROM ISO ===")
        
        # Parse the XYT data
        xyt_b64 = verification_template['xyt_data']
        xyt_data = base64.b64decode(xyt_b64)
        minutiae_list = FingerprintProcessor.parse_xyt_data(xyt_data)
        
        analyze_minutiae(minutiae_list)
    
    # Process minutiae through the pipeline
    with measure_time("Minutiae processing pipeline"):
        print("\n=== PROCESSING PIPELINE ===")
        
        # Canonicalization
        print("\nCanonicalizing minutiae...")
        canonicalized = FingerprintProcessor.canonicalize_minutiae(minutiae_list)
        analyze_minutiae(canonicalized, "Canonicalized Minutiae")
        
        # Quantization
        print("\nQuantizing minutiae...")
        quantized = FingerprintProcessor.quantize_minutiae(canonicalized)
        analyze_minutiae(quantized, "Quantized Minutiae")
        
        # Optimization
        print("\nOptimizing minutiae...")
        optimized = FingerprintProcessor.optimize_minutiae(quantized)
        analyze_minutiae(optimized, "Optimized Minutiae")
    
    # Format XYT data
    with measure_time("XYT data formatting"):
        print("\n=== FINAL XYT DATA ===")
        final_xyt_data = FingerprintProcessor.format_xyt_data(optimized)
        print(f"XYT data size: {len(final_xyt_data)} bytes")
    
    # Test Bozorth3 matching
    print("\n=== TESTING BOZORTH3 MATCHING ===")
    with measure_time("Bozorth3 matching tests"):
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create XYT files
            verify_xyt_path = os.path.join(temp_dir, "verify.xyt")
            with open(verify_xyt_path, 'w') as f:
                for x, y, theta in optimized:
                    f.write(f"{x} {y} {theta}\n")
            
            # Create XYT file from ISO conversion
            iso_xyt_path = os.path.join(temp_dir, "iso.xyt")
            with open(iso_xyt_path, 'w') as f:
                for x, y, theta in optimized:
                    f.write(f"{x} {y} {theta}\n")
            
            print(f"\nCreated XYT files: {verify_xyt_path}, {iso_xyt_path}")
            
            # Run multiple Bozorth3 tests
            print("\n=== TESTING DIFFERENT BOZORTH3 PARAMETERS ===")
            
            # Test 1: Standard self-matching
            with measure_time("Standard self-matching"):
                match_score = run_bozorth3_test(verify_xyt_path, iso_xyt_path)
                print(f"Standard self-match score: {match_score}")
                if match_score == 0:
                    print("❌ Self-matching failed! This indicates an issue with XYT format or minutiae data.")
                else:
                    print(f"✅ Self-matching successful with score: {match_score}")
            
            # Test 2: With relaxed threshold
            with measure_time("Relaxed threshold test"):
                match_score = run_bozorth3_test(verify_xyt_path, iso_xyt_path, threshold=10)
                print(f"Relaxed threshold (10) self-match score: {match_score}")
    
    print("\n===== DEBUG COMPLETE =====")
    return {
        'original_count': len(minutiae_list),
        'final_count': len(optimized),
        'xyt_data': final_xyt_data
    }

if __name__ == "__main__":
    # Example verification template data
    print("Loading a sample fingerprint template...")
    with open('docs/fingerprint_reader/test_output/fingerprint(0)_template.json', 'r') as f:
        template = json.load(f)
    
    print("\nAnalyzing template structure...")
    analyze_template(template)
    
    print("\nRunning fingerprint matching debug...")
    debug_results = debug_fingerprint_matching(template)
    print("\nDebug Results:", debug_results)

# Print timing summary
print("\n===== TIMING SUMMARY =====")
total_time = sum(timing_results.values())
for operation, duration in sorted(timing_results.items(), key=lambda x: x[1], reverse=True):
    percentage = (duration / total_time) * 100
    print(f"{operation}: {duration:.4f}s ({percentage:.1f}%)")