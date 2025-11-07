// src/features/warehouse/components/WarehouseAssignmentManager.tsx
import React, { useState, useEffect } from 'react';
import { X, UserPlus, MapPin, Users, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import warehouseService, { 
  type WarehouseAssignment, 
  type WarehouseRole 
} from '../../../shared/services/warehouseService';
import { userService } from '../../../shared/services/userService';
import { apiClient } from '../../../shared/services';
import type { User } from '../../../shared/types/entities';

// ========================
// TYPES
// ========================
interface Location {
  id: number;
  name: string;
  code: string;
  address: string;
}

// ========================
// WAREHOUSE ASSIGNMENT MANAGER
// ========================
const WarehouseAssignmentManager: React.FC = () => {
  // State
  const [assignments, setAssignments] = useState<WarehouseAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<WarehouseRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<number | ''>('');
  const [userSearch, setUserSearch] = useState('');
  const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState(true);

  // Filters
  const [filterWarehouse, setFilterWarehouse] = useState<number | ''>('');
  const [filterRole, setFilterRole] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // ========================
  // EFFECTS
  // ========================
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Seleccionar rol por defecto cuando se cargan roles y ya hay usuario elegido
  useEffect(() => {
    if (selectedUser && !selectedRole && roles && roles.length > 0) {
      const sellerRole = roles.find(r => r.role_type === 'warehouse_seller');
      if (sellerRole) setSelectedRole(sellerRole.id);
    }
  }, [roles, selectedUser]);

  // ========================
  // DATA LOADING
  // ========================
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load assignments (normalizar respuesta)
      const assignmentsData = await warehouseService.getAllWarehouseAssignments();
      const normalizedAssignments = Array.isArray((assignmentsData as any))
        ? (assignmentsData as any)
        : (assignmentsData?.results || []);
      setAssignments(normalizedAssignments as WarehouseAssignment[]);

      // Load users and merge with profiles to filter sellers
      const usersData = await userService.getUsers();
      let profiles: any[] = [];
      try {
        const profilesResp = await apiClient.get<any>('/api/user/v1/profiles/');
        profiles = Array.isArray(profilesResp) ? profilesResp : (profilesResp?.results || []);
      } catch (e) {
        console.warn('No se pudieron cargar perfiles, se mostrarán todos los usuarios:', e);
      }
      const roleByUserId = new Map<number, string>();
      profiles.forEach(p => {
        if (p?.user && p?.role) roleByUserId.set(p.user, p.role);
      });
      const usersWithRole = usersData.map((u: any) => ({
        ...u,
        profile: u.profile || (roleByUserId.has(u.id) ? { role: roleByUserId.get(u.id) } : undefined)
      }));
      // Si no hay perfiles (backend cayó o no expone), no filtrar para no dejar la lista vacía
      if (!profiles || profiles.length === 0) {
        setUsers(usersWithRole as User[]);
      } else {
        const sellers = usersWithRole.filter((user: any) =>
          user.profile?.role === 'seller' ||
          user.profile?.role === 'seller_tt' ||
          user.profile?.role === 'seller_executive'
        );
        setUsers(sellers as User[]);
      }

      // Normalizar lista de usuarios: priorizar vendedores activos; si no hay, mostrar usuarios activos
      try {
        const preferred = usersWithRole.filter((user: any) =>
          user.profile?.role === 'seller' ||
          user.profile?.role === 'seller_tt' ||
          user.profile?.role === 'seller_executive'
        );
        const activePreferred = (preferred as User[]).filter(u => u.is_active !== false);
        const activeUsers = (usersWithRole as User[]).filter(u => u.is_active !== false);
        setUsers(activePreferred.length > 0 ? activePreferred : activeUsers);
      } catch {}

      // Load locations
      const locationsData = await warehouseService.getLocations();
      setLocations(locationsData);

      // Load roles
      const rolesData = await warehouseService.getWarehouseRoles();
      setRoles(rolesData);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // HANDLERS
  // ========================
  // Selecciona por defecto el rol de vendedor de bodega si está disponible
  const ensureDefaultSellerRole = () => {
    try {
      const sellerRole = roles.find(r => r.role_type === 'warehouse_seller');
      if (sellerRole) setSelectedRole(sellerRole.id);
    } catch {}
  };
  const handleUserChange = (userId: number | '') => {
    setSelectedUser(userId);
    
    // Auto-seleccionar "Vendedor Almacén" cuando se elige un vendedor
    if (userId) {
      const sellerRole = roles.find(r => r.role_type === 'warehouse_seller');
      console.log('🔍 Roles disponibles:', roles);
      console.log('🔍 Rol de vendedor encontrado:', sellerRole);
      if (sellerRole) {
        setSelectedRole(sellerRole.id);
        console.log('✅ Rol auto-asignado:', sellerRole.id);
      }
    } else {
      setSelectedRole('');
    }
  };



  const resetForm = () => {
    setSelectedUser('');
    setSelectedWarehouse('');
    setSelectedRole('');
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Desactivar esta asignacion?')) {
      return;
    }

    try {
      await warehouseService.deactivateWarehouseAssignment(id);
      setSuccess('Asignacion desactivada exitosamente');
      loadData();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError('Error al desactivar asignacion');
    }
  };

  const handleCreateAssignmentSafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser || !selectedWarehouse) {
      setError('Vendedor y bodega son requeridos');
      return;
    }

    if (!selectedRole) {
      ensureDefaultSellerRole();
    }

    if (!selectedRole) {
      setError('No se pudo determinar el rol de vendedor de bodega');
      return;
    }

    try {
      setSubmitting(true);
      await warehouseService.createWarehouseAssignment({
        user: Number(selectedUser),
        warehouse: Number(selectedWarehouse),
        role: Number(selectedRole),
      });
      setSuccess('Asignacion creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message;
      setError(detail || 'Error al crear asignacion');
    } finally {
      setSubmitting(false);
    }
  };



  // Usuarios visibles en el selector del modal (ordenados, opcionalmente solo activos y por búsqueda)
  const visibleUsers = (users || [])
    .filter(u => (showOnlyActiveUsers ? u.is_active !== false : true))
    .filter(u => {
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return (
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (`${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  // ========================
  // FILTERS
  // ========================
  const filteredAssignments = assignments.filter(assignment => {
    const matchesWarehouse = !filterWarehouse || assignment.warehouse === Number(filterWarehouse);
    const matchesRole = !filterRole || assignment.role === Number(filterRole);
    const matchesSearch = !searchTerm || 
      assignment.user_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.warehouse_details.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesWarehouse && matchesRole && matchesSearch;
  });

  // ========================
  // RENDER
  // ========================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Asignaciones de Bodegas
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona qué vendedores tienen acceso a cada bodega
          </p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); ensureDefaultSellerRole(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>Asignar Vendedor</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre de usuario o bodega..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Bodega
            </label>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las bodegas</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Rol
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Asignación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado por
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay asignaciones que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.user_username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.warehouse_details.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.warehouse_details.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {assignment.role_details.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assigned_by_username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desactivar asignación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Asignar Vendedor a Bodega
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSafe} className="p-6 space-y-4">
              {/* User Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nombre, usuario o email"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={showOnlyActiveUsers}
                      onChange={(e) => setShowOnlyActiveUsers(e.target.checked)}
                    />
                    Solo activos
                  </label>
                </div>
                <select
                  value={selectedUser}
                  onChange={(e) => handleUserChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar vendedor...</option>
                  {visibleUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} - {user.email} {user.is_active === false ? '(inactivo)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bodega *
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar bodega...</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol en bodega *
                </label>
                {roles.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 space-y-2">
                    <div>No hay roles disponibles. Verifica la configuración de roles de bodegas.</div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setError('');
                          await warehouseService.seedDefaultWarehouseRoles();
                          const newRoles = await warehouseService.getWarehouseRoles();
                          setRoles(newRoles);
                          const sellerRole = newRoles.find(r => r.role_type === 'warehouse_seller');
                          if (sellerRole) setSelectedRole(sellerRole.id);
                        } catch (e: any) {
                          setError(e?.message || 'No se pudieron crear roles por defecto');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Crear roles por defecto
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedUser || !selectedWarehouse}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Asignando...' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseAssignmentManager;
