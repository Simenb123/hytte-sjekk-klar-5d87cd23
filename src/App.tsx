import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import ChecklistHome from './pages/ChecklistHome';
import ChecklistPage from './pages/ChecklistPage';
import CalendarApp from './pages/CalendarApp';
import InventoryPage from './pages/InventoryPage';
import FamilyPage from './pages/FamilyPage';
import WeatherApp from './pages/WeatherApp';
import AiHelperPage from './pages/AiHelperPage';
import LogsPage from './pages/LogsPage';
import OtherApps from './pages/OtherApps';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ChecklistAdminPage from './pages/ChecklistAdminPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/booking" element={
                <ProtectedRoute>
                  <BookingPage />
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
              <Route path="/checklists/admin" element={
                <ProtectedRoute>
                  <ChecklistAdminPage />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <CalendarApp />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } />
              <Route path="/family" element={
                <ProtectedRoute>
                  <FamilyPage />
                </ProtectedRoute>
              } />
              <Route path="/weather" element={
                <ProtectedRoute>
                  <WeatherApp />
                </ProtectedRoute>
              } />
              <Route path="/ai-helper" element={
                <ProtectedRoute>
                  <AiHelperPage />
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <LogsPage />
                </ProtectedRoute>
              } />
              <Route path="/other-apps" element={
                <ProtectedRoute>
                  <OtherApps />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
