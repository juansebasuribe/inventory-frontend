import React, { useState, useEffect } from 'react';
import type { User } from '../../../shared/types/entities';
import { UserCard } from './UserCard';
import userService from '../../../shared/services/userService';

interface UserListProps {
  refreshKey?: number;
  onUserEdit?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  refreshKey = 0,
  onUserEdit,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await userService.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar el usuario');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      const updatedUser = await userService.toggleUserStatus(userId);
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.profile?.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, usuario o email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              <option value="seller">Vendedor</option>
              <option value="seller_tt">Vendedor T&T</option>
              <option value="seller_executive">Vendedor Ejecutivo</option>
              <option value="operator">Operario</option>
              <option value="editor">Editor</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Gerente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total de usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mostrando</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredUsers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={onUserEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
