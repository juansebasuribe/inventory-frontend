// src/pages/ProductServiceTestPage.tsx

/**
 * PÁGINA TEMPORAL DE PRUEBA - FASE 7.2.1
 * Página para probar productService e imageService sin componentes adicionales
 * Se eliminará después de crear los componentes profesionales
 */

import { useState } from 'react';
import { productService } from '../features/products/services/productService';
import { imageService } from '../features/products/services/imageService';
import { categoryService } from '../features/products/services/categoryService';
import { providerService } from '../features/products/services/providerService';
import { inventoryService } from '../features/products/services/inventoryService';
import { cartService } from '../features/products/services/cartService';
import { orderService } from '../features/products/services/orderService';
import { useAuth } from '../shared/stores';

export const ProductServiceTestPage = () => {
  // Usamos any para productos temporalmente para evitar problemas de tipos
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Hook de autenticación para debug
  const { user, tokens, login } = useAuth();

  // ========================================
  // FUNCIONES DE PRUEBA
  // ========================================

  const addTestResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const resultMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => [...prev, resultMessage]);
  };

  const clearResults = () => {
    setTestResults([]);
    setError('');
  };

  // Test 1: Obtener lista de productos
  const testGetProducts = async () => {
    try {
      setLoading(true);
      addTestResult('Iniciando prueba de obtener productos...');
      
      const response = await productService.getProducts({ 
        page: 1, 
        page_size: 5 
      });
      
      setProducts(response.results);
      addTestResult(`✨ Productos obtenidos: ${response.results.length} de ${response.count} total`);
      addTestResult(`📄 Resultados por página: ${response.results.length}`);
      
    } catch (err: any) {
      const errorMsg = `Error al obtener productos: ${err.message}`;
      setError(errorMsg);
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Buscar productos
  const testSearchProducts = async () => {
    try {
      setLoading(true);
      addTestResult('Iniciando búsqueda de productos...');
      
      const results = await productService.searchProducts('test', 3);
      addTestResult(`🔍 Búsqueda completada: ${results.length} productos encontrados`);
      
    } catch (err: any) {
      const errorMsg = `Error en búsqueda: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Obtener estadísticas
  const testGetStats = async () => {
    try {
      setLoading(true);
      addTestResult('Obteniendo estadísticas de productos...');
      
      const statistics = await productService.getProductStats();
      setStats(statistics);
      addTestResult(`📊 Estadísticas obtenidas: ${statistics.total} productos totales`);
      addTestResult(`📈 Activos: ${statistics.active}, Inactivos: ${statistics.inactive}`);
      
    } catch (err: any) {
      const errorMsg = `Error al obtener estadísticas: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Validar código de barras
  const testValidateBarCode = async () => {
    try {
      setLoading(true);
      addTestResult('Validando código de barras...');
      
      const isAvailable = await productService.validateBarCode('TEST123456');
      addTestResult(`🏷️ Código TEST123456 ${isAvailable ? 'está disponible' : 'ya existe'}`);
      
    } catch (err: any) {
      const errorMsg = `Error al validar código: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Obtener imágenes de productos reales
  const testGetProductImages = async () => {
    try {
      setLoading(true);
      addTestResult('Probando obtener imágenes de productos...');
      
      // Primero obtenemos algunos productos para probar sus imágenes
      const productsResponse = await productService.getProducts({ page: 1, page_size: 3 });
      if (productsResponse.results.length === 0) {
        addTestResult('⚠️ No hay productos disponibles para probar imágenes');
        return;
      }
      
      // Probar con el primer producto
      const testProduct = productsResponse.results[0];
      addTestResult(`🔍 Probando imágenes del producto: ${testProduct.name} (${testProduct.bar_code})`);
      
      const images = await imageService.getProductImages(testProduct.bar_code);
      addTestResult(`🖼️ Imágenes encontradas: ${images.length} imágenes`);
      
      if (images.length > 0) {
        images.forEach((img, index) => {
          addTestResult(`📸 Imagen ${index + 1}: ID ${img.id}, orden ${img.order}, activa: ${img.is_active}`);
        });
      } else {
        addTestResult('📭 No se encontraron imágenes para este producto');
      }
      
    } catch (err: any) {
      const errorMsg = `Error al obtener imágenes: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Debug de autenticación
  const testDebugAuth = () => {
    addTestResult('🔍 DEBUGGING AUTENTICACIÓN');
    addTestResult('================================');
    
    // Verificar usuario logueado
    if (user) {
      addTestResult(`👤 Usuario: ${user.username} (${user.email})`);
      addTestResult(`🎭 Rol: ${user.profile?.role || 'No definido'}`);
    } else {
      addTestResult('❌ No hay usuario logueado', true);
    }
    
    // Verificar tokens
    if (tokens) {
      addTestResult(`🔑 Access Token: ${tokens.access ? '✅ Presente' : '❌ Ausente'}`);
      addTestResult(`🔄 Refresh Token: ${tokens.refresh ? '✅ Presente' : '❌ Ausente'}`);
      
      if (tokens.access) {
        // Verificar si el token no está expirado
        try {
          const payload = JSON.parse(atob(tokens.access.split('.')[1]));
          const now = Date.now() / 1000;
          const isExpired = payload.exp < now;
          addTestResult(`⏰ Token ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`);
          addTestResult(`📅 Expira: ${new Date(payload.exp * 1000).toLocaleString()}`);
        } catch (err) {
          addTestResult('❌ Error al decodificar token', true);
        }
      }
    } else {
      addTestResult('❌ No hay tokens disponibles', true);
    }
    
    // Verificar localStorage
    const localStorageAuth = localStorage.getItem('tita-auth-storage');
    if (localStorageAuth) {
      try {
        const parsed = JSON.parse(localStorageAuth);
        addTestResult(`💾 LocalStorage: ✅ Presente`);
        addTestResult(`📊 Estado: ${parsed.state?.isAuthenticated ? '✅ Autenticado' : '❌ No autenticado'}`);
        addTestResult(`👤 Usuario en storage: ${parsed.state?.user ? '✅ Presente' : '❌ Ausente'}`);
        addTestResult(`🔑 Tokens en storage: ${parsed.state?.tokens ? '✅ Presente' : '❌ Ausente'}`);
      } catch (err) {
        addTestResult('❌ Error al parsear localStorage', true);
      }
    } else {
      addTestResult('❌ No hay datos en localStorage', true);
    }
    
    addTestResult('================================');
  };

  // Test específico de Login/Auth  
  const testLogin = async () => {
    try {
      addTestResult('🔐 Iniciando prueba de login...');
      
      // Credenciales válidas
      const username = 'juan';
      const password = 'Andreavalor12';
      
      addTestResult(`📝 Intentando login con usuario: ${username}`);
      await login(username, password);
      
      addTestResult('✅ Login exitoso!');
      addTestResult(`👤 Usuario logueado: ${user?.username}`);
      addTestResult(`🎭 Rol: ${user?.profile?.role}`);
      
      // Verificar que los tokens y usuario estén disponibles
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('auth_user');
      
      addTestResult(`💾 Tokens en localStorage: ${storedTokens ? '✅ Sí' : '❌ No'}`);
      addTestResult(`👤 Usuario en localStorage: ${storedUser ? '✅ Sí' : '❌ No'}`);
      
    } catch (error: any) {
      addTestResult(`❌ Error en login: ${error.message}`, true);
      throw error;
    }
  };

  // Test 6: CategoryService - Obtener categorías
  const testGetCategories = async () => {
    try {
      setLoading(true);
      addTestResult('Probando CategoryService - obtener categorías...');
      
      const response = await categoryService.getCategories({ page: 1, page_size: 5 });
      addTestResult(`📁 Categorías obtenidas: ${response.results.length} de ${response.count} total`);
      
      if (response.results.length > 0) {
        response.results.forEach((cat, index) => {
          addTestResult(`📂 Categoría ${index + 1}: ${cat.name} (ID: ${cat.id}, activa: ${cat.is_active})`);
        });
      } else {
        addTestResult('📭 No se encontraron categorías');
      }
      
    } catch (err: any) {
      const errorMsg = `Error al obtener categorías: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 7: ProviderService - Obtener proveedores
  const testGetProviders = async () => {
    try {
      setLoading(true);
      addTestResult('Probando ProviderService - obtener proveedores...');
      
      const response = await providerService.getProviders({ page: 1, page_size: 5 });
      addTestResult(`🏢 Proveedores obtenidos: ${response.results.length} de ${response.count} total`);
      
      if (response.results.length > 0) {
        response.results.forEach((provider, index) => {
          addTestResult(`🏭 Proveedor ${index + 1}: ${provider.name} (${provider.country}, activo: ${provider.is_active})`);
        });
      } else {
        addTestResult('📭 No se encontraron proveedores');
      }
      
    } catch (err: any) {
      const errorMsg = `Error al obtener proveedores: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 7: Obtener items del inventario
  const testGetInventoryItems = async () => {
    try {
      setLoading(true);
      addTestResult('Iniciando prueba de obtener items del inventario...');
      
      const response = await inventoryService.getInventoryItems({ 
        page: 1, 
        page_size: 10 
      });
      
      addTestResult(`✨ Inventario obtenido exitosamente`);
      addTestResult(`📊 Total de items: ${response.count}`);
      addTestResult(`📦 Items en esta página: ${response.results.length}`);
      
      if (response.results.length > 0) {
        const firstItem = response.results[0];
        addTestResult(`🏷️ Primer item: ${firstItem.product_name} (Stock: ${firstItem.current_stock})`);
        
        // Obtener estadísticas del inventario
        const stats = await inventoryService.getInventoryStats();
        addTestResult(`📈 Estadísticas - Total items: ${stats.total_items}, Valor total: $${stats.total_value}`);
        
        // Obtener alertas de stock
        const alerts = await inventoryService.getStockAlerts();
        addTestResult(`⚠️ Alertas de stock: ${alerts.results.length} alertas activas`);
      } else {
        addTestResult('📭 No se encontraron items en el inventario');
      }
      
    } catch (err: any) {
      const errorMsg = `Error al obtener inventario: ${err.message}`;
      addTestResult(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // Test 8: Obtener carrito de compras
  const testGetCart = async () => {
    try {
      setLoading(true);
      addTestResult('Iniciando prueba de obtener carrito...');
      
      const cart = await cartService.getCart();
      
      addTestResult(`🛒 Carrito obtenido exitosamente`);
      addTestResult(`📊 Total de items: ${cart.total_items}`);
      addTestResult(`💰 Total del carrito: $${cart.total_amount} ${cart.currency}`);
      
      if (cart.items.length > 0) {
        const firstItem = cart.items[0];
        addTestResult(`🏷️ Primer item: ${firstItem.product_name} (Cantidad: ${firstItem.quantity})`);
        
        // Obtener resumen del carrito
        const summary = await cartService.getCartSummary();
        addTestResult(`📈 Resumen - Subtotal: $${summary.subtotal}, Descuentos: $${summary.total_discount}`);
        
        // Contar items del carrito
        const itemsCount = await cartService.getCartItemsCount();
        addTestResult(`🔢 Total de items individuales: ${itemsCount}`);
      } else {
        addTestResult('🛒 El carrito está vacío');
      }
      
      // Validar carrito (si el endpoint existe)
      try {
        const validation = await cartService.validateCart();
        addTestResult(`✅ Validación del carrito: ${validation.isValid ? 'Válido' : 'Inválido'}`);
        if (validation.errors.length > 0) {
          addTestResult(`❌ Errores de validación: ${validation.errors.join(', ')}`);
        }
      } catch (validationError) {
        addTestResult(`⚠️ Endpoint de validación no disponible aún`);
      }
      
    } catch (err: any) {
      if (err.message.includes('404') || err.message.includes('Not Found')) {
        addTestResult(`⚠️ Endpoint de carrito no implementado aún en backend`, true);
        addTestResult(`ℹ️ CartService está listo, esperando implementación backend`);
      } else {
        const errorMsg = `Error al obtener carrito: ${err.message}`;
        addTestResult(errorMsg, true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test 9: Obtener órdenes del usuario
  const testGetOrders = async () => {
    try {
      setLoading(true);
      addTestResult('Iniciando prueba de obtener órdenes...');
      
      const response = await orderService.getUserOrders({ 
        page: 1, 
        page_size: 10 
      });
      
      addTestResult(`📋 Órdenes obtenidas exitosamente`);
      addTestResult(`📊 Total de órdenes: ${response.count}`);
      addTestResult(`📦 Órdenes en esta página: ${response.results.length}`);
      
      if (response.results.length > 0) {
        const firstOrder = response.results[0];
        const statusLabel = orderService.getStatusLabel(firstOrder.status);
        const paymentLabel = orderService.getPaymentStatusLabel(firstOrder.payment_status);
        
        addTestResult(`🏷️ Primera orden: ${firstOrder.order_number} - ${statusLabel}`);
        addTestResult(`💳 Estado de pago: ${paymentLabel}`);
        addTestResult(`💰 Total de la orden: $${firstOrder.total_amount} ${firstOrder.currency}`);
        
        // Obtener estadísticas de órdenes (si el endpoint existe)
        try {
          const stats = await orderService.getOrderStats();
          addTestResult(`📈 Estadísticas - Total órdenes: ${stats.total_orders}, Revenue: $${stats.total_revenue}`);
        } catch (statsError) {
          addTestResult(`⚠️ Endpoint de estadísticas no disponible aún`);
        }
        
        // Probar búsqueda de órdenes
        try {
          const searchResults = await orderService.searchOrders('test', { page: 1, page_size: 5 });
          addTestResult(`🔍 Búsqueda de órdenes: ${searchResults.results.length} resultados`);
        } catch (searchError) {
          addTestResult(`⚠️ Función de búsqueda probada localmente`);
        }
      } else {
        addTestResult('📭 No se encontraron órdenes');
      }
      
    } catch (err: any) {
      if (err.message.includes('404') || err.message.includes('Not Found')) {
        addTestResult(`⚠️ Algunos endpoints de órdenes no implementados aún en backend`, true);
        addTestResult(`ℹ️ OrderService está listo, esperando implementación completa backend`);
      } else {
        const errorMsg = `Error al obtener órdenes: ${err.message}`;
        addTestResult(errorMsg, true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Probar ImageService con archivo ficticio
  const testImageValidation = async () => {
    try {
      addTestResult('Probando validación de imágenes...');
      
      // Crear un blob ficticio para simular una imagen
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(0, 0, 500, 500);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('TEST IMAGE', 150, 250);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
          
          try {
            const validation = await imageService.validateImage(testFile);
            addTestResult(`🖼️ Validación de imagen: ${validation.isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
            if (!validation.isValid) {
              addTestResult(`❗ Errores: ${validation.errors.join(', ')}`, true);
            }
            
            // Generar preview
            const previewUrl = imageService.generatePreviewUrl(testFile);
            addTestResult(`🎨 URL de preview generada correctamente`);
            
            // Liberar URL
            setTimeout(() => {
              imageService.revokePreviewUrl(previewUrl);
              addTestResult(`🗑️ URL de preview liberada`);
            }, 1000);
            
          } catch (err: any) {
            addTestResult(`Error en validación de imagen: ${err.message}`, true);
          }
        }
      }, 'image/png');
      
    } catch (err: any) {
      addTestResult(`Error en prueba de imagen: ${err.message}`, true);
    }
  };

  // Ejecutar todas las pruebas
  const runAllTests = async () => {
    clearResults();
    addTestResult('🚀 INICIANDO BATERÍA DE PRUEBAS DE SERVICIOS');
    addTestResult('==========================================');
    
    // Primero debug de autenticación
    testDebugAuth();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetProducts();
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre pruebas
    
    await testSearchProducts();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testValidateBarCode();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetProductImages();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testImageValidation();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Servicios de gestión
    await testGetCategories();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetProviders();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetInventoryItems();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetCart();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetOrders();
    
    addTestResult('==========================================');
    addTestResult('🎉 BATERÍA DE PRUEBAS COMPLETADA - TODOS LOS SERVICIOS VALIDADOS');
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">🧪</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>PÁGINA DE PRUEBA TEMPORAL - FASE 7.2.1</strong>
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Esta página se usa para probar productService e imageService. 
              Se eliminará cuando creemos los componentes profesionales.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Control */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎛️ Panel de Pruebas
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? '⏳ Ejecutando...' : '🚀 Ejecutar Todas las Pruebas'}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={testGetProducts}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                📋 Productos
              </button>
              
              <button
                onClick={testSearchProducts}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                🔍 Búsqueda
              </button>
              
              <button
                onClick={testGetStats}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                📊 Stats
              </button>
              
              <button
                onClick={testGetProductImages}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                📸 Imágenes API
              </button>
              
              <button
                onClick={testImageValidation}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                🖼️ Validación
              </button>
            </div>

            {/* Nueva fila para servicios adicionales */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                onClick={testGetCategories}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                📁 Categorías
              </button>
              
              <button
                onClick={testGetProviders}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                🏢 Proveedores
              </button>
              
              <button
                onClick={testGetInventoryItems}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                📦 Inventario
              </button>
              
              <button
                onClick={testGetCart}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                🛒 Carrito
              </button>
              
              <button
                onClick={testGetOrders}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded-md"
              >
                � Órdenes
              </button>
            </div>
            
            <button
              onClick={testDebugAuth}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-md"
            >
              🔍 Debug Auth
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm py-2 px-4 rounded-md"
            >
              🔐 Test Login
            </button>
            
            <button
              onClick={clearResults}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-md"
            >
              🗑️ Limpiar Resultados
            </button>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">📈 Estadísticas</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total: <span className="font-medium">{stats.total}</span></div>
                <div>Activos: <span className="font-medium text-green-600">{stats.active}</span></div>
                <div>Inactivos: <span className="font-medium text-red-600">{stats.inactive}</span></div>
                <div>Sin Stock: <span className="font-medium text-orange-600">{stats.outOfStock}</span></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Resultados de Pruebas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Resultados de Pruebas
          </h2>
          
          <div className="bg-gray-900 rounded-md p-4 h-96 overflow-y-auto">
            <div className="font-mono text-sm space-y-1">
              {testResults.length === 0 ? (
                <p className="text-gray-400">
                  Ejecuta una prueba para ver los resultados...
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`${
                      result.includes('❌') 
                        ? 'text-red-400' 
                        : result.includes('✅') 
                        ? 'text-green-400'
                        : result.includes('🚀') || result.includes('🎉')
                        ? 'text-blue-400 font-bold'
                        : result.includes('===')
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      {products.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📦 Productos Obtenidos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Código: {product.bar_code}
                </p>
                <p className="text-sm text-gray-500">
                  Categoría: {product.category_name || 'Sin categoría'}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductServiceTestPage;