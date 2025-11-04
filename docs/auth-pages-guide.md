# Páginas de Autenticación - TITA

## 📋 Descripción General

Este documento describe las páginas de autenticación implementadas para el sistema de gestión de inventarios TITA, incluyendo su funcionalidad, características y flujo de usuario.

## 🎨 AuthLayout - Layout Compartido

Todas las páginas de autenticación utilizan un layout común (`AuthLayout`) que proporciona:

### Características del Layout:

- **Panel izquierdo** (desktop): Branding TITA y características del sistema
- **Panel derecho**: Formulario de autenticación
- **Responsive**: Se adapta a móviles ocultando el panel izquierdo
- **Gradiente de fondo**: Diseño moderno con branding corporativo
- **Patrón de fondo**: Elementos visuales sutiles

### Props del AuthLayout:

```tsx
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string; // Título principal
  subtitle?: string; // Subtítulo descriptivo
  showFeatures?: boolean; // Mostrar panel de características
}
```

## 📄 Páginas Implementadas

### 1. LoginPage (`/auth/login`)

**Propósito**: Página principal de inicio de sesión.

**Características**:

- ✅ Formulario de login con validación
- ✅ Integración con AuthLayout
- ✅ Redirección inteligente post-login
- ✅ Enlace a recuperación de contraseña
- ✅ Branding TITA completo

**Componentes utilizados**:

- `LoginForm` (formulario principal)
- `AuthLayout` (layout compartido)

**Flujo**:

```
Usuario accede → LoginPage → LoginForm → Validación → AuthStore → Redirección
```

### 2. ForgotPasswordPage (`/auth/forgot-password`)

**Propósito**: Solicitar recuperación de contraseña por email.

**Características**:

- ✅ Formulario de email con validación
- ✅ Estados de carga y éxito
- ✅ Página de confirmación integrada
- ✅ Instrucciones claras al usuario
- ✅ Opción de reenvío

**Estados**:

1. **Formulario inicial**: Captura email
2. **Estado de éxito**: Confirmación de envío
3. **Manejo de errores**: Feedback claro

**Flujo**:

```
Email → Validación → API Call → Email enviado → Instrucciones → Volver al login
```

### 3. ResetPasswordPage (`/auth/reset-password`)

**Propósito**: Restablecer contraseña con token de seguridad.

**Características**:

- ✅ Validación de token desde URL
- ✅ Indicador de fortaleza de contraseña
- ✅ Confirmación de contraseña
- ✅ Manejo de tokens expirados
- ✅ Página de éxito integrada

**Validaciones de contraseña**:

- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Visualización de fortaleza en tiempo real

**Parámetros URL**:

- `token`: Token de recuperación
- `email`: Email del usuario

**Estados**:

1. **Validación de token**: Verifica enlace válido
2. **Formulario de contraseña**: Captura nueva contraseña
3. **Éxito**: Confirmación de cambio
4. **Error**: Token inválido o expirado

### 4. LogoutPage (`/auth/logout`)

**Propósito**: Cierre de sesión con feedback visual.

**Características**:

- ✅ Logout automático al acceder
- ✅ Estados de carga
- ✅ Confirmación visual
- ✅ Redirección automática
- ✅ Opción manual de redirección

**Flujo**:

```
Acceso → Logout automático → Loading → Success → Auto-redirect (2s) → Login
```

## 🔄 Flujos de Usuario

### Flujo de Login Normal

```
1. Usuario accede a /auth/login
2. Completa credenciales
3. Validación en tiempo real
4. Submit al backend
5. Token almacenado
6. Redirección a página original o dashboard
```

### Flujo de Recuperación de Contraseña

```
1. Usuario hace clic en "Olvidé mi contraseña"
2. Ingresa email en /auth/forgot-password
3. Sistema envía email con token
4. Usuario hace clic en enlace del email
5. Accede a /auth/reset-password?token=xxx&email=xxx
6. Valida token y muestra formulario
7. Establece nueva contraseña
8. Redirección a login con nueva contraseña
```

### Flujo de Logout

```
1. Usuario hace clic en "Cerrar sesión"
2. Redirección a /auth/logout
3. Limpieza automática de tokens
4. Confirmación visual
5. Redirección automática a login
```

## 🎨 Características de Diseño

### Colores Corporativos TITA

- **Primario**: `#DC2626` (Rojo TITA)
- **Secundario**: `#F59E0B` (Dorado)
- **Fondos**: Gradientes grises suaves
- **Estados**: Verde (éxito), Rojo (error), Azul (info)

### Componentes UI Utilizados

- `Card`: Contenedores principales
- `Button`: Estados de carga y variantes
- `Input`: Validación y iconos
- `IconComponents`: Lucide React icons

### Responsive Design

- **Desktop**: Layout de dos columnas con características
- **Tablet**: Layout simplificado
- **Mobile**: Single column, header compacto

## 🔒 Características de Seguridad

### Validación de Formularios

- **Zod**: Esquemas de validación robustos
- **React Hook Form**: Manejo eficiente de formularios
- **Validación en tiempo real**: Feedback inmediato

### Manejo de Estados

- **Loading states**: Previene múltiples submits
- **Error handling**: Mensajes específicos por tipo de error
- **Token validation**: Verificación de enlaces de recuperación

### UX de Seguridad

- **Indicador de fortaleza**: Para nuevas contraseñas
- **Ocultación de contraseñas**: Toggle de visibilidad
- **Feedback claro**: Mensajes de error específicos
- **Timeouts**: Redirecciones automáticas

## 🔄 Integración con Sistema de Rutas

### Protección de Rutas

- Todas las páginas auth usan `AuthRoute` (redirige si ya está autenticado)
- Excepto `/auth/logout` que permite acceso directo

### Redirecciones Inteligentes

```tsx
// Preserva página de destino
const from = location.state?.from?.pathname || "/dashboard";
navigate(from, { replace: true });
```

### Estados de Navegación

```tsx
// Información de contexto
navigate("/auth/reset-password", {
  state: {
    from: location,
    reason: "token_expired",
  },
});
```

## 📱 Experiencia Móvil

### Adaptaciones Mobile

- Header compacto con logo TITA
- Single column layout
- Touch-friendly buttons
- Viewport optimizado

### Performance

- Lazy loading de componentes
- Optimización de re-renders
- Estados de carga eficientes

## 🚀 Próximas Mejoras

### Funcionalidades Pendientes

- [ ] Autenticación de dos factores (2FA)
- [ ] Login con redes sociales
- [ ] Recordar dispositivo
- [ ] Notificaciones push de seguridad

### Mejoras UX

- [ ] Animaciones de transición
- [ ] Modo oscuro
- [ ] Accesibilidad (ARIA labels)
- [ ] Soporte offline

Este sistema de páginas de autenticación proporciona una experiencia completa, segura y profesional para los usuarios del sistema TITA.
