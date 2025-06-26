
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
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
              <Route path="/checklist" element={<ChecklistHome />} />
              <Route path="/checklist/:category" element={<ChecklistPage />} />
              <Route path="/checklist-admin" element={<ChecklistAdminPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/calendar" element={<CalendarApp />} />
              <Route path="/weather" element={<WeatherApp />} />
              <Route path="/ai-helper" element={<AiHelperPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/other-apps" element={<OtherApps />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
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
