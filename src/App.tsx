
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ChecklistApp from "./pages/ChecklistApp";
import WeatherApp from "./pages/WeatherApp";
import CalendarApp from "./pages/CalendarApp";
import OtherApps from "./pages/OtherApps";
import { ChecklistProvider } from "./context/ChecklistContext";
import { StrictMode } from "react";

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
        {/* Wrap BrowserRouter inside ChecklistProvider */}
        <ChecklistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/checklist" element={<ChecklistApp />} />
              <Route path="/weather" element={<WeatherApp />} />
              <Route path="/calendar" element={<CalendarApp />} />
              <Route path="/other-apps" element={<OtherApps />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ChecklistProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
