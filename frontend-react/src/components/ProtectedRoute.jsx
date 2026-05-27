import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If page is restricted to Admin role and user is not an admin, redirect to home dashboard
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/browse" replace />;
  }

  return children;
};

export default ProtectedRoute;
