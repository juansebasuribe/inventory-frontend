// src/features/providers/components/ProviderCreateModal.tsx

import React, { useState } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { providerService } from '../../../shared/services/providerService';

interface ProviderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderCreated: (provider: any) => void;
}

export const ProviderCreateModal: React.FC<ProviderCreateModalProps> = ({
  isOpen,
  onClose,
  onProviderCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    identification_type: 'nit',
    identification_number: '',
    address: '',
    phone_number: '',
    email: '',
    contact: '',
    comments: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const identificationType = [
    { value: 'nit', label: 'NIT' },
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'otros', label: 'Otros' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.identification_number.trim()) {
      newErrors.identification_number = 'El número de identificación es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Preparar datos - remover campos vacíos
      const providerData: any = {
        name: formData.name,
        identification_type: formData.identification_type,
        identification_number: formData.identification_number,
      };

      if (formData.address) providerData.address = formData.address;
      if (formData.phone_number) providerData.phone_number = formData.phone_number;
      if (formData.email) providerData.email = formData.email;
      if (formData.contact) providerData.contact_person = formData.contact;
      if (formData.comments) providerData.notes = formData.comments;

      const newProvider = await providerService.createProvider(providerData);
      
      console.log('✅ Proveedor creado exitosamente:', newProvider);
      
      // Resetear formulario
      setFormData({
        name: '',
        identification_type: 'nit',
        identification_number: '',
        address: '',
        phone_number: '',
        email: '',
        contact: '',
        comments: '',
      });
      
      // Notificar éxito
      onProviderCreated(newProvider);
      
      // Cerrar modal
      onClose();
    } catch (error: any) {
      console.error('❌ Error al crear proveedor:', error);
      
      const errorMessage = error.message || 'Error al crear el proveedor';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        identification_type: 'nit',
        identification_number: '',
        address: '',
        phone_number: '',
        email: '',
        contact: '',
        comments: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Proveedor</h2>
              <p className="text-sm text-gray-500 mt-1">Registra un nuevo proveedor en el sistema</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre o Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Ej: Distribuidora XYZ S.A.S"
                autoFocus
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Tipo de Identificación */}
            <div>
              <label htmlFor="identification_type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Identificación <span className="text-red-500">*</span>
              </label>
              <select
                id="identification_type"
                name="identification_type"
                value={formData.identification_type}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {identificationType.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Número de Identificación */}
            <div>
              <label htmlFor="identification_number" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Identificación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="identification_number"
                name="identification_number"
                value={formData.identification_number}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.identification_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Ej: 900123456-7"
              />
              {errors.identification_number && (
                <p className="text-red-500 text-xs mt-1">{errors.identification_number}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ej: +57 300 123 4567"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Ej: contacto@proveedor.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Persona de Contacto */}
            <div className="md:col-span-2">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Persona de Contacto
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ej: Calle 123 #45-67, Bogotá"
              />
            </div>

            {/* Comentarios */}
            <div className="md:col-span-2">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Notas adicionales sobre el proveedor..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Proveedor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderCreateModal;
