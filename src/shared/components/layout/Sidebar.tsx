// src/shared/components/layout/Sidebar.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  ChevronLeft,
  Building2,
  Truck
} from 'lucide-react';
import { Button } from '../ui/buttons/Button';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard',
    href: '/dashboard',
    active: true,
  },
  {
    icon: <Package className="h-5 w-5" />,
    label: 'Productos',
    href: '/products',
  },
  {
    icon: <Warehouse className="h-5 w-5" />,
    label: 'Inventario',
    href: '/inventory',
    badge: '12',
  },
  {
    icon: <ShoppingCart className="h-5 w-5" />,
    label: 'Órdenes',
    href: '/orders',
    badge: '5',
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    label: 'Almacenes',
    href: '/warehouses',
  },
  {
    icon: <Truck className="h-5 w-5" />,
    label: 'Proveedores',
    href: '/providers',
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: 'Usuarios',
    href: '/users',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: 'Reportes',
    href: '/reports',
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: 'Configuración',
    href: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  className,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-secondary-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-secondary-900">TITA</h2>
                <p className="text-xs text-secondary-600">Inventario</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
              icon={<ChevronLeft className="h-4 w-4" />}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  item.active
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-secondary-200">
            <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-full">
                <span className="text-white text-xs font-bold">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  Admin
                </p>
                <p className="text-xs text-secondary-600 truncate">
                  admin@tita.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export { Sidebar };