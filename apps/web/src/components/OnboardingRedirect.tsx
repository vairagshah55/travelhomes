import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

const OnboardingRedirect: React.FC<OnboardingRedirectProps> = ({ children }) => {
  const { isAuthenticated, needsOnboarding } = useAuth();

  // If user is authenticated but needs onboarding, redirect to service selection
  if (isAuthenticated && needsOnboarding) {
    return <Navigate to="/onboarding/service-selection" replace />;
  }

  return <>{children}</>;
};

export default OnboardingRedirect;
