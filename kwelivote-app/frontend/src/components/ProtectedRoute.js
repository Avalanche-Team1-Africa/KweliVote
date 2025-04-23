import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get user info from session storage
  const userInfoString = sessionStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  
  // Check if user is authenticated and has the allowed role
  const isAuthenticated = !!userInfo;
  const hasRole = isAuthenticated && allowedRoles.includes(userInfo.role);
  
  // If not authenticated or doesn't have the role, redirect to home
  if (!isAuthenticated || !hasRole) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children (the protected component)
  return children;
};

export default ProtectedRoute;