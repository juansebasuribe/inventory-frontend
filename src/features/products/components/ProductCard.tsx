// src/features/products/components/ProductCard.tsx

import React, { useState } from 'react';
import type { Product } from '../../../shared/types/product.types';
import { getProductImageUrl } from '../../../shared/utils/url.utils';
import { useAuth } from '../../../shared/stores';
import { useLocation } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  showActions?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onEdit,
  showActions = true,
  className = ''
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const isSellerTatView = location.pathname.includes('/seller-tat');
  const _instanceId = React.useRef(Math.random().toString(36).slice(2, 9));
  React.useEffect(() => {
   
    
  }, [product?.bar_code]);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Obtener URL completa de la imagen del producto
  const productImageUrl = getProductImageUrl(product);

  // Calcular precio según el rol del usuario
  const getDisplayPrice = (): number => {
    const userRole = user?.profile?.role;
    const currentPath = location.pathname;

    // Determinar el rol efectivo (del perfil o de la ruta)
    let effectiveRole = userRole;
    if (!effectiveRole) {
      if (currentPath.includes('/seller-tat')) {
        effectiveRole = 'seller_tt';
      } else if (currentPath.includes('/seller')) {
        effectiveRole = 'seller';
      }
    }

    const retail = Number(product.retail_price) || 0;
    const baseCost = Number(product.primary_cost_price ?? product.cost_price ?? retail);

    if (effectiveRole === 'seller_tt' || isSellerTatView) {
      return baseCost * 1.2;
    }

    if (effectiveRole === 'seller' || effectiveRole === 'seller_executive') {
      return baseCost * 1.4;
    }

    // Mostrar current_price si el backend lo calcula; si no, retail
    return product.current_price || retail;
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Determinar color del stock
  const getStockColor = () => {
    if (product.total_stock <= 0 || !product.in_stock) return 'text-red-600 bg-red-50';
    if (product.needs_restock) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  // Calcular porcentaje de descuento si hay descuento
  const getDiscountPercentage = () => {
    if (product.discount_percentage) {
      return Math.round(product.discount_percentage);
    }
    if (product.retail_price && product.retail_price > product.current_price) {
      return Math.round(((product.retail_price - product.current_price) / product.retail_price) * 100);
    }
    return null;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const discountPercentage = getDiscountPercentage();
  const displayPrice = getDisplayPrice();
  const showRetailComparison =
    Boolean(product.retail_price && product.retail_price > displayPrice && !isSellerTatView);

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer ${className}`}
      onClick={() => onEdit?.(product)}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <img
          src={imageError ? '/placeholder-product.svg' : productImageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Badge de descuento */}
        {discountPercentage && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
            -{discountPercentage}%
          </div>
        )}

        {/* Badge de estado */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium ${
          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {product.active ? 'Activo' : 'Inactivo'}
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Código del producto */}
        <div className="text-xs text-gray-500 mb-1">
          SKU: {product.bar_code}
        </div>

        {/* Nombre del producto */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Descripción */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Categoría */}
        {product.category_name && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mb-3">
            {product.category_name}
          </div>
        )}

        {/* Precios */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(displayPrice)}
            </span>
            {showRetailComparison && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.retail_price)}
              </span>
            )}
          </div>
          
          
          
          
        </div>

        {/* Stock */}
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3 ${getStockColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
          Stock: {product.total_stock} unidades
        </div>

        {/* Acciones */}
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(product);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Ver detalles
            </button>
            
            {product.active && product.in_stock && product.total_stock > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Agregar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
