// src/shared/types/entities.ts

// ========================
// BUSINESS ENTITIES (BÁSICAS)
// ========================

// Base Entity
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// User Entity
export interface User extends BaseEntity {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  profile?: UserProfile;
}

export interface UserProfile extends BaseEntity {
  user: number;
  role: UserRole;
}

export type UserRole = 'operator' | 'editor' | 'supervisor' | 'manager' | 'seller' | 'seller_tt' | 'seller_executive';

export type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'out_of_stock';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Warehouse Entity
export interface Warehouse extends BaseEntity {
  name: string;
  code: string;
  address: string;
  manager?: User;
  isActive: boolean;
}

// Inventory Entity
export interface InventoryMovement extends BaseEntity {
  product_id: number;
  warehouse: Warehouse;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  user: User;
  order_id?: number;
}

export interface ProductStock {
  warehouse: Warehouse;
  quantity: number;
  reservedQuantity: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer';

// Order Entity
export interface Order extends BaseEntity {
  orderNumber: string;
  customer?: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  user: User;
  warehouse: Warehouse;
  notes?: string;
}

export interface OrderItem extends BaseEntity {
  order: number;
  product_id: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

// NOTA: Los tipos Product, ProductImage, Category, Provider están en product.types.ts
// para evitar conflictos y tener tipos más detallados basados en el backend Django real