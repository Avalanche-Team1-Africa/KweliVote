#!/usr/bin/env python3
"""Test script for fingerprint matching using the new FingerprintProcessor."""

import base64
import json
import tempfile
import subprocess
import os
import numpy as np
import logging
from iso_fingerprint_template_app.fingerprint_processor import FingerprintProcessor

logger = logging.getLogger(__name__)

def run_bozorth3_test(verify_xyt_path, gallery_xyt_path, threshold=None):
    """Run a single Bozorth3 test with given parameters."""
    try:
        cmd = ['bozorth3', verify_xyt_path, gallery_xyt_path]
        if threshold is not None:
            cmd.extend(['-T', str(threshold)])
            
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        match_score = int(result.stdout.strip())
        return match_score
    except Exception as e:
        logger.error(f"Bozorth3 error: {e}")
        return 0

def test_self_matching(template_path):
    """Test if a template matches itself using the new FingerprintProcessor."""
    print(f"Loading template from {template_path}")
    with open(template_path, 'r') as f:
        template = json.load(f)
    
    # Create processor instance
    processor = FingerprintProcessor()
    
    # Extract ISO template
    if 'iso_template_base64' not in template:
        print("Error: Template does not contain iso_template_base64 field")
        return False
    
    iso_b64 = template['iso_template_base64']
    iso_data = base64.b64decode(iso_b64)
    
    # Extract minutiae
    minutiae = processor.parse_iso_template(iso_data)
    print(f"Extracted {len(minutiae)} minutiae points")
    
    # Process minutiae through the pipeline
    canonicalized = processor.canonicalize_minutiae(minutiae)
    quantized = processor.quantize_minutiae(canonicalized)
    optimized = processor.optimize_minutiae(quantized)
    
    # Create XYT files for Bozorth3
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create probe XYT file
        probe_path = os.path.join(temp_dir, "probe.xyt")
        with open(probe_path, 'w') as f:
            for x, y, theta in optimized:
                f.write(f"{x} {y} {theta}\n")
        
        # Create gallery XYT file (same as probe for self-matching)
        gallery_path = os.path.join(temp_dir, "gallery.xyt")
        with open(gallery_path, 'w') as f:
            for x, y, theta in optimized:
                f.write(f"{x} {y} {theta}\n")
        
        # Run Bozorth3 for matching
        match_score = run_bozorth3_test(probe_path, gallery_path)
        print(f"Self-matching score: {match_score}")
        
        if match_score > 0:
            print("✅ Self-matching successful!")
            return True
        else:
            print("❌ Self-matching failed (score = 0)")
            return False

def test_fingerprint_matching():
    """Test fingerprint matching with the new FingerprintProcessor class"""
    # Create processor instance
    processor = FingerprintProcessor()
    
    # Test data
    minutiae_list = [
        (100, 100, 90),
        (150, 150, 45),
        (200, 200, 135),
        (250, 250, 180),
        (300, 300, 225)
    ]
    
    print("\n=== Testing FingerprintProcessor Pipeline ===")
    
    # Test canonicalization with IQR-based orientation
    print("\nTesting canonicalization with IQR-based orientation...")
    canonicalized = processor.canonicalize_minutiae(minutiae_list)
    print(f"Original minutiae: {minutiae_list[:3]}...")
    print(f"Canonicalized minutiae: {canonicalized[:3]}...")
    
    # Test quantization
    print("\nTesting quantization...")
    quantized = processor.quantize_minutiae(canonicalized)
    print(f"Quantized minutiae: {quantized[:3]}...")
    
    # Test optimization
    print("\nTesting optimization...")
    optimized = processor.optimize_minutiae(quantized)
    print(f"Optimized minutiae: {optimized[:3]}...")
    
    # Test XYT data formatting
    print("\nTesting XYT data formatting...")
    xyt_data = processor.format_xyt_data(optimized)
    print(f"XYT data (first 100 bytes): {xyt_data[:100]}")
    
    # Test XYT data parsing
    print("\nTesting XYT data parsing...")
    parsed_minutiae = processor.parse_xyt_data(xyt_data)
    print(f"Parsed minutiae: {parsed_minutiae[:3]}...")
    
    # Verify the pipeline preserves minutiae data integrity
    print("\nVerifying data integrity through pipeline...")
    print(f"Original count: {len(minutiae_list)}")
    print(f"Final count: {len(parsed_minutiae)}")
    
    # Test with more realistic data
    print("\n=== Testing with realistic minutiae data ===")
    realistic_minutiae = []
    np.random.seed(42)  # For reproducible tests
    
    # Generate 100 random minutiae points within 500x550 bounds
    for _ in range(100):
        x = np.random.randint(0, 500)
        y = np.random.randint(0, 550)
        theta = np.random.randint(0, 180)
        realistic_minutiae.append((x, y, theta))
    
    # Process through the pipeline
    print("\nProcessing realistic data through pipeline...")
    canonicalized = processor.canonicalize_minutiae(realistic_minutiae)
    quantized = processor.quantize_minutiae(canonicalized)
    optimized = processor.optimize_minutiae(quantized)
    
    print(f"Original minutiae count: {len(realistic_minutiae)}")
    print(f"Final minutiae count: {len(optimized)}")
    print(f"Sample of final minutiae: {optimized[:3]}...")
    
    # Verify minutiae are within bounds
    print("\nVerifying minutiae bounds...")
    for x, y, theta in optimized:
        assert 0 <= x < 500, f"X coordinate {x} out of bounds"
        assert 0 <= y < 550, f"Y coordinate {y} out of bounds"
        assert 0 <= theta < 180, f"Theta {theta} out of bounds"
    print("All minutiae within bounds!")
    
    print("\nAll tests completed successfully!")

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

    test_fingerprint_matching()
