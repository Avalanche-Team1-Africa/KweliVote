import { getAuthToken, setAuthToken, removeAuthToken } from './auth';

// API Base URL - should match with your Django backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Export the API_BASE_URL for other services to use
export { API_BASE_URL };

// Helper for handling API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Handle network errors
  if (error.message === 'Failed to fetch') {
    return new Error('Network error. Check if the server is running.');
  }
  
  // Handle API response errors
  if (error.response) {
    // The request was made, but the server responded with an error
    if (error.response.data && error.response.data.detail) {
      return new Error(error.response.data.detail);
    }
    return new Error(`Server error: ${error.response.status}`);
  }
  
  // Generic error
  return error;
};

// Authentication API functions
export const authAPI = {
  // Login function
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      // Store the token in localStorage
      if (data.access) {
        setAuthToken(data.access);
      }
      
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // Function to get current user details
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // Logout function - clears session storage and any auth data
  logout() {
    sessionStorage.removeItem('userInfo');
    return { success: true };
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      return !!userInfo.token;
    } catch (e) {
      return false;
    }
  },
  
  // Refresh token function
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      // Update token in session storage
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      userInfo.token = data.access;
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Helper function for authenticated requests
const authenticatedRequest = async (url, method = 'GET', data = null) => {
  // Get token from session storage
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token;
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  // Log fingerprint-related API calls
  if (url.includes('fingerprint')) {
    console.log(`[Fingerprint API] Making ${method} request to ${url}`);
    if (data && data.nationalId) {
      console.log(`[Fingerprint API] Request for national ID: ${data.nationalId}`);
    }
  }
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Check for 401 (Unauthorized) and handle token expiration
      if (response.status === 401) {
        // Clear session storage and redirect to login
        sessionStorage.removeItem('userInfo');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      const errorData = await response.json();
      // Log fingerprint-related API errors
      if (url.includes('fingerprint')) {
        console.error(`[Fingerprint API] Error in ${method} request to ${url}:`, errorData);
        if (data && data.nationalId) {
          console.error(`[Fingerprint API] Failed request for national ID: ${data.nationalId}`);
        }
      }
      throw { response: { status: response.status, data: errorData } };
    }
    
    // For DELETE requests that return no content
    if (method === 'DELETE' && response.status === 204) {
      return { success: true };
    }
    
    const responseData = await response.json();
    
    // Log successful fingerprint-related API responses
    if (url.includes('fingerprint')) {
      console.log(`[Fingerprint API] Successful ${method} request to ${url}`);
      if (responseData && responseData.national_id) {
        console.log(`[Fingerprint API] Processed template for national ID: ${responseData.national_id}`);
      }
    }
    
    return responseData;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Voter API functions
export const voterAPI = {
  async getVoters() {
    return authenticatedRequest(`${API_BASE_URL}/voters/`);
  },
  
  async getVoterById(id) {
    return authenticatedRequest(`${API_BASE_URL}/voters/${id}/`);
  },
  
  async createVoter(data) {
    // Extract any biometric data from the request
    const biometricData = {};
    if (data.did) biometricData.did = data.did;
    if (data.biometric_template) biometricData.biometric_template = data.biometric_template;
    if (data.blockchain_tx_id) biometricData.blockchain_tx_id = data.blockchain_tx_id;
    if (data.blockchain_subnet_id) biometricData.blockchain_subnet_id = data.blockchain_subnet_id;
    
    // Remove biometric fields from main data
    const voterData = { ...data };
    delete voterData.did;
    delete voterData.biometric_template;
    delete voterData.has_template;
    
    // If biometric data is present, include it in the request
    return authenticatedRequest(`${API_BASE_URL}/voters/`, 'POST', {
      ...voterData,
      ...(biometricData.did && biometricData.biometric_template ? biometricData : {})
    });
  },
  
  async updateVoter(id, data) {
    try {
      // First, get the current voter data if we're only updating specific fields
      let completeVoterData = { ...data };

      // Handle camelCase to snake_case conversion for these fields
      if (data.designatedPollingStation) {
        completeVoterData.designated_polling_station = data.designatedPollingStation;
        delete completeVoterData.designatedPollingStation;
      }

      // Check if we're only updating specific fields like blockchain data
      const requiredFields = ['nationalid', 'firstname', 'surname', 'designated_polling_station', 'created_by'];
      const missingFields = requiredFields.filter(field => !completeVoterData[field]);

      // If we're missing required fields, fetch the voter data first
      if (missingFields.length > 0) {
        console.log("Fetching complete voter data before update since required fields are missing");
        const currentVoter = await this.getVoterById(id);
        if (currentVoter) {
          // Fill in any missing required fields from existing data
          completeVoterData = {
            ...currentVoter, // Start with all current data
            ...completeVoterData, // Override with any new data provided
            
            // Ensure these required fields exist
            nationalid: completeVoterData.nationalid || currentVoter.nationalid,
            firstname: completeVoterData.firstname || currentVoter.firstname,
            surname: completeVoterData.surname || currentVoter.surname,
            designated_polling_station: completeVoterData.designated_polling_station || currentVoter.designated_polling_station,
            created_by: completeVoterData.created_by || currentVoter.created_by
          };
        }
      }
      
      // Extract any biometric data from the request
      const biometricData = {};
      if (completeVoterData.did) biometricData.did = completeVoterData.did;
      if (completeVoterData.biometric_template) biometricData.biometric_template = completeVoterData.biometric_template;
      if (completeVoterData.blockchain_tx_id) biometricData.blockchain_tx_id = completeVoterData.blockchain_tx_id;
      if (completeVoterData.blockchain_subnet_id) biometricData.blockchain_subnet_id = completeVoterData.blockchain_subnet_id;
      
      // Remove biometric fields from main data
      const voterData = { ...completeVoterData };
      delete voterData.did;
      delete voterData.biometric_template;
      delete voterData.has_template;
      
      // Update voter with non-biometric data and biometric data if available
      return authenticatedRequest(`${API_BASE_URL}/voters/${id}/`, 'PUT', {
        ...voterData,
        ...(biometricData.did && biometricData.biometric_template ? biometricData : {})
      });
    } catch (error) {
      console.error("Error updating voter:", error);
      throw error;
    }
  },
  
  async deleteVoter(id) {
    return authenticatedRequest(`${API_BASE_URL}/voters/${id}/`, 'DELETE');
  },
  
  // Enhanced search method with server-side and client-side fallback
  async searchVoters(searchTerm) {
    if (!searchTerm) return [];
    
    try {
      // Try server-side search first (assumes backend has search endpoint)
      try {
        const response = await fetch(`${API_BASE_URL}/voters/search/?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${JSON.parse(sessionStorage.getItem('userInfo') || '{}').token}`
          }
        });
        
        // Check if response is OK and is JSON
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          // If not JSON or not OK, throw error to trigger fallback
          throw new Error('Server-side search unavailable or returned non-JSON response');
        }
      } catch (searchError) {
        console.log('Server-side search error:', searchError.message);
        throw searchError; // Re-throw to trigger fallback
      }
    } catch (error) {
      console.log('Server-side search not available, falling back to client-side filtering');
      
      // Fallback to client-side filtering
      const voters = await authenticatedRequest(`${API_BASE_URL}/voters/`);
      searchTerm = searchTerm.toLowerCase();
      
      return voters.filter(voter => 
        voter.nationalid.toLowerCase().includes(searchTerm) ||
        voter.firstname.toLowerCase().includes(searchTerm) ||
        voter.surname.toLowerCase().includes(searchTerm) ||
        (voter.middlename && voter.middlename.toLowerCase().includes(searchTerm)) ||
        (voter.designated_polling_station && voter.designated_polling_station.toLowerCase().includes(searchTerm))
      );
    }
  },

  // Method to save biometric data (DID, template, has_template)
  // Only use this when you need to explicitly save biometric data separately
  async saveBiometricData(voterId, data) {
    // Validate data before sending
    if (!data.did || !data.biometric_template) {
      throw new Error('Both DID and biometric template are required');
    }
    
    // voterId is the nationalid of the voter
    return authenticatedRequest(
      `${API_BASE_URL}/voters/${voterId}/biometric-data/`, 
      'POST', 
      data
    );
  },
};

