// src/features/warehouse/components/WarehouseAssignmentManager.tsx
import React, { useState, useEffect } from 'react';
import { X, UserPlus, MapPin, Users, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import warehouseService, { 
  type WarehouseAssignment, 
  type WarehouseRole 
} from '../../../shared/services/warehouseService';
import { userService } from '../../../shared/services/userService';
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

  // Form state
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<number | ''>('');

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

  // ========================
  // DATA LOADING
  // ========================
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load assignments
      const assignmentsData = await warehouseService.getAllWarehouseAssignments();
      setAssignments(assignmentsData.results);

      // Load users (sellers only)
      const usersData = await userService.getUsers();
      const sellers = usersData.filter((user: User) => 
        user.profile?.role === 'seller' || 
        user.profile?.role === 'seller_tt' || 
        user.profile?.role === 'seller_executive'
      );
      setUsers(sellers);

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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Creando asignación...', {
      selectedUser,
      selectedWarehouse,
      selectedRole
    });
    
    if (!selectedUser || !selectedWarehouse) {
      setError('Vendedor y bodega son requeridos');
      return;
    }

    if (!selectedRole) {
      setError('Error: No se pudo asignar el rol automáticamente');
      return;
    }

    try {
      console.log('🚀 Enviando al backend:', {
        user: Number(selectedUser),
        warehouse: Number(selectedWarehouse),
        role: Number(selectedRole)
      });
      
      await warehouseService.createWarehouseAssignment({
        user: Number(selectedUser),
        warehouse: Number(selectedWarehouse),
        role: Number(selectedRole)
      });

      setSuccess('✅ Asignación creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Error creating assignment:', err);
      setError(err.message || 'Error al crear asignación');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar esta asignación?')) {
      return;
    }

    try {
      await warehouseService.deactivateWarehouseAssignment(id);
      setSuccess('✅ Asignación desactivada exitosamente');
      loadData();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError('Error al desactivar asignación');
    }
  };

  const resetForm = () => {
    setSelectedUser('');
    setSelectedWarehouse('');
    setSelectedRole('');
  };

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
          onClick={() => setShowCreateModal(true)}
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

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              {/* User Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor *
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => handleUserChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar vendedor...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} - {user.email}
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

              {/* Mostrar rol auto-asignado en lugar del select */}
              {selectedRole && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Rol asignado
                        </p>
                        <p className="text-sm text-blue-700 font-semibold">
                          {roles.find(r => r.id === selectedRole)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Asignar
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
