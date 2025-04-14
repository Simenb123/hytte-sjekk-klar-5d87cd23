
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-hytte-background rounded-xl p-4 mb-2">
        <img 
          src="/lovable-uploads/e5ff44d2-e8ee-4312-925b-75026c32e7f6.png" 
          alt="Hytte logo" 
          className="hytte-logo"
        />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-center">Hytte-sjekk-klar</h1>
    </div>
  );
};

export default Logo;
