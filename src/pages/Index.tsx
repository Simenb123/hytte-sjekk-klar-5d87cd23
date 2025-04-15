
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard (ensure we use the correct path)
    navigate('/dashboard');
  }, [navigate]);

  return null; // This component just redirects, so no need to render anything
};

export default Index;
