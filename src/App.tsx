
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/state/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';

// Import pages
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import ChecklistPage from './pages/ChecklistPage';
import ChecklistHome from './pages/ChecklistHome';
import ChecklistAdminPage from './pages/ChecklistAdminPage';
import InventoryPage from './pages/InventoryPage';
import FamilyPage from './pages/FamilyPage';
import BookingPage from './pages/BookingPage';
import CalendarApp from './pages/CalendarApp';
import WeatherApp from './pages/WeatherApp';
import AiHelperPage from './pages/AiHelperPage';
import DocumentsPage from './pages/DocumentsPage';
import HyttebokPage from './pages/HyttebokPage';
import OtherApps from './pages/OtherApps';
import LogsPage from './pages/LogsPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/checklist"
                element={
                  <ProtectedRoute>
                    <ChecklistHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checklist/:category"
                element={
                  <ProtectedRoute>
                    <ChecklistPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/checklist-admin" element={<ChecklistAdminPage />} />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/family"
                element={
                  <ProtectedRoute>
                    <FamilyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/calendar" element={<CalendarApp />} />
              <Route path="/weather" element={<WeatherApp />} />
              <Route
                path="/ai-helper"
                element={
                  <ProtectedRoute>
                    <AiHelperPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route
                path="/hyttebok"
                element={
                  <ProtectedRoute>
                    <HyttebokPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/other-apps" element={<OtherApps />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
