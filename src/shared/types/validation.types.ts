// src/shared/types/validation.types.ts

/**
 * Tipos para validaciones de formularios y datos
 */

// ========================================
// VALIDACIONES DE IMÁGENES
// ========================================

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ImageValidationRules {
  maxSize: number;              
  allowedTypes: string[];       
  maxWidth?: number;            
  maxHeight?: number;           
  minWidth?: number;           
  minHeight?: number;           
}

// ========================================
// VALIDACIONES DE FORMULARIOS
// ========================================

export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings?: FormValidationError[];
}

// ========================================
// VALIDACIONES DE PRODUCTOS
// ========================================

export interface ProductValidationRules {
  name: {
    required: true;
    minLength: number;
    maxLength: number;
  };
  barCode: {
    required: true;
    pattern: RegExp;
    unique: boolean;
  };
  prices: {
    retailPrice: {
      required: true;
      min: number;
      max: number;
    };
    costPrice: {
      required: true;
      min: number;
    };
  };
  images: {
    mainImage: {
      required: boolean;
      validation: ImageValidationRules;
    };
    additionalImages: {
      maxCount: number;
      validation: ImageValidationRules;
    };
  };
}

// ========================================
// ESTADOS DE VALIDACIÓN
// ========================================

export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export interface FieldValidationState {
  value: any;
  status: ValidationStatus;
  errors: string[];
  touched: boolean;
  dirty: boolean;
}

export interface FormValidationState {
  [key: string]: FieldValidationState;
}

// ========================================
// REGLAS DE NEGOCIO
// ========================================

export interface BusinessRule {
  name: string;
  description: string;
  condition: (data: any) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ProductBusinessRules {
  priceConsistency: BusinessRule;    
  stockMinimum: BusinessRule;        
  providerRequired: BusinessRule;    
  categoryRequired: BusinessRule;    
  imageQuality: BusinessRule;       
}

// ========================================
// UTILIDADES DE VALIDACIÓN
// ========================================

export interface ValidationUtils {
  validateImage: (file: File, rules: ImageValidationRules) => ImageValidationResult;
  validateBarCode: (barCode: string) => boolean;
  validatePrice: (price: number, min?: number, max?: number) => boolean;
  validateRequired: (value: any) => boolean;
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
}

// ========================================
// CONSTANTES DE VALIDACIÓN
// ========================================

export const VALIDATION_CONSTANTS = {
  PRODUCT: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    BAR_CODE_PATTERN: /^[0-9A-Za-z\-_]{4,50}$/,
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999.99,
  },
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024,      // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
    MAX_WIDTH: 2048,
    MAX_HEIGHT: 2048,
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
  },
  PROVIDER: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    IDENTIFICATION_MIN_LENGTH: 5,
    IDENTIFICATION_MAX_LENGTH: 20,
  },
  CATEGORY: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
  }
} as const;