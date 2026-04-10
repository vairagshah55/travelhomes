import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticateAfterRegister, isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.log('OAuthRedirect mounted');
    console.log('Current auth state:', { isAuthenticated, user });
    
    const handleRedirect = () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      console.log('URL params:', { token: token ? 'present' : 'missing', userParam: userParam ? 'present' : 'missing', error });

      if (error) {
        toast.error('Authentication failed: ' + error);
        navigate('/login');
        return;
      }

      if (token && userParam) {
        try {
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(userParam));
          console.log('Parsed user data:', userData);
          
          // Store token
          localStorage.setItem('travel_auth_token', token);
          console.log('Token stored in localStorage');
          
          // Format user for auth context
          const user = {
            id: userData._id || userData.id,
            email: userData.email,
            firstName: userData.name?.split(' ')[0] || userData.fullname?.split(' ')[0] || '',
            lastName: userData.name?.split(' ').slice(1).join(' ') || userData.fullname?.split(' ').slice(1).join(' ') || '',
            userType: userData.userType || 'user',
            photo: userData.photo,
            vendorStatus: userData.vendorStatus
          };

          console.log('Formatted user for auth:', user);

          // Authenticate user
          authenticateAfterRegister(user);
          
          // Check if authentication worked
          setTimeout(() => {
            console.log('After authenticateAfterRegister - isAuthenticated:', isAuthenticated);
            console.log('After authenticateAfterRegister - user:', user);
          }, 100);
          
          toast.success('Successfully signed in with Google!');
          
          // Redirect to home or previous page
          const redirectPath = sessionStorage.getItem('auth_redirect') || '/';
          sessionStorage.removeItem('auth_redirect');
          console.log('Redirecting to:', redirectPath);
          
          // Use window.location for hard redirect to ensure state is reset
          window.location.href = redirectPath;
        } catch (err) {
          console.error('Error parsing user data:', err);
          toast.error('Failed to process authentication');
          navigate('/login');
        }
      } else {
        console.error('Missing token or user data');
        navigate('/login');
      }
    };

    handleRedirect();
  }, [searchParams, navigate, authenticateAfterRegister]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;