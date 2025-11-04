import React from 'react';
import type { User } from '../../../shared/types/entities';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
  onToggleStatus?: (userId: number) => void;
}

const getRoleBadgeColor = (role: string): string => {
  const colors: Record<string, string> = {
    seller: 'bg-blue-100 text-blue-800',
    seller_tt: 'bg-purple-100 text-purple-800',
    seller_executive: 'bg-indigo-100 text-indigo-800',
    operator: 'bg-gray-100 text-gray-800',
    editor: 'bg-green-100 text-green-800',
    supervisor: 'bg-orange-100 text-orange-800',
    manager: 'bg-red-100 text-red-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    seller: 'Vendedor',
    seller_tt: 'Vendedor T&T',
    seller_executive: 'Vendedor Ejecutivo',
    operator: 'Operario',
    editor: 'Editor',
    supervisor: 'Supervisor',
    manager: 'Gerente',
  };
  return labels[role] || role;
};

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                user.profile?.role || 'seller'
              )}`}
            >
              {getRoleLabel(user.profile?.role || 'seller')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">@{user.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {user.email}
        </div>
        {user.phone_number && (
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {user.phone_number}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {onEdit && (
          <button
            onClick={() => onEdit(user)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </button>
        )}
        {onToggleStatus && (
          <button
            onClick={() => onToggleStatus(user.id)}
            className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow ${
              user.is_active
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {user.is_active ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span className="hidden sm:inline">{user.is_active ? 'Desactivar' : 'Activar'}</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `¿Estás seguro de eliminar a ${user.first_name} ${user.last_name}?`
                )
              ) {
                onDelete(user.id);
              }
            }}
            className="p-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow"
            title="Eliminar usuario"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
