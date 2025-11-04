// src/features/dashboard/components/layout/Header.tsx
import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../../shared/stores';
import { Button } from '../../../../shared/components/ui/buttons/Button';

interface HeaderProps {
  onMenuClick: () => void;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="hidden lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>

          {/* Search bar */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos, pedidos..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.profile?.role || 'Usuario'}
              </p>
            </div>
            
            {/* User avatar */}
            <div className="relative">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};