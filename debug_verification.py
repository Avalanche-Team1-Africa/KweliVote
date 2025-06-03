#!/usr/bin/env python3
"""Debug script to test verification matching."""

import json
import base64
import requests

# Test data
auth_creds = {'username': 'john_0001', 'password': 'KV2025_xV3cfqgQlV'}
api_base = 'http://127.0.0.1:8000/api'

# Authenticate
print("Authenticating...")
auth_response = requests.post(f'{api_base}/token/', json=auth_creds)
token = auth_response.json()['access']

# Load one of the successful templates
print("Loading template data...")
with open('docs/fingerprint_reader/test_output/102_6_template.json', 'r') as f:
    template_data = json.load(f)

print('Template data keys:', list(template_data.keys()))
print('ISO template length:', len(template_data['iso_template_base64']))

# Load the original fingerprint
print("Loading fingerprint image...")
with open('docs/fingerprint_reader/sample_fingerprints/102_6.tif', 'rb') as f:
    fp_data = base64.b64encode(f.read()).decode('ascii')

print('Fingerprint data length:', len(fp_data))

# Test verification with debug info
payload = {
    'nationalId': 'TEST12345678',
    'fingerprints': [{'sample': fp_data, 'hand': 'right', 'position': 'index'}],
    'template': template_data['iso_template_base64'],
    'threshold': 40
}

print('Sending verification request...')
response = requests.post(f'{api_base}/fingerprints/verify-fingerprint/', json=payload, headers={'Authorization': f'Bearer {token}'})
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
response_extract = requests.post(f'{api_base}/fingerprints/verify-fingerprint/', json=payload_extract, headers={'Authorization': f'Bearer {token}'})
print('Extract response status:', response_extract.status_code)
print('Extract response:', response_extract.json()) 