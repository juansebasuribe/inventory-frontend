// src/features/dashboard/config/navigation.config.ts
import type { NavigationItem } from '../types';
import { PERMISSIONS } from '../../../shared/types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    requiredPermissions: [PERMISSIONS.DASHBOARD_ACCESS]
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: 'Package',
    href: '/inventory',
    requiredPermissions: [PERMISSIONS.INVENTORY_VIEW],
    children: [
      {
        id: 'inventory-products',
        label: 'Productos',
        icon: 'Box',
        href: '/inventory/products',
        requiredPermissions: [PERMISSIONS.PRODUCT_VIEW]
      },
      {
        id: 'inventory-movements',
        label: 'Movimientos',
        icon: 'ArrowUpDown',
        href: '/inventory/movements',
        requiredPermissions: [PERMISSIONS.INVENTORY_VIEW]
      },
      {
        id: 'inventory-warehouses',
        label: 'Almacenes',
        icon: 'Warehouse',
        href: '/inventory/warehouses',
        requiredPermissions: [PERMISSIONS.WAREHOUSE_VIEW]
      }
    ]
  },
  {
    id: 'products',
    label: 'Productos',
    icon: 'Package2',
    href: '/products',
    requiredPermissions: [PERMISSIONS.PRODUCT_VIEW],
    children: [
      {
        id: 'products-list',
        label: 'Lista de Productos',
        icon: 'List',
        href: '/products',
        requiredPermissions: [PERMISSIONS.PRODUCT_VIEW]
      },
      {
        id: 'products-create',
        label: 'Nuevo Producto',
        icon: 'Plus',
        href: '/products/create',
        requiredPermissions: [PERMISSIONS.PRODUCT_CREATE]
      },
      {
        id: 'products-categories',
        label: 'Categorías',
        icon: 'Tags',
        href: '/products/categories',
        requiredPermissions: [PERMISSIONS.CATEGORY_VIEW]
      }
    ]
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: 'ShoppingCart',
    href: '/orders',
    requiredPermissions: [PERMISSIONS.ORDER_VIEW],
    children: [
      {
        id: 'orders-list',
        label: 'Lista de Pedidos',
        icon: 'List',
        href: '/orders',
        requiredPermissions: [PERMISSIONS.ORDER_VIEW]
      },
      {
        id: 'orders-create',
        label: 'Nuevo Pedido',
        icon: 'Plus',
        href: '/orders/create',
        requiredPermissions: [PERMISSIONS.ORDER_CREATE]
      }
    ]
  },
  {
    id: 'cart',
    label: 'Carrito',
    icon: 'ShoppingBag',
    href: '/cart',
    requiredPermissions: [PERMISSIONS.CART_ACCESS],
    badge: {
      text: '0',
      variant: 'primary'
    }
  },
  {
    id: 'providers',
    label: 'Proveedores',
    icon: 'Truck',
    href: '/providers',
    requiredPermissions: [PERMISSIONS.PROVIDER_VIEW]
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: 'Users',
    href: '/users',
    requiredPermissions: [PERMISSIONS.USER_VIEW],
    children: [
      {
        id: 'users-list',
        label: 'Lista de Usuarios',
        icon: 'List',
        href: '/users',
        requiredPermissions: [PERMISSIONS.USER_VIEW]
      },
      {
        id: 'users-create',
        label: 'Nuevo Usuario',
        icon: 'UserPlus',
        href: '/users/create',
        requiredPermissions: [PERMISSIONS.USER_CREATE]
      },
      {
        id: 'users-roles',
        label: 'Roles y Permisos',
        icon: 'Shield',
        href: '/users/roles',
        requiredPermissions: [PERMISSIONS.USER_MANAGE]
      }
    ]
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: 'BarChart3',
    href: '/reports',
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW],
    children: [
      {
        id: 'reports-inventory',
        label: 'Inventario',
        icon: 'Package',
        href: '/reports/inventory',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      },
      {
        id: 'reports-sales',
        label: 'Ventas',
        icon: 'TrendingUp',
        href: '/reports/sales',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      },
      {
        id: 'reports-financial',
        label: 'Financieros',
        icon: 'DollarSign',
        href: '/reports/financial',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: 'Settings',
    href: '/settings',
    requiredPermissions: [PERMISSIONS.SETTINGS_ACCESS],
    children: [
      {
        id: 'settings-general',
        label: 'General',
        icon: 'Settings',
        href: '/settings/general',
        requiredPermissions: [PERMISSIONS.SETTINGS_ACCESS]
      },
      {
        id: 'settings-system',
        label: 'Sistema',
        icon: 'Cog',
        href: '/settings/system',
        requiredPermissions: [PERMISSIONS.SYSTEM_ADMIN]
      }
    ]
  }
];

// Función para filtrar navegación basada en permisos del usuario
export const getFilteredNavigation = (userPermissions: string[]): NavigationItem[] => {
  const filterItem = (item: NavigationItem): NavigationItem | null => {
    // Verificar si el usuario tiene permisos para este item
    if (item.requiredPermissions && 
        !item.requiredPermissions.some(permission => userPermissions.includes(permission))) {
      return null;
    }

    // Filtrar children si existen
    let filteredChildren: NavigationItem[] | undefined;
    if (item.children) {
      filteredChildren = item.children
        .map(child => filterItem(child))
        .filter((child): child is NavigationItem => child !== null);
      
      // Si no quedan children después del filtrado, mantener el item padre pero sin children
      if (filteredChildren.length === 0) {
        filteredChildren = undefined;
      }
    }

    return {
      ...item,
      children: filteredChildren
    };
  };

  return NAVIGATION_ITEMS
    .map(item => filterItem(item))
    .filter((item): item is NavigationItem => item !== null);
};