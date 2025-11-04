// src/features/dashboard/components/layout/SimpleDashboardLayout.tsx
import React, { useState, type ReactNode } from 'react';
import { useAuth } from '../../../../shared/stores';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Package2,
  ShoppingCart,
  Users,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '../../../../shared/components/ui/buttons/Button';

interface SimpleDashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export const SimpleDashboardLayout: React.FC<SimpleDashboardLayoutProps> = ({
  children,
  className = ""
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'inventory', label: 'Inventario', icon: Package, href: '/inventory' },
    { id: 'products', label: 'Productos', icon: Package2, href: '/products' },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart, href: '/orders' },
    { id: 'users', label: 'Usuarios', icon: Users, href: '/users' },
    { id: 'reports', label: 'Reportes', icon: BarChart3, href: '/reports' },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      } ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-4 border-b border-gray-200 ${
          sidebarCollapsed && "justify-center"
        }`}>
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TITA</span>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
          )}

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map(item => {
              const IconComponent = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 mx-2 rounded-lg transition-colors duration-200 ${
                    isActive 
                      ? "bg-primary-100 text-primary-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <IconComponent className={`flex-shrink-0 ${
                    sidebarCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
                  } ${
                    isActive ? "text-primary-700" : "text-gray-400"
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="flex-1 font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.profile?.role || 'Usuario'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 p-6 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
};