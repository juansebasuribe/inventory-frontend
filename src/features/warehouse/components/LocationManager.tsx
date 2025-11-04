import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../shared/services';

interface Location {
  id: number;
  code: string;
  name: string;
  type: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  capacity?: number;
  notes?: string;
  is_active: boolean;
  creation_date: string;
  update_date: string;
}

interface LocationForm {
  name: string;
  code: string;
  type: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  capacity: number;
  notes: string;
}

export const LocationManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<LocationForm>({
    name: '',
    code: '',
    type: 'warehouse',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    capacity: 1000,
    notes: '',
  });

  // Tipos válidos del backend
  const locationTypes = [
    { value: 'warehouse', label: '🏭 Almacén' },
    { value: 'storage', label: '📦 Bodega' },
    { value: 'store', label: '🏪 Tienda' },
    { value: 'showroom', label: '🎪 Sala de Exhibición' },
  ];

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      console.log('📍 Cargando ubicaciones...');
      const response = await apiClient.get<any>('/api/warehouse/v1/locations/');
      console.log('✅ Ubicaciones cargadas:', response);
      setLocations(response.results || []);
      console.log('Total ubicaciones:', response.results?.length || 0);
    } catch (error) {
      console.error('❌ Error loading locations:', error);
      setErrors({ general: 'Error al cargar las ubicaciones' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // En modo edición, no validamos el código (no es editable)
    if (!editingId && !formData.code.trim()) {
      newErrors.code = 'Código requerido';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nombre requerido';
    }
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacidad debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (editingId) {
        // Actualizar ubicación existente (sin enviar 'code' porque no es editable)
        const { code, ...rest } = formData;
        
        // Limpiar campos vacíos para enviar solo lo necesario
        const dataToUpdate: any = {
          name: rest.name,
          type: rest.type,
          capacity: rest.capacity > 0 ? rest.capacity : null,
        };
        
        // Solo agregar campos opcionales si tienen valor
        if (rest.address?.trim()) dataToUpdate.address = rest.address;
        if (rest.contact_person?.trim()) dataToUpdate.contact_person = rest.contact_person;
        if (rest.contact_phone?.trim()) dataToUpdate.contact_phone = rest.contact_phone;
        if (rest.contact_email?.trim()) dataToUpdate.contact_email = rest.contact_email;
        if (rest.notes?.trim()) dataToUpdate.notes = rest.notes;
        
        console.log('📝 Actualizando ubicación id:', editingId);
        console.log('📦 Datos a enviar:', JSON.stringify(dataToUpdate, null, 2));
        
        await apiClient.patch(`/api/warehouse/v1/locations/${editingId}/`, dataToUpdate);
        setSuccessMessage('Ubicación actualizada exitosamente');
        console.log('✅ Ubicación actualizada exitosamente');
      } else {
        // Crear nueva ubicación
        const dataToCreate: any = {
          name: formData.name,
          code: formData.code,
          type: formData.type,
          capacity: formData.capacity > 0 ? formData.capacity : null,
        };
        
        // Solo agregar campos opcionales si tienen valor
        if (formData.address?.trim()) dataToCreate.address = formData.address;
        if (formData.contact_person?.trim()) dataToCreate.contact_person = formData.contact_person;
        if (formData.contact_phone?.trim()) dataToCreate.contact_phone = formData.contact_phone;
        if (formData.contact_email?.trim()) dataToCreate.contact_email = formData.contact_email;
        if (formData.notes?.trim()) dataToCreate.notes = formData.notes;
        
        console.log('✨ Creando nueva ubicación');
        console.log('📦 Datos a enviar:', JSON.stringify(dataToCreate, null, 2));
        
        await apiClient.post('/api/warehouse/v1/locations/', dataToCreate);
        setSuccessMessage('Ubicación creada exitosamente');
        console.log('✅ Ubicación creada exitosamente');
      }

      // Recargar lista y limpiar formulario
      await loadLocations();
      resetForm();
      setShowForm(false);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Error al guardar ubicación:', error);
      console.error('Detalles del error:', error.response?.data);
      setErrors({
        general: error.response?.data?.detail || error.message || 'Error al guardar la ubicación',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    console.log('📝 Editando ubicación:', location);
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type,
      address: location.address || '',
      contact_person: location.contact_person || '',
      contact_phone: location.contact_phone || '',
      contact_email: location.contact_email || '',
      capacity: location.capacity || 1000,
      notes: location.notes || '',
    });
    setEditingId(location.id);
    setErrors({});
    setShowForm(true);
    console.log('✅ Modal de edición abierto, editingId:', location.id);
  };

  const handleDelete = async (id: number) => {
    console.log('🗑️ Intentando eliminar ubicación con id:', id);
    
    if (!window.confirm('⚠️ ¿Estás seguro de que deseas eliminar esta ubicación?\n\nNOTA: Solo administradores pueden eliminar ubicaciones.')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('📡 Enviando DELETE a:', `/api/warehouse/v1/locations/${id}/`);
      await apiClient.delete(`/api/warehouse/v1/locations/${id}/`);
      setSuccessMessage('Ubicación eliminada exitosamente');
      await loadLocations();
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log('✅ Ubicación eliminada exitosamente');
    } catch (error: any) {
      console.error('❌ Error al eliminar ubicación:', error);
      console.error('Detalles del error:', error.response?.data);
      
      // Mensaje más claro para error 403
      if (error.response?.status === 403) {
        setErrors({
          general: '❌ No tienes permisos para eliminar ubicaciones. Solo los administradores globales pueden realizar esta acción.',
        });
      } else {
        setErrors({
          general: error.response?.data?.detail || error.message || 'Error al eliminar la ubicación',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'warehouse',
      address: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      capacity: 1000,
      notes: '',
    });
    setEditingId(null);
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Ubicaciones</h2>
          <p className="text-gray-600 mt-1">Crea y administra las ubicaciones del almacén</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setErrors({});
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nueva Ubicación</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">✅ {successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Form Modal - Diseño Mejorado */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all disabled:opacity-50 text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form con scroll */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección: Información Básica */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                  Información Básica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Código {!editingId && <span className="text-red-500">*</span>}
                      {editingId && <span className="text-gray-400 text-xs ml-2">(no editable)</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="LOC001"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.code && !editingId
                          ? 'border-red-300 bg-red-50'
                          : editingId 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      disabled={loading || Boolean(editingId)}
                    />
                    {errors.code && !editingId && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.code}
                      </p>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Almacén Principal"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.name
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      disabled={loading}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Tipo y Capacidad */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                  Características
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Ubicación
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all"
                      disabled={loading}
                    >
                      {locationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Capacidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Capacidad (unidades) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      min="1"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.capacity
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      disabled={loading}
                    />
                    {errors.capacity && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.capacity}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Información de Contacto (opcional) */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-1 h-6 bg-gray-400 rounded-full mr-3"></div>
                  Información de Contacto <span className="text-sm text-gray-500 font-normal ml-2">(Opcional)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Persona de Contacto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contacto@ejemplo.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, número, comuna, ciudad"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Notas Adicionales */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-1 h-6 bg-gray-400 rounded-full mr-3"></div>
                  Notas Adicionales <span className="text-sm text-gray-500 font-normal ml-2">(Opcional)</span>
                </h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Información adicional, instrucciones especiales, etc..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all resize-none"
                  disabled={loading}
                />
              </div>

              {/* Botones */}
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 -mx-6 px-6 -mb-6 pb-6">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-semibold shadow-lg shadow-blue-500/30"
                  >
                    {loading ? '⏳ Guardando...' : editingId ? '💾 Actualizar' : '✨ Crear Ubicación'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Ubicaciones Registradas</h3>
        </div>

        {loading && !showForm ? (
          <div className="p-6 text-center text-gray-500">
            <p>Cargando ubicaciones...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay ubicaciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{location.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{location.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {locationTypes.find((t) => t.value === location.type)?.label ||
                          location.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{location.capacity || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(location)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
