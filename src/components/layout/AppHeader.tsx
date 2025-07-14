
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from './Logo';
import ProfileButton from '../profile/ProfileButton';
import NotificationBell from '../notifications/NotificationBell';

const AppHeader = () => {
  const navItems = [
    { href: '/', label: 'Hjem' },
    { href: '/checklist', label: 'Sjekkliste' },
    { href: '/booking', label: 'Booking' },
    { href: '/calendar', label: 'Kalender' },
    { href: '/inventory', label: 'Inventar' },
    { href: '/family', label: 'Familie' },
    { href: '/ai-helper', label: 'AI Hjelper' },
    { href: '/other-apps', label: 'Andre apper' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-0">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <nav className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link to="/" className="md:hidden">
              <Logo />
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <ProfileButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
