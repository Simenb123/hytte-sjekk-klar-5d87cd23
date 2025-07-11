import { useContext } from 'react';
import { AuthContext } from '@/state/auth';

/** Hook for convenient access to auth context. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
