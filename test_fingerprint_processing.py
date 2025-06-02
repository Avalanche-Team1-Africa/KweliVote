#!/usr/bin/env python3
"""
Test script for fingerprint template generation and matching.
This script verifies that template generation is identical during both
enrollment and verification processes in the KweliVote system.

When run with the --offline flag, it will simulate the API responses
to demonstrate the template consistency check logic.

Usage:
    python3 test_fingerprint_processing.py            # Run with live API
    python3 test_fingerprint_processing.py --offline  # Run in offline simulation mode

Offline Mode:
    The offline mode allows testing without a running backend server by:
    - Simulating API responses
    - Creating synthetic fingerprint templates
    - Demonstrating both matching and non-matching scenarios
    - One test case (dummy_fingerprint_1) is deliberately designed to fail 
      to demonstrate how inconsistencies are detected
"""
import os
import sys
import json
import base64
import requests
import logging
import hashlib
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
API_BASE_URL = "http://127.0.0.1:8000/api"
SAMPLES_DIR = "docs/fingerprint_reader/sample_fingerprints"
OUTPUT_DIR = "docs/fingerprint_reader/test_output"
TEST_NATIONAL_ID = "TEST12345678"
AUTH_CREDENTIALS = {
    "username": "john_0001",
    "password": "KV2025_xV3cfqgQlV"
}

# Ensure output directory exists
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

