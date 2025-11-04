// src/features/products/services/imageService.ts

/**
 * Servicio especializado para manejo de imágenes de productos
 * Implementa compresión, validación y optimización de imágenes
 */

import type { 
  ProductImage, 
  ProductImageCreate, 
  ProductImageUpdate
} from '../../../shared/types/product.types';
import type { ImageValidationResult } from '../../../shared/types/validation.types';
import { apiClient } from '../../../shared/services';
import { PRODUCT_API_ENDPOINTS, IMAGE_CONFIG } from '../constants';

// ========================================
// INTERFACES Y TIPOS
// ========================================

// TODO: Usar esta interfaz cuando se implemente upload de imágenes
// interface ImageUploadResponse {
//   id: number;
//   image_url: string;
//   message: string;
// }

interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

interface ImageValidationOptions {
  maxSize: number;
  allowedTypes: readonly string[];
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

// ========================================
// UTILIDADES DE VALIDACIÓN
// ========================================

class ImageValidator {
  /**
   * Valida un archivo de imagen contra las reglas especificadas
   */
  static validate(
    file: File, 
    options: ImageValidationOptions = {
      maxSize: IMAGE_CONFIG.MAX_SIZE,
      allowedTypes: IMAGE_CONFIG.ALLOWED_TYPES
    }
  ): ImageValidationResult {
    const errors: string[] = [];

    // Validar tipo de archivo
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(IMAGE_CONFIG.ERRORS.INVALID_TYPE);
    }

