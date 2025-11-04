# Sistema de Protección de Rutas - Guía de Uso

## 📋 Descripción General

El sistema de protección de rutas implementado proporciona una solución completa para controlar el acceso a diferentes páginas de la aplicación basándose en el estado de autenticación y los roles de usuario.

## 🔧 Componentes Principales

### 1. ProtectedRoute

Componente principal para proteger rutas que requieren autenticación y/o roles específicos.

```tsx
import { ProtectedRoute } from '@/shared/components/auth';

// Ruta que requiere solo autenticación
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Ruta que requiere roles específicos
<ProtectedRoute requiredRoles={['manager', 'supervisor']}>
  <AdminPanel />
</ProtectedRoute>

// Ruta con página de fallback personalizada
<ProtectedRoute
  requiredRoles={['editor']}
  fallbackPath="/dashboard"
>
  <ProductsPage />
</ProtectedRoute>
```

### 2. PublicRoute

Para rutas públicas que pueden redirigir si el usuario ya está autenticado.

```tsx
import { PublicRoute, AuthRoute } from '@/shared/components/auth';

// Ruta pública que no redirige
<PublicRoute redirectIfAuthenticated={false}>
  <LandingPage />
</PublicRoute>

// Ruta de autenticación (redirige si ya está logueado)
<AuthRoute>
  <LoginPage />
</AuthRoute>
```

### 3. Componentes de Conveniencia

```tsx
import {
  AdminRoute,
  SupervisorRoute,
  EditorRoute,
  SalesRoute
} from '@/shared/components/auth';

// Solo para managers
<AdminRoute>
  <UsersManagementPage />
</AdminRoute>

// Para supervisors y managers
<SupervisorRoute>
  <ReportsPage />
</SupervisorRoute>

// Para editors, supervisors y managers
<EditorRoute>
  <ProductsPage />
</EditorRoute>

// Para vendedores y superiores
<SalesRoute>
  <SalesPage />
</SalesRoute>
```

## 🎛️ Hook de Permisos

### usePermissions

Hook personalizado para verificar permisos en componentes.

```tsx
import { usePermissions } from "@/shared/hooks";

const MyComponent = () => {
  const {
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    canAccess,
    isManager,
    userRole,
    roleDisplayName,
  } = usePermissions();

  return (
    <div>
      <h1>Bienvenido {roleDisplayName}</h1>

      {/* Renderizado condicional basado en roles */}
      {isManager && <AdminPanel />}

      {canAccess(["editor", "supervisor"]) && <EditButton />}

      {hasMinimumRole("supervisor") && <SupervisorTools />}
    </div>
  );
};
```

## 👥 Jerarquía de Roles

El sistema implementa una jerarquía de roles donde roles superiores tienen acceso a funcionalidades de roles inferiores:

```
1. operator (más bajo)
2. editor
3. supervisor
4. manager (más alto)
5. seller
6. seller_tt
7. seller_executive
```

### Ejemplo de Uso por Roles

```tsx
// Solo operadores
<ProtectedRoute requiredRoles={['operator']}>
  <OperatorPanel />
</ProtectedRoute>

// Editores y superiores (editor, supervisor, manager)
<ProtectedRoute requiredRoles={['editor']}>
  <ProductEditor />
</ProtectedRoute>

// Múltiples roles específicos
<ProtectedRoute requiredRoles={['seller', 'seller_tt', 'manager']}>
  <SalesModule />
</ProtectedRoute>
```

## 🔄 Flujo de Redirecciones

### 1. Usuario No Autenticado

```
Usuario intenta acceder a /products
↓
Redirigido a /auth/login
↓
Después del login exitoso
↓
Redirigido a /products (página original)
```

### 2. Usuario Sin Permisos

```
Usuario autenticado intenta acceder a ruta protegida
↓
Verificación de permisos falla
↓
Redirigido a /unauthorized
↓
Página muestra información del error y opciones
```

## 📝 Ejemplos Prácticos

### 1. Configuración de Rutas Completa

```tsx
import { Routes, Route } from "react-router-dom";
import {
  ProtectedRoute,
  AuthRoute,
  AdminRoute,
  UnauthorizedPage,
} from "@/shared/components/auth";

const AppRoutes = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route
      path="/auth/login"
      element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      }
    />

    {/* Rutas protegidas básicas */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />

    {/* Rutas por roles */}
    <Route
      path="/admin/*"
      element={
        <AdminRoute>
          <AdminPages />
        </AdminRoute>
      }
    />

    {/* Rutas con roles específicos */}
    <Route
      path="/inventory"
      element={
        <ProtectedRoute requiredRoles={["editor", "supervisor", "manager"]}>
          <InventoryPage />
        </ProtectedRoute>
      }
    />

    {/* Página de error */}
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
  </Routes>
);
```

### 2. Protección de Componentes

```tsx
import { usePermissions } from "@/shared/hooks";

const ProductCard = ({ product }) => {
  const { canAccess } = usePermissions();

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.price}</p>

      {/* Solo editores pueden editar */}
      {canAccess(["editor"]) && <EditButton productId={product.id} />}

      {/* Solo managers pueden eliminar */}
      {canAccess(["manager"]) && <DeleteButton productId={product.id} />}
    </div>
  );
};
```

### 3. Navegación Condicional

```tsx
import { usePermissions } from "@/shared/hooks";

const Navigation = () => {
  const { canAccess, isManager } = usePermissions();

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>

      {canAccess(["editor"]) && <Link to="/products">Productos</Link>}

      {canAccess(["supervisor"]) && <Link to="/reports">Reportes</Link>}

      {isManager && <Link to="/admin">Administración</Link>}
    </nav>
  );
};
```

## 🚀 Estados de Carga

El sistema maneja automáticamente los estados de carga durante la verificación de autenticación:

```tsx
// Muestra AuthLoading mientras verifica autenticación
<ProtectedRoute>
  <MyProtectedPage />
</ProtectedRoute>

// El usuario ve el loading hasta que:
// 1. Se verifica que está autenticado
// 2. Se verifican los permisos
// 3. Se toma la decisión de mostrar contenido o redirigir
```

## ⚡ Características Avanzadas

### 1. Estado de Navegación

- Preserva la página de destino original después del login
- Proporciona información sobre la razón del acceso denegado
- Mantiene el historial de navegación

### 2. Manejo de Errores

- Página de error personalizada con información detallada
- Opciones de navegación para usuarios bloqueados
- Información sobre roles requeridos vs. rol actual

### 3. Rendimiento

- Verificaciones optimizadas con useMemo
- Estados de carga centralizados
- Redirecciones eficientes sin renderizado innecesario

Este sistema proporciona una base sólida y flexible para manejar la autorización en toda la aplicación de inventario TITA.
