
import React from 'react';
import AppHeader from './AppHeader';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showHomeButton = false,
  onBackClick
}) => {
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
};

export default Header;
