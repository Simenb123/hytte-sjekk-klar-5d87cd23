import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import ChecklistApp from './pages/ChecklistApp';
import LogsPage from './pages/LogsPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookings" element={<BookingPage />} />
        <Route path="/checklist" element={<ChecklistApp />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
