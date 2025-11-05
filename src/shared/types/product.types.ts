// src/shared/types/product.types.ts

/**
 * Tipos TypeScript para el módulo de productos
 * Basado en el backend Django con soporte completo para imágenes
 */

// ========================================
// TIPOS BASE Y AUDITORÍA
// ========================================

export interface BaseModel {
  id: number;
  creation_date: string;
  update_date: string;
  active: boolean;
  created_by?: number;
  updated_by?: number;
}

// ========================================
// IMÁGENES DE PRODUCTOS
// ========================================

export interface ProductImage {
  id: number;
  image: string;              // URL del archivo de imagen
  image_url: string;          // URL completa con dominio
  order: number;              // Orden 1-3 para imágenes adicionales
  caption: string;            // Leyenda descriptiva
  is_active: boolean;         // Control de visibilidad
  product: number;            // FK al producto
  product_name?: string;      // Nombre del producto (solo lectura)
  product_bar_code?: string;  // Código de barras (solo lectura)
}

export interface ProductImageCreate {
  image: File;                // Archivo de imagen para subir
  order: number;              // Orden 1-3
  caption?: string;           // Leyenda opcional
  is_active?: boolean;        // Por defecto true
}

export interface ProductImageUpdate {
  order?: number;
  caption?: string;
  is_active?: boolean;
}

// ========================================
// CATEGORÍAS
// ========================================

export interface Category extends BaseModel {
  name: string;               // Nombre único de la categoría
  description: string;        // Descripción detallada
  parent: number | null;      // Categoría padre (jerarquía)
  order: number;              // Orden para listado
  image: string | null;       // Imagen representativa
}

export interface CategoryCreate {
  name: string;
  description?: string;
  parent?: number;
  order?: number;
  image?: File;
}

export interface CategoryTree extends Category {
  subcategories: CategoryTree[];  // Subcategorías anidadas
  product_count?: number;         // Número de productos en la categoría
}

// ========================================
// PROVEEDORES
// ========================================

export type IdentificationType = 'nit' | 'cc' | 'ce' | 'pasaporte' | 'otros';

export interface Provider extends BaseModel {
  name: string;                           // Razón social
  identification_type: IdentificationType; // Tipo de identificación
  identification_number: string;          // Número único de identificación
  address: string;                        // Dirección completa
  phone_number: string;                   // Teléfono
  email: string;                          // Email
  contact_person?: string;                // Persona de contacto
  website?: string;                       // Sitio web
  rating?: number;                        // Calificación 0-5
  notes?: string;                         // Notas adicionales
}

export interface ProviderCreate {
  name: string;
  identification_type: IdentificationType;
  identification_number: string;
  address?: string;
  phone_number?: string;
  email?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
}

// ========================================
// RELACIÓN PRODUCTO-PROVEEDOR
// ========================================

export interface ProductProviderRelationship {
  id: number;
  provider: number;                       // FK al proveedor
  provider_name: string;                  // Nombre del proveedor (solo lectura)
  provider_identification: string;        // Identificación del proveedor (solo lectura)
  cost_price: number;                     // Precio de costo con este proveedor
  lead_time: number;                      // Tiempo de entrega en días
  minimum_order_quantity: number;         // Cantidad mínima de pedido
  is_primary: boolean;                    // ¿Es el proveedor principal?
  product_bar_code?: string;              // Código del producto (solo lectura)
}

export interface ProductProviderCreate {
  provider: number;
  cost_price: number;
  lead_time?: number;
  minimum_order_quantity?: number;
  is_primary?: boolean;
}

// ========================================
// PRODUCTOS
// ========================================

export interface Product extends BaseModel {
  // Información básica
  name: string;                           // Nombre del producto
  description: string;                    // Descripción detallada
  bar_code: string;                       // Código de barras único
  
  // Precios
  retail_price: number;                   // Precio de venta al público
  current_price: number;                  // Precio actual según el rol del usuario
  cost_price: number;                     // Precio de costo
  
  // Imágenes
  main_image: string | null;              // URL de la imagen principal
  additional_images: ProductImage[];      // Array de imágenes adicionales (max 3)
  all_images?: ProductImage[];            // Todas las imágenes (principal + adicionales)
  
  // Categorización
  category: number;                       // FK a la categoría
  category_name: string;                  // Nombre de la categoría (solo lectura)
  
  // Proveedores
  provider_relationships: ProductProviderRelationship[]; // Relaciones con proveedores
  primary_provider?: Provider;            // Proveedor principal (calculado)
  primary_cost_price?: number;            // Precio del proveedor principal
  
