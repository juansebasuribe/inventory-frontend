// src/shared/components/layout/Header.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/buttons/Button';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';

export interface HeaderProps {
  onMenuClick?: () => void;
  showSidebarToggle?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showSidebarToggle = true,
  className,
}) => {
  return (
    <header className={cn(
      'bg-white border-b border-secondary-200 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center gap-4">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
              icon={<Menu className="h-5 w-5" />}
            />
          )}
          
          {/* Logo TITA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-secondary-900">
                COMERCIALIZADORA
              </h1>
              <p className="text-sm font-semibold text-primary-600 -mt-1">
                TITA
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-500" />
            <input
              type="text"
              placeholder="Buscar productos, categorías..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center gap-2">
          {/* Search button (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            icon={<Search className="h-5 w-5" />}
          />
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            icon={<Bell className="h-5 w-5" />}
          >
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-600 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-secondary-200 rounded-full">
                <User className="h-4 w-4 text-secondary-600" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-secondary-700">
                Admin User
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut className="h-4 w-4" />}
              className="text-secondary-600 hover:text-red-600"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };