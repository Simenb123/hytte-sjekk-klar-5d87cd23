
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/layout/Layout';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Show a simple loading state while redirecting
  return (
    <Layout title="Laster">
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
