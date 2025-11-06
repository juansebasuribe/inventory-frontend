// src/pages/AdminInventoryPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Package,
  Filter,
  Search,
  ArrowLeft,
  Home,
  TrendingDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  MapPin,
  Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../features/products/services/inventoryService';
import { productService } from '../features/products/services/productService';
import warehouseService from '../shared/services/warehouseService';

// ========================================
// TIPOS Y CONSTANTES
// ========================================

interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  aisle?: string;
  shelf?: string;
  bin?: string;
  needs_restock?: boolean;
  overstock?: boolean;
}

interface Product {
  id: number;
  bar_code: string;
  name: string;
  retail_price: number;
}

interface Location {
  id: number;
  code: string;
  name: string;
}

type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer';

const ITEMS_PER_PAGE = 15;

// Colores corporativos TITA
const COLORS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  card: 'bg-white border border-gray-200 rounded-xl shadow-sm',
  badge: {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700'
  }
};

// ========================================
// COMPONENTE: MODAL DE MOVIMIENTO
// ========================================

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: MovementType;
  item?: InventoryItem;
  products: Product[];
  locations: Location[];
}

const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  item,
  products,
  locations
}) => {
  const [formData, setFormData] = useState({
    product_barcode: '',
    quantity: 0,
    from_location_code: '',
    to_location_code: '',
    notes: '',
    aisle: '',
    shelf: '',
    bin: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Resetear y cargar datos cuando cambia el item o el tipo de movimiento
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          product_barcode: item.product_code,
          quantity: 0,
          from_location_code: item.warehouse_code,
          to_location_code: '',
          notes: '',
          aisle: item.aisle || '',
          shelf: item.shelf || '',
          bin: item.bin || ''
        });
        setProductSearch(item.product_name);
      } else {
        // Limpiar formulario para nuevos movimientos
        setFormData({
          product_barcode: '',
          quantity: 0,
          from_location_code: '',
          to_location_code: '',
          notes: '',
          aisle: '',
          shelf: '',
          bin: ''
        });
        setProductSearch('');
      }
      setErrors({});
      setLoading(false);
      setShowProductDropdown(false);
    }
  }, [item, isOpen, type]);

  // Filtrar productos según búsqueda
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.bar_code.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10); // Limitar a 10 resultados

  const handleProductSelect = (product: typeof products[0]) => {
    setFormData({ ...formData, product_barcode: product.bar_code });
    setProductSearch(`${product.name} - ${product.bar_code}`);
    setShowProductDropdown(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProductDropdown]);

  const getTitle = () => {
    switch (type) {
      case 'entry':
        return 'Entrada de Inventario';
      case 'exit':
        return 'Salida de Inventario';
      case 'adjustment':
        return 'Ajuste de Inventario';
      case 'transfer':
        return 'Transferencia de Inventario';
      default:
        return 'Movimiento de Inventario';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'entry':
        return <ArrowDownCircle className="h-6 w-6 text-green-600" />;
      case 'exit':
        return <ArrowUpCircle className="h-6 w-6 text-red-600" />;
      case 'adjustment':
        return <Package className="h-6 w-6 text-blue-600" />;
      case 'transfer':
        return <Warehouse className="h-6 w-6 text-purple-600" />;
      default:
        return <Package className="h-6 w-6 text-gray-600" />;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_barcode || !formData.product_barcode.trim()) {
      newErrors.product_barcode = 'Seleccione un producto';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }
    
    // Validación de ubicación de origen (para exit, adjustment, transfer)
    if (type !== 'entry') {
      if (!formData.from_location_code || !formData.from_location_code.trim()) {
        newErrors.from_location_code = 'Seleccione una ubicación de origen';
      }
    }
    
    // Validación de ubicación de destino (para entry y transfer)
    if (type === 'entry' || type === 'transfer') {
      if (!formData.to_location_code || !formData.to_location_code.trim()) {
        newErrors.to_location_code = 'Seleccione una ubicación de destino';
      }
    }
    
    // Para transferencias, validar que origen y destino sean diferentes
    if (type === 'transfer') {
      if (formData.from_location_code && formData.to_location_code && 
          formData.from_location_code === formData.to_location_code) {
        newErrors.to_location_code = 'La ubicación de destino debe ser diferente al origen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Validación fallida', errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Construir el payload base con campos requeridos
      const movementPayload: any = {
        movement_type: type, // ⚠️ IMPORTANTE: Enviar en minúsculas tal como está
        product_barcode: formData.product_barcode.trim(),
        quantity: Number(formData.quantity)
      };

      // Agregar notas solo si hay contenido
      if (formData.notes && formData.notes.trim()) {
        movementPayload.notes = formData.notes.trim();
      }

      // Agregar ubicaciones según el tipo de movimiento
      if (type === 'entry') {
        if (!formData.to_location_code) {
          throw new Error('Debe seleccionar una ubicación de destino para entradas');
        }
        movementPayload.to_location_code = formData.to_location_code.trim();
        
        // Agregar detalles de ubicación solo si están presentes
        if (formData.aisle && formData.aisle.trim()) {
          movementPayload.aisle = formData.aisle.trim();
        }
        if (formData.shelf && formData.shelf.trim()) {
          movementPayload.shelf = formData.shelf.trim();
        }
        if (formData.bin && formData.bin.trim()) {
          movementPayload.bin = formData.bin.trim();
        }
      } else if (type === 'exit') {
        if (!formData.from_location_code) {
          throw new Error('Debe seleccionar una ubicación de origen para salidas');
        }
        movementPayload.from_location_code = formData.from_location_code.trim();
      } else if (type === 'transfer') {
        if (!formData.from_location_code || !formData.to_location_code) {
          throw new Error('Debe seleccionar ubicaciones de origen y destino para transferencias');
        }
        movementPayload.from_location_code = formData.from_location_code.trim();
        movementPayload.to_location_code = formData.to_location_code.trim();
        
        // Agregar detalles de ubicación solo si están presentes
        if (formData.aisle && formData.aisle.trim()) {
          movementPayload.aisle = formData.aisle.trim();
        }
        if (formData.shelf && formData.shelf.trim()) {
          movementPayload.shelf = formData.shelf.trim();
        }
        if (formData.bin && formData.bin.trim()) {
          movementPayload.bin = formData.bin.trim();
        }
      } else if (type === 'adjustment') {
        if (!formData.from_location_code) {
          throw new Error('Debe seleccionar una ubicación para ajustes');
        }
        movementPayload.from_location_code = formData.from_location_code.trim();
      }

      console.log('📦 Enviando movimiento:', {
        tipo: type,
        payload: movementPayload
      });

      // CRÍTICO: Hacer el request API con await para capturar errores correctamente
      const result = await inventoryService.createMovement(movementPayload);

      console.log('✅ Movimiento creado exitosamente:', result);
      
      // NUEVA ESTRATEGIA: Limpiar estado, esperar, LUEGO cerrar y notificar
      setLoading(false);
      setErrors({});
      
      // Esperar un tick para que React procese el cambio de loading
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Cerrar modal
      onClose();
      
      // Esperar a que el modal se desmonte completamente antes de actualizar el padre
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Notificar éxito
      onSuccess();
    } catch (error) {
      console.error('❌ Error al crear movimiento:', error);
      
      let errorMessage = 'Error al procesar el movimiento. Intente nuevamente.';
      const fieldErrors: Record<string, string> = {};
      
      // Manejar errores de Error estándar
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Verificar si tiene información de response del backend
        const anyError = error as any;
        if (anyError.response?.data) {
          const data = anyError.response.data;
          
          // Mensaje principal
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.detail) {
            errorMessage = Array.isArray(data.detail) ? data.detail.join(', ') : String(data.detail);
          } else if (data.error) {
            errorMessage = String(data.error);
          } else if (data.message) {
            errorMessage = String(data.message);
          } else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) 
              ? data.non_field_errors.join(', ') 
              : String(data.non_field_errors);
          }
          
          // Extraer errores de campos específicos
          Object.keys(data).forEach(key => {
            if (!['detail', 'error', 'message', 'non_field_errors'].includes(key)) {
              const value = data[key];
              if (Array.isArray(value)) {
                fieldErrors[key] = value.join(', ');
              } else if (typeof value === 'string') {
                fieldErrors[key] = value;
              }
            }
          });
        }
        
        // Si hay detalles de validación en el error mismo
        if (anyError.details && typeof anyError.details === 'object') {
          Object.keys(anyError.details).forEach(key => {
            const value = anyError.details[key];
            if (Array.isArray(value)) {
              fieldErrors[key] = value.join(', ');
            } else if (typeof value === 'string') {
              fieldErrors[key] = value;
            }
          });
        }
      }
      
      // Combinar errores de campos en el mensaje si existen
      if (Object.keys(fieldErrors).length > 0) {
        const fieldErrorMessages = Object.entries(fieldErrors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        errorMessage = fieldErrorMessages || errorMessage;
      }
      
      setErrors({ general: errorMessage, ...fieldErrors });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showLocationFields = type === 'entry' || type === 'transfer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
              {item && <p className="text-sm text-gray-500">{item.product_name}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* Producto con búsqueda */}
            <div className="product-search-container relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productSearch}
                onChange={e => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                  // Limpiar selección si el usuario borra el texto
                  if (!e.target.value) {
                    setFormData({ ...formData, product_barcode: '' });
                  }
                }}
                onFocus={() => setShowProductDropdown(true)}
                disabled={!!item || loading}
                placeholder="Buscar por nombre o código de barras..."
                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.product_barcode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${item ? 'bg-gray-100' : ''}`}
              />
              
              {/* Dropdown de resultados */}
              {showProductDropdown && !item && productSearch && filteredProducts.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                  {filteredProducts.map(product => (
                    <button
                      key={product.bar_code}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-blue-50 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        Código: {product.bar_code}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {errors.product_barcode && (
                <p className="mt-1 text-xs text-red-500">{errors.product_barcode}</p>
              )}
              
              {/* Hint para búsqueda */}
              {!item && (
                <p className="mt-1 text-xs text-gray-500">
                  💡 Escribe el código de barras o nombre del producto
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                disabled={loading}
                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ingrese la cantidad"
              />
              {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
              {item && (
                <p className="mt-1 text-xs text-gray-500">
                  Stock actual: <span className="font-semibold">{item.current_stock}</span> unidades
                </p>
              )}
            </div>

            {/* Ubicación de origen (para salidas, ajustes y transferencias) */}
            {type !== 'entry' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Ubicación de origen <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.from_location_code}
                  onChange={e => setFormData({ ...formData, from_location_code: e.target.value })}
                  disabled={!!item || loading}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.from_location_code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${item ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Seleccione una ubicación</option>
                  {locations.map(location => (
                    <option key={location.code} value={location.code}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
                {errors.from_location_code && (
                  <p className="mt-1 text-xs text-red-500">{errors.from_location_code}</p>
                )}
              </div>
            )}

            {/* Ubicación de destino (para entradas y transferencias) */}
            {(type === 'entry' || type === 'transfer') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Ubicación de destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.to_location_code}
                  onChange={e => setFormData({ ...formData, to_location_code: e.target.value })}
                  disabled={loading}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.to_location_code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione una ubicación</option>
                  {locations.map(location => (
                    <option key={location.code} value={location.code}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
                {errors.to_location_code && (
                  <p className="mt-1 text-xs text-red-500">{errors.to_location_code}</p>
                )}
              </div>
            )}

            {/* Detalles de ubicación (pasillo, estante, ubicación) */}
            {showLocationFields && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="h-4 w-4" />
                  Detalles de ubicación (opcional)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Pasillo</label>
                    <input
                      type="text"
                      value={formData.aisle}
                      onChange={e => setFormData({ ...formData, aisle: e.target.value })}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="A1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Estante</label>
                    <input
                      type="text"
                      value={formData.shelf}
                      onChange={e => setFormData({ ...formData, shelf: e.target.value })}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="E2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Ubicación</label>
                    <input
                      type="text"
                      value={formData.bin}
                      onChange={e => setFormData({ ...formData, bin: e.target.value })}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="B3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                disabled={loading}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${COLORS.secondary} disabled:opacity-50`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${COLORS.primary} disabled:opacity-50`}
            >
              {loading && <Package className="h-4 w-4 animate-spin" />}
              {loading ? 'Procesando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export const AdminInventoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out' | 'over'>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('entry');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // ========================================
  // CARGA DE DATOS CON CACHÉ
  // ========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar inventario primero
      const [inventoryResponse, productsResponse, locationsResponse] = await Promise.all([
        inventoryService.getInventoryItems({ page_size: 500 }),
        productService.getProducts({ page_size: 1000, ordering: 'name' })
          .catch(() => ({ results: [] })),
        warehouseService.getLocations()
          .catch(() => [])
      ]);

      const items = inventoryResponse.results || [];
      setInventoryItems(items);

      const productList = (productsResponse.results || []).map((p: any) => ({
        id: p.id,
        bar_code: p.bar_code,
        name: p.name,
        retail_price: p.retail_price
      }));
      setProducts(productList);

      const locationList = (locationsResponse || []).map((l: any) => ({
        id: l.id,
        code: l.code,
        name: l.name
      }));
      setLocations(locationList);

      // Calcular estadísticas
      const lowStock = items.filter(i => i.needs_restock).length;
      const outOfStock = items.filter(i => i.current_stock === 0).length;

      setStats({
        totalItems: items.length,
        lowStock,
        outOfStock,
        totalValue: 0
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ========================================
  // FILTRADO Y PAGINACIÓN
  // ========================================

  useEffect(() => {
    let filtered = inventoryItems;

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.product_name.toLowerCase().includes(term) ||
          item.product_code.toLowerCase().includes(term) ||
          item.warehouse_name.toLowerCase().includes(term)
      );
    }

    // Filtro de ubicación
    if (filterLocation) {
      filtered = filtered.filter(item => item.warehouse_code === filterLocation);
    }

    // Filtro de stock
    if (filterStock === 'low') {
      filtered = filtered.filter(item => item.needs_restock);
    } else if (filterStock === 'out') {
      filtered = filtered.filter(item => item.current_stock === 0);
    } else if (filterStock === 'over') {
      filtered = filtered.filter(item => item.overstock);
    }

    setFilteredItems(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [inventoryItems, searchTerm, filterLocation, filterStock]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handleOpenMovementModal = (type: MovementType, item?: InventoryItem) => {
    // Prevenir apertura si hay una transición en proceso
    if (isModalTransitioning) return;

    setIsModalTransitioning(true);
    setMovementType(type);
    setSelectedItem(item);
    
    // Delay corto para permitir que el estado se actualice
    setTimeout(() => {
      setShowMovementModal(true);
      setIsModalTransitioning(false);
    }, 100);
  };

  const handleMovementSuccess = () => {
    // El modal ya se cerró en handleSubmit, solo limpiar estado y recargar
    setSelectedItem(undefined);
    setIsModalTransitioning(false);
    setShowMovementModal(false); // Asegurar que esté cerrado
    
    // Recargar datos
    void loadData();
  };

  const handleCloseModal = () => {
    setIsModalTransitioning(true);
    setShowMovementModal(false);
    
    // Esperar a que el modal se cierre antes de limpiar el estado
    setTimeout(() => {
      setSelectedItem(undefined);
      setIsModalTransitioning(false);
    }, 300);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterStock('all');
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return { label: 'Agotado', className: COLORS.badge.red };
    }
    if (item.needs_restock) {
      return { label: 'Stock bajo', className: COLORS.badge.amber };
    }
    if (item.overstock) {
      return { label: 'Sobrestock', className: COLORS.badge.amber };
    }
    return { label: 'Normal', className: COLORS.badge.green };
  };

  const hasActiveFilters = Boolean(searchTerm || filterLocation || filterStock !== 'all');

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className={`mb-6 ${COLORS.card} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1 transition-colors hover:text-gray-900"
              >
                <Home className="h-4 w-4" />
                Inicio
              </button>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-700">Control de Inventario</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona entradas, salidas y movimientos de inventario
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors border-blue-600 text-blue-600 hover:bg-blue-50`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${COLORS.secondary} disabled:opacity-50`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => handleOpenMovementModal('entry')}
              disabled={isModalTransitioning}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${COLORS.success} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Nueva Entrada
            </button>
            <button
              type="button"
              onClick={() => handleOpenMovementModal('exit')}
              disabled={isModalTransitioning}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${COLORS.danger} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Nueva Salida
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Items</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock Bajo</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.lowStock}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <TrendingDown className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Agotados</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ubicaciones</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{locations.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Warehouse className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`mb-6 ${COLORS.card} p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por producto, código o ubicación..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-600">Filtros</span>
            </div>
            <select
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map(location => (
                <option key={location.code} value={location.code}>
                  {location.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: 'all' as const, label: 'Todos' },
            { value: 'low' as const, label: 'Stock bajo' },
            { value: 'out' as const, label: 'Agotados' },
            { value: 'over' as const, label: 'Sobrestock' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilterStock(option.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                filterStock === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={COLORS.card}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Package className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No se encontraron items</h3>
            <p className="mt-2 text-sm text-gray-500">
              Ajusta los filtros o registra un nuevo movimiento.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Ubicación</th>
                    <th className="px-6 py-4">Stock Actual</th>
                    <th className="px-6 py-4">Min / Max</th>
                    <th className="px-6 py-4">Ubicación Física</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedItems.map(item => {
                    const badge = getStockBadge(item);
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-gray-50/60">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.product_code}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.warehouse_name}</p>
                            <p className="text-xs text-gray-500">{item.warehouse_code}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-gray-900">{item.current_stock}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-0.5">
                            {/* Mostrar 0 correctamente: antes se ocultaba por usar || '-' */}
                            <span>
                              Min:{' '}
                              {item.minimum_stock !== null && item.minimum_stock !== undefined
                                ? item.minimum_stock
                                : '-'}
                            </span>
                            <span>
                              Max:{' '}
                              {item.maximum_stock !== null && item.maximum_stock !== undefined
                                ? item.maximum_stock
                                : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.aisle || item.shelf || item.bin ? (
                            <div className="flex flex-wrap gap-1">
                              {item.aisle && (
                                <span className="rounded bg-gray-100 px-2 py-0.5">P: {item.aisle}</span>
                              )}
                              {item.shelf && (
                                <span className="rounded bg-gray-100 px-2 py-0.5">E: {item.shelf}</span>
                              )}
                              {item.bin && (
                                <span className="rounded bg-gray-100 px-2 py-0.5">U: {item.bin}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenMovementModal('entry', item)}
                              disabled={isModalTransitioning}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${COLORS.success} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Entrada"
                            >
                              Entrada
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenMovementModal('exit', item)}
                              disabled={isModalTransitioning}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${COLORS.danger} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Salida"
                            >
                              Salida
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  Mostrando{' '}
                  <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                  </span>{' '}
                  de <span className="font-semibold">{filteredItems.length}</span> items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Movimiento - Siempre montado pero controlado por isOpen */}
      <MovementModal
        isOpen={showMovementModal}
        onClose={handleCloseModal}
        onSuccess={handleMovementSuccess}
        type={movementType}
        item={selectedItem}
        products={products}
        locations={locations}
      />
    </div>
  );
};

export default AdminInventoryPage;
