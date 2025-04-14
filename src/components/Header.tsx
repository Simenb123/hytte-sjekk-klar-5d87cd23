
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = memo(({ 
  title, 
  showBackButton = false, 
  showHomeButton = false,
  onBackClick
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    console.log('[Header] Back button clicked');
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  console.log('[Header] Rendering with title:', title, 'showBackButton:', showBackButton);
  
  return (
    <div className="w-full sticky top-0 left-0 z-40">
      <AppHeader 
        title={title || ''}
        showBackButton={showBackButton}
        showHomeButton={showHomeButton}
        onBackClick={handleBack}
      />
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
