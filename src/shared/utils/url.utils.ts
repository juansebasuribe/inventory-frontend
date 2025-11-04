// src/shared/utils/url.utils.ts

/**
 * Utilidades para manejo de URLs
 */

// Configuración de la API base desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Convierte una ruta relativa de imagen en una URL absoluta
 * @param imagePath - Ruta de la imagen (puede ser relativa o absoluta)
 * @returns URL absoluta de la imagen
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) {
    return '/placeholder-product.svg';
  }

  // Si ya es una URL absoluta, devolverla tal como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si es una ruta relativa que empieza con /media/, convertir a absoluta
  if (imagePath.startsWith('/media/')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Si es una ruta relativa sin /media/, agregar la base
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Si no empieza con /, agregar / y la base
  return `${API_BASE_URL}/${imagePath}`;
};

/**
 * Obtiene la URL de la imagen principal de un producto
 * @param product - Producto del cual obtener la imagen
 * @returns URL de la imagen principal o placeholder
 */
export const getProductImageUrl = (product: any): string => {
  // Prioridad: image (API simple) > main_image > primera imagen adicional > placeholder
  if (product.image) {
    return getImageUrl(product.image);
  }

  if (product.main_image) {
    return getImageUrl(product.main_image);
  }

  if (product.additional_images && product.additional_images.length > 0) {
    const firstAdditional = product.additional_images[0];
    return getImageUrl(firstAdditional.image_url || firstAdditional.image);
  }

  if (product.all_images && product.all_images.length > 0) {
    const firstImage = product.all_images[0];
    return getImageUrl(firstImage.image);
  }

  return '/placeholder-product.svg';
};

/**
 * Obtiene todas las URLs de imágenes de un producto
 * @param product - Producto del cual obtener las imágenes
 * @returns Array de URLs de imágenes
 */
export const getProductImages = (product: any): string[] => {
  const images: string[] = [];

  // Agregar imagen principal
  if (product.main_image) {
    images.push(getImageUrl(product.main_image));
  }

  // Agregar imágenes adicionales
  if (product.additional_images && product.additional_images.length > 0) {
    product.additional_images.forEach((img: any) => {
      images.push(getImageUrl(img.image_url || img.image));
    });
  }

  // Agregar all_images si no hay additional_images
  if (images.length <= 1 && product.all_images && product.all_images.length > 0) {
    product.all_images.forEach((img: any) => {
      if (img.type !== 'main') { // Evitar duplicar la imagen principal
        images.push(getImageUrl(img.image));
      }
    });
  }

  return images.length > 0 ? images : ['/placeholder-product.svg'];
};