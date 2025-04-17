
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import ChecklistApp from './pages/ChecklistApp';
import LogsPage from './pages/LogsPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingPage />} />
          <Route path="/checklist" element={<ChecklistApp />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