  // Stock e inventario
  total_stock: number;                    // Stock total en todas las ubicaciones
  stock_by_location?: { [key: string]: number }; // Stock por ubicación
  minimum_stock?: number;                 // Límite mínimo recomendado (agregado)
  maximum_stock?: number;                 // Límite máximo recomendado (agregado)
  in_stock: boolean;                      // ¿Hay stock disponible?
  needs_restock: boolean;                 // ¿Necesita reabastecimiento?
  
  // Precios y márgenes (calculados según el rol)
  profit_margin?: number;                 // Margen de ganancia porcentual
  profit_value?: number;                  // Valor de ganancia
  can_modify_price: boolean;              // ¿El usuario puede modificar precios?
  price_modifier_role?: string;           // Rol que está afectando el precio
  is_tt_discount: boolean;                // ¿Tiene descuento TT?
  discount_percentage?: number;           // Porcentaje de descuento aplicado
  
  // Auditoría adicional
  user_modification?: number;             // Usuario que hizo la última modificación
}

export interface ProductSimple {
  id: number;
  name: string;
  bar_code: string;
  retail_price: number;
  current_price: number;
  cost_price: number;
  wholesale_price: number;
  main_image: string | null;
  category?: {
    id: number;
    name: string;
  };
  category_name?: string;
  total_stock: number;
  minimum_stock?: number;
  maximum_stock?: number;
  in_stock: boolean;
  needs_restock: boolean;
  active: boolean;
  image?: string;
  description?: string;
  // Campos de pricing según rol
  can_modify_price?: boolean;
  price_modifier_role?: string;
  is_tt_discount?: boolean;
  discount_percentage?: number;
}

export interface ProductCreate {
  name: string;
  description?: string;
  bar_code: string;
  retail_price: number;
  cost_price: number;
  category: number;
  main_image?: File;
  additional_images?: ProductImageCreate[];
  minimum_stock?: number;
  maximum_stock?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  retail_price?: number;
  cost_price?: number;
  category?: number;
  main_image?: File | null;
  additional_images?: ProductImageCreate[];
  minimum_stock?: number;
  maximum_stock?: number;
}

// ========================================
// FILTROS Y BÚSQUEDAS
// ========================================

export interface ProductFilters {
  search?: string;              // Búsqueda por nombre o código
  category?: number;            // Filtro por categoría
  provider?: number;            // Filtro por proveedor
  in_stock?: boolean;           // Solo productos en stock
  needs_restock?: boolean;      // Solo productos que necesitan reabastecimiento
  price_min?: number;           // Precio mínimo
  price_max?: number;           // Precio máximo
  active?: boolean;             // Estado activo/inactivo
}

export interface ProductSearchParams extends ProductFilters {
  page?: number;                // Número de página
  page_size?: number;           // Tamaño de página
  ordering?: string;            // Campo de ordenamiento
}

// ========================================
// RESPUESTAS DE API
// ========================================

export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[] | ProductSimple[];
}

export interface ProductImageResponse {
  id: number;
  message: string;
  image_url: string;
}

// ========================================
// VALIDACIONES Y CONSTANTES
// ========================================

export const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_ADDITIONAL_IMAGES = 3;
export const IMAGE_ORDER_RANGE = [1, 2, 3] as const;

export type ImageOrder = typeof IMAGE_ORDER_RANGE[number];

// ========================================
// TIPOS PARA FORMULARIOS
// ========================================

export interface ProductFormData {
  // Información básica
  name: string;
  description: string;
  bar_code: string;
  retail_price: string;          // String para manejar en formularios
  cost_price: string;            // String para manejar en formularios
  category: string;              // String para select
  
  // Imágenes
  main_image: File | null;
  additional_images: {
    id?: number;                 // Para imágenes existentes
    file?: File;                 // Para imágenes nuevas
    order: number;
    caption: string;
    is_active: boolean;
    preview?: string;            // URL de preview
  }[];
  
  // Proveedores
  providers: {
    provider: string;            // String para select
    cost_price: string;          // String para formularios
    lead_time: string;           // String para formularios
    minimum_order_quantity: string; // String para formularios
    is_primary: boolean;
  }[];
}

// ========================================
// ESTADOS DE CARGA
// ========================================

export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  categories: Category[];
  providers: Provider[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

// ========================================
// TIPOS PARA COMPONENTES
// ========================================

export interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  currentImage?: string;
  className?: string;
}

export interface ImageGalleryProps {
  images: ProductImage[];
  onImageClick?: (image: ProductImage) => void;
  onImageDelete?: (imageId: number) => void;
  editable?: boolean;
  className?: string;
}

export interface ProductCardProps {
  product: Product | ProductSimple;
  onClick?: (product: Product | ProductSimple) => void;
  showActions?: boolean;
  className?: string;
}