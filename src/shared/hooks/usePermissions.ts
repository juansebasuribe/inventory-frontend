// src/shared/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAuth } from '../stores';
import type { UserRole } from '../types/entities';

// ========================
// TYPES
// ========================
interface UsePermissionsReturn {
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
  isOperator: boolean;
  isEditor: boolean;
  isSupervisor: boolean;
  isManager: boolean;
  isSeller: boolean;
  isSellerTT: boolean;
  isSellerExecutive: boolean;
  isAdministrator: boolean;
  userRole: UserRole | null;
  roleDisplayName: string;
}

// ========================
// ROLE HIERARCHY - BASADO EN BACKEND DJANGO
// ========================
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'operator': 1,          // Solo lectura
  'seller': 2,           // Vendedor básico (carrito)
  'seller_tt': 3,        // Vendedor T&T (carrito)
  'editor': 4,           // Crear/modificar productos
  'seller_executive': 5, // Vendedor ejecutivo (puede cambiar precios)
  'manager': 6,          // Gerente (legacy)
  'supervisor': 7,       // Supervisor (casi todo)
  'administrator': 8     // Administrador (todo)
};

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'operator': 'Operario',
  'editor': 'Editor',
  'supervisor': 'Supervisor',
  'manager': 'Gerente',
  'seller': 'Vendedor',
  'seller_tt': 'Vendedor T&T',
  'seller_executive': 'Vendedor Ejecutivo',
  'administrator': 'Administrador'
};

// ========================
// PERMISSIONS HOOK
// ========================
export const usePermissions = (): UsePermissionsReturn => {
  const { user, isAuthenticated } = useAuth();

  const userRole = useMemo((): UserRole | null => {
    if (!isAuthenticated || !user?.profile) return null;
    return user.profile.role;
  }, [isAuthenticated, user]);

  const userLevel = useMemo((): number => {
    if (!userRole) return 0;
    return ROLE_HIERARCHY[userRole];
  }, [userRole]);

  const roleDisplayName = useMemo((): string => {
    if (!userRole) return 'Sin rol';
    return ROLE_DISPLAY_NAMES[userRole];
  }, [userRole]);

  // ========================
  // PERMISSION CHECKS
  // ========================
  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const hasMinimumRole = (minimumRole: UserRole): boolean => {
    if (!userRole) return false;
    return userLevel >= ROLE_HIERARCHY[minimumRole];
  };

  const canAccess = (requiredRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !userRole) return false;
    if (requiredRoles.length === 0) return true;
    
    return requiredRoles.some(role => userLevel >= ROLE_HIERARCHY[role]);
  };

  // ========================
  // CONVENIENCE BOOLEAN FLAGS
  // ========================
  const isOperator = hasRole('operator');
  const isEditor = hasRole('editor');
  const isSupervisor = hasRole('supervisor');
  const isManager = hasRole('manager');
  const isSeller = hasRole('seller');
  const isSellerTT = hasRole('seller_tt');
  const isSellerExecutive = hasRole('seller_executive');
  const isAdministrator = hasRole('administrator');

  return {
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    canAccess,
    isOperator,
    isEditor,
    isSupervisor,
    isManager,
    isSeller,
    isSellerTT,
    isSellerExecutive,
    isAdministrator,
    userRole,
    roleDisplayName
  };
};

export default usePermissions;