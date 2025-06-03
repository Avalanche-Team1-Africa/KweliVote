#!/usr/bin/env python3
"""Analyze templates to understand matching issues."""

import json
import base64

print("Loading enrollment template...")
with open('docs/fingerprint_reader/test_output/102_6_template.json', 'r') as f:
    enrollment_template = json.load(f)

print("Loading verification template...")
with open('docs/fingerprint_reader/test_output/102_6_verification_template.json', 'r') as f:
    verification_template = json.load(f)

print("\n=== ENROLLMENT TEMPLATE ANALYSIS ===")
print("Keys:", list(enrollment_template.keys()))
print("ISO template length:", len(enrollment_template['iso_template_base64']))

print("\n=== VERIFICATION TEMPLATE ANALYSIS ===")
print("Keys:", list(verification_template.keys()))
print("ISO template length:", len(verification_template['iso_template_base64']))

# Compare the ISO templates
print("\n=== ISO TEMPLATE COMPARISON ===")
enrollment_iso = enrollment_template['iso_template_base64']
verification_iso = verification_template['iso_template_base64']

print("Templates are identical:", enrollment_iso == verification_iso)

if enrollment_iso != verification_iso:
    print("Enrollment ISO first 100 chars:", enrollment_iso[:100])
    print("Verification ISO first 100 chars:", verification_iso[:100])
    
    # Decode both and compare
    enrollment_binary = base64.b64decode(enrollment_iso)
    verification_binary = base64.b64decode(verification_iso)
    
    print("Enrollment binary length:", len(enrollment_binary))
    print("Verification binary length:", len(verification_binary))
    print("Binary data identical:", enrollment_binary == verification_binary)

# Analyze XYT data if available
print("\n=== XYT DATA ANALYSIS ===")
if 'xyt_data' in verification_template:
    xyt_b64 = verification_template['xyt_data']
    xyt_text = base64.b64decode(xyt_b64).decode('utf-8')
    print("XYT data (first 200 chars):")
    print(xyt_text[:200])
    
    lines = xyt_text.strip().split('\n')
    print(f"Number of minutiae points: {len([l for l in lines if l.strip()])}")

# Compare metadata
print("\n=== METADATA COMPARISON ===")
if 'metadata' in enrollment_template and 'metadata' in verification_template:
    enroll_meta = enrollment_template['metadata']
    verify_meta = verification_template['metadata']
    
    for key in set(list(enroll_meta.keys()) + list(verify_meta.keys())):
        enroll_val = enroll_meta.get(key, 'MISSING')
        verify_val = verify_meta.get(key, 'MISSING')
        match = "✅" if enroll_val == verify_val else "❌"
        print(f"{match} {key}: enrollment={enroll_val}, verification={verify_val}") 