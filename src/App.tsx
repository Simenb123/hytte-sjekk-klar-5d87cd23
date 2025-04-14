
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ChecklistApp from "./pages/ChecklistApp";
import WeatherApp from "./pages/WeatherApp";
import CalendarApp from "./pages/CalendarApp";
import OtherApps from "./pages/OtherApps";
import AuthPage from "./pages/AuthPage";
import { ChecklistProvider } from "./context/ChecklistContext";
import { AuthProvider } from "./context/AuthContext";
import { StrictMode } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

// Create a stable QueryClient that won't change between renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  console.log('[App] Rendering App component');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" closeButton />
        <AuthProvider>
          <ChecklistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/checklist" element={
                  <ProtectedRoute>
                    <ChecklistApp />
                  </ProtectedRoute>
                } />
                <Route path="/weather" element={<WeatherApp />} />
                <Route path="/calendar" element={<CalendarApp />} />
                <Route path="/other-apps" element={<OtherApps />} />
                {/* Redirect to dashboard if no route matches */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ChecklistProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
