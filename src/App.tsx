
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/state/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import './App.css';

// Import pages
import Index from './screens/Index';
import Dashboard from './screens/Dashboard';
import ChecklistPage from './screens/ChecklistPage';
import ChecklistHome from './screens/ChecklistHome';
import ChecklistAdminPage from './screens/ChecklistAdminPage';
import InventoryPage from './screens/InventoryPage';
import FamilyPage from './screens/FamilyPage';
import BookingPage from './screens/BookingPage';
import WeatherApp from './screens/WeatherApp';
import AiHelperPage from './screens/AiHelperPage';
import DocumentsPage from './screens/DocumentsPage';
import WineCellarPage from './screens/WineCellarPage';
import HyttebokPage from './screens/HyttebokPage';
import OtherApps from './screens/OtherApps';
import LogsPage from './screens/LogsPage';
import ProfilePage from './screens/ProfilePage';
import AuthPage from './screens/AuthPage';
import NotFound from './screens/NotFound';

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
              {/* Redirect /calendar to /booking to maintain compatibility */}
              <Route path="/calendar" element={<Navigate to="/booking" replace />} />
              <Route path="/auth/calendar" element={<Navigate to="/booking" replace />} />
              <Route path="/weather" element={<WeatherApp />} />
              <Route
                path="/ai-helper"
                element={
                  <ProtectedRoute>
                    <AiHelperPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wine-cellar"
                element={
                  <ProtectedRoute>
                    <WineCellarPage />
                  </ProtectedRoute>
                }
              />
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
