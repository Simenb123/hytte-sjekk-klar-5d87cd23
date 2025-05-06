
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signup } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/checklists" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      setMessage('Vennligst fyll ut alle felt');
      return;
    }

    setLoading(true);
    setMessage('');

    const { success, error } = await signup(email, password, firstName, lastName);
    
    if (success) {
      setMessage('Konto opprettet! Du kan nå logge inn.');
    } else {
      setMessage(`Feil: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Registrer ny konto</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              Fornavn
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Etternavn
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
        </div>
        
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
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Passord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">Minst 6 tegn</p>
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-medium
            ${loading 
              ? 'bg-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={loading}
        >
          {loading ? 'Registrerer...' : 'Registrer konto'}
        </button>

        <div className="text-center mt-4">
          <p>Har du allerede en konto? <Link to="/login" className="text-blue-600 hover:underline">Logg inn her</Link></p>
        </div>
      </form>
      
      {message && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
