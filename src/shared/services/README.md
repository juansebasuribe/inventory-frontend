# 📋 Arquitectura de Servicios - COMERCIALIZADORA TITA

## 🎯 **Fase 4 Completada: Service Layer Architecture**

Esta documentación describe la arquitectura de servicios implementada siguiendo principios de **Clean Code** y **Clean Architecture** para el sistema de inventario de COMERCIALIZADORA TITA.

---

## 🏗️ **Arquitectura General**

### **Capas de la Aplicación**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│                   (React Components)                        │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                        │
│                     (Services)                              │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                            │
│                  (Repositories)                             │
├─────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                       │
│                   (API Client)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 **Estructura de Archivos**

```
src/shared/services/
├── api/
│   └── apiClient.ts                 # Cliente HTTP base
├── repositories/
│   ├── baseRepository.ts            # Repository patrón base
│   ├── userRepository.ts            # Gestión de usuarios
│   ├── productRepository.ts         # Gestión de productos
│   └── index.ts                     # Exportaciones centralizadas
├── examples/
│   └── serviceUsageExample.ts       # Guía de uso práctica
└── index.ts                         # Servicio principal
```

---

## 🔧 **Componentes Principales**

### **1. API Client (Infrastructure Layer)**

**Archivo:** `src/shared/services/api/apiClient.ts`

**Responsabilidades:**

- Configuración base de Axios
- Manejo centralizado de errores
- Interceptores para autenticación automática
- Retry automático para errores de red
- Gestión de tokens JWT

**Características:**

```typescript
// Singleton pattern
export const apiClient = new ApiClient({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Métodos disponibles
apiClient.get<T>(url, config?)
apiClient.post<T>(url, data?, config?)
apiClient.put<T>(url, data?, config?)
apiClient.patch<T>(url, data?, config?)
apiClient.delete<T>(url, config?)
```

### **2. Base Repository (Domain Layer)**

**Archivo:** `src/shared/services/repositories/baseRepository.ts`

**Responsabilidades:**

- Implementación del patrón Repository
- Operaciones CRUD genéricas
- Query builder para filtros y paginación
- Operaciones en lote (bulk operations)
- Validaciones básicas

**Características:**

```typescript
// Operaciones CRUD
findAll(params?)     // Listar con filtros/paginación
findById(id)         // Obtener por ID
create(data)         // Crear nuevo
update(id, data)     // Actualizar existente
delete(id)           // Eliminar

// Operaciones en lote
bulkCreate(data[])   // Crear múltiples
bulkUpdate(updates[]) // Actualizar múltiples
bulkDelete(ids[])    // Eliminar múltiples

// Búsqueda y filtros
search(query, params?) // Búsqueda de texto
count(filter?)        // Contar registros
exists(id)           // Verificar existencia
```

### **3. User Repository**

**Archivo:** `src/shared/services/repositories/userRepository.ts`

**Funcionalidades:**

- Autenticación (login/logout/refresh)
- Gestión de contraseñas
- Perfil de usuario
- Roles y permisos
- Búsquedas avanzadas

### **4. Product Repository**

**Archivo:** `src/shared/services/repositories/productRepository.ts`

**Funcionalidades:**

- Gestión de productos y SKUs
- Control de precios y costos
- Filtros por categoría y proveedor
- Gestión de inventario
- Estadísticas de productos

---

## 🚀 **Uso Básico**

### **Importación**

```typescript
import { services, repositories } from "@/shared/services";
```

### **Autenticación**

```typescript
// Login
const tokens = await services.login("admin@tita.com", "password");

// Obtener usuario actual
const user = await services.getCurrentUser();

// Verificar autenticación
if (services.isAuthenticated()) {
  // Usuario autenticado
}

// Logout
await services.logout();
```

### **Gestión de Usuarios**

```typescript
// Crear usuario
const newUser = await repositories.user.create({
  email: "empleado@tita.com",
  first_name: "Juan",
  last_name: "Pérez",
  password: "password123",
  role: "employee",
});

// Buscar por email
const user = await repositories.user.findByEmail("empleado@tita.com");

// Listar por rol
const employees = await repositories.user.getUsersByRole("employee");
```

### **Gestión de Productos**

