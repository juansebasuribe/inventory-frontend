// src/features/auth/components/UserMenu.tsx
import React from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Shield,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../../../shared/stores';
import { Button } from '../../../shared/components/ui/buttons/Button';

// ========================
// COMPONENT PROPS
// ========================
interface UserMenuProps {
  className?: string;
  showFullName?: boolean;
  variant?: 'compact' | 'full';
}

// ========================
// USER MENU COMPONENT
// ========================
export const UserMenu: React.FC<UserMenuProps> = ({
  className = '',
  showFullName = true,
  variant = 'full'
}) => {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // ========================
  // CLICK OUTSIDE HANDLER
  // ========================
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========================
  // LOGOUT HANDLER
  // ========================
  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ========================
  // USER DISPLAY NAME
  // ========================
  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    
    if (showFullName && user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    if (user.first_name) {
      return user.first_name;
    }
    
    return user.username || user.email;
  };

  // ========================
  // ROLE DISPLAY
  // ========================
  const getRoleDisplay = () => {
    if (!user?.profile?.role) return 'Usuario';
    
    const roleMap: Record<string, string> = {
      operator: 'Operario',
      editor: 'Editor',
      supervisor: 'Supervisor',
      manager: 'Gerente',
      seller: 'Vendedor',
      seller_tt: 'Vendedor T&T',
      seller_executive: 'Vendedor Ejecutivo'
    };
    
    return roleMap[user.profile.role] || user.profile.role;
  };

  // ========================
  // COMPACT VARIANT
  // ========================
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={menuRef}>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2"
          disabled={isLoading}
        >
          <UserCircle className="w-6 h-6" />
        </Button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500">{getRoleDisplay()}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  // ========================
  // FULL VARIANT
  // ========================
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
        disabled={isLoading}
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-semibold">
            {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getUserDisplayName()}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {getRoleDisplay()}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{getRoleDisplay()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to profile
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <User className="w-4 h-4" />
              Mi Perfil
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to settings
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Settings className="w-4 h-4" />
              Configuración
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4" />
              {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;