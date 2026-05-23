import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, authenticateAfterRegister } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Authentication failed: ' + error);
        navigate('/login');
        return;
      }

      // Handle direct token/user from backend (unified flow)
      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          // Store token
          localStorage.setItem('travel_auth_token', token);
          
          // Format user
          const userObj = {
            id: userData._id || userData.id,
            email: userData.email,
            firstName: userData.name?.split(' ')[0] || userData.fullname?.split(' ')[0] || '',
            lastName: userData.name?.split(' ').slice(1).join(' ') || userData.fullname?.split(' ').slice(1).join(' ') || '',
            userType: ((userData.userType as string)?.toLowerCase() as any as string)?.toLowerCase() as any || 'user' ,
            photo: userData.photo,
            vendorStatus: userData.vendorStatus
          };

          // Authenticate
          authenticateAfterRegister(userObj);
          
          toast.success('Successfully signed in with Google!');
          
          const redirectPath = sessionStorage.getItem('auth_redirect') || '/';
          sessionStorage.removeItem('auth_redirect');
          window.location.href = redirectPath;
          return;
        } catch (err) {
          console.error('Error parsing user data:', err);
          toast.error('Failed to process authentication');
          navigate('/login');
          return;
        }
      }

      // Handle authorization code
      if (code) {
        try {
          const { success, message } = await handleGoogleCallback(code);
          if (success) {
            toast.success('Successfully signed in with Google!');
            // Redirect to stored location or home
            const redirectPath = sessionStorage.getItem('auth_redirect') || '/';
            sessionStorage.removeItem('auth_redirect');
            console.log('Redirecting to:', redirectPath);
            window.location.href = redirectPath;
          } else {
            toast.error(`Authentication failed: ${message || 'Unknown error'}`);
            // Wait a bit before redirecting so user can see the error
            setTimeout(() => navigate('/login'), 2000);
          }
        } catch (err: any) {
          console.error('Callback error:', err);
          toast.error(`Authentication failed: ${err.message || 'Unknown error'}`);
          setTimeout(() => navigate('/login'), 2000);
        }
      } else if (!token) {
        toast.error('No authorization code or token received');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, handleGoogleCallback, authenticateAfterRegister, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;