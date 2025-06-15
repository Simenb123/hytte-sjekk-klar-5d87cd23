import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import LogsPage from './pages/LogsPage';
import AuthPage from './pages/AuthPage';
import ChecklistHome from './pages/ChecklistHome';
import ChecklistPage from './pages/ChecklistPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <LogsPage />
                </ProtectedRoute>
              } />
              <Route path="/checklists" element={
                <ProtectedRoute>
                  <ChecklistHome />
                </ProtectedRoute>
              } />
              <Route path="/checklists/:category" element={
                <ProtectedRoute>
                  <ChecklistPage />
                </ProtectedRoute>
              } />
              
              {/* Redirect root to login if not authenticated, otherwise to dashboard */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
