
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/state/auth';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-center">Laster...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
