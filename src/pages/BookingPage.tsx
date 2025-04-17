
import React from 'react';
import Header from '../components/Header';

const BookingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Bookinger"
        showBackButton={true}
        showHomeButton={true}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-28">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Booking Side</h2>
          <p>Booking-funksjonalitet kommer snart.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
