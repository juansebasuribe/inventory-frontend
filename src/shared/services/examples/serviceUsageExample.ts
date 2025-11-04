// src/shared/services/examples/serviceUsageExample.ts

/**
 * GUÍA DE USO - ARQUITECTURA DE SERVICIOS TITA INVENTORY
 * =====================================================
 * 
 * Esta guía muestra cómo usar la arquitectura de servicios implementada
 * con patrones de Clean Code y principios SOLID.
 */

import { services, repositories } from '../index';
import type { CreateUserDto, CreateProductDto } from '../repositories';

// ========================
// 1. EJEMPLOS DE AUTENTICACIÓN
// ========================

/**
 * Ejemplo: Login de usuario
 */
export async function loginExample() {
  try {
    const tokens = await services.login('admin@tita.com', 'password123');
    console.log('Login exitoso:', tokens);
    
    // Verificar autenticación
    if (services.isAuthenticated()) {
      console.log('Usuario autenticado correctamente');
    }
  } catch (error) {
    console.error('Error en login:', error);
  }
}

/**
 * Ejemplo: Obtener usuario actual
 */
export async function getCurrentUserExample() {
  try {
    if (services.isAuthenticated()) {
      const currentUser = await services.getCurrentUser();
      console.log('Usuario actual:', currentUser);
      return currentUser;
    } else {
      console.log('Usuario no autenticado');
    }
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
  }
}

/**
 * Ejemplo: Logout
 */
export async function logoutExample() {
  try {
    await services.logout();
    console.log('Logout exitoso');
  } catch (error) {
    console.error('Error en logout:', error);
  }
}

// ========================
// 2. EJEMPLOS DE GESTIÓN DE USUARIOS
// ========================

/**
 * Ejemplo: Crear nuevo usuario
 */
export async function createUserExample() {
  try {
    const newUserData: CreateUserDto = {
      username: 'empleado_tita',
      email: 'empleado@tita.com',
      first_name: 'Juan',
      last_name: 'Pérez',
      phone_number: '3001234567',
      password: 'password123',
      role: 'seller',
      is_active: true
    };

    const newUser = await repositories.user.create(newUserData);
    console.log('Usuario creado:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error creando usuario:', error);
  }
}

/**
 * Ejemplo: Buscar usuarios por rol
 */
export async function getUsersByRoleExample() {
  try {
    const sellers = await repositories.user.getUsersByRole('seller');
    console.log('Vendedores encontrados:', sellers);
    return sellers;
  } catch (error) {
    console.error('Error buscando vendedores:', error);
  }
}

/**
 * Ejemplo: Buscar usuario por email
 */
export async function findUserByEmailExample(email: string) {
  try {
    const user = await repositories.user.findByEmail(email);
    if (user) {
      console.log('Usuario encontrado:', user);
    } else {
      console.log('Usuario no encontrado');
    }
    return user;
  } catch (error) {
    console.error('Error buscando usuario:', error);
  }
}

/**
 * Ejemplo: Cambiar contraseña
 */
export async function changePasswordExample(userId: number) {
  try {
    await repositories.user.changePassword(userId, {
      current_password: 'password123',
      new_password: 'newPassword456',
      confirm_password: 'newPassword456'
    });
    console.log('Contraseña cambiada exitosamente');
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
  }
}

// ========================
// 3. EJEMPLOS DE GESTIÓN DE PRODUCTOS
// ========================

/**
 * Ejemplo: Crear nuevo producto
 */
export async function createProductExample() {
  try {
    const newProductData: CreateProductDto = {
      name: 'Laptop Dell Inspiron',
      description: 'Laptop Dell Inspiron 15 3000 series',
      sku: 'DELL-INS-15-3000',
      barcode: '1234567890123',
      category_id: 1,
      provider_id: 1,
      price: 2500000,
      cost: 2000000,
      tax_rate: 19,
      weight: 2.5,
      dimensions: '35.8 x 24.7 x 2.3 cm',
      status: 'active',
      is_active: true
    };

    const newProduct = await repositories.product.create(newProductData);
    console.log('Producto creado:', newProduct);
    return newProduct;
  } catch (error) {
    console.error('Error creando producto:', error);
  }
}

/**
 * Ejemplo: Buscar productos por categoría
 */
export async function getProductsByCategoryExample(categoryId: number) {
  try {
    const products = await repositories.product.getProductsByCategory(categoryId);
    console.log(`Productos de categoría ${categoryId}:`, products);
    return products;
  } catch (error) {
    console.error('Error buscando productos por categoría:', error);
  }
}

/**
 * Ejemplo: Buscar producto por SKU
 */
export async function findProductBySkuExample(sku: string) {
  try {
    const product = await repositories.product.findBySku(sku);
    if (product) {
      console.log('Producto encontrado:', product);
    } else {
      console.log('Producto no encontrado');
    }
    return product;
  } catch (error) {
    console.error('Error buscando producto por SKU:', error);
  }
}

/**
 * Ejemplo: Actualizar precio de producto
 */
export async function updateProductPriceExample(productId: number) {
  try {
    const updatedProduct = await repositories.product.updatePrice(
      productId,
      2800000, // nuevo precio
      2200000  // nuevo costo
    );
    console.log('Precio actualizado:', updatedProduct);
    return updatedProduct;
  } catch (error) {
    console.error('Error actualizando precio:', error);
  }
}

/**
 * Ejemplo: Búsqueda de productos
 */
