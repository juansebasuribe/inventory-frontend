// src/features/dashboard/types/dashboard.types.ts
export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'custom';
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: {
    row: number;
    col: number;
    rowSpan?: number;
    colSpan?: number;
  };
  data?: any;
  config?: Record<string, any>;
}

export interface DashboardConfig {
  layout: 'grid' | 'masonry';
  columns: number;
  widgets: DashboardWidget[];
  refreshInterval?: number;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  charts: {
    inventory: any;
    sales: any;
    orders: any;
  };
  recentActivity: any[];
  alerts: any[];
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  requiredPermissions?: string[];
  children?: NavigationItem[];
  badge?: {
    text: string;
    variant: 'primary' | 'success' | 'warning' | 'danger';
  };
}