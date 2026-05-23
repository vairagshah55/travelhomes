import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    // If authenticated, redirect to dashboard or the page they were trying to access
    const from = (location.state as any)?.from?.pathname || (user?.userType === 'vendor' ? '/dashboard' : '/');
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
