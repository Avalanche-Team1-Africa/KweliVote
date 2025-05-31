import { getAuthToken } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';

class FingerprintService {
  /**
   * Verify a fingerprint against a stored template for a national ID
   * @param {File} fingerprintImage - The fingerprint image file
   * @param {string} nationalId - The national ID to match against
   * @param {number} threshold - Optional matching threshold (default: 40)
   * @returns {Promise<Object>} - The verification result
   */
  async verifyFingerprint(fingerprintImage, nationalId, threshold = 40) {
    if (!fingerprintImage) {
      throw new Error('Fingerprint image is required');
    }
    
    if (!nationalId) {
      throw new Error('National ID is required');
    }
    
    try {
      // Create form data with the fingerprint image and national ID
      const formData = new FormData();
      formData.append('fingerprint', fingerprintImage);
      formData.append('national_id', nationalId);
      formData.append('threshold', threshold);
      
      // Get the authentication token
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/fingerprints/verify-fingerprint/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to verify fingerprint: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying fingerprint:', error);
      throw error;
    }
  }
  
  /**
   * Identify a fingerprint against all stored templates
   * @param {File} fingerprintImage - The fingerprint image file
   * @param {number} threshold - Optional matching threshold (default: 40)
   * @param {number} limit - Optional result limit (default: 5)
   * @returns {Promise<Object>} - The identification results
   */
  async identifyFingerprint(fingerprintImage, threshold = 40, limit = 5) {
    if (!fingerprintImage) {
      throw new Error('Fingerprint image is required');
    }
    
    try {
      // Create form data with the fingerprint image
      const formData = new FormData();
      formData.append('fingerprint', fingerprintImage);
      formData.append('threshold', threshold);
      formData.append('limit', limit);
      
      // Get the authentication token
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/fingerprints/identify-fingerprint/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to identify fingerprint: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error identifying fingerprint:', error);
      throw error;
    }
  }
}

export default new FingerprintService();
