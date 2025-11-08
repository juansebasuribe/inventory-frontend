// src/features/dashboard/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard,
  Package,
  Package2,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
  Settings,
  Box,
  ArrowUpDown,
  Warehouse,
  List,
  Plus,
  Tags,
  UserPlus,
  Shield,
  TrendingUp,
  DollarSign,
  Cog
} from 'lucide-react';
import { getFilteredNavigation } from '../../config';
import { useAuth } from '../../../../shared/stores';
import { cn } from '../../../../shared/utils';
import type { NavigationItem } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

// Mapeo de iconos
const iconMap = {
  LayoutDashboard,
  Package,
  Package2,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
  Settings,
  Box,
  ArrowUpDown,
  Warehouse,
  List,
  Plus,
  Tags,
  UserPlus,
  Shield,
  TrendingUp,
  DollarSign,
  Cog
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Obtener permisos del usuario
  const userPermissions = React.useMemo(() => {
    if (!user?.profile?.role) return [];
    // Aquí deberías obtener los permisos reales basados en el rol
    // Por ahora, simularemos algunos permisos básicos
    return ['dashboard.access', 'products.view', 'inventory.view'];
  }, [user]);

  // Filtrar navegación basada en permisos
  const navigationItems = React.useMemo(() => {
    return getFilteredNavigation(userPermissions);
  }, [userPermissions]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const IconComponent = iconMap[item.icon as keyof typeof iconMap];
    const isActive = isActiveRoute(item.href);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        {/* Item principal */}
        <div className={cn(
          "group flex items-center",
          level === 0 ? "px-3 py-2 mx-1.5 rounded-lg" : "px-6 py-2",
          isActive 
            ? "bg-primary-100 text-primary-700" 
            : "text-gray-700 hover:bg-gray-100",
          "transition-colors duration-200"
        )}>
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="flex items-center w-full text-left"
            >
              {IconComponent && (
                <IconComponent className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                  isActive ? "text-primary-700" : "text-gray-400"
                )} />
              )}
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {hasChildren && (
                    <div className="ml-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </>
              )}
              {item.badge && !isCollapsed && (
                <span className={cn(
                  "ml-2 px-2 py-1 text-xs font-medium rounded-full",
                  item.badge.variant === 'primary' && "bg-primary-100 text-primary-700",
                  item.badge.variant === 'success' && "bg-green-100 text-green-700",
                  item.badge.variant === 'warning' && "bg-yellow-100 text-yellow-700",
                  item.badge.variant === 'danger' && "bg-red-100 text-red-700"
                )}>
                  {item.badge.text}
                </span>
              )}
            </button>
          ) : (
            <Link 
              to={item.href}
              className="flex items-center w-full"
              onClick={() => window.innerWidth < 1024 && onClose()}
            >
              {IconComponent && (
                <IconComponent className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                  isActive ? "text-primary-700" : "text-gray-400"
                )} />
              )}
              {!isCollapsed && (
                <span className="flex-1 font-medium">{item.label}</span>
              )}
              {item.badge && !isCollapsed && (
                <span className={cn(
                  "ml-2 px-2 py-1 text-xs font-medium rounded-full",
                  item.badge.variant === 'primary' && "bg-primary-100 text-primary-700",
                  item.badge.variant === 'success' && "bg-green-100 text-green-700",
                  item.badge.variant === 'warning' && "bg-yellow-100 text-yellow-700",
                  item.badge.variant === 'danger' && "bg-red-100 text-red-700"
                )}>
                  {item.badge.text}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Items hijos */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-3 lg:px-4 py-4 border-b border-gray-200",
          isCollapsed && "justify-center"
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TITA</span>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
          )}

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
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
    </>
  );
};
