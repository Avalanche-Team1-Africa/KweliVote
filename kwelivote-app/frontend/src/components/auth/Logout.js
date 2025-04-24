import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const Logout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    try {
      // Call the logout method from authAPI
      authAPI.logout();
      
      // Force clear the session storage to ensure all user data is removed
      sessionStorage.clear();
      
      // Small delay to show the logout animation
      setTimeout(() => {
        // Redirect to home page and force a page refresh to reset the app state
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // If there's an error, still clear session and redirect
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center text-kweli-secondary hover:text-red-600 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary rounded-md ${isLoggingOut ? 'opacity-70' : ''}`}
    >
      {isLoggingOut ? (
        <>
          <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging out...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </>
      )}
    </button>
  );
};

export default Logout;