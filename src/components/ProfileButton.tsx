
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/state/auth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user);
  const navigate = useNavigate();
  
  const getInitials = () => {
    if (!profile) return 'U';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    if (!firstName && !lastName) return 'U';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      console.log('[ProfileButton] Starting logout process');
      await signOut();
      console.log('[ProfileButton] Logout successful, navigating to /auth');
      navigate('/auth');
    } catch (error) {
      console.error('[ProfileButton] Logout error:', error);
      toast.error('Feil ved utlogging');
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Avatar className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-500 text-white border-2 border-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <AvatarFallback className="font-bold text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl rounded-md">
        <DropdownMenuLabel className="font-bold text-gray-800">Min konto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="w-full cursor-pointer hover:bg-blue-50 text-blue-600">
            Min profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer font-medium">
          Logg ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;
