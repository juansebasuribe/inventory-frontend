// src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../shared/stores';
import { SimpleDashboardLayout } from '../features/dashboard/components/layout/SimpleDashboardLayout';
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, refreshData } = useDashboardData();

  if (loading) {
    return (
      <SimpleDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </SimpleDashboardLayout>
    );
  }

  if (error) {
    return (
      <SimpleDashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar el dashboard
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refreshData}
                  className="bg-red-100 px-2 py-1 rounded text-red-800 hover:bg-red-200 text-sm"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </SimpleDashboardLayout>
    );
  }

  return (
    <SimpleDashboardLayout>
      <div className="space-y-6">
        {/* Header del Dashboard */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Bienvenido, {user?.first_name}. Aquí está el resumen de tu sistema de inventario.
            </p>
          </div>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Métrica 1 */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Total de Productos
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.metrics?.[0]?.value || '1,247'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  vs mes anterior
                </p>
              </div>
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Alertas de Stock Bajo
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.metrics?.[1]?.value || '23'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  vs semana anterior
                </p>
              </div>
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Pedidos Pendientes
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.metrics?.[2]?.value || '45'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  vs ayer
                </p>
              </div>
            </div>
          </div>

          {/* Métrica 4 */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Ventas del Mes
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.metrics?.[3]?.value || '$127,450'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  vs mes anterior
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {data?.recentActivity?.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-gray-500">
                <p>No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SimpleDashboardLayout>
  );
};

export default DashboardPage;