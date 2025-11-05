// src/pages/AdminInventoryPage.tsx

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Package, ArrowUpDown, Filter, Download, Search, ArrowLeft, Home, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../features/products/services/inventoryService';
import { productService } from '../features/products/services/productService';
import warehouseService from '../shared/services/warehouseService';

// Interfaces locales basadas en la respuesta del backend
interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit_cost: number;
  total_value: number;
  last_movement_date: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  needs_restock?: boolean;
  overstock?: boolean;
}

type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'TRANSFER';

interface MovementLocationForm {
  aisle: string;
  shelf: string;
  bin: string;
}

const createEmptyMovementLocation = (): MovementLocationForm => ({
  aisle: '',
  shelf: '',
  bin: ''
});

export const AdminInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const INVENTORY_FETCH_PAGE_SIZE = 200;
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Todos los productos disponibles
  const [loading, setLoading] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState<string>(''); // Para nueva entrada
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState<string>(''); // Para nueva entrada
  const [transferDestinationCode, setTransferDestinationCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  
  // Form data para ajustes
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    movement_type: 'ADJUSTMENT' as MovementType,
    notes: ''
  });

  // Form data para movimientos
  const [movementData, setMovementData] = useState({
    movement_type: 'ENTRY' as MovementType,
    quantity: 0,
    notes: ''
  });

  const [movementLocation, setMovementLocation] = useState<MovementLocationForm>(createEmptyMovementLocation);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [tablePage, setTablePage] = useState<number>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<any[]>([]);

  const resetMovementForm = () => {
    setMovementData({ movement_type: 'ENTRY', quantity: 0, notes: '' });
    setSelectedProductCode('');
    setSelectedWarehouseCode('');
    setTransferDestinationCode('');
    setMovementLocation(createEmptyMovementLocation());
    setErrors({});
  };

  const handleCloseMovementModal = () => {
    setShowMovementModal(false);
    setSelectedItem(null);
    resetMovementForm();
  };

  useEffect(() => {
    loadInventoryItems();
    loadLocations();
    loadAllProducts(); // Cargar todos los productos
  }, []);

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, filterLocation, inventoryItems.length, itemsPerPage]);

  useEffect(() => {
    const isEntry = movementData.movement_type === 'ENTRY';
    const isTransfer = movementData.movement_type === 'TRANSFER';
    const targetWarehouseCode = isTransfer ? transferDestinationCode : selectedWarehouseCode;

    if (!isEntry && !(isTransfer && targetWarehouseCode)) {
      setMovementLocation((prev) => {
        if (!prev.aisle && !prev.shelf && !prev.bin) {
          return prev;
        }
        return createEmptyMovementLocation();
      });
      return;
    }

    if (!selectedProductCode || !targetWarehouseCode) {
      setMovementLocation((prev) => {
        if (!prev.aisle && !prev.shelf && !prev.bin) {
          return prev;
        }
        return createEmptyMovementLocation();
      });
      return;
    }

    const existing = inventoryItems.find(
      (item) =>
        item.product_code === selectedProductCode &&
        item.warehouse_code === targetWarehouseCode
    );

    if (existing) {
      const nextLocation = {
        aisle: existing.aisle || '',
        shelf: existing.shelf || '',
        bin: existing.bin || ''
      };
      setMovementLocation((prev) => {
        if (
          prev.aisle === nextLocation.aisle &&
          prev.shelf === nextLocation.shelf &&
          prev.bin === nextLocation.bin
        ) {
          return prev;
        }
        return nextLocation;
      });
    } else {
      setMovementLocation((prev) => {
        if (!prev.aisle && !prev.shelf && !prev.bin) {
          return prev;
        }
        return createEmptyMovementLocation();
      });
    }
  }, [
    movementData.movement_type,
    selectedProductCode,
    selectedWarehouseCode,
    transferDestinationCode,
    inventoryItems
  ]);

  useEffect(() => {
    if (movementData.movement_type !== 'ENTRY' && movementData.movement_type !== 'TRANSFER') {
      setErrors((prev) => {
        if (!prev.aisle && !prev.shelf && !prev.bin) {
          return prev;
        }

        const { aisle, shelf, bin, ...rest } = prev;
        return rest;
      });
    }
  }, [movementData.movement_type]);

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventoryItems({
        page: 1,
        page_size: INVENTORY_FETCH_PAGE_SIZE
      });
      console.log('📦 Inventario cargado:', response);
      setInventoryItems(response.results || []);
      setTablePage(1);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await productService.getProducts({ page: 1, page_size: 1000 });
      console.log('📋 Todos los productos cargados:', response);
      setAllProducts(response.results || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const locations = await warehouseService.getLocations();
      console.log('📍 Ubicaciones cargadas:', locations);
      setLocations(locations || []);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      // No bloquear la UI si falla la carga de ubicaciones
      setLocations([]);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || adjustmentData.quantity === 0) {
      setErrors({ quantity: 'La cantidad debe ser diferente de 0' });
      return;
    }

    try {
      setLoading(true);
      
      // Crear movimiento de ajuste usando el servicio
      const movementPayload = {
        movement_type: 'adjustment' as const,
        product_barcode: selectedItem.product_code,
        to_location_code: selectedItem.warehouse_code,
        quantity: Math.abs(adjustmentData.quantity),
        notes: adjustmentData.notes || 'Ajuste de inventario manual',
        reference_number: `ADJ-${Date.now()}`
      };

      console.log('📝 Creando ajuste:', movementPayload);

      await inventoryService.createMovement(movementPayload);
      
      // Resetear
      setAdjustmentData({ quantity: 0, movement_type: 'ADJUSTMENT', notes: '' });
      setErrors({});
      setShowAdjustModal(false);
      setSelectedItem(null);
      
      // Recargar
      await loadInventoryItems();
      
      alert('✅ Stock ajustado exitosamente');
    } catch (error: any) {
      console.error('Error al ajustar stock:', error);
      setErrors({ general: error.message || 'Error al ajustar el stock' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: Record<string, string> = {};

    if (movementData.quantity <= 0) {
      validationErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    const productCode = selectedItem?.product_code || selectedProductCode;
    const warehouseCode = selectedItem?.warehouse_code || selectedWarehouseCode;
    const hasProduct = Boolean(productCode);
    const hasWarehouse = Boolean(warehouseCode);

    if (!hasProduct) {
      validationErrors.product = 'Seleccione un producto';
    }
    if (!hasWarehouse) {
      validationErrors.warehouse = 'Seleccione una bodega';
    }
    if (!hasProduct || !hasWarehouse) {
      validationErrors.general = 'Debe seleccionar un producto y una bodega';
    }

    const sanitizedLocation = {
      aisle: movementLocation.aisle.trim(),
      shelf: movementLocation.shelf.trim(),
      bin: movementLocation.bin.trim()
    };

    const needsLocationDetails =
      movementData.movement_type === 'ENTRY' && hasProduct && hasWarehouse;

    if (needsLocationDetails) {
      if (!sanitizedLocation.aisle) {
        validationErrors.aisle = 'Ingresa el pasillo';
      }
      if (!sanitizedLocation.shelf) {
        validationErrors.shelf = 'Ingresa la estantería';
      }
      if (!sanitizedLocation.bin) {
        validationErrors.bin = 'Ingresa la posición';
      }
      if (
        !sanitizedLocation.aisle ||
        !sanitizedLocation.shelf ||
        !sanitizedLocation.bin
      ) {
        if (!validationErrors.general) {
          validationErrors.general = 'Completa los detalles de ubicación para registrar la entrada';
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      
      // Mapear tipo de movimiento
      const movementTypeMap: Record<MovementType, 'entry' | 'exit' | 'adjustment' | 'transfer'> = {
        'ENTRY': 'entry',
        'EXIT': 'exit',
        'ADJUSTMENT': 'adjustment',
        'TRANSFER': 'transfer'
      };

      const movementType = movementTypeMap[movementData.movement_type];

      const movementPayload: Parameters<typeof inventoryService.createMovement>[0] = {
        movement_type: movementType,
        product_barcode: productCode as string,
        quantity: movementData.quantity,
        notes: movementData.notes || `Movimiento de ${movementData.movement_type}`,
        reference_number: `MOV-${Date.now()}`
      };

      if (movementType === 'entry' || movementType === 'adjustment') {
        movementPayload.to_location_code = warehouseCode as string;
      }

      if (movementType === 'exit') {
        movementPayload.from_location_code = warehouseCode as string;
      }

      if (movementType === 'transfer') {
        movementPayload.from_location_code = warehouseCode as string;
        if (transferDestinationCode) {
          movementPayload.to_location_code = transferDestinationCode;
        }
      }

      const locationCanBeSent = movementType === 'entry' || movementType === 'adjustment';

      if (locationCanBeSent && sanitizedLocation.aisle) {
        movementPayload.aisle = sanitizedLocation.aisle;
      }
      if (locationCanBeSent && sanitizedLocation.shelf) {
        movementPayload.shelf = sanitizedLocation.shelf;
      }
      if (locationCanBeSent && sanitizedLocation.bin) {
        movementPayload.bin = sanitizedLocation.bin;
      }

      console.log('📝 Creando movimiento:', movementPayload);

      await inventoryService.createMovement(movementPayload);

      const productName = allProducts.find((p) => p.bar_code === productCode)?.name || productCode;
      const locationDetailLines = [
        sanitizedLocation.aisle && `Pasillo: ${sanitizedLocation.aisle}`,
        sanitizedLocation.shelf && `Estante: ${sanitizedLocation.shelf}`,
        sanitizedLocation.bin && `Posición: ${sanitizedLocation.bin}`
      ].filter(Boolean);
      const shouldShowLocationDetails = locationCanBeSent && locationDetailLines.length > 0;

      let successMessage = `✅ Movimiento registrado exitosamente!\n\n` +
        `Producto: ${productName}\n` +
        `Tipo: ${movementData.movement_type}\n` +
        `Cantidad: ${movementData.quantity}`;

      if (shouldShowLocationDetails) {
        successMessage += `\n${locationDetailLines.join('\n')}`;
      }

      if (movementType === 'exit') {
        const exitLocationName = selectedItem?.warehouse_name ||
          locations.find((loc) => loc.code === warehouseCode)?.name ||
          warehouseCode;
        successMessage += `\nUbicación origen: ${exitLocationName}`;
      }

      alert(successMessage);

      await loadInventoryItems();

      handleCloseMovementModal();
    } catch (error: any) {
      console.error('Error al crear movimiento:', error);
      setErrors({ general: error.message || 'Error al registrar el movimiento' });
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentData({ quantity: 0, movement_type: 'ADJUSTMENT', notes: '' });
    setErrors({});
    setShowAdjustModal(true);
  };

  const openMovementModal = (item: InventoryItem | null, type: MovementType = 'ENTRY') => {
    setSelectedItem(item);
    setSelectedProductCode(item?.product_code || '');
    setSelectedWarehouseCode(item?.warehouse_code || '');
    setMovementData({ movement_type: type, quantity: 0, notes: '' });
    setMovementLocation(
      item
        ? {
            aisle: item.aisle || '',
            shelf: item.shelf || '',
            bin: item.bin || ''
          }
        : createEmptyMovementLocation()
    );
    setErrors({});
    setShowMovementModal(true);
  };

  const currentMovementItem = selectedItem ||
    (selectedProductCode && selectedWarehouseCode
      ? inventoryItems.find(
          (item) =>
            item.product_code === selectedProductCode &&
            item.warehouse_code === selectedWarehouseCode
        )
      : undefined);

  // Filtrar items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filterLocation === '' || 
      item.warehouse_code === filterLocation;
    
    return matchesSearch && matchesLocation;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice(
    (tablePage - 1) * itemsPerPage,
    tablePage * itemsPerPage
  );
  const showingFrom = filteredItems.length === 0 ? 0 : (tablePage - 1) * itemsPerPage + 1;
  const showingTo = filteredItems.length === 0 ? 0 : Math.min(filteredItems.length, tablePage * itemsPerPage);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    if (tablePage > maxPage) {
      setTablePage(maxPage);
    }
  }, [filteredItems.length, itemsPerPage, tablePage]);

  // Calcular estadísticas mejoradas
  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.current_stock || 0), 0);
  const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.total_value || 0)), 0);
  const lowStockItems = inventoryItems.filter(item => 
    item.current_stock <= (item.minimum_stock || 0) && item.current_stock > 0
  ).length;
  const outOfStockItems = inventoryItems.filter(item => item.current_stock === 0).length;
  const overstockItems = inventoryItems.filter(item => 
    item.maximum_stock && item.current_stock > item.maximum_stock
  ).length;

  // Resumen por ubicación
  const stockByLocation = inventoryItems.reduce((acc, item) => {
    const key = item.warehouse_name || 'Sin ubicación';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        items: 0,
        quantity: 0,
        value: 0
      };
    }
    acc[key].items++;
    acc[key].quantity += item.current_stock || 0;
    acc[key].value += item.total_value || 0;
    return acc;
  }, {} as Record<string, { name: string; items: number; quantity: number; value: number }>);

  const locationSummary = Object.values(stockByLocation);

  // Función para formatear valores grandes con sufijos (K, M, B)
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toLocaleString('es-CO')}`;
    }
  };

  const formatMovementDate = (dateString?: string): string => {
    if (!dateString) {
      return 'Sin registro';
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Debug
  console.log('📊 Estadísticas:', {
    totalItems,
    totalQuantity,
    totalValue,
    lowStockItems,
    outOfStockItems,
    overstockItems,
    locationSummary
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
                <p className="text-sm text-gray-600">Control de stock y movimientos</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ir al inicio"
            >
              <Home className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Botones de acción principales */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => openMovementModal(null, 'ENTRY')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Nueva Entrada
            </button>
            <button
              onClick={() => openMovementModal(null, 'EXIT')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <TrendingDown className="w-4 h-4" />
              Nueva Salida
            </button>
            <button
              onClick={() => openMovementModal(null, 'ADJUSTMENT')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
              Ajuste de Stock
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadInventoryItems}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Estadísticas mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {/* Total Items */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Cantidad Total */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Unidades</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalQuantity.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Valor Total - Formato mejorado */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Valor Total</p>
                <div className="mt-1">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatLargeNumber(totalValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5" title={`$${totalValue.toLocaleString('es-CO')}`}>
                    ${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          {/* Stock Bajo */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{lowStockItems}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
          
          {/* Sin Stock */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockItems}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Sobre Stock */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Sobre Stock</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{overstockItems}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen por Ubicación - Siempre visible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumen por Ubicación
          </h3>
          {locationSummary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationSummary.map((location, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-3 text-base">{location.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold text-gray-900">{location.items}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Unidades:</span>
                      <span className="font-semibold text-gray-900">{location.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Valor:</span>
                      <div className="text-right">
                        <span className="font-bold text-purple-600 text-base">
                          {formatLargeNumber(location.value)}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ${location.value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay items en el inventario aún</p>
              <p className="text-sm text-gray-400 mt-1">Usa el botón "Nueva Entrada" para agregar stock</p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar producto
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o código de barras..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Ubicación
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.code}>{loc.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Cargando inventario...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron items en el inventario
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const isLowStock = item.current_stock <= (item.minimum_stock || 0);
                    const isOutOfStock = item.current_stock === 0;
                    const locationBadges = [
                      { label: 'Pasillo', value: item.aisle },
                      { label: 'Estante', value: item.shelf },
                      { label: 'Posición', value: item.bin }
                    ].filter(detail => Boolean(detail.value));
                    const hasLocationDetail = locationBadges.length > 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product_code || 'Sin código'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {item.warehouse_name}
                            </span>
                            {hasLocationDetail ? (
                              locationBadges.map(({ label, value }) => (
                                <span
                                  key={label}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {label}: {value}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                                Sin detalle de ubicación
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Último movimiento: <span className="font-medium text-gray-700">{formatMovementDate(item.last_movement_date)}</span>
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            isOutOfStock ? 'text-red-600' : 
                            isLowStock ? 'text-orange-600' : 
                            'text-green-600'
                          }`}>
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.minimum_stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              Sin Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openMovementModal(item)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Registrar movimiento"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Ajustar stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 0 && (
            <div className="flex flex-col gap-4 px-6 py-4 border-t border-gray-200 bg-white md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Mostrar</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[15, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>por página</span>
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:gap-4">
                <span>
                  Mostrando {showingFrom}-{showingTo} de {filteredItems.length} productos
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                    disabled={tablePage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {filteredItems.length === 0 ? 0 : tablePage} de {filteredItems.length === 0 ? 0 : totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={tablePage >= totalPages || filteredItems.length === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajustar Stock */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Ajustar Stock</h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-6">
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Producto:</p>
                <p className="font-bold text-gray-900">{selectedItem.product_name}</p>
                <p className="text-sm text-gray-600 mt-2">Stock actual:</p>
                <p className="font-bold text-blue-600 text-2xl">{selectedItem.current_stock}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a ajustar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 10 (positivo) o -5 (negativo)"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Usa números positivos para aumentar, negativos para disminuir
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Razón del ajuste..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Ajustando...' : 'Ajustar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento Mejorado */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {movementData.movement_type === 'ENTRY' ? '📥 Nueva Entrada' : 
                   movementData.movement_type === 'EXIT' ? '📤 Nueva Salida' : 
                   '⚙️ Ajuste de Stock'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedItem ? selectedItem.product_name : 'Selecciona un producto y bodega'}
                </p>
              </div>
              <button
                onClick={handleCloseMovementModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="p-6 space-y-6">
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{errors.general}</p>
                </div>
              )}

              {selectedItem ? (
                /* Si hay item seleccionado, mostrar info */
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Producto:</p>
                  <p className="font-bold text-gray-900">{selectedItem.product_name}</p>
                  <p className="text-xs text-gray-500">{selectedItem.product_code}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Ubicación:</p>
                    <p className="font-medium text-gray-900">{selectedItem.warehouse_name}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Stock actual:</p>
                    <p className="font-bold text-blue-600 text-2xl">{selectedItem.current_stock}</p>
                  </div>
                </div>
              ) : (
                /* Si NO hay item, permitir selección de TODOS los productos */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProductCode}
                      onChange={(e) => setSelectedProductCode(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.product ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar producto...</option>
                      {allProducts.map(product => (
                        <option key={product.bar_code} value={product.bar_code}>
                          {product.name} (Código: {product.bar_code})
                        </option>
                      ))}
                    </select>
                    {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bodega/Ubicación <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedWarehouseCode}
                      onChange={(e) => setSelectedWarehouseCode(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.warehouse ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar bodega...</option>
                      {locations.map(location => (
                        <option key={location.code} value={location.code}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    {errors.warehouse && <p className="text-red-500 text-xs mt-1">{errors.warehouse}</p>}
                  </div>

                  {/* Mostrar stock actual si existe */}
                  {selectedProductCode && selectedWarehouseCode && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Stock actual en esta ubicación: </span>
                        {(() => {
                          const existingItem = inventoryItems.find(
                            i => i.product_code === selectedProductCode && i.warehouse_code === selectedWarehouseCode
                          );
                          return existingItem ? `${existingItem.current_stock} unidades` : '0 unidades (Nueva ubicación)';
                        })()}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Detalles de ubicación
                    {movementData.movement_type === 'ENTRY' && (
                      <span className="text-red-500"> *</span>
                    )}
                  </p>
                  {movementData.movement_type === 'ENTRY' && (
                    <span className="text-xs text-gray-500">
                      Requerido para entradas de inventario
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Pasillo
                    </label>
                    <input
                      type="text"
                      value={movementLocation.aisle}
                      onChange={(e) =>
                        setMovementLocation((prev) => ({ ...prev, aisle: e.target.value }))
                      }
                      placeholder="Ej: A1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.aisle ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.aisle && <p className="text-red-500 text-xs mt-1">{errors.aisle}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Estante
                    </label>
                    <input
                      type="text"
                      value={movementLocation.shelf}
                      onChange={(e) =>
                        setMovementLocation((prev) => ({ ...prev, shelf: e.target.value }))
                      }
                      placeholder="Ej: Nivel 3"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.shelf ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.shelf && <p className="text-red-500 text-xs mt-1">{errors.shelf}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Posición
                    </label>
                    <input
                      type="text"
                      value={movementLocation.bin}
                      onChange={(e) =>
                        setMovementLocation((prev) => ({ ...prev, bin: e.target.value }))
                      }
                      placeholder="Ej: B-07"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.bin ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.bin && <p className="text-red-500 text-xs mt-1">{errors.bin}</p>}
                  </div>
                </div>
                {currentMovementItem && (
                  <p className="text-xs text-gray-500 mt-2">
                    Ubicación actual registrada: {[
                      currentMovementItem.aisle,
                      currentMovementItem.shelf,
                      currentMovementItem.bin
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sin detalles'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento <span className="text-red-500">*</span>
                </label>
                <select
                  value={movementData.movement_type}
                  onChange={(e) => setMovementData({ ...movementData, movement_type: e.target.value as MovementType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ENTRY">📥 Entrada (Agregar stock)</option>
                  <option value="EXIT">📤 Salida (Retirar stock)</option>
                  <option value="ADJUSTMENT">⚙️ Ajuste (Corrección)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Cantidad del movimiento"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                
                {/* Mostrar stock resultante - funciona para items existentes y nuevos */}
                {movementData.quantity > 0 && (selectedItem || (selectedProductCode && selectedWarehouseCode)) && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Stock resultante: </span>
                      {(() => {
                        const currentStock = selectedItem 
                          ? selectedItem.current_stock 
                          : inventoryItems.find(i => i.product_code === selectedProductCode && i.warehouse_code === selectedWarehouseCode)?.current_stock || 0;
                        
                        if (movementData.movement_type === 'ENTRY') {
                          return currentStock + movementData.quantity;
                        } else if (movementData.movement_type === 'EXIT') {
                          return currentStock - movementData.quantity;
                        } else {
                          return movementData.quantity;
                        }
                      })()} unidades
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={movementData.notes}
                  onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del movimiento, razón del ajuste, etc..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseMovementModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (!selectedItem && (!selectedProductCode || !selectedWarehouseCode))}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
                    movementData.movement_type === 'ENTRY' ? 'bg-green-600 hover:bg-green-700' :
                    movementData.movement_type === 'EXIT' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Registrando...' : `Registrar ${
                    movementData.movement_type === 'ENTRY' ? 'Entrada' :
                    movementData.movement_type === 'EXIT' ? 'Salida' : 'Ajuste'
                  }`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