    // Validar tamaño de archivo
    if (file.size > options.maxSize) {
      errors.push(IMAGE_CONFIG.ERRORS.FILE_TOO_LARGE);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dimensiones de imagen
   */
  static async validateDimensions(
    file: File, 
    options: Pick<ImageValidationOptions, 'maxWidth' | 'maxHeight' | 'minWidth' | 'minHeight'>
  ): Promise<ImageValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const errors: string[] = [];

      img.onload = () => {
        if (options.maxWidth && img.width > options.maxWidth) {
          errors.push(IMAGE_CONFIG.ERRORS.DIMENSIONS_TOO_LARGE);
        }
        if (options.maxHeight && img.height > options.maxHeight) {
          errors.push(IMAGE_CONFIG.ERRORS.DIMENSIONS_TOO_LARGE);
        }
        if (options.minWidth && img.width < options.minWidth) {
          errors.push(IMAGE_CONFIG.ERRORS.DIMENSIONS_TOO_SMALL);
        }
        if (options.minHeight && img.height < options.minHeight) {
          errors.push(IMAGE_CONFIG.ERRORS.DIMENSIONS_TOO_SMALL);
        }

        resolve({
          isValid: errors.length === 0,
          errors
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          errors: ['Archivo de imagen inválido']
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// ========================================
// UTILIDADES DE COMPRESIÓN
// ========================================

class ImageCompressor {
  /**
   * Comprime una imagen manteniendo la calidad visual
   */
  static async compress(
    file: File, 
    options: ImageCompressionOptions = {
      maxWidth: IMAGE_CONFIG.MAX_WIDTH,
      maxHeight: IMAGE_CONFIG.MAX_HEIGHT,
      quality: IMAGE_CONFIG.COMPRESSION_QUALITY,
      format: 'jpeg'
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        // Calcular nuevas dimensiones manteniendo proporción
        const ratio = Math.min(
          options.maxWidth / img.width,
          options.maxHeight / img.height
        );

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }

            // Crear nuevo archivo con el blob comprimido
            const compressedFile = new File(
              [blob], 
              file.name, 
              { 
                type: `image/${options.format}`,
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);
          },
          `image/${options.format}`,
          options.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Genera thumbnail de imagen
   */
  static async generateThumbnail(
    file: File,
    width: number = IMAGE_CONFIG.THUMBNAIL_WIDTH,
    height: number = IMAGE_CONFIG.THUMBNAIL_HEIGHT
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen centrada y recortada
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width / 2) - (img.width / 2) * scale;
        const y = (height / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => {
        reject(new Error('Error al generar thumbnail'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// ========================================
// SERVICIO PRINCIPAL DE IMÁGENES
// ========================================

export class ImageService {
  private static instance: ImageService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  // ========================================
  // MÉTODOS DE VALIDACIÓN
  // ========================================

  /**
   * Valida archivo de imagen completo (archivo + dimensiones)
   */
  async validateImage(file: File): Promise<ImageValidationResult> {
    // Validación básica del archivo
    const fileValidation = ImageValidator.validate(file);
    if (!fileValidation.isValid) {
      return fileValidation;
    }

    // Validación de dimensiones
    const dimensionValidation = await ImageValidator.validateDimensions(file, {
      maxWidth: IMAGE_CONFIG.MAX_WIDTH,
      maxHeight: IMAGE_CONFIG.MAX_HEIGHT,
      minWidth: IMAGE_CONFIG.MIN_WIDTH,
      minHeight: IMAGE_CONFIG.MIN_HEIGHT
    });

    return {
      isValid: dimensionValidation.isValid,
      errors: [...fileValidation.errors, ...dimensionValidation.errors]
    };
  }

  /**
   * Valida si se puede agregar una imagen adicional a un producto
   */
  validateAdditionalImageCount(currentImages: ProductImage[], newOrder: number): ImageValidationResult {
    const errors: string[] = [];

    // Verificar límite máximo
    const activeImages = currentImages.filter(img => img.is_active);
    if (activeImages.length >= IMAGE_CONFIG.MAX_ADDITIONAL_IMAGES) {
      errors.push(IMAGE_CONFIG.ERRORS.MAX_IMAGES_REACHED);
    }

    // Verificar orden único
    const orderExists = activeImages.some(img => img.order === newOrder);
    if (orderExists) {
      errors.push(IMAGE_CONFIG.ERRORS.ORDER_ALREADY_EXISTS);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // MÉTODOS DE PROCESAMIENTO
  // ========================================

  /**
   * Procesa imagen antes de subir (compresión + validación)
   */
  async processImageForUpload(file: File): Promise<{
    processedFile: File;
    thumbnail: string;
    validation: ImageValidationResult;
  }> {
    // Validar imagen
    const validation = await this.validateImage(file);
    if (!validation.isValid) {
      throw new Error(`Imagen inválida: ${validation.errors.join(', ')}`);
    }

    // Comprimir imagen si es necesario
    let processedFile = file;
    if (file.size > IMAGE_CONFIG.MAX_SIZE * 0.5) { // Comprimir si es mayor al 50% del límite
      processedFile = await ImageCompressor.compress(file);
    }

    // Generar thumbnail
    const thumbnail = await ImageCompressor.generateThumbnail(processedFile);

    return {
      processedFile,
      thumbnail,
      validation
    };
  }

  // ========================================
  // MÉTODOS DE API
  // ========================================

  /**
   * Obtiene todas las imágenes de un producto
   */
  async getProductImages(barCode: string): Promise<ProductImage[]> {
    try {
      const response = await apiClient.get<ProductImage[]>(
        PRODUCT_API_ENDPOINTS.PRODUCT_IMAGES(barCode)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener imágenes del producto:', error);
      throw new Error('Error al cargar las imágenes del producto');
    }
  }

  /**
   * Sube una nueva imagen de producto
   */
  async uploadProductImage(
    barCode: string, 
    imageData: ProductImageCreate
  ): Promise<ProductImage> {
    try {
      // Procesar imagen antes de subir
      const { processedFile } = await this.processImageForUpload(imageData.image);

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('image', processedFile);
      formData.append('order', imageData.order.toString());
      
      if (imageData.caption) {
        formData.append('caption', imageData.caption);
      }
      
      if (imageData.is_active !== undefined) {
        formData.append('is_active', imageData.is_active.toString());
      }

      const response = await apiClient.post<ProductImage>(
        PRODUCT_API_ENDPOINTS.PRODUCT_IMAGES(barCode),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw new Error(IMAGE_CONFIG.ERRORS.UPLOAD_FAILED);
    }
  }

  /**
   * Actualiza una imagen existente
   */
  async updateProductImage(
    barCode: string,
    imageId: number,
    updateData: ProductImageUpdate
  ): Promise<ProductImage> {
    try {
      const response = await apiClient.patch<ProductImage>(
        PRODUCT_API_ENDPOINTS.PRODUCT_IMAGE_DETAIL(barCode, imageId),
        updateData
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      throw new Error('Error al actualizar la imagen');
    }
  }

  /**
   * Elimina una imagen de producto
   */
  async deleteProductImage(barCode: string, imageId: number): Promise<void> {
    try {
      await apiClient.delete(
        PRODUCT_API_ENDPOINTS.PRODUCT_IMAGE_DETAIL(barCode, imageId)
      );
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      throw new Error(IMAGE_CONFIG.ERRORS.DELETE_FAILED);
    }
  }

  /**
   * Reordena imágenes de un producto
   */
  async reorderProductImages(
    barCode: string, 
    imageOrders: { id: number; order: number }[]
  ): Promise<ProductImage[]> {
    try {
      const updatePromises = imageOrders.map(({ id, order }) =>
        this.updateProductImage(barCode, id, { order })
      );

      const updatedImages = await Promise.all(updatePromises);
      return updatedImages;
    } catch (error) {
      console.error('Error al reordenar imágenes:', error);
      throw new Error('Error al reordenar las imágenes');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Genera URL de vista previa para archivo local
   */
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Libera URL de vista previa
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Convierte blob a File
   */
  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, {
      type: blob.type,
      lastModified: Date.now()
    });
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const imageService = ImageService.getInstance();