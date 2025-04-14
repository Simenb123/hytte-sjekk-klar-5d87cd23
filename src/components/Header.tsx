
import React from 'react';
import AppHeader from './AppHeader';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showHomeButton = false 
}) => {
  return (
    <div className="py-4 mb-4">
      <AppHeader 
        title={title || ''}
        showBackButton={showBackButton}
        showHomeButton={showHomeButton}
      />
    </div>
  );
};

export default Header;
