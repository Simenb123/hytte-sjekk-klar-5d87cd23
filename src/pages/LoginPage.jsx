
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/state/auth';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vennligst fyll ut alle felt');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Innlogging vellykket!');
    } catch (error) {
      toast.error('En uventet feil oppstod');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">Logg inn</h1>
        
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
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>

          <div className="text-center mt-4">
            <p>
              Har du ikke en konto?{' '}
              <Link to="/auth" className="text-blue-600 hover:underline">Registrer deg her</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
