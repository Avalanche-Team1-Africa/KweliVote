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
    - Using actual fingerprint images from the sample directory
    - Demonstrating both matching and non-matching scenarios
    - The first fingerprint file is deliberately processed inconsistently
      to demonstrate how template differences are detected
    
Note:
    In offline mode, the script requires actual fingerprint images in the 
    'docs/fingerprint_reader/sample_fingerprints' directory. If this directory
    is empty or doesn't exist, the script will create the directory but
    report an error as it requires at least one sample file to run the tests.
"""
import os
import sys
import base64
import json
import logging
import hashlib
import random
import argparse
import requests
import tempfile
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
        self.output_dir = OUTPUT_DIR
        self.fingerprint_dir = SAMPLES_DIR
        self.national_id = TEST_NATIONAL_ID
        
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
        
        # First check if the server is available
        try:
            health_check = requests.get(f"{API_BASE_URL}/health/", timeout=3)
            if health_check.status_code != 200:
                logger.warning(f"API health check failed with status {health_check.status_code}")
                logger.warning("The API server may not be running. Try starting it with: cd kwelivote-app/backend && python3 manage.py runserver")
                logger.warning("Or run with --offline flag for testing without a backend server")
        except requests.exceptions.RequestException as e:
            logger.warning(f"API server does not appear to be running: {str(e)}")
            logger.warning("Start the API server with: cd kwelivote-app/backend && python3 manage.py runserver")
            logger.warning("Or run with --offline flag for testing without a backend server")
        
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
        logger.info(f"Looking for fingerprint samples in {self.fingerprint_dir}")
        fingerprint_files = []
        
        # Check if sample directory exists
        if not os.path.exists(self.fingerprint_dir):
            if self.offline_mode:
                logger.warning(f"Creating sample directory {self.fingerprint_dir} for offline mode")
                os.makedirs(self.fingerprint_dir, exist_ok=True)
            else:
                logger.error(f"Sample directory {self.fingerprint_dir} not found")
            return []
        
        # Get fingerprint files from the directory
        for filename in os.listdir(self.fingerprint_dir):
            if filename.endswith(('.tif', '.png', '.jpg', '.jpeg')):
                fingerprint_files.append(filename)
        
        if not fingerprint_files:
            logger.error(f"No fingerprint samples found in {self.fingerprint_dir}")
            if self.offline_mode:
                logger.warning("In offline mode, please add at least one fingerprint image to the samples directory")
        else:
            logger.info(f"Found {len(fingerprint_files)} fingerprint samples")
            
        return fingerprint_files
    
    def encode_fingerprint(self, filename):
        """Encode a fingerprint image as base64."""
        try:
            # Build the full path to the fingerprint file
            filepath = os.path.join(self.fingerprint_dir, filename)
            logger.info(f"Loading fingerprint image from: {filepath}")
            
            with open(filepath, 'rb') as f:
                img_data = f.read()
                
            # Encode as base64
            encoded = base64.b64encode(img_data).decode('ascii')
            logger.info(f"Successfully encoded fingerprint image ({len(encoded)} chars)")
            return encoded
            
        except Exception as e:
            logger.error(f"Error encoding fingerprint image {filename}: {str(e)}")
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
            output_path = os.path.join(self.output_dir, f"{filename.split('.')[0]}_template.json")
            with open(output_path, 'w') as f:
                json.dump(fake_template, f, indent=2)
            
            logger.info(f"OFFLINE: Saved simulated template to {output_path}")
            
            # Store the template for matching tests
            self.templates[filename] = fake_template
            return fake_template
        
        # Encode the fingerprint image
        encoded_fingerprint = self.encode_fingerprint(filename)
        if not encoded_fingerprint:
            return None
        
        # Prepare the request payload with the correct format
        payload = {
            "nationalId": self.national_id,
            "fingerprints": [
                {
                    "sample": encoded_fingerprint,
                    "hand": "right",
                    "position": "index"
                }
            ],
            "extract_only": True,
            "threshold": 40
        }
        
        try:
            # Make the API request to the correct endpoint
            response = requests.post(
                f"{API_BASE_URL}/fingerprints/verify-fingerprint/",
                json=payload,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
            response.raise_for_status()
            
            result = response.json()
            if "extracted_template" in result:
                template_data = result["extracted_template"]
                logger.info(f"Successfully generated template for {filename}")
                
                # Save the template to a file
                output_path = os.path.join(self.output_dir, f"{filename.split('.')[0]}_template.json")
                with open(output_path, 'w') as f:
                    json.dump(template_data, f, indent=2)
                
                logger.info(f"Saved template to {output_path}")
                
                # Store the template for matching tests
                self.templates[filename] = template_data
                return template_data
            else:
                logger.error("API response doesn't contain extracted template data")
                return None
            
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
            first_file_check = False
            
            # Check if this is the first file in our list to simulate inconsistency
            fingerprint_files = self.get_fingerprint_files()
            if fingerprint_files and fingerprint_path == fingerprint_files[0]:
                first_file_check = True
                logger.info("OFFLINE: Deliberately simulating inconsistent template for the first file")
                
            if first_file_check:
                fake_template = {
                    "iso_template_base64": base64.b64encode(f"VERIFICATION_TEMPLATE_{filename}_INCONSISTENT".encode()).decode(),
                    "xyt_data": base64.b64encode(f"VERIFICATION_XYT_DATA_{filename}_MODIFIED".encode()).decode(),
                    "metadata": {
                        "template_version": "1.0",
                        "creation_method": "verification",
                        "minutiae_count": 32,
                        "template_hash": hashlib.md5((filename + "different").encode()).hexdigest()
                    }
                }
            else:
                fake_template = {
                    "iso_template_base64": base64.b64encode(f"ENROLLMENT_TEMPLATE_{filename}".encode()).decode(),
                    "xyt_data": base64.b64encode(f"ENROLLMENT_XYT_DATA_{filename}".encode()).decode(),
                    "metadata": {
                        "template_version": "1.0",
                        "creation_method": "verification",
                        "minutiae_count": 32,
                        "template_hash": hashlib.md5(filename.encode()).hexdigest()
                    }
                }
            
            # Save the verification template to a file
            output_path = os.path.join(self.output_dir, f"{filename.split('.')[0]}_verification_template.json")
            with open(output_path, 'w') as f:
                json.dump(fake_template, f, indent=2)
            
            logger.info(f"OFFLINE: Saved simulated verification template to {output_path}")
            
            # Store the verification template for comparison
            self.verification_templates[filename] = fake_template
            return fake_template
        
        # Encode the fingerprint image
        encoded_fingerprint = self.encode_fingerprint(filename)
        if not encoded_fingerprint:
            return None
        
        # Instead of relying on a debug endpoint, we'll:
        # 1. Create a copy of the fingerprint file to ensure no caching
        # 2. Extract the template data that would be used for verification
        # 3. Compare this with the enrollment template
        
        # Prepare the request payload similar to verification but without a template
        # This will force the API to generate a new template for verification
        payload = {
            "nationalId": self.national_id,
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
                logger.info(f"Successfully generated verification template for {filename}")
                
                # Save the template to a file
                output_path = os.path.join(self.output_dir, f"{filename.split('.')[0]}_verification_template.json")
                with open(output_path, 'w') as f:
                    json.dump(verification_template, f, indent=2)
                
                logger.info(f"Saved verification template to {output_path}")
                
                # Store the template for matching tests
                self.verification_templates[filename] = verification_template
                return verification_template
            else:
                logger.warning("API response doesn't contain extracted template data")
                return None
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating verification template: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"API response: {e.response.text}")
                
            # If the API doesn't support the extraction or verification_mode flags,
            # we'll simply note that we can't perform this part of the test
            logger.warning("API doesn't support template extraction for comparison. Skipping this test.")
            return None
    
    def verify_fingerprint(self, fingerprint_file, template_data):
        """Verify a fingerprint against its template."""
        logger.info(f"Verifying fingerprint {fingerprint_file} against its template")
        
        if self.offline_mode:
            # In offline mode, just simulate verification
            logger.info("OFFLINE: Simulating fingerprint verification")
            
            # Simulate a successful match with a random score between 70 and 90
            match_score = random.randint(70, 90)
            verification_result = {
                "match_score": match_score,
                "is_match": match_score >= 40
            }
            
            # Save the verification result to a file
            output_file = os.path.join(self.output_dir, f"{os.path.splitext(fingerprint_file)[0]}_verification.json")
            with open(output_file, 'w') as f:
                json.dump(verification_result, f, indent=2)
            logger.info(f"OFFLINE: Saved simulated verification result to {output_file}")
            
            # Report result
            if verification_result["is_match"]:
                logger.info(f"OFFLINE: Fingerprint {fingerprint_file} matched with score {match_score}")
            else:
                logger.warning(f"OFFLINE: Fingerprint {fingerprint_file} failed to match with score {match_score}")

            return verification_result["is_match"]
            
        # In API mode, send actual verification request
        
        # Get template data
        if 'iso_template_base64' in template_data:
            template_base64 = template_data['iso_template_base64']
        else:
            logger.error("Template data missing iso_template_base64 field")
            return False
        
        # Prepare the fingerprint for verification
        try:
            encoded_fingerprint = self.encode_fingerprint(fingerprint_file)
            if not encoded_fingerprint:
                return False
                
            # Prepare the request payload
            payload = {
                "nationalId": self.national_id,
                "fingerprints": [
                    {
                        "finger": "right_index",
                        "sample": encoded_fingerprint
                    }
                ],
                "template": template_base64,
                "threshold": 40
            }
            
            # Make the API request
            response = requests.post(
                f"{API_BASE_URL}/fingerprints/verify-fingerprint/",
                json=payload,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
            response.raise_for_status()
            
            verification_result = response.json()
            
            # Save the verification result to a file
            output_file = os.path.join(self.output_dir, f"{os.path.splitext(fingerprint_file)[0]}_verification.json")
            with open(output_file, 'w') as f:
                json.dump(verification_result, f, indent=2)
            
            logger.info(f"Saved verification result to {output_file}")
            
            # Check if the verification was successful
            if verification_result.get('is_match', False):
                logger.info(f"Fingerprint {fingerprint_file} matched with score {verification_result.get('match_score', 'unknown')}")
                return True
            else:
                logger.warning(f"Fingerprint {fingerprint_file} failed to match with score {verification_result.get('match_score', 'unknown')}")
                return False
                
        except Exception as e:
            logger.error(f"Error verifying fingerprint: {str(e)}")
            return False
    
    def compare_templates(self, template1, template2):
        """Compare two templates and log any differences."""
        logger.info("Comparing enrollment and verification templates...")
        
        # Extract the relevant template data 
        template1_data = template1
        template2_data = template2
        
        # If template is from API (has 'id', 'created_at', etc.), extract the relevant parts
        if isinstance(template1, dict) and 'id' in template1 and 'iso_template_base64' in template1:
            template1_data = {
                'iso_template_base64': template1['iso_template_base64'],
                'xyt_data': template1.get('xyt_data', ''),
                'metadata': template1.get('metadata', {})
            }
            
        if isinstance(template2, dict) and 'id' in template2 and 'iso_template_base64' in template2:
            template2_data = {
                'iso_template_base64': template2['iso_template_base64'],
                'xyt_data': template2.get('xyt_data', ''),
                'metadata': template2.get('metadata', {})
            }
            
        # If template is from verification extract_only mode (has 'xyt_data'), adjust format
        if isinstance(template1, dict) and 'xyt_data' in template1:
            template1_data = template1
            
        if isinstance(template2, dict) and 'xyt_data' in template2:
            template2_data = template2
            
        # Now compare only the template data (not full object with DB fields)
        if 'iso_template_base64' in template1_data and 'iso_template_base64' in template2_data:
            # Compare binary ISO templates (most accurate comparison)
            try:
                iso1 = base64.b64decode(template1_data['iso_template_base64'])
                iso2 = base64.b64decode(template2_data['iso_template_base64'])
                
                if iso1 == iso2:
                    logger.info("✓ Binary ISO templates are identical")
                    return True
                else:
                    logger.warning("✗ Binary ISO templates differ!")
                    # Log details about the differences
                    self._log_template_differences(template1_data, template2_data)
                    return False
            except Exception as e:
                logger.error(f"Error comparing binary templates: {str(e)}")
                
        # If we couldn't compare binaries, fall back to a direct dictionary comparison
        return self._compare_dicts(template1_data, template2_data)
    
    def calculate_template_hash(self, template_data):
        """Calculate a stable hash of template data for comparison."""
        if "iso_template_base64" in template_data:
            try:
                iso_data = base64.b64decode(template_data["iso_template_base64"])
                return hashlib.sha256(iso_data).hexdigest()
            except Exception as e:
                logger.error(f"Error calculating template hash: {str(e)}")
                return None
        elif "xyt_data" in template_data:
            try:
                xyt_data = base64.b64decode(template_data["xyt_data"]) if isinstance(template_data["xyt_data"], str) else template_data["xyt_data"]
                return hashlib.sha256(xyt_data).hexdigest()
            except Exception as e:
                logger.error(f"Error calculating XYT hash: {str(e)}")
                return None
        else:
            logger.error("No template data (iso_template_base64 or xyt_data) found for hashing")
            return None
    
    def _log_template_differences(self, template1, template2):
        """Log the differences between two templates in detail."""
        # Compare dictionaries
        if isinstance(template1, dict) and isinstance(template2, dict):
            # Check metadata differences
            if 'metadata' in template1 and 'metadata' in template2:
                if template1['metadata'] != template2['metadata']:
                    logger.warning("Metadata differences detected:")
                    for key in set(template1['metadata'].keys()) | set(template2['metadata'].keys()):
                        if key in template1['metadata'] and key in template2['metadata']:
                            if template1['metadata'][key] != template2['metadata'][key]:
                                logger.warning(f"  - {key}: {template1['metadata'][key]} vs {template2['metadata'][key]}")
                        elif key in template1['metadata']:
                            logger.warning(f"  - {key}: {template1['metadata'][key]} (missing in verification template)")
                        else:
                            logger.warning(f"  - {key}: {template2['metadata'][key]} (missing in enrollment template)")
            
            # Check template sizes
            if 'iso_template_base64' in template1 and 'iso_template_base64' in template2:
                try:
                    iso1 = base64.b64decode(template1['iso_template_base64'])
                    iso2 = base64.b64decode(template2['iso_template_base64'])
                    logger.warning(f"ISO template size: {len(iso1)} vs {len(iso2)} bytes")
                    
                    # Compare first 32 bytes (header)
                    if len(iso1) >= 32 and len(iso2) >= 32:
                        if iso1[:32] == iso2[:32]:
                            logger.info("✓ ISO template headers match")
                        else:
                            logger.warning("✗ ISO template headers differ")
                            logger.warning(f"  - Header1: {iso1[:32].hex()}")
                            logger.warning(f"  - Header2: {iso2[:32].hex()}")
                except Exception as e:
                    logger.error(f"Error comparing ISO templates: {str(e)}")
        elif template1 != template2:
            logger.warning(f"Templates differ in structure: {type(template1)} vs {type(template2)}")
            
    def _compare_dicts(self, dict1, dict2):
        """Compare two dictionaries and return True if they are similar enough."""
        # This is a simplified comparison that only checks key existence
        # and binary sizes for base64 fields
        if not isinstance(dict1, dict) or not isinstance(dict2, dict):
            logger.warning(f"Cannot compare non-dictionary objects: {type(dict1)} vs {type(dict2)}")
            return False
            
        # Check if iso_template_base64 exists in both
        if 'iso_template_base64' in dict1 and 'iso_template_base64' in dict2:
            try:
                # Check that the template sizes are roughly the same
                # (exact match not required for this comparison)
                iso1_size = len(base64.b64decode(dict1['iso_template_base64']))
                iso2_size = len(base64.b64decode(dict2['iso_template_base64']))
                
                if abs(iso1_size - iso2_size) <= 8:  # Allow small size differences
                    logger.info(f"✓ ISO template sizes are similar: {iso1_size} vs {iso2_size} bytes")
                    return True
                else:
                    logger.warning(f"✗ ISO template sizes differ significantly: {iso1_size} vs {iso2_size} bytes")
                    return False
            except Exception as e:
                logger.error(f"Error comparing ISO templates: {str(e)}")
                
        # Fall back to exact comparison
        return dict1 == dict2
    
    def run_test(self):
        """Run the test process."""
        logger.info("Starting fingerprint testing process")
        
        # Authenticate with the API
        if not self.authenticate():
            logger.error("Authentication failed, cannot continue testing")
            return False
        
        # Get list of fingerprint files
        fingerprints = self.get_fingerprint_files()
        if not fingerprints:
            logger.error("No fingerprint samples found, cannot continue testing")
            return False
            
        # Get just the filenames, not full paths
        fingerprint_files = [os.path.basename(fp) for fp in fingerprints]
        logger.info(f"Found {len(fingerprint_files)} fingerprint samples")
        
        # Generate templates for all fingerprints (enrollment)
        self.enrollment_templates = {}
        for fp in fingerprint_files:
            template = self.generate_template(fp)
            if template:
                self.enrollment_templates[fp] = template
        
        logger.info(f"Generated {len(self.enrollment_templates)} templates out of {len(fingerprint_files)} fingerprints")
        
        # Generate verification templates for all fingerprints
        self.verification_templates = {}
        for fp in fingerprint_files:
            verification_template = self.generate_verification_template(fp)
            if verification_template:
                self.verification_templates[fp] = verification_template
        
        logger.info(f"Generated {len(self.verification_templates)} verification templates")
        
        # Compare templates for consistency
        consistent_templates = 0
        inconsistent_templates = 0
        
        for fp in fingerprint_files:
            if fp in self.enrollment_templates and fp in self.verification_templates:
                logger.info(f"Comparing templates for {fp}...")
                if self.compare_templates(self.enrollment_templates[fp], self.verification_templates[fp]):
                    logger.info(f"✓ Templates for {fp} are consistent")
                    consistent_templates += 1
                else:
                    logger.warning(f"✗ Templates for {fp} are inconsistent!")
                    inconsistent_templates += 1
        
        # Verify each fingerprint against its template
        successful_verifications = 0
        failed_verifications = 0
        
        for fp in fingerprint_files:
            if fp in self.enrollment_templates:
                logger.info(f"Verifying {fp} against its template...")
                if self.verify_fingerprint(fp, self.enrollment_templates[fp]):
                    logger.info(f"✓ Fingerprint {fp} verified successfully against its template")
                    successful_verifications += 1
                else:
                    logger.warning(f"✗ Fingerprint {fp} failed to verify against its template!")
                    failed_verifications += 1
        
        # Print summary
        logger.info("=" * 50)
        logger.info("TEST SUMMARY")
        logger.info("=" * 50)
        logger.info(f"Total fingerprints tested: {len(fingerprint_files)}")
        logger.info(f"Templates generated (enrollment): {len(self.enrollment_templates)}")
        logger.info(f"Templates generated (verification): {len(self.verification_templates)}")
        logger.info(f"Template consistency checks passed: {consistent_templates}")
        logger.info(f"Template consistency checks failed: {inconsistent_templates}")
        logger.info(f"Self-verification successes: {successful_verifications}")
        logger.info(f"Self-verification failures: {failed_verifications}")
        
        # Check test success criteria
        if successful_verifications == len(self.enrollment_templates):
            logger.info("✅ ALL FINGERPRINTS VERIFY SUCCESSFULLY AGAINST THEIR TEMPLATES")
        else:
            logger.error("❌ SOME FINGERPRINTS FAILED TO VERIFY AGAINST THEIR TEMPLATES")
            
        if consistent_templates == len(self.enrollment_templates) and inconsistent_templates == 0:
            logger.info("✅ ALL TEMPLATES ARE CONSISTENT BETWEEN ENROLLMENT AND VERIFICATION")
        else:
            logger.error("❌ SOME TEMPLATES ARE INCONSISTENT BETWEEN ENROLLMENT AND VERIFICATION")
            
        return successful_verifications == len(self.enrollment_templates)

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test fingerprint template generation and matching')
    parser.add_argument('--offline', action='store_true', help='Run in offline mode with simulated API responses')
    args = parser.parse_args()
    
    # Create and run the tester
    tester = FingerprintTester(offline_mode=args.offline)
    success = tester.run_test()
    sys.exit(0 if success else 1)
