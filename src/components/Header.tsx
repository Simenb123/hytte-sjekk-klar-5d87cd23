
import React, { memo } from 'react';
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
  console.log('[Header] Rendering with title:', title);
  
  return (
    <div className="py-4 mb-4">
      <AppHeader 
        title={title || ''}
        showBackButton={showBackButton}
        showHomeButton={showHomeButton}
        onBackClick={onBackClick}
      />
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
