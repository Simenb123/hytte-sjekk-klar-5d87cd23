
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import ChecklistApp from './pages/ChecklistApp';
import LogsPage from './pages/LogsPage';
import AuthPage from './pages/AuthPage';
import ChecklistHome from './pages/ChecklistHome';
import ArrivalChecklist from './pages/ArrivalChecklist';
import DepartureChecklist from './pages/DepartureChecklist';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './context/AuthContext';
import { ChecklistProvider } from './context/ChecklistContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
          <ChecklistProvider>
            <Router>
              <Toaster position="top-right" />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<BookingPage />} />
                <Route path="/checklist" element={<ChecklistApp />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/checklists" element={
                  <ProtectedRoute>
                    <ChecklistHome />
                  </ProtectedRoute>
                } />
                <Route path="/checklists/arrival" element={
                  <ProtectedRoute>
                    <ArrivalChecklist />
                  </ProtectedRoute>
                } />
                <Route path="/checklists/departure" element={
                  <ProtectedRoute>
                    <DepartureChecklist />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </ChecklistProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
