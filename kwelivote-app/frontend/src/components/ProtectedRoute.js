import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Use the auth context to get current user info
  const { currentUser, isAuthenticated } = useAuth();
  
  // Check if user is authenticated and has the allowed role
  const hasRole = isAuthenticated && allowedRoles.includes(currentUser.role);
  
  // If not authenticated or doesn't have the role, redirect to home
  if (!isAuthenticated || !hasRole) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children (the protected component)
  return children;
};

export default ProtectedRoute;