export async function searchProductsExample(query: string) {
  try {
    const results = await repositories.product.searchProducts(query, {
      is_active: true,
      status: 'active'
    });
    console.log('Resultados de búsqueda:', results);
    return results;
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
  }
}

/**
 * Ejemplo: Obtener productos más vendidos
 */
export async function getTopSellingProductsExample() {
  try {
    const topProducts = await repositories.product.getTopSellingProducts(10);
    console.log('Top 10 productos más vendidos:', topProducts);
    return topProducts;
  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
  }
}

/**
 * Ejemplo: Productos con stock bajo
 */
export async function getLowStockProductsExample() {
  try {
    const lowStockProducts = await repositories.product.getLowStockProducts();
    console.log('Productos con stock bajo:', lowStockProducts);
    return lowStockProducts;
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
  }
}

// ========================
// 4. EJEMPLOS DE OPERACIONES AVANZADAS
// ========================

/**
 * Ejemplo: Operaciones en lote (bulk)
 */
export async function bulkOperationsExample() {
  try {
    // Crear múltiples usuarios
    const usersToCreate: CreateUserDto[] = [
      {
        username: 'usuario1',
        email: 'usuario1@tita.com',
        first_name: 'Usuario',
        last_name: 'Uno',
        phone_number: '3001111111',
        password: 'password123',
        role: 'seller'
      },
      {
        username: 'usuario2',
        email: 'usuario2@tita.com',
        first_name: 'Usuario',
        last_name: 'Dos',
        phone_number: '3002222222',
        password: 'password123',
        role: 'operator'
      }
    ];

    const createdUsers = await repositories.user.bulkCreate(usersToCreate);
    console.log('Usuarios creados en lote:', createdUsers);

    // Actualizar precios en lote
    const priceUpdates = {
      products: [
        { id: 1, price: 2500000, cost: 2000000 },
        { id: 2, price: 1800000, cost: 1400000 }
      ]
    };

    const updatedProducts = await repositories.product.bulkUpdatePrices(priceUpdates);
    console.log('Precios actualizados en lote:', updatedProducts);

  } catch (error) {
    console.error('Error en operaciones en lote:', error);
  }
}

/**
 * Ejemplo: Paginación y filtros avanzados
 */
export async function advancedFiltersExample() {
  try {
    // Búsqueda de usuarios con filtros y paginación
    const userResults = await repositories.user.findAll({
      filter: {
        role: 'seller',
        is_active: true
      },
      sort: {
        field: 'first_name',
        order: 'asc'
      },
      pagination: {
        page: 1,
        pageSize: 10
      },
      include: ['profile']
    });

    console.log('Usuarios filtrados:', userResults);

    // Productos por rango de precios
    const expensiveProducts = await repositories.product.getProductsByPriceRange(
      1000000, // precio mínimo
      5000000  // precio máximo
    );

    console.log('Productos en rango de precio:', expensiveProducts);

  } catch (error) {
    console.error('Error en filtros avanzados:', error);
  }
}

/**
 * Ejemplo: Estadísticas y reportes
 */
export async function statisticsExample() {
  try {
    const productStats = await repositories.product.getProductStats();
    console.log('Estadísticas de productos:', productStats);

    const userCount = await repositories.user.count({
      is_active: true
    });
    console.log('Total de usuarios activos:', userCount);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
  }
}

// ========================
// 5. DEMOSTRACIÓN COMPLETA
// ========================

/**
 * Función principal de demostración
 */
export async function runCompleteDemo() {
  console.log('=== DEMOSTRACIÓN COMPLETA DE SERVICIOS TITA ===\n');

  // 1. Autenticación
  console.log('1. AUTENTICACIÓN');
  await loginExample();
  await getCurrentUserExample();
  console.log('');

  // 2. Gestión de usuarios
  console.log('2. GESTIÓN DE USUARIOS');
  await createUserExample();
  await getUsersByRoleExample();
  await findUserByEmailExample('empleado@tita.com');
  console.log('');

  // 3. Gestión de productos
  console.log('3. GESTIÓN DE PRODUCTOS');
  await createProductExample();
  await getProductsByCategoryExample(1);
  await findProductBySkuExample('DELL-INS-15-3000');
  await updateProductPriceExample(1);
  console.log('');

  // 4. Búsquedas y filtros
  console.log('4. BÚSQUEDAS Y FILTROS');
  await searchProductsExample('laptop');
  await getTopSellingProductsExample();
  await getLowStockProductsExample();
  console.log('');

  // 5. Operaciones avanzadas
  console.log('5. OPERACIONES AVANZADAS');
  await bulkOperationsExample();
  await advancedFiltersExample();
  await statisticsExample();
  console.log('');

  // 6. Logout
  console.log('6. FINALIZACIÓN');
  await logoutExample();
  
  console.log('=== DEMOSTRACIÓN COMPLETADA ===');
}

// ========================
// EXPORT PARA USO EXTERNO
// ========================
export default {
  // Autenticación
  loginExample,
  getCurrentUserExample,
  logoutExample,
  
  // Usuarios
  createUserExample,
  getUsersByRoleExample,
  findUserByEmailExample,
  changePasswordExample,
  
  // Productos
  createProductExample,
  getProductsByCategoryExample,
  findProductBySkuExample,
  updateProductPriceExample,
  searchProductsExample,
  getTopSellingProductsExample,
  getLowStockProductsExample,
  
  // Avanzado
  bulkOperationsExample,
  advancedFiltersExample,
  statisticsExample,
  
  // Demo completa
  runCompleteDemo
};