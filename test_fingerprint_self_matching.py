#!/usr/bin/env python3
"""
Fingerprint Self-Matching Test Script

This script tests fingerprint self-matching through the API endpoints.
It loads sample fingerprints, enrolls them via the API, and then verifies
that each fingerprint correctly matches against itself.

Authentication uses the provided credentials:
- Username: john_0001
- Password: eCb*Y3cuXZph
"""

import os
import sys
import json
import base64
import requests
import logging
import time
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('fingerprint_self_matching_test.log')
    ]
)
logger = logging.getLogger(__name__)

# Constants
AUTH_CREDS = {'username': 'john_0001', 'password': 'eCb*Y3cuXZph'}
API_BASE = os.environ.get('API_BASE_URL', 'http://127.0.0.1:8000/api')
SAMPLE_DIR = 'docs/fingerprint_reader/sample_fingerprints'
OUTPUT_DIR = 'test_results'
TEST_NATIONAL_ID_PREFIX = 'TEST-SELFMATCH-'

class FingerprintSelfMatchingTest:
    """Test fingerprint self-matching through API endpoints"""
    
    def __init__(self):
        """Initialize the test environment"""
        self.token = None
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'summary': {
                'total': 0,
                'successful': 0,
                'failed': 0
            }
        }
        
        # Create output directory if it doesn't exist
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
    def authenticate(self):
        """Authenticate with the API"""
        try:
            logger.info("Authenticating with API...")
            response = requests.post(f'{API_BASE}/token/', json=AUTH_CREDS)
            response.raise_for_status()
            self.token = response.json()['access']
            logger.info("Authentication successful")
            return True
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            return False
    
    def get_sample_fingerprints(self):
        """Get list of sample fingerprint files"""
        try:
            sample_path = Path(SAMPLE_DIR)
            if not sample_path.exists():
                logger.error(f"Sample directory not found: {SAMPLE_DIR}")
                return []
                
            fingerprint_files = list(sample_path.glob('*.png'))
            logger.info(f"Found {len(fingerprint_files)} sample fingerprints")
            return fingerprint_files
        except Exception as e:
            logger.error(f"Error getting sample fingerprints: {str(e)}")
            return []
    
    def load_fingerprint(self, file_path):
        """Load a fingerprint image and convert to base64"""
        try:
            with open(file_path, 'rb') as f:
                image_data = f.read()
            
            base64_data = base64.b64encode(image_data).decode('ascii')
            logger.info(f"Loaded fingerprint: {file_path.name} ({len(image_data)} bytes)")
            return base64_data
        except Exception as e:
            logger.error(f"Error loading fingerprint {file_path}: {str(e)}")
            return None
    
    def enroll_fingerprint(self, fp_data, national_id):
        """Enroll a fingerprint via API"""
        try:
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Prepare enrollment payload
            payload = {
                'nationalId': national_id,
                'fingerprints': [{
                    'sample': fp_data,
                    'finger': 'Scan 1'
                }],
                'extract_only': True
            }
            
            logger.info(f"Enrolling fingerprint for ID: {national_id}")
            response = requests.post(
                f'{API_BASE}/fingerprints/verify-fingerprint/',
                json=payload, 
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if we have the extracted template
                if 'extracted_template' in result:
                    template_data = result['extracted_template']
                    logger.info(f"Successfully enrolled fingerprint: {national_id}")
                    return template_data
                else:
                    logger.error(f"No template data in enrollment response")
                    return None
            else:
                logger.error(f"Enrollment failed: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error enrolling fingerprint: {str(e)}")
            return None
    
    def verify_fingerprint(self, fp_data, template_data, national_id):
        """Verify a fingerprint against a template via API"""
        try:
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Extract template
            template = template_data.get('iso_template_base64', '')
            
            # Prepare verification payload
            payload = {
                'nationalId': national_id,
                'fingerprints': [{
                    'sample': fp_data,
                    'finger': 'Scan 1'
                }],
                'template': template,
                'threshold': 40,
                'extract_only': False
            }
            
            logger.info(f"Verifying fingerprint for ID: {national_id}")
            response = requests.post(
                f'{API_BASE}/fingerprints/verify-fingerprint/',
                json=payload, 
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if we have a match
                match_score = result.get('match_score', 0)
                is_match = result.get('is_match', False)
                
                logger.info(f"Verification complete: Score={match_score}, Match={is_match}")
                return result
            else:
                logger.error(f"Verification failed: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error verifying fingerprint: {str(e)}")
            return None
    
    def run_self_matching_test(self, fingerprint_file):
        """Run a self-matching test for a single fingerprint"""
        test_result = {
            'file': fingerprint_file.name,
            'national_id': f"{TEST_NATIONAL_ID_PREFIX}{fingerprint_file.stem}",
            'start_time': datetime.now().isoformat(),
            'steps': [],
            'success': False
        }
        
        # Step 1: Load fingerprint
        fp_data = self.load_fingerprint(fingerprint_file)
        if not fp_data:
            test_result['steps'].append({
                'step': 'load_fingerprint',
                'status': 'failed',
                'message': 'Failed to load fingerprint'
            })
            return test_result
        
        test_result['steps'].append({
            'step': 'load_fingerprint',
            'status': 'success'
        })
        
        # Step 2: Enroll fingerprint
        template_data = self.enroll_fingerprint(fp_data, test_result['national_id'])
        if not template_data:
            test_result['steps'].append({
                'step': 'enroll_fingerprint',
                'status': 'failed',
                'message': 'Failed to enroll fingerprint'
            })
            return test_result
        
        test_result['steps'].append({
            'step': 'enroll_fingerprint',
            'status': 'success',
            'template_hash': template_data.get('metadata', {}).get('template_hash', 'unknown')
        })
        
        # Step 3: Verify fingerprint (self-matching)
        verification_result = self.verify_fingerprint(fp_data, template_data, test_result['national_id'])
        if not verification_result:
            test_result['steps'].append({
                'step': 'verify_fingerprint',
                'status': 'failed',
                'message': 'Failed to verify fingerprint'
            })
            return test_result
        
        # Check if the self-match was successful
        match_score = verification_result.get('match_score', 0)
        is_match = verification_result.get('is_match', False)
        
        test_result['steps'].append({
            'step': 'verify_fingerprint',
            'status': 'success' if is_match else 'failed',
            'match_score': match_score,
            'is_match': is_match
        })
        
        test_result['success'] = is_match
        test_result['end_time'] = datetime.now().isoformat()
        
        return test_result
    
    def run_tests(self):
        """Run self-matching tests for all sample fingerprints"""
        # Authenticate with the API
        if not self.authenticate():
            logger.error("Aborting tests due to authentication failure")
            return False
        
        # Get sample fingerprints
        fingerprint_files = self.get_sample_fingerprints()
        if not fingerprint_files:
            logger.error("No sample fingerprints found")
            return False
        
        # Run tests for each fingerprint
        for fp_file in fingerprint_files:
            logger.info(f"Testing fingerprint: {fp_file.name}")
            test_result = self.run_self_matching_test(fp_file)
            
            # Update results
            self.results['tests'].append(test_result)
            self.results['summary']['total'] += 1
            if test_result['success']:
                self.results['summary']['successful'] += 1
            else:
                self.results['summary']['failed'] += 1
        
        # Save results
        self.save_results()
        
        # Display summary
        logger.info(f"Tests completed: {self.results['summary']['successful']}/{self.results['summary']['total']} successful")
        
        return self.results['summary']['failed'] == 0
    
    def save_results(self):
        """Save test results to file"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            result_file = os.path.join(OUTPUT_DIR, f"fingerprint_self_matching_{timestamp}.json")
            
            with open(result_file, 'w') as f:
                json.dump(self.results, f, indent=2)
                
            logger.info(f"Test results saved to: {result_file}")
        except Exception as e:
            logger.error(f"Error saving test results: {str(e)}")


if __name__ == "__main__":
    logger.info("Starting Fingerprint Self-Matching Test")
    
    try:
        test_runner = FingerprintSelfMatchingTest()
        success = test_runner.run_tests()
        
        logger.info("Fingerprint Self-Matching Test completed")
        
        # Exit with status code based on test results
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        sys.exit(1)
