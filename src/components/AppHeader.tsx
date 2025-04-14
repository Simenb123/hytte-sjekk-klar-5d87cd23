
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showHomeButton = false,
  onBackClick
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button 
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
          </div>
          
          {showHomeButton && (
            <button 
              onClick={handleHome}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Home size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