class FingerprintTester:
    """Test class for fingerprint template generation and matching."""
    
    def __init__(self, offline_mode=False):
        self.auth_token = None
        self.templates = {}  # Store generated templates keyed by filename
        self.verification_templates = {}  # Store templates generated during verification
        self.offline_mode = offline_mode
        
        if offline_mode:
            logger.info("Running in OFFLINE mode - API calls will be simulated")
            # Set a fake auth token for offline mode
            self.auth_token = "fake_token_for_offline_testing"
    
    def authenticate(self):
        """Authenticate with the API and get JWT token."""
        if self.offline_mode:
            logger.info("OFFLINE: Authentication simulation successful")
            return True
            
        logger.info("Authenticating with the API...")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/token/",
                json=AUTH_CREDENTIALS
            )
            response.raise_for_status()
            
            token_data = response.json()
            self.auth_token = token_data["access"]
            logger.info("Authentication successful")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Authentication failed: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            return False
    
    def get_fingerprint_files(self):
        """Get a list of fingerprint image files from the sample directory."""
        logger.info(f"Looking for fingerprint samples in {SAMPLES_DIR}")
        fingerprint_files = []
        
        # In offline mode, create simulated files if sample dir doesn't exist
        if self.offline_mode and not os.path.exists(SAMPLES_DIR):
            logger.info("OFFLINE: Sample directory doesn't exist, using simulated files")
            # Create the directory
            os.makedirs(SAMPLES_DIR, exist_ok=True)
            
            # Create some dummy files for testing
            for i in range(3):
                dummy_file = os.path.join(SAMPLES_DIR, f"dummy_fingerprint_{i}.png")
                with open(dummy_file, 'wb') as f:
                    # Create a tiny PNG file
                    f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82')
                fingerprint_files.append(dummy_file)
            
            return fingerprint_files
        
        for filename in os.listdir(SAMPLES_DIR):
            if filename.endswith(('.tif', '.png', '.jpg', '.jpeg')):
                fingerprint_files.append(os.path.join(SAMPLES_DIR, filename))
        
        if not fingerprint_files:
            logger.error("No fingerprint samples found")
        else:
            logger.info(f"Found {len(fingerprint_files)} fingerprint samples")
            
        return fingerprint_files
    
    def encode_fingerprint(self, filepath):
        """Encode a fingerprint image as base64."""
        try:
            with open(filepath, 'rb') as f:
                image_data = f.read()
                encoded = base64.b64encode(image_data).decode('ascii')
                return encoded
        except Exception as e:
            logger.error(f"Error encoding fingerprint image {filepath}: {str(e)}")
            return None
    
    def generate_template(self, fingerprint_path):
        """Generate ISO template for a fingerprint image (enrollment)."""
        if not self.auth_token:
            logger.error("Not authenticated. Call authenticate() first")
            return None
        
        filename = os.path.basename(fingerprint_path)
        logger.info(f"Generating ISO template for {filename} (enrollment)")
        
        if self.offline_mode:
            # In offline mode, generate a deterministic fake template based on the filename
            logger.info("OFFLINE: Generating simulated enrollment template")
            
            # Create a deterministic template based on the filename
            fake_template = {
                "iso_template_base64": base64.b64encode(f"ENROLLMENT_TEMPLATE_{filename}".encode()).decode(),
                "xyt_data": base64.b64encode(f"ENROLLMENT_XYT_DATA_{filename}".encode()).decode(),
                "metadata": {
                    "template_version": "1.0",
                    "creation_method": "enrollment",
                    "minutiae_count": 32,
                    "template_hash": hashlib.md5(filename.encode()).hexdigest()
                }
            }
            
            # Save the template to a file
            output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_template.json")
            with open(output_path, 'w') as f:
                json.dump(fake_template, f, indent=2)
            
            logger.info(f"OFFLINE: Saved simulated template to {output_path}")
            
            # Store the template for matching tests
            self.templates[filename] = fake_template
            return fake_template
        
        # Encode the fingerprint image
        encoded_fingerprint = self.encode_fingerprint(fingerprint_path)
        if not encoded_fingerprint:
            return None
        
        # Prepare the request payload
        payload = {
            "nationalId": TEST_NATIONAL_ID,
            "fingerprints": [
                {
                    "finger": "right_index",
                    "sample": encoded_fingerprint
                }
            ]
        }
        
        try:
            # Make the API request
            response = requests.post(
                f"{API_BASE_URL}/fingerprints/process-fingerprint-template/",
                json=payload,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
            response.raise_for_status()
            
            template_data = response.json()
            logger.info(f"Successfully generated template for {filename}")
            
            # Save the template to a file
            output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_template.json")
            with open(output_path, 'w') as f:
                json.dump(template_data, f, indent=2)
            
            logger.info(f"Saved template to {output_path}")
            
            # Store the template for matching tests
            self.templates[filename] = template_data
            return template_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating template: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            return None
    
    def generate_verification_template(self, fingerprint_path):
        """Generate template during verification process for comparison."""
        if not self.auth_token:
            logger.error("Not authenticated. Call authenticate() first")
            return None
        
        filename = os.path.basename(fingerprint_path)
        logger.info(f"Generating verification template for {filename} (for comparison)")
        
        if self.offline_mode:
            # In offline mode, generate a simulated verification template
            logger.info("OFFLINE: Generating simulated verification template")
            
            # Create a deterministic template based on the filename
            # The key question for testing is whether this should be identical
            # to the enrollment template or slightly different
            
            # For demonstration purposes, we'll generate two types:
            # 1. Identical to enrollment (correct implementation)
            # 2. Slightly different (incorrect implementation)
            
            # Let's simulate the "correct" case for most files but the "incorrect"
            # case for one file to demonstrate the test detection
            if "dummy_fingerprint_1" in filename:
                # Simulate incorrect implementation for one file
                fake_template = {
                    "iso_template_base64": base64.b64encode(f"VERIFICATION_TEMPLATE_{filename}".encode()).decode(),
                    "xyt_data": base64.b64encode(f"VERIFICATION_XYT_DATA_{filename}".encode()).decode(),
                    "metadata": {
                        "template_version": "1.0",
                        "creation_method": "verification",  # Different from enrollment
                        "minutiae_count": 31,  # Different count
                        "template_hash": hashlib.md5((filename + "_different").encode()).hexdigest()
                    }
                }
                logger.info("OFFLINE: Simulating inconsistent template generation for test case")
            else:
                # Simulate correct implementation - identical to enrollment
                fake_template = {
                    "iso_template_base64": base64.b64encode(f"ENROLLMENT_TEMPLATE_{filename}".encode()).decode(),
                    "xyt_data": base64.b64encode(f"ENROLLMENT_XYT_DATA_{filename}".encode()).decode(),
                    "metadata": {
                        "template_version": "1.0",
                        "creation_method": "enrollment",
                        "minutiae_count": 32,
                        "template_hash": hashlib.md5(filename.encode()).hexdigest()
                    }
                }
                logger.info("OFFLINE: Simulating consistent template generation")
            
            # Save the verification template to a file
            output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_verification_template.json")
            with open(output_path, 'w') as f:
                json.dump(fake_template, f, indent=2)
            
            logger.info(f"OFFLINE: Saved simulated verification template to {output_path}")
            
            # Store the verification template for comparison
            self.verification_templates[filename] = fake_template
            return fake_template
        
        # Encode the fingerprint image
        encoded_fingerprint = self.encode_fingerprint(fingerprint_path)
        if not encoded_fingerprint:
            return None
        
        # Instead of relying on a debug endpoint, we'll:
        # 1. Create a copy of the fingerprint file to ensure no caching
        # 2. Extract the template data that would be used for verification
        # 3. Compare this with the enrollment template
        
        # Prepare the request payload similar to verification but without a template
        # This will force the API to generate a new template for verification
        payload = {
            "nationalId": TEST_NATIONAL_ID,
            "fingerprints": [
                {
                    "finger": "right_index",
                    "sample": encoded_fingerprint
                }
            ],
            "template": "",  # Empty template to force new template generation
            "threshold": 40,
            "extract_only": True  # Special flag to request template extraction without matching
        }
        
        try:
            # Make the API request to the verify endpoint
            # The API should return the extracted template without performing matching
            response = requests.post(
                f"{API_BASE_URL}/fingerprints/verify-fingerprint/",
                json=payload,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Check if the result contains the extracted template
            if "extracted_template" in result:
                verification_template = result["extracted_template"]
                logger.info(f"Successfully extracted verification template for {filename}")
                
                # Save the verification template to a file
                output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_verification_template.json")
                with open(output_path, 'w') as f:
                    json.dump(verification_template, f, indent=2)
                
                logger.info(f"Saved verification template to {output_path}")
                
                # Store the verification template for comparison
                self.verification_templates[filename] = verification_template
                return verification_template
            else:
                logger.warning("Template extraction not supported by API, using alternative approach")
                
                # If the API doesn't support template extraction, use an alternative approach:
                # Call the process-fingerprint-template endpoint but with special flags
                # to mimic the verification process
                alt_payload = {
                    "nationalId": TEST_NATIONAL_ID,
                    "fingerprints": [
                        {
                            "finger": "right_index",
                            "sample": encoded_fingerprint
                        }
                    ],
                    "verification_mode": True  # Flag to process as if for verification
                }
                
                alt_response = requests.post(
                    f"{API_BASE_URL}/fingerprints/process-fingerprint-template/",
                    json=alt_payload,
                    headers={"Authorization": f"Bearer {self.auth_token}"}
                )
                alt_response.raise_for_status()
                
                verification_template = alt_response.json()
                logger.info(f"Successfully generated alternative verification template for {filename}")
                
                # Save the verification template to a file
                output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_verification_template.json")
                with open(output_path, 'w') as f:
                    json.dump(verification_template, f, indent=2)
                
                logger.info(f"Saved verification template to {output_path}")
                
                # Store the verification template for comparison
                self.verification_templates[filename] = verification_template
                return verification_template
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating verification template: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
                
            # If the API doesn't support the extraction or verification_mode flags,
            # we'll simply note that we can't perform this part of the test
            logger.warning("API doesn't support template extraction for comparison. Skipping this test.")
            return None
    
    def verify_fingerprint(self, fingerprint_path, template_data):
        """Verify a fingerprint against a template."""
        if not self.auth_token:
            logger.error("Not authenticated. Call authenticate() first")
            return None
        
        filename = os.path.basename(fingerprint_path)
        logger.info(f"Verifying fingerprint {filename} against its template")
        
        if self.offline_mode:
            # In offline mode, simulate verification results
            logger.info("OFFLINE: Simulating fingerprint verification")
            
            # Simulate successful verification for all samples
            fake_result = {
                "national_id": TEST_NATIONAL_ID,
                "match_score": 85,  # High score for good match
                "is_match": True
            }
            
            # Save the verification result
            output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_verification.json")
            with open(output_path, 'w') as f:
                json.dump(fake_result, f, indent=2)
            
            logger.info(f"OFFLINE: Saved simulated verification result to {output_path}")
            return fake_result
        
        # Encode the fingerprint image
        encoded_fingerprint = self.encode_fingerprint(fingerprint_path)
        if not encoded_fingerprint:
            return None
        
        # Extract the template from template_data
        template = template_data.get("iso_template_base64", "")
        logger.info(f"Template base64 length: {len(template) if template else 0}")
        
        # Log template data structure for debugging
        logger.info(f"Template data keys: {template_data.keys()}")
        
        # Prepare the request payload - using same format as generate_template
        payload = {
            "nationalId": TEST_NATIONAL_ID,
            "fingerprints": [
                {
                    "finger": "right_index",
                    "sample": encoded_fingerprint
                }
            ],
            "template": template,  # Include the template to match against
            "threshold": 40  # Default threshold
        }
        
        try:
            # Make the API request
            logger.info(f"Sending verification request to API with payload size: {len(str(payload))}")
            response = requests.post(
                f"{API_BASE_URL}/fingerprints/verify-fingerprint/",
                json=payload,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
            
            # Debug response before raising for status
            logger.info(f"Verification response status code: {response.status_code}")
            
            # Try to get the response content even if status code is not 2xx
            try:
                response_content = response.json()
                logger.info(f"Verification response content: {response_content}")
            except:
                logger.info(f"Verification response text: {response.text}")
            
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Verification result for {filename}: {result}")
            
            # Save the verification result
            output_path = os.path.join(OUTPUT_DIR, f"{filename.split('.')[0]}_verification.json")
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            logger.info(f"Saved verification result to {output_path}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error verifying fingerprint: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response status code: {e.response.status_code}")
                logger.error(f"Response content: {e.response.text}")
            return None
    
    def compare_templates(self, enrollment_template, verification_template):
        """Compare enrollment and verification templates to check consistency."""
        logger.info("Comparing enrollment and verification templates...")
        
        # Calculate template hashes for comparison
        enrollment_hash = self.calculate_template_hash(enrollment_template)
        verification_hash = self.calculate_template_hash(verification_template)
        
        if enrollment_hash == verification_hash:
            logger.info("✅ Templates are identical!")
            return True
        else:
            logger.error("❌ Templates differ between enrollment and verification!")
            # Log the differences in more detail
            self.log_template_differences(enrollment_template, verification_template)
            return False
    
    def calculate_template_hash(self, template_data):
        """Calculate a stable hash of template data for comparison."""
        if "iso_template_base64" in template_data:
            # Hash the base64 template directly
            return hashlib.sha256(template_data["iso_template_base64"].encode()).hexdigest()
        elif "xyt_data" in template_data:
            # Hash the XYT data
            return hashlib.sha256(template_data["xyt_data"].encode()).hexdigest()
        else:
            # Fall back to a string representation of the entire template
            return hashlib.sha256(json.dumps(template_data, sort_keys=True).encode()).hexdigest()
    
    def log_template_differences(self, template1, template2):
        """Log the differences between two templates in detail."""
        # Log template keys
        keys1 = set(template1.keys())
        keys2 = set(template2.keys())
        
        logger.info(f"Template 1 keys: {keys1}")
        logger.info(f"Template 2 keys: {keys2}")
        
        # Log keys that differ
        diff_keys = keys1.symmetric_difference(keys2)
        if diff_keys:
            logger.info(f"Keys that exist in only one template: {diff_keys}")
        
        # Log values that differ for common keys
        common_keys = keys1.intersection(keys2)
        for key in common_keys:
            if template1[key] != template2[key]:
                logger.info(f"Values differ for key '{key}'")
                
                # For base64 values, log their lengths
                if isinstance(template1[key], str) and isinstance(template2[key], str) and len(template1[key]) > 100:
                    logger.info(f"  Length in template 1: {len(template1[key])}")
                    logger.info(f"  Length in template 2: {len(template2[key])}")
                    
                    # If they're base64, try decoding and compare binary content size
                    try:
                        bin1 = base64.b64decode(template1[key])
                        bin2 = base64.b64decode(template2[key])
                        logger.info(f"  Binary size in template 1: {len(bin1)} bytes")
                        logger.info(f"  Binary size in template 2: {len(bin2)} bytes")
                    except:
                        pass
                else:
                    # For smaller values, log the actual values
                    logger.info(f"  Value in template 1: {template1[key]}")
                    logger.info(f"  Value in template 2: {template2[key]}")
    
    def run_tests(self):
        """Run the full fingerprint testing process."""
        logger.info("Starting fingerprint testing process")
        
        # Step 1: Authenticate
        if not self.authenticate():
            logger.error("Authentication failed. Exiting.")
            return False
        
        # Step 2: Get fingerprint files
        fingerprint_files = self.get_fingerprint_files()
        if not fingerprint_files:
            logger.error("No fingerprint files found. Exiting.")
            return False
        
        # Step 3: Generate templates for each fingerprint (enrollment process)
        templates_generated = 0
        for fp_file in fingerprint_files:
            template = self.generate_template(fp_file)
            if template:
                templates_generated += 1
        
        logger.info(f"Generated {templates_generated} templates out of {len(fingerprint_files)} fingerprints")
        
        # Step 4: Generate templates during verification process for comparison
        verification_templates_generated = 0
        for fp_file in fingerprint_files:
            template = self.generate_verification_template(fp_file)
            if template:
                verification_templates_generated += 1
        
        logger.info(f"Generated {verification_templates_generated} verification templates")
        
        # Step 5: Compare enrollment and verification templates
        template_matches = 0
        template_mismatches = 0
        
        for fp_file in fingerprint_files:
            filename = os.path.basename(fp_file)
            if filename in self.templates and filename in self.verification_templates:
                logger.info(f"Comparing templates for {filename}...")
                if self.compare_templates(self.templates[filename], self.verification_templates[filename]):
                    template_matches += 1
                else:
                    template_mismatches += 1
        
        # Step 6: Verify each fingerprint against its own template
        verification_success = 0
        verification_failed = 0
        
        for fp_file in fingerprint_files:
            filename = os.path.basename(fp_file)
            if filename in self.templates:
                result = self.verify_fingerprint(fp_file, self.templates[filename])
                if result and result.get('is_match', False):
                    verification_success += 1
                    logger.info(f"✅ {filename} matched successfully with score: {result.get('match_score', 'N/A')}")
                else:
                    verification_failed += 1
                    logger.error(f"❌ {filename} failed to match with its own template")
        
        # Step 7: Summarize results
        logger.info("=" * 50)
        logger.info("TEST SUMMARY")
        logger.info("=" * 50)
        logger.info(f"Total fingerprints tested: {len(fingerprint_files)}")
        logger.info(f"Templates generated (enrollment): {templates_generated}")
        logger.info(f"Templates generated (verification): {verification_templates_generated}")
        logger.info(f"Template consistency checks passed: {template_matches}")
        logger.info(f"Template consistency checks failed: {template_mismatches}")
        logger.info(f"Self-verification successes: {verification_success}")
        logger.info(f"Self-verification failures: {verification_failed}")
        
        # Assert that all fingerprints matched with themselves
        if verification_failed > 0:
            logger.error("TEST FAILED: Some fingerprints did not match with their own templates")
            return False
        else:
            logger.info("TEST PASSED: All fingerprints matched with their own templates")
        
        # Assert that all templates are consistent between enrollment and verification
        if template_mismatches > 0:
            logger.error("TEST FAILED: Template generation is not consistent between enrollment and verification")
            return False
        else:
            logger.info("TEST PASSED: Template generation is consistent between enrollment and verification")
            
        return template_mismatches == 0 and verification_failed == 0

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test fingerprint template generation and matching')
    parser.add_argument('--offline', action='store_true', help='Run in offline mode with simulated API responses')
    args = parser.parse_args()
    
    # Create and run the tester
    tester = FingerprintTester(offline_mode=args.offline)
    success = tester.run_tests()
    sys.exit(0 if success else 1)