// Keyperson API functions
export const keypersonAPI = {
  async getKeypersons() {
    return authenticatedRequest(`${API_BASE_URL}/keypersons/`);
  },
  
  async getKeypersonById(id) {
    return authenticatedRequest(`${API_BASE_URL}/keypersons/${id}/`);
  },
  
  async createKeyperson(data) {
    // Extract any biometric data from the request
    const biometricData = {};
    if (data.did) biometricData.did = data.did;
    if (data.biometric_template) biometricData.biometric_template = data.biometric_template;
    
    // Remove biometric fields from main data
    const keypersonData = { ...data };
    delete keypersonData.did;
    delete keypersonData.biometric_template;
    delete keypersonData.has_template;
    delete keypersonData.blockchain_tx_id;
    delete keypersonData.blockchain_subnet_id;

    // Convert camelCase field names to snake_case for backend
    const transformedData = {
      ...keypersonData,
      designated_polling_station: keypersonData.designatedPollingStation,
      political_party: keypersonData.politicalParty,
      observer_type: keypersonData.observerType,
      // Get current user info for created_by field
      created_by: JSON.parse(sessionStorage.getItem('userInfo') || '{}').username || 'system',
    };
    
    // Remove the camelCase fields to avoid duplications
    delete transformedData.designatedPollingStation;
    delete transformedData.politicalParty;
    delete transformedData.observerType;
    
    // If both DID and biometric_template are present, include them in the request
    return authenticatedRequest(`${API_BASE_URL}/keypersons/`, 'POST', {
      ...transformedData,
      ...(biometricData.did && biometricData.biometric_template ? biometricData : {})
    });
  },
  
  async updateKeyperson(id, data) {
    // Extract any biometric data from the request
    const biometricData = {};
    if (data.did) biometricData.did = data.did;
    if (data.biometric_template) biometricData.biometric_template = data.biometric_template;
    
    // Remove biometric fields from main data
    const keypersonData = { ...data };
    delete keypersonData.did;
    delete keypersonData.biometric_template;
    delete keypersonData.has_template;
    delete keypersonData.blockchain_tx_id;
    delete keypersonData.blockchain_subnet_id;
    
    // Convert camelCase field names to snake_case for backend
    const transformedData = {
      ...keypersonData,
      designated_polling_station: keypersonData.designatedPollingStation,
      political_party: keypersonData.politicalParty,
      observer_type: keypersonData.observerType,
      // Get current user info for created_by field
      created_by: JSON.parse(sessionStorage.getItem('userInfo') || '{}').username || 'system',
    };
    
    // Remove the camelCase fields to avoid duplications
    delete transformedData.designatedPollingStation;
    delete transformedData.politicalParty;
    delete transformedData.observerType;
    
    // Update keyperson with non-biometric data and biometric data if available
    return authenticatedRequest(`${API_BASE_URL}/keypersons/${id}/`, 'PUT', {
      ...transformedData,
      ...(biometricData.did && biometricData.biometric_template ? biometricData : {})
    });
  },
  
  async deleteKeyperson(id) {
    return authenticatedRequest(`${API_BASE_URL}/keypersons/${id}/`, 'DELETE');
  },
  
  // Additional endpoint for creating user accounts for keypersons
  async createKeypersonUser(data) {
    return authenticatedRequest(`${API_BASE_URL}/users/`, 'POST', data);
  },

  // Transaction-based endpoint for creating both keyperson and user in a single operation
  async createKeypersonWithUser(data) {
    // Extract any biometric data from the request
    const biometricData = {};
    if (data.did) biometricData.did = data.did;
    if (data.biometric_template) biometricData.biometric_template = data.biometric_template;
    
    // Send the data to the endpoint - it will handle biometric data if present
    try {
      const response = await fetch(`${API_BASE_URL}/keyperson-with-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ...biometricData  // Include biometric data if available
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // New method to search keypersons by name or national ID
  async searchKeypersons(searchTerm) {
    if (!searchTerm) return [];
    
    try {
      // Try server-side search first (assumes backend has search endpoint)
      try {
        const response = await fetch(`${API_BASE_URL}/keypersons/search/?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${JSON.parse(sessionStorage.getItem('userInfo') || '{}').token}`
          }
        });
        
        // Check if response is OK and is JSON
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          // If not JSON or not OK, throw error to trigger fallback
          throw new Error('Server-side search unavailable or returned non-JSON response');
        }
      } catch (searchError) {
        console.log('Server-side search error:', searchError.message);
        throw searchError; // Re-throw to trigger fallback
      }
    } catch (error) {
      console.log('Server-side search not available, falling back to client-side filtering');
      
      // Fallback to client-side filtering
      const keypersons = await authenticatedRequest(`${API_BASE_URL}/keypersons/`);
      searchTerm = searchTerm.toLowerCase();
      
      return keypersons.filter(keyperson => 
        keyperson.nationalid.toLowerCase().includes(searchTerm) ||
        keyperson.firstname.toLowerCase().includes(searchTerm) ||
        keyperson.surname.toLowerCase().includes(searchTerm) ||
        (keyperson.middlename && keyperson.middlename.toLowerCase().includes(searchTerm)) ||
        (keyperson.role && keyperson.role.toLowerCase().includes(searchTerm))
      );
    }
  },

  // Method to save biometric data (DID, template, has_template)
  // Only use this when you need to explicitly save biometric data separately
  async saveBiometricData(keypersonId, data) {
    // Validate data before sending
    if (!data.did || !data.biometric_template) {
      throw new Error('Both DID and biometric template are required');
    }
    
    // keypersonId is the nationalid of the keyperson
    return authenticatedRequest(
      `${API_BASE_URL}/keypersons/${keypersonId}/biometric-data/`, 
      'POST', 
      data
    );
  },
};

// Candidate API functions
export const candidateAPI = {
  async getCandidates() {
    return authenticatedRequest(`${API_BASE_URL}/candidates/`);
  },
  
  async getCandidateById(id) {
    return authenticatedRequest(`${API_BASE_URL}/candidates/${id}/`);
  }
};

// Results API functions
export const resultsAPI = {
  async getResults() {
    return authenticatedRequest(`${API_BASE_URL}/resultscount/`);
  },
  
  async getResultById(id) {
    return authenticatedRequest(`${API_BASE_URL}/resultscount/${id}/`);
  },
  
  async createResult(data) {
    return authenticatedRequest(`${API_BASE_URL}/resultscount/`, 'POST', data);
  },
  
  async updateResult(id, data) {
    return authenticatedRequest(`${API_BASE_URL}/resultscount/${id}/`, 'PUT', data);
  }
};

// Fingerprint processing API functions
export const fingerprintAPI = {
  // Process fingerprint templates with proper authentication
  async processTemplate(template) {
    // Validate required nationalId field
    if (!template.nationalId) {
      console.error('National ID is required for fingerprint template processing');
      throw new Error('National ID is required');
    }
    
    console.log(`Sending fingerprint template request for national ID: ${template.nationalId}`);
    
    // Use the verify-fingerprint endpoint with extract_only=true to process JSON data with base64 images
    // The process-fingerprint-template endpoint only accepts file uploads, not JSON data
    const requestData = {
      ...template,
      extract_only: true  // This tells the verification endpoint to only extract the template, not perform matching
    };
    
    return authenticatedRequest(
      `${API_BASE_URL}/fingerprints/verify-fingerprint/`,
      'POST',
      requestData
    );
  },
  
  // Verify fingerprint using template data
  async verifyFingerprintTemplate(template, nationalId, threshold = 40) {
    return authenticatedRequest(
      `${API_BASE_URL}/fingerprints/verify-fingerprint-template/`,
      'POST',
      {
        template: template,
        national_id: nationalId,
        threshold: threshold,
        is_template_data: true
      }
    );
  }
};

// Create a named object for the default export
const apiServices = {
  auth: authAPI,
  voter: voterAPI,
  keyperson: keypersonAPI,
  candidate: candidateAPI,
  results: resultsAPI,
  fingerprint: fingerprintAPI,
};

export default apiServices;