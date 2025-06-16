import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import Dashboard from '@/pages/Dashboard';
import ChecklistHome from '@/pages/ChecklistHome';
import ChecklistPage from '@/pages/ChecklistPage';
import InventoryPage from '@/pages/InventoryPage';
import FamilyPage from '@/pages/FamilyPage';
import ProfilePage from '@/pages/ProfilePage';
import BookingPage from '@/pages/BookingPage';
import CalendarApp from '@/pages/CalendarApp';
import WeatherApp from '@/pages/WeatherApp';
import AiHelperPage from '@/pages/AiHelperPage';
import OtherApps from '@/pages/OtherApps';
import LogsPage from '@/pages/LogsPage';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/checklist" element={<ProtectedRoute><ChecklistHome /></ProtectedRoute>} />
          <Route path="/checklist/:areaId" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarApp /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><WeatherApp /></ProtectedRoute>} />
          <Route path="/ai-helper" element={<ProtectedRoute><AiHelperPage /></ProtectedRoute>} />
          <Route path="/other-apps" element={<ProtectedRoute><OtherApps /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
