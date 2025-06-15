
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();

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
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md w-full z-50 sticky top-0 left-0">
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-3 items-center py-3 px-2 h-16">
          <div className="flex items-center gap-1 justify-start">
            <button 
              onClick={handleHome}
              className="rounded-full hover:bg-gray-100 flex items-center justify-center bg-white text-black transition-colors"
              aria-label="Hjem"
              type="button"
            >
              <img src="/lovable-uploads/e5ff44d2-e8ee-4312-925b-75026c32e7f6.png" alt="Hjem" className="h-10 w-10" />
            </button>
            {showBackButton && (
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
          
          <h2 className="text-xl font-semibold text-center truncate">{title}</h2>
          
          <div className="flex items-center gap-2 justify-end">
            {rightContent}
            {user && <ProfileButton />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
