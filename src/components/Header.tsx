
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileButton from './ProfileButton';
import { useAuth } from '@/state/auth';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  showHomeButton = false,
  onBackClick,
  rightContent
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackClick = () => {
    console.log('[Header] Back button clicked, onBackClick handler exists:', !!onBackClick);
    if (onBackClick) {
      onBackClick();
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    console.log('[Header] Home button clicked');
    navigate('/');
  };

  return (
    <header className="app-header sticky top-0 left-0 right-0 bg-primary text-primary-foreground shadow-sm z-30">
      <div className="max-w-lg mx-auto flex items-center p-4">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-4 p-2 rounded-full hover:bg-primary/80"
              aria-label="Tilbake"
              type="button"
            >
              <ArrowLeft size={20} className="text-primary-foreground" />
            </button>
          )}
          
          {showHomeButton && !showBackButton && (
            <button
              onClick={handleHomeClick}
              className="mr-4 p-2 rounded-full hover:bg-primary/80"
              aria-label="Hjem"
              type="button"
            >
              <Home size={20} className="text-primary-foreground" />
            </button>
          )}

          <h1 className="text-xl font-semibold text-primary-foreground">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {rightContent}
          {user && <ProfileButton />}
        </div>
      </div>
    </header>
  );
};

export default Header;
