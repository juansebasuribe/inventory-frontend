// src/features/products/components/ProductDetail.tsx


import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../../../shared/types/product.types';

interface ProductDetailProps {
  barCode?: string;
  product?: Product;
  onAddToCart?: (product: Product) => void;
  onClose?: () => void;
  className?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  barCode,
  product: initialProduct,
  onAddToCart,
  onClose,
  className = ''
}) => {
  // Estados
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Cargar producto si solo tenemos el barCode
  useEffect(() => {
    if (barCode && !initialProduct) {
      loadProduct();
    }
  }, [barCode, initialProduct]);

  // Cargar imagen del producto
  useEffect(() => {
    if (product?.main_image) {
      loadImage(product.main_image);
    }
  }, [product?.main_image]);

  const loadProduct = async () => {
    if (!barCode) return;

    try {
      setLoading(true);
      setError('');
      const productData = await productService.getProductByBarCode(barCode);
      setProduct(productData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const loadImage = async (imagePath: string) => {
    try {
      // Si la imagen ya es una URL completa, usarla directamente
      setImageUrl(imagePath);
    } catch (err) {
      console.warn('Error al cargar imagen:', err);
      setImageUrl('');
    }
  };

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const max = product?.total_stock || 1;
    setQuantity(Math.max(1, Math.min(newQuantity, max)));
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex justify-between items-start">
          <div className="text-red-600">
            ⚠️ {error}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // No product state
  if (!product) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg">Producto no encontrado</div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cerrar
          </button>
        )}
      </div>
    );
  }

  // Calcular precio final
  const finalPrice = product.current_price;
  const hasDiscount = product.current_price < product.retail_price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.retail_price - product.current_price) / product.retail_price) * 100)
    : 0;

  // Estado del stock
  const isInStock = product.in_stock;
  const needsRestock = product.needs_restock;

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header con botón cerrar */}
      {onClose && (
        <div className="flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* Imagen del producto */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageUrl('')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-2">📦</div>
                  <div>Sin imagen</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Miniaturas de imágenes adicionales */}
          {product.additional_images && product.additional_images.length > 0 && (
            <div className="flex space-x-2">
              {product.additional_images.map((img) => (
                <div key={img.id} className="w-16 h-16 bg-gray-100 rounded border"></div>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          {/* Título y código */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-gray-600">
              Código: {product.bar_code}
            </p>
          </div>

          {/* Estado y stock */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              product.active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isInStock 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isInStock 
                ? `En stock (${product.total_stock})`
                : 'Sin stock'
              }
            </span>

            {needsRestock && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                Necesita reposición
              </span>
            )}

            {product.is_tt_discount && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Descuento TT
              </span>
            )}
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-bold text-blue-600">
                ${finalPrice.toLocaleString()}
              </span>
              
              {hasDiscount && (
                <>
                  <span className="text-2xl text-gray-500 line-through">
                    ${product.retail_price.toLocaleString()}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                    -{discountPercentage}%
                  </span>
                </>
              )}
            </div>

            {hasDiscount && (
              <p className="text-green-600 font-medium">
                ¡Ahorras ${(product.retail_price - finalPrice).toLocaleString()}!
              </p>
            )}

            {/* Información de precios para usuarios autorizados */}
            {product.can_modify_price && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>Precio de costo: ${product.cost_price.toLocaleString()}</p>
                {product.profit_margin && (
                  <p>Margen de ganancia: {product.profit_margin.toFixed(1)}%</p>
                )}
                {product.profit_value && (
                  <p>Ganancia: ${product.profit_value.toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Descripción
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
            <div>
              <span className="text-sm text-gray-500">Categoría</span>
              <p className="font-medium">
                {product.category_name || 'Sin categoría'}
              </p>
            </div>
            
            {product.primary_provider && (
              <div>
                <span className="text-sm text-gray-500">Proveedor principal</span>
                <p className="font-medium">
                  {product.primary_provider.name}
                </p>
              </div>
            )}
            
            <div>
              <span className="text-sm text-gray-500">Stock total</span>
              <p className="font-medium">{product.total_stock}</p>
            </div>
            
            {product.stock_by_location && (
              <div>
                <span className="text-sm text-gray-500">Ubicaciones</span>
                <p className="font-medium">
                  {Object.keys(product.stock_by_location).length} ubicaciones
                </p>
              </div>
            )}
          </div>

          {/* Acciones */}
          {product.active && isInStock && onAddToCart && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Selector de cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    min={1}
                    max={product.total_stock}
                    className="w-20 text-center border border-gray-300 rounded-md py-2"
                  />
                  
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.total_stock}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  
                  <span className="text-sm text-gray-500">
                    Disponible: {product.total_stock}
                  </span>
                </div>
              </div>

              {/* Botón agregar al carrito */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                🛒 Agregar al carrito
              </button>

              {/* Total */}
              <div className="text-center text-lg font-semibold text-gray-900">
                Total: ${(finalPrice * quantity).toLocaleString()}
              </div>
            </div>
          )}

          {/* Mensajes de estado */}
          {!product.active && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-medium">
                Este producto no está disponible actualmente
              </p>
            </div>
          )}

          {product.active && !isInStock && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-medium">
                Producto agotado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;