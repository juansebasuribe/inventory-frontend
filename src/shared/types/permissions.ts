// src/shared/types/permissions.ts
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_ACCESS: 'dashboard.access',

  // Gestión de usuarios
  USER_VIEW: 'users.view',
  USER_CREATE: 'users.create',
  USER_EDIT: 'users.edit',
  USER_DELETE: 'users.delete',
  USER_MANAGE: 'users.manage',

  // Gestión de productos
  PRODUCT_VIEW: 'products.view',
  PRODUCT_CREATE: 'products.create',
  PRODUCT_EDIT: 'products.edit',
  PRODUCT_DELETE: 'products.delete',
  PRODUCT_PRICE_EDIT: 'products.price_edit',

  // Gestión de inventario
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_REPORTS: 'inventory.reports',

  // Gestión de ventas y carrito
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  CART_ACCESS: 'cart.access',

  // Categorías
  CATEGORY_VIEW: 'categories.view',
  CATEGORY_CREATE: 'categories.create',
  CATEGORY_EDIT: 'categories.edit',
  CATEGORY_DELETE: 'categories.delete',

  // Proveedores
  PROVIDER_VIEW: 'providers.view',
  PROVIDER_CREATE: 'providers.create',
  PROVIDER_EDIT: 'providers.edit',
  PROVIDER_DELETE: 'providers.delete',

  // Órdenes
  ORDER_VIEW: 'orders.view',
  ORDER_CREATE: 'orders.create',
  ORDER_EDIT: 'orders.edit',
  ORDER_DELETE: 'orders.delete',

  // Almacenes
  WAREHOUSE_VIEW: 'warehouses.view',
  WAREHOUSE_CREATE: 'warehouses.create',
  WAREHOUSE_EDIT: 'warehouses.edit',
  WAREHOUSE_DELETE: 'warehouses.delete',

  // Reportes
  REPORTS_VIEW: 'reports.view',

  // Configuración
  SETTINGS_ACCESS: 'settings.access',
  SYSTEM_ADMIN: 'system.admin'
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];