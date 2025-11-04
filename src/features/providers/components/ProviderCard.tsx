// src/features/providers/components/ProviderCard.tsx

/**
 * Componente ProviderCard - Tarjeta de proveedor
 * Muestra información del proveedor con rating y acciones
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState } from 'react';
import { providerService } from '../../../shared/services/providerService';
import type { Provider, IdentificationType } from '../../../shared/types/product.types';

interface ProviderCardProps {
  provider: Provider;
  onEdit?: (provider: Provider) => void;
  onDelete?: (provider: Provider) => void;
  onViewDetails?: (provider: Provider) => void;
  onRatingChange?: (provider: Provider, newRating: number) => void;
  showActions?: boolean;
  className?: string;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onEdit,
  onDelete,
  onViewDetails,
  onRatingChange,
  showActions = true,
  className = ''
}) => {
  // Estados
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [localRating, setLocalRating] = useState(provider.rating || 0);

  // Mapeo de tipos de identificación
  const getIdentificationTypeLabel = (type: IdentificationType): string => {
    const types = {
      nit: 'NIT',
      cc: 'C.C.',
      ce: 'C.E.',
      pasaporte: 'Pasaporte',
      otros: 'Otros'
    };
    return types[type] || type;
  };

  // Manejar cambio de rating
  const handleRatingChange = async (newRating: number) => {
    if (newRating === localRating) return;

    try {
      setIsUpdatingRating(true);
      await providerService.updateProviderRating(provider.id, newRating);
      setLocalRating(newRating);
      
      if (onRatingChange) {
        onRatingChange({ ...provider, rating: newRating }, newRating);
      }
    } catch (error) {
      console.error('Error al actualizar rating:', error);
      // Revertir rating local en caso de error
      setLocalRating(provider.rating || 0);
    } finally {
      setIsUpdatingRating(false);
    }
  };

  // Renderizar estrellas de rating
  const renderRating = () => {
    const stars = [];
    const rating = localRating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingChange(i)}
          disabled={isUpdatingRating}
          className={`text-lg ${
            i <= rating 
              ? 'text-yellow-400' 
              : 'text-gray-300'
          } hover:text-yellow-500 transition-colors ${
            isUpdatingRating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title={`Calificar con ${i} estrella${i > 1 ? 's' : ''}`}
        >
          ⭐
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-1">
        {stars}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            ({rating.toFixed(1)})
          </span>
        )}
        {isUpdatingRating && (
          <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {provider.name}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">
                {getIdentificationTypeLabel(provider.identification_type)}:
              </span>
              <span>{provider.identification_number}</span>
            </div>
          </div>

          {/* Estado */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            provider.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {provider.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Información de contacto */}
        <div className="space-y-2">
          {provider.address && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">📍</span>
              <span className="text-gray-700">{provider.address}</span>
            </div>
          )}
          
          {provider.phone_number && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">📞</span>
              <span className="text-gray-700">{provider.phone_number}</span>
            </div>
          )}
          
          {provider.email && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">📧</span>
              <span className="text-gray-700">{provider.email}</span>
            </div>
          )}
          
          {provider.website && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">🌐</span>
              <a 
                href={provider.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {provider.website}
              </a>
            </div>
          )}
        </div>

        {/* Persona de contacto */}
        {provider.contact_person && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400">👤</span>
            <span className="text-gray-700">
              <span className="font-medium">Contacto:</span> {provider.contact_person}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Calificación:</span>
          {renderRating()}
        </div>

        {/* Notas */}
        {provider.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <span className="text-sm font-medium text-gray-700">Notas:</span>
            <p className="text-sm text-gray-600 mt-1">{provider.notes}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(provider)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  Ver detalles
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => onEdit(provider)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  ✏️ Editar
                </button>
              )}
            </div>

            {/* Acciones de peligro */}
            {onDelete && (
              <button
                onClick={() => onDelete(provider)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer con fechas */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Creado: {new Date(provider.creation_date).toLocaleDateString()}</span>
          <span>Actualizado: {new Date(provider.update_date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;