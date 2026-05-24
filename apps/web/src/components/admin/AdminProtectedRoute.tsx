import React from 'react';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  // Check if admin is authenticated (you can enhance this with proper JWT validation)
  const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  
  if (!adminToken) {
    // Redirect to admin login if not authenticated.
    // Absolute "/login" would land on the vendor login page; AdminApp is
    // mounted at /admin/*, so the admin login lives at /admin/login.
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
