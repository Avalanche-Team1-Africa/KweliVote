import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './api';
import { useNavigate } from 'react-router-dom';

// Create the Authentication Context
const AuthContext = createContext(null);

// Provider component that wraps the app and makes auth object available to all child components
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage for existing user info when the app loads
    const userInfoString = sessionStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        setCurrentUser(userInfo);
      } catch (error) {
        console.error('Error parsing user info from session storage', error);
        sessionStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  // Login function to store user data and set current user
  const login = (userData) => {
    sessionStorage.setItem('userInfo', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  // Logout function to clear session and user data
  const logout = () => {
    authAPI.logout();
    sessionStorage.removeItem('userInfo');
    setCurrentUser(null);
  };

  // Auth context value to be provided to children
  const value = {
    currentUser,
    loading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};