```typescript
// Crear producto
const product = await repositories.product.create({
  name: "Laptop Dell",
  sku: "DELL-001",
  price: 2500000,
  category_id: 1,
  provider_id: 1,
  status: "active",
});

// Buscar por SKU
const product = await repositories.product.findBySku("DELL-001");

// Actualizar precio
await repositories.product.updatePrice(1, 2800000, 2200000);
```

---

## 🔍 **Funcionalidades Avanzadas**

### **Filtros y Paginación**

```typescript
const results = await repositories.user.findAll({
  filter: {
    role: "employee",
    is_active: true,
  },
  sort: {
    field: "first_name",
    order: "asc",
  },
  pagination: {
    page: 1,
    pageSize: 10,
  },
  include: ["profile"],
});
```

### **Búsquedas**

```typescript
const searchResults = await repositories.product.searchProducts("laptop", {
  category_id: 1,
  is_active: true,
  price_min: 1000000,
  price_max: 5000000,
});
```

### **Operaciones en Lote**

```typescript
// Crear múltiples productos
const products = await repositories.product.bulkCreate([
  { name: 'Producto 1', sku: 'SKU-001', ... },
  { name: 'Producto 2', sku: 'SKU-002', ... }
]);

// Actualizar precios masivamente
await repositories.product.bulkUpdatePrices({
  products: [
    { id: 1, price: 2500000 },
    { id: 2, price: 1800000 }
  ]
});
```

---

## 🛡️ **Manejo de Errores**

### **Tipos de Errores**

```typescript
try {
  await repositories.user.create(userData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Error de validación (400)
    console.log(error.details);
  } else if (error instanceof AuthenticationError) {
    // Error de autenticación (401)
    services.clearAuthTokens();
  } else if (error instanceof NetworkError) {
    // Error de red
    showNetworkErrorMessage();
  }
}
```

### **Códigos de Error**

- `VALIDATION_ERROR` (400): Datos inválidos
- `AUTH_ERROR` (401): Autenticación requerida
- `FORBIDDEN` (403): Acceso denegado
- `NOT_FOUND` (404): Recurso no encontrado
- `SERVER_ERROR` (500): Error interno del servidor
- `NETWORK_ERROR`: Error de conectividad

---

## 🎮 **Ejemplo Práctico Completo**

Revisa el archivo `src/shared/services/examples/serviceUsageExample.ts` para ver ejemplos detallados de:

1. **Autenticación completa**
2. **CRUD de usuarios y productos**
3. **Búsquedas y filtros avanzados**
4. **Operaciones en lote**
5. **Manejo de errores**
6. **Estadísticas y reportes**

---

## 📊 **Métricas y Monitoreo**

### **Performance**

- Timeouts configurables por request
- Retry automático para errores de red
- Logging de tiempos de respuesta en desarrollo
- Cacheo opcional por endpoint

### **Seguridad**

- Tokens JWT automáticos en headers
- Refresh automático de tokens expirados
- Limpieza automática de tokens en logout
- Validación de permisos por endpoint

---

## 🔄 **Próximos Pasos**

### **Fase 5: State Management**

- [ ] Integración con Zustand
- [ ] Stores por dominio
- [ ] React Query para cache
- [ ] Optimistic updates

### **Fase 6: UI Integration**

- [ ] Hooks personalizados
- [ ] Componentes conectados
- [ ] Formularios con validación
- [ ] Tablas con paginación

---

## 📚 **Principios Aplicados**

✅ **Single Responsibility**: Cada clase tiene una responsabilidad específica  
✅ **Open/Closed**: Extensible sin modificar código existente  
✅ **Liskov Substitution**: Implementaciones intercambiables  
✅ **Interface Segregation**: Interfaces específicas y pequeñas  
✅ **Dependency Inversion**: Dependencias a través de abstracciones

✅ **DRY**: No repetición de código  
✅ **KISS**: Soluciones simples y claras  
✅ **YAGNI**: Solo lo que se necesita ahora  
✅ **Repository Pattern**: Abstracción de acceso a datos  
✅ **Singleton Pattern**: Instancias únicas compartidas

---

**🎉 ARQUITECTURA DE SERVICIOS COMPLETADA**

_Sistema robusto, escalable y mantenible para COMERCIALIZADORA TITA_
