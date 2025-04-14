
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showHomeButton = false,
  onBackClick,
  rightContent
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    console.log('[Header] Back button clicked, onBackClick handler exists:', !!onBackClick);
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleHomeClick = () => {
    console.log('[Header] Home button clicked');
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-30">
      <div className="max-w-lg mx-auto flex items-center justify-between p-4">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
              aria-label="Tilbake"
              type="button"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          
          {showHomeButton && !showBackButton && (
            <button
              onClick={handleHomeClick}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
              aria-label="Hjem"
              type="button"
            >
              <Home size={20} className="text-gray-600" />
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>
        
        {rightContent && (
          <div className="flex items-center">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
