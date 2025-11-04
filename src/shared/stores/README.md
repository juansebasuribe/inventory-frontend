# 🔐 Guía de Uso - Auth Store con Zustand

## 📋 **Funcionalidades del Auth Store**

### **🎯 Características principales:**

- ✅ Gestión completa de autenticación JWT
- ✅ Persistencia automática en localStorage
- ✅ Sistema de permisos por roles
- ✅ Auto-logout por inactividad
- ✅ Refresh automático de tokens
- ✅ DevTools integrado
- ✅ TypeScript completo

---

## 🚀 **Uso Básico**

### **1. Inicialización en App.tsx**

```typescript
import { useAuthInitialization } from "@/shared/stores/hooks";

function App() {
  const { isInitialized } = useAuthInitialization();

  if (!isInitialized) {
    return <div>Inicializando aplicación...</div>;
  }

  return <Router>{/* Tu app aquí */}</Router>;
}
```

### **2. Hook de Autenticación**

```typescript
import { useAuth } from "@/shared/stores";

function LoginComponent() {
  const { login, logout, isAuthenticated, isLoading, error, clearError } =
    useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redireccionar después del login
    } catch (error) {
      // Error ya está en el store
    }
  };
}
```

### **3. Usuario Actual**

```typescript
import { useCurrentUser, useUserRole } from "@/shared/stores";

function UserProfile() {
  const user = useCurrentUser();
  const role = useUserRole();

  return (
    <div>
      <h1>
        {user?.first_name} {user?.last_name}
      </h1>
      <p>Rol: {role}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### **4. Sistema de Permisos**

```typescript
import { usePermissions } from "@/shared/stores";

function ProductManagement() {
  const { canViewProducts, canEditProducts, canAccess } = usePermissions();

  if (!canViewProducts) {
    return <div>Sin permisos</div>;
  }

  return (
    <div>
      <h1>Productos</h1>
      {canEditProducts && <button>Crear Producto</button>}
      {canAccess("products.delete") && <button>Eliminar</button>}
    </div>
  );
}
```

---

## 🛡️ **Protección de Rutas**

### **Componente ProtectedRoute (por crear en siguiente fase)**

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, canAccess } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !canAccess(requiredPermission)) {
    return <div>Acceso denegado</div>;
  }

  return <>{children}</>;
}
```

---

## 🔑 **Permisos Disponibles**

### **👥 Gestión de Usuarios:**

- `users.view` - Ver usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios

### **📦 Gestión de Productos:**

- `products.view` - Ver productos
- `products.create` - Crear productos
- `products.edit` - Editar productos
- `products.delete` - Eliminar productos

### **📊 Inventario:**

- `inventory.view` - Ver inventario
- `inventory.edit` - Editar inventario
- `inventory.reports` - Reportes de inventario

### **💰 Ventas:**

- `sales.view` - Ver ventas
- `sales.create` - Crear ventas
- `sales.edit` - Editar ventas

### **📈 Reportes:**

- `reports.view` - Ver reportes
- `reports.export` - Exportar reportes

### **⚙️ Configuración:**

- `settings.view` - Ver configuración
- `settings.edit` - Editar configuración

---

## 👥 **Roles y Permisos**

### **🏢 Manager**

- ✅ Acceso completo a todo el sistema
- ✅ Gestión de usuarios, productos, inventario
- ✅ Configuración del sistema

### **👨‍💼 Supervisor**

- ✅ Gestión de usuarios (crear/editar)
- ✅ Gestión completa de productos
- ✅ Inventario y reportes
- ❌ Configuración del sistema

### **✏️ Editor**

- ✅ Ver usuarios
- ✅ Gestión de productos
- ✅ Ver inventario
- ❌ Crear usuarios, reportes

### **🛠️ Operator**

- ✅ Ver y editar inventario
- ❌ Productos, usuarios, reportes

### **🛒 Seller/Seller_TT/Seller_Executive**

- ✅ Ver productos
- ✅ Gestión de ventas
- ❌ Editar productos, usuarios

---

## 🔄 **Estado del Store**

### **Estados disponibles:**

```typescript
interface AuthState {
  isAuthenticated: boolean; // ¿Usuario autenticado?
  isLoading: boolean; // ¿Operación en progreso?
  isInitialized: boolean; // ¿Store inicializado?
  user: User | null; // Datos del usuario
  tokens: AuthTokens | null; // Tokens JWT
  error: string | null; // Errores de auth
  lastActivity: number; // Última actividad
  sessionTimeout: number; // Timeout de sesión
}
```

### **Acciones disponibles:**

```typescript
interface AuthActions {
  // Inicialización
  initialize(): Promise<void>;

  // Autenticación
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;

  // Usuario
  setUser(user: User | null): void;
  updateUser(updates: Partial<User>): void;

  // Utilidades
  hasRole(role: UserRole): boolean;
  canAccess(resource: string): boolean;
  checkSession(): boolean;
  updateActivity(): void;
}
```

---

## 💾 **Persistencia**

### **Datos persistidos en localStorage:**

- ✅ Tokens de autenticación
- ✅ Datos del usuario
- ✅ Estado de autenticación
- ✅ Última actividad

### **Datos NO persistidos:**

- ❌ Estados de loading
- ❌ Errores temporales
- ❌ Estado de inicialización

---

## 🔧 **Configuración Avanzada**

### **Timeout de sesión:**

- **Predeterminado:** 30 minutos
- **Verificación:** Cada 1 minuto
- **Auto-logout:** Por inactividad

### **DevTools:**

- **Activado:** Solo en desarrollo
- **Nombre:** `auth-store`
- **Persistencia:** Versioned storage

---

**✅ AUTH STORE COMPLETADO**

_Sistema robusto de autenticación listo para COMERCIALIZADORA TITA_
