import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Get the selected role from session storage
    const selectedRole = sessionStorage.getItem('selectedRole');
    if (!selectedRole) {
      // If no role selected, redirect to home
      navigate('/');
    } else {
      setRole(selectedRole);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Call the login API
      const response = await authAPI.login(username, password);
      
      // Extract tokens and any user data from response
      const { access, refresh, role: userRole, nationalid, name } = response;
      
      // Use the role from the response if available, otherwise use the selected role
      const effectiveRole = userRole || role;
      
      // Store the authenticated user info
      const userInfo = {
        username,
        token: access,
        refreshToken: refresh,
        role: effectiveRole,
        nationalId: nationalid,
        name,
      };
      
      // Use the context login function to persist user info in context and storage
      login(userInfo);
        
      // Redirect based on role
      switch(effectiveRole) {
        case 'IEBC Constituency Election Coordinators (CECs)':
          navigate('/register-keypersons');
          break;
        case 'Registration Clerk':
          navigate('/register-voters');
          break;
        case 'Polling Clerks':
          navigate('/view-data');
          break;
        case 'Presiding Officer (PO)':
        case 'Deputy Presiding Officer (DPO)':
          navigate('/results-count');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-kweli-light rounded-full mb-6 shadow-soft-sm">
            <img 
              src="/img/kwelivote_logo.png" 
              alt="KweliVote Logo" 
              className="h-14"
            />
          </div>
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">Welcome Back</h2>
          <div className="inline-block bg-gradient-to-r from-kweli-accent/20 to-kweli-primary/10 text-kweli-secondary px-4 py-2 rounded-full">
            <p className="font-medium">{role}</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-soft-sm animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
                placeholder="Enter your username"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`w-full flex items-center justify-center bg-kweli-primary hover:bg-kweli-secondary text-white font-medium py-3 px-6 rounded-lg shadow-soft transition-all duration-300 ${isLoading ? 'opacity-80' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              <>
                Sign In
                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <button 
            onClick={() => navigate('/')}
            className="text-kweli-secondary hover:text-kweli-primary transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
