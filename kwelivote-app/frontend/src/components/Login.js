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
      setError(error.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-kweli-light to-white">
      <div className="m-auto w-full max-w-md">
        <div className="bg-white rounded-xl shadow-soft-2xl p-8 transition-all duration-300 hover:shadow-soft-3xl">
          <div className="text-center mb-8">
            <img 
              src="/img/kwelivote_logo.png" 
              alt="KweliVote Logo" 
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-kweli-dark">
              {role === 'keyperson' ? 'Key Person Login' : 
               role === 'admin' ? 'Administrator Login' : 
               role === 'voter' ? 'Voter Login' : 'Login'}
            </h2>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              <p className="font-medium">Authentication Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-kweli-dark mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kweli-primary focus:ring focus:ring-kweli-primary/20 focus:outline-none transition-all duration-200"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-kweli-dark mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kweli-primary focus:ring focus:ring-kweli-primary/20 focus:outline-none transition-all duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-kweli-primary hover:bg-kweli-primary/90 text-white font-medium py-3 px-4 rounded-lg shadow-soft-1xl hover:shadow-soft-2xl transition-all duration-200 flex justify-center items-center"
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
                  'Login'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-kweli-primary hover:text-kweli-secondary text-sm font-medium transition-colors duration-200"
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
