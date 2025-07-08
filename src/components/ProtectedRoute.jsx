
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center">Laster...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
