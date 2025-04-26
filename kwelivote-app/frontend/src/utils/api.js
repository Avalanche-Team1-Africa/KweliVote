// API Base URL - should match with your Django backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper for handling API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Handle network errors
  if (error.message === 'Failed to fetch') {
    throw new Error('Network error. Check if the server is running.');
  }
  
  // Handle API response errors
  if (error.response) {
    // The request was made, but the server responded with an error
    if (error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(`Server error: ${error.response.status}`);
  }
  
  // Generic error
  throw error;
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
      
      return await response.json();
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
      throw { response: { status: response.status, data: errorData } };
    }
    
    // For DELETE requests that return no content
    if (method === 'DELETE' && response.status === 204) {
      return { success: true };
    }
    
    return await response.json();
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
    return authenticatedRequest(`${API_BASE_URL}/voters/`, 'POST', data);
  },
  
  async updateVoter(id, data) {
    return authenticatedRequest(`${API_BASE_URL}/voters/${id}/`, 'PUT', data);
  },
  
  async deleteVoter(id) {
    return authenticatedRequest(`${API_BASE_URL}/voters/${id}/`, 'DELETE');
  },
  
  // New method to save biometric template
  async saveBiometricTemplate(voterId, template) {
    return authenticatedRequest(
      `${API_BASE_URL}/voters/${voterId}/biometric-template/`, 
      'POST', 
      { template }
    );
  }
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
    return authenticatedRequest(`${API_BASE_URL}/keypersons/`, 'POST', data);
  },
  
  async updateKeyperson(id, data) {
    return authenticatedRequest(`${API_BASE_URL}/keypersons/${id}/`, 'PUT', data);
  },
  
  async deleteKeyperson(id) {
    return authenticatedRequest(`${API_BASE_URL}/keypersons/${id}/`, 'DELETE');
  },
  
  // Additional endpoint for creating user accounts for keypersons
  async createKeypersonUser(data) {
    return authenticatedRequest(`${API_BASE_URL}/users/`, 'POST', data);
  },

  // New transaction-based endpoint for creating both keyperson and user in a single operation
  async createKeypersonWithUser(data) {
    // This endpoint doesn't require authentication for keyperson registration
    try {
      const response = await fetch(`${API_BASE_URL}/keyperson-with-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }
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
  }
};

export default {
  auth: authAPI,
  voter: voterAPI,
  keyperson: keypersonAPI,
  candidate: candidateAPI,
  results: resultsAPI,
};