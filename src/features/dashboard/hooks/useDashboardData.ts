// src/features/dashboard/hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import type { DashboardData } from '../types';

// Simulación de datos - en producción vendría de la API
const generateMockData = (): DashboardData => {
  return {
    metrics: [
      {
        id: 'total-products',
        title: 'Total de Productos',
        value: '1,247',
        trend: {
          value: 5.2,
          direction: 'up',
          label: 'vs mes anterior'
        },
        color: 'primary'
      },
      {
        id: 'low-stock-alerts',
        title: 'Alertas de Stock Bajo',
        value: '23',
        trend: {
          value: -12.5,
          direction: 'down',
          label: 'vs semana anterior'
        },
        color: 'warning'
      },
      {
        id: 'pending-orders',
        title: 'Pedidos Pendientes',
        value: '45',
        trend: {
          value: 8.1,
          direction: 'up',
          label: 'vs ayer'
        },
        color: 'info'
      },
      {
        id: 'monthly-sales',
        title: 'Ventas del Mes',
        value: '$127,450',
        trend: {
          value: 15.3,
          direction: 'up',
          label: 'vs mes anterior'
        },
        color: 'success'
      }
    ],
    charts: {
      inventory: {
        // Datos para gráfico de inventario
        categories: ['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros'],
        values: [320, 180, 250, 150, 90]
      },
      sales: {
        // Datos para gráfico de ventas
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        values: [12000, 15000, 18000, 14000, 21000, 25000]
      },
      orders: {
        // Datos para gráfico de pedidos
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        values: [45, 52, 38, 61, 47, 33, 28]
      }
    },
    recentActivity: [
      {
        id: 1,
        type: 'order',
        description: 'Nueva orden #ORD-2024-001',
        time: '2 min ago',
        user: 'Juan Pérez'
      },
      {
        id: 2,
        type: 'product',
        description: 'Producto actualizado: iPhone 14',
        time: '15 min ago',
        user: 'María González'
      },
      {
        id: 3,
        type: 'inventory',
        description: 'Stock bajo: Samsung Galaxy S23',
        time: '1 hour ago',
        user: 'Sistema'
      }
    ],
    alerts: [
      {
        id: 1,
        type: 'warning',
        title: 'Stock Bajo',
        message: '23 productos con stock inferior a 10 unidades',
        time: '10 min ago'
      },
      {
        id: 2,
        type: 'info',
        title: 'Nuevo Pedido',
        message: 'Pedido #ORD-2024-001 creado exitosamente',
        time: '5 min ago'
      }
    ]
  };
};

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dashboardData = generateMockData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refreshData
  };
};