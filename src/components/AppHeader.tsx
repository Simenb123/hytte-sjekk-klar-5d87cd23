
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileButton from './ProfileButton';
import { useAuth } from '@/context/AuthContext';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  onBackClick,
  rightContent
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Automatically determine if we should show back button based on route
  const shouldShowBackButton = showBackButton || (location.pathname !== '/' && location.pathname !== '/dashboard');

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/dashboard');
  };

  return (
    <header className="bg-white shadow-md w-full z-50 sticky top-0 left-0">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between py-2 pl-1 pr-2 h-16">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleHome}
              className="rounded-full hover:bg-gray-100 flex items-center justify-center bg-white text-black transition-colors p-0"
              aria-label="Hjem"
              type="button"
            >
              <img src="/lovable-uploads/e5ff44d2-e8ee-4312-925b-75026c32e7f6.png" alt="Hjem" className="h-16 w-16" />
            </button>
            {shouldShowBackButton && (
              <button 
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center bg-white text-black"
                aria-label="Tilbake"
                type="button"
              >
                <ArrowLeft size={24} />
              </button>
            )}
          </div>
          
          <h2 className="text-xl font-semibold flex-1 text-center truncate mx-2">{title}</h2>
          
          <div className="flex items-center gap-2">
            {rightContent}
            {user && <ProfileButton />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
