#!/usr/bin/env python3
"""Debug script to test verification matching."""

import json
import base64
import requests
import logging
from iso_fingerprint_template_app.fingerprint_processor import FingerprintProcessor

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Test data
auth_creds = {'username': 'john_0001', 'password': 'KV2025_xV3cfqgQlV'}
api_base = 'http://127.0.0.1:8000/api'

def debug_verification():
    """Debug the verification process."""
    # Authenticate
    print("Authenticating...")
    auth_response = requests.post(f'{api_base}/token/', json=auth_creds)
    token = auth_response.json()['access']

    # Load one of our sample fingerprints
    print("Loading fingerprint image...")
    with open('docs/fingerprint_reader/sample_fingerprints/fingerprint(0).png', 'rb') as f:
        fp_data = base64.b64encode(f.read()).decode('ascii')

    print('Fingerprint data length:', len(fp_data))

    # Test verification with debug info
    payload = {
        'nationalId': 'TEST12345678',
        'fingerprints': [{'sample': fp_data, 'hand': 'right', 'position': 'index'}],
        'extract_only': True,
        'threshold': 40
    }

    print('Sending verification request...')
    response = requests.post(
        f'{api_base}/fingerprints/verify-fingerprint/',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )
    print('Response status:', response.status_code)
    print('Response:', response.json())

    # Let's also test with extract_only to see the verification template
    payload_extract = {
        'nationalId': 'TEST12345678',
        'fingerprints': [{'sample': fp_data, 'finger': 'right_index'}],
        'template': '',
        'threshold': 40,
        'extract_only': True
    }

    print('\nTesting extract_only mode...')
    response_extract = requests.post(
        f'{api_base}/fingerprints/verify-fingerprint/',
        json=payload_extract,
        headers={'Authorization': f'Bearer {token}'}
    )
    print('Extract response status:', response_extract.status_code)
    print('Extract response:', response_extract.json())

    # If we got a template, let's analyze it
    if response_extract.status_code == 200:
        template_data = response_extract.json()
        if 'iso_template_base64' in template_data:
            print('\nAnalyzing extracted template...')
            processor = FingerprintProcessor()
            
            # Parse ISO template
            iso_data = base64.b64decode(template_data['iso_template_base64'])
            minutiae = processor.parse_iso_template(iso_data)
            print(f'Extracted {len(minutiae)} minutiae points')
            
            # Process minutiae through the pipeline
            canonicalized = processor.canonicalize_minutiae(minutiae)
            quantized = processor.quantize_minutiae(canonicalized)
            optimized = processor.optimize_minutiae(quantized)
            
            print('\nMinutiae statistics:')
            print(f'Original minutiae count: {len(minutiae)}')
            print(f'After canonicalization: {len(canonicalized)}')
            print(f'After quantization: {len(quantized)}')
            print(f'After optimization: {len(optimized)}')
            
            # Generate template hash
            template_hash = processor.generate_template_hash(optimized)
            print(f'\nTemplate hash: {template_hash}')

if __name__ == "__main__":
    debug_verification() 