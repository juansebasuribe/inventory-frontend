// src/features/dashboard/config/dashboard.config.ts
import type { DashboardConfig } from '../types';

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  layout: 'grid',
  columns: 12,
  refreshInterval: 30000, // 30 segundos
  widgets: [
    // Primera fila - Métricas principales
    {
      id: 'total-products',
      title: 'Total de Productos',
      type: 'metric',
      size: 'md',
      position: { row: 1, col: 1, colSpan: 3 }
    },
    {
      id: 'low-stock-alerts',
      title: 'Alertas de Stock Bajo',
      type: 'metric',
      size: 'md',
      position: { row: 1, col: 4, colSpan: 3 }
    },
    {
      id: 'pending-orders',
      title: 'Pedidos Pendientes',
      type: 'metric',
      size: 'md',
      position: { row: 1, col: 7, colSpan: 3 }
    },
    {
      id: 'monthly-sales',
      title: 'Ventas del Mes',
      type: 'metric',
      size: 'md',
      position: { row: 1, col: 10, colSpan: 3 }
    },

    // Segunda fila - Gráficos
    {
      id: 'inventory-overview',
      title: 'Resumen de Inventario',
      type: 'chart',
      size: 'lg',
      position: { row: 2, col: 1, colSpan: 6, rowSpan: 2 }
    },
    {
      id: 'sales-trend',
      title: 'Tendencia de Ventas',
      type: 'chart',
      size: 'lg',
      position: { row: 2, col: 7, colSpan: 6, rowSpan: 2 }
    },

    // Tercera fila - Tablas y actividad
    {
      id: 'recent-orders',
      title: 'Pedidos Recientes',
      type: 'table',
      size: 'lg',
      position: { row: 4, col: 1, colSpan: 6 }
    },
    {
      id: 'top-products',
      title: 'Productos Más Vendidos',
      type: 'table',
      size: 'lg',
      position: { row: 4, col: 7, colSpan: 6 }
    }
  ]
};

// Configuraciones específicas por rol
export const ROLE_DASHBOARD_CONFIGS: Record<string, Partial<DashboardConfig>> = {
  administrator: {
    // Administradores ven todo
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets
  },
  supervisor: {
    // Supervisores ven casi todo
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets
  },
  manager: {
    // Gerentes ven métricas de alto nivel
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['total-products', 'low-stock-alerts', 'pending-orders', 'monthly-sales', 'sales-trend'].includes(widget.id)
    )
  },
  editor: {
    // Editores ven información operativa
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['total-products', 'low-stock-alerts', 'inventory-overview', 'recent-orders'].includes(widget.id)
    )
  },
  operator: {
    // Operadores ven solo información básica
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['total-products', 'low-stock-alerts', 'inventory-overview'].includes(widget.id)
    )
  },
  seller: {
    // Vendedores ven información de ventas
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['pending-orders', 'monthly-sales', 'sales-trend', 'top-products'].includes(widget.id)
    )
  },
  seller_tt: {
    // Vendedores TT ven información similar
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['pending-orders', 'monthly-sales', 'sales-trend', 'top-products'].includes(widget.id)
    )
  },
  seller_executive: {
    // Ejecutivos de ventas ven más información
    widgets: DEFAULT_DASHBOARD_CONFIG.widgets.filter(widget => 
      ['total-products', 'pending-orders', 'monthly-sales', 'sales-trend', 'top-products', 'recent-orders'].includes(widget.id)
    )
  }
};

export const getDashboardConfigForRole = (role: string): DashboardConfig => {
  const roleConfig = ROLE_DASHBOARD_CONFIGS[role] || ROLE_DASHBOARD_CONFIGS.operator;
  return {
    ...DEFAULT_DASHBOARD_CONFIG,
    ...roleConfig
  };
};