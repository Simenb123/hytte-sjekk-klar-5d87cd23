
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/checklists" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Vennligst skriv inn e-posten din');
      return;
    }

    setLoading(true);
    setMessage('');

    const { success, error } = await login(email);
    
    if (success) {
      setMessage('Sjekk e-posten din for innloggingslenke!');
    } else {
      setMessage(`Feil: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Logg inn</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-post
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-medium
            ${loading 
              ? 'bg-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={loading}
        >
          {loading ? 'Sender...' : 'Send innloggingslenke'}
        </button>
      </form>
      
      {message && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
