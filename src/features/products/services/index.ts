// src/features/products/services/index.ts

/**
 * Exportación unificada de todos los servicios de productos
 * FASE 7.2.2 - Servicios completados y validados
 */

export { productService } from './productService';
export { imageService } from './imageService';
export { categoryService } from './categoryService';
export { providerService } from './providerService';
export { inventoryService } from './inventoryService';
export { cartService } from './cartService';
export { orderService } from './orderService';

// Agregar comentarios de estado para tracking
/*
SERVICIOS COMPLETADOS ✅:
- ProductService: CRUD de productos, búsqueda, estadísticas
- ImageService: Gestión de imágenes, validación, upload
- CategoryService: CRUD de categorías, árbol jerárquico, estadísticas
- ProviderService: CRUD de proveedores, ratings, filtros geográficos
- InventoryService: Gestión de stock, movimientos, alertas
- CartService: Carrito de compras, validación, descuentos
- OrderService: Procesamiento de órdenes, tracking, facturación

FASE 7.2.2 COMPLETADA ✅
Todos los servicios backend han sido implementados y están listos para integración con UI.
*/