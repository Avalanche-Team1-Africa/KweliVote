import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get user info from session storage
  const userInfoString = sessionStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  
  // Check if user is authenticated (has a valid token) and has the allowed role
  const isAuthenticated = !!userInfo && !!userInfo.token;
  const hasRole = isAuthenticated && allowedRoles.includes(userInfo.role);
  
  // If not authenticated or doesn't have the role, redirect to home
  if (!isAuthenticated || !hasRole) {
    // Clear any stored user info if authentication fails
    if (!isAuthenticated) {
      authAPI.logout();
    }
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children (the protected component)
  return children;
};

export default ProtectedRoute;