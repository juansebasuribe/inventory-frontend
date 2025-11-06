// src/features/products/constants/index.ts

// ========================================
// URLs DE API
// ========================================

export const PRODUCT_API_ENDPOINTS = {
  // Productos - Backend solo expone endpoint "simple"
  PRODUCTS: '/api/product/v1/products/simple/',
  PRODUCT_DETAIL_BY_CODE: (barCode: string) => `/api/product/v1/products/code/simple/${barCode}/`,
  PRODUCT_ACTIVATE: (barCode: string) => `/api/product/v1/products/${barCode}/activate/`,
  PRODUCT_INACTIVE: '/api/product/v1/products/inactive/',
  
  // Proveedores de productos
  PRODUCT_PROVIDERS: (barCode: string) => `/api/product/v1/products/${barCode}/providers/`,
  PRODUCT_PROVIDER_DETAIL: (barCode: string, providerId: number) => 
    `/api/product/v1/products/${barCode}/providers/${providerId}/`,
  PRODUCT_PROVIDER_SET_PRIMARY: (barCode: string, providerId: number) => 
    `/api/product/v1/products/${barCode}/providers/${providerId}/set-primary/`,
  
  // Imágenes de productos
  PRODUCT_IMAGES: (barCode: string) => `/api/product/v1/products/${barCode}/images/`,
  PRODUCT_IMAGE_DETAIL: (barCode: string, imageId: number) => 
    `/api/product/v1/products/${barCode}/images/${imageId}/`,
  
  // Categorías
  CATEGORIES: '/api/category/v1/categories/',
  CATEGORY_DETAIL: (id: number) => `/api/category/v1/categories/${id}/`,
  CATEGORY_TREE: '/api/category/v1/categories/tree/',
  CATEGORY_SUBCATEGORIES: (id: number) => `/api/category/v1/categories/${id}/subcategories/`,
  CATEGORY_INACTIVE: '/api/category/v1/categories/inactive/',
  CATEGORY_RESTORE: (id: number) => `/api/category/v1/categories/${id}/restore/`,
  
  // Proveedores
  PROVIDERS: '/api/provider/v1/providers/',
  PROVIDER_DETAIL: (id: number) => `/api/provider/v1/providers/${id}/`,
  PROVIDER_INACTIVE: '/api/provider/v1/providers/inactive/',
  PROVIDER_RESTORE: (id: number) => `/api/provider/v1/providers/${id}/restore/`,
  PROVIDER_RATE: (id: number) => `/api/provider/v1/providers/${id}/rate/`,
  PROVIDER_PRODUCTS: (providerId: number) => `/api/product/v1/providers/${providerId}/products/`,
} as const;

// ========================================
// CONFIGURACIÓN DE IMÁGENES
// ========================================

export const IMAGE_CONFIG = {
  // Formatos soportados
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  
  // Tamaños
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  
  // Thumbnails
  THUMBNAIL_WIDTH: 150,
  THUMBNAIL_HEIGHT: 150,
  PREVIEW_WIDTH: 400,
  PREVIEW_HEIGHT: 400,
  
  // Cantidad
  MAX_ADDITIONAL_IMAGES: 3,
  IMAGE_ORDERS: [1, 2, 3] as const,
  
  // Calidad de compresión
  COMPRESSION_QUALITY: 0.8,
  
  // Mensajes de error
  ERRORS: {
    INVALID_TYPE: 'Tipo de archivo no válido. Use: JPG, PNG, GIF, BMP o WEBP',
    FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 5MB',
    DIMENSIONS_TOO_LARGE: 'Las dimensiones son demasiado grandes. Máximo 2048x2048px',
    DIMENSIONS_TOO_SMALL: 'Las dimensiones son demasiado pequeñas. Mínimo 100x100px',
    MAX_IMAGES_REACHED: 'Máximo 3 imágenes adicionales permitidas',
    ORDER_ALREADY_EXISTS: 'Ya existe una imagen con este orden',
    UPLOAD_FAILED: 'Error al subir la imagen',
    DELETE_FAILED: 'Error al eliminar la imagen',
  }
} as const;

// ========================================
// CONFIGURACIÓN DE PAGINACIÓN
// ========================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ========================================
// CONFIGURACIÓN DE FILTROS
// ========================================

export const FILTER_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms para búsqueda
  SEARCH_MIN_LENGTH: 2,
  
  // Campos de ordenamiento
  SORT_FIELDS: {
    NAME: 'name',
    BAR_CODE: 'bar_code',
    PRICE: 'retail_price',
    CATEGORY: 'category__name',
    STOCK: 'total_stock',
    CREATED: 'creation_date',
    UPDATED: 'update_date',
  },
  
  // Filtros por defecto
  DEFAULT_FILTERS: {
    active: true,
    in_stock: undefined,
    needs_restock: undefined,
    category: undefined,
    provider: undefined,
    price_min: undefined,
    price_max: undefined,
  },
} as const;

// ========================================
// CONFIGURACIÓN DE VALIDACIÓN
// ========================================

export const VALIDATION_CONFIG = {
  PRODUCT: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    BAR_CODE_MIN_LENGTH: 4,
    BAR_CODE_MAX_LENGTH: 50,
    BAR_CODE_PATTERN: /^[0-9A-Za-z\-_]{4,50}$/,
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999.99,
    PRICE_DECIMAL_PLACES: 2,
  },
  
  CATEGORY: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
  },
  
  PROVIDER: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    IDENTIFICATION_MIN_LENGTH: 5,
    IDENTIFICATION_MAX_LENGTH: 20,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^[\+]?[0-9\-\s\(\)]{7,15}$/,
  },
  
  MESSAGES: {
    REQUIRED: 'Este campo es obligatorio',
    INVALID_FORMAT: 'Formato inválido',
    TOO_SHORT: (min: number) => `Mínimo ${min} caracteres`,
    TOO_LONG: (max: number) => `Máximo ${max} caracteres`,
    INVALID_PRICE: 'Precio debe ser mayor a 0',
    PRICE_TOO_HIGH: (max: number) => `Precio máximo ${max}`,
    INVALID_BAR_CODE: 'Código de barras inválido (solo letras, números, guiones y guiones bajos)',
    DUPLICATE_BAR_CODE: 'Este código de barras ya existe',
    INVALID_EMAIL: 'Email inválido',
    INVALID_PHONE: 'Teléfono inválido',
  }
} as const;

// ========================================
// ESTADOS Y ETIQUETAS
// ========================================

export const PRODUCT_STATUS = {
  ACTIVE: { value: true, label: 'Activo', color: 'green' },
  INACTIVE: { value: false, label: 'Inactivo', color: 'red' },
} as const;

export const STOCK_STATUS = {
  IN_STOCK: { label: 'En Stock', color: 'green', icon: 'check-circle' },
  OUT_OF_STOCK: { label: 'Sin Stock', color: 'red', icon: 'x-circle' },
  LOW_STOCK: { label: 'Stock Bajo', color: 'yellow', icon: 'alert-triangle' },
} as const;

export const VIEW_MODES = {
  GRID: { value: 'grid', label: 'Cuadrícula', icon: 'grid' },
  LIST: { value: 'list', label: 'Lista', icon: 'list' },
  TABLE: { value: 'table', label: 'Tabla', icon: 'table' },
} as const;

// ========================================
// ROLES Y PERMISOS
// ========================================

export const PRODUCT_PERMISSIONS = {
  VIEW: ['operator', 'editor', 'supervisor', 'manager', 'seller', 'seller_tt', 'seller_executive', 'administrator'],
  CREATE: ['editor', 'supervisor', 'administrator'],
  UPDATE: ['editor', 'supervisor', 'administrator'],
  DELETE: ['supervisor', 'administrator'],
  MANAGE_IMAGES: ['editor', 'supervisor', 'administrator'],
  MANAGE_PROVIDERS: ['editor', 'supervisor', 'administrator'],
  VIEW_COST_PRICES: ['supervisor', 'administrator'],
  MODIFY_PRICES: ['supervisor', 'administrator'],
} as const;

export const CATEGORY_PERMISSIONS = {
  VIEW: ['operator', 'editor', 'supervisor', 'manager', 'seller', 'seller_tt', 'seller_executive', 'administrator'],
  CREATE: ['editor', 'supervisor', 'administrator'],
  UPDATE: ['editor', 'supervisor', 'administrator'],
  DELETE: ['supervisor', 'administrator'],
} as const;

export const PROVIDER_PERMISSIONS = {
  VIEW: ['operator', 'editor', 'supervisor', 'manager', 'seller', 'seller_tt', 'seller_executive', 'administrator'],
  CREATE: ['editor', 'supervisor', 'administrator'],
  UPDATE: ['editor', 'supervisor', 'administrator'],
  DELETE: ['supervisor', 'administrator'],
  RATE: ['operator', 'editor', 'supervisor', 'manager', 'seller', 'seller_tt', 'seller_executive', 'administrator'],
} as const;

// ========================================
// CONFIGURACIÓN DE UI
// ========================================

export const UI_CONFIG = {
  ANIMATION_DURATION: 200, // ms
  TOAST_DURATION: 5000, // ms
  MODAL_BACKDROP_BLUR: true,
  LOADING_DELAY: 100, // ms antes de mostrar loading
  
  // Colores por estado
  COLORS: {
    SUCCESS: '#10B981',
    ERROR: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#3B82F6',
    NEUTRAL: '#6B7280',
  },
  
  // Breakpoints responsivos
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// ========================================
// MENSAJES DE LA UI
// ========================================

export const UI_MESSAGES = {
  LOADING: {
    PRODUCTS: 'Cargando productos...',
    PRODUCT: 'Cargando producto...',
    CATEGORIES: 'Cargando categorías...',
    PROVIDERS: 'Cargando proveedores...',
    IMAGES: 'Cargando imágenes...',
    SAVING: 'Guardando...',
    DELETING: 'Eliminando...',
    UPLOADING: 'Subiendo imagen...',
  },
  
  SUCCESS: {
    PRODUCT_CREATED: 'Producto creado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente',
    IMAGE_UPLOADED: 'Imagen subida exitosamente',
    IMAGE_DELETED: 'Imagen eliminada exitosamente',
    CATEGORY_CREATED: 'Categoría creada exitosamente',
    PROVIDER_CREATED: 'Proveedor creado exitosamente',
  },
  
  ERROR: {
    GENERIC: 'Ha ocurrido un error inesperado',
    NETWORK: 'Error de conexión. Verifique su internet',
    PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    CATEGORY_NOT_FOUND: 'Categoría no encontrada',
    PROVIDER_NOT_FOUND: 'Proveedor no encontrado',
    IMAGE_UPLOAD_FAILED: 'Error al subir la imagen',
    DUPLICATE_BAR_CODE: 'El código de barras ya existe',
  },
  
  CONFIRM: {
    DELETE_PRODUCT: '¿Está seguro de eliminar este producto?',
    DELETE_IMAGE: '¿Está seguro de eliminar esta imagen?',
    DELETE_CATEGORY: '¿Está seguro de eliminar esta categoría?',
    DELETE_PROVIDER: '¿Está seguro de eliminar este proveedor?',
    DISCARD_CHANGES: '¿Está seguro de descartar los cambios?',
  },
  
  EMPTY_STATES: {
    NO_PRODUCTS: 'No se encontraron productos',
    NO_CATEGORIES: 'No se encontraron categorías',
    NO_PROVIDERS: 'No se encontraron proveedores',
    NO_IMAGES: 'No hay imágenes',
    NO_RESULTS: 'No se encontraron resultados para su búsqueda',
  },
} as const;