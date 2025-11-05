// src/features/products/components/ProductCreateModal.tsx


import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Hash, FileText, Tag, Upload, Image, Trash2, ArrowUpDown } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { ProductCreate } from '../../../shared/types/product.types';

interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  is_active: boolean;
  created_date: string;
  updated_date: string;
}

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
}

export const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  // TEMPORAL: Deshabilitar imágenes adicionales hasta que se arregle el backend
  const ENABLE_ADDITIONAL_IMAGES = false;
  
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    bar_code: '',
    retail_price: 0,
    cost_price: 0,
    category: 1,
    minimum_stock: 0,
    maximum_stock: 0
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data.results || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Funciones para manejar imágenes
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, main_image: 'Por favor selecciona un archivo de imagen válido' }));
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, main_image: 'La imagen debe ser menor a 5MB' }));
        return;
      }

      setMainImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMainImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Limpiar error
      if (errors.main_image) {
        setErrors(prev => ({ ...prev, main_image: '' }));
      }
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar que no excedan 4 imágenes adicionales
    if (additionalImages.length + files.length > 4) {
      setErrors(prev => ({ ...prev, additional_images: 'Máximo 4 imágenes adicionales permitidas' }));
      return;
    }

    // Validar cada archivo
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, additional_images: 'Todos los archivos deben ser imágenes válidas' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, additional_images: 'Cada imagen debe ser menor a 5MB' }));
        return;
      }

      validFiles.push(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setAdditionalImages(prev => [...prev, ...validFiles]);
    
    // Limpiar error
    if (errors.additional_images) {
      setErrors(prev => ({ ...prev, additional_images: '' }));
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview('');
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bar_code.trim()) {
      newErrors.bar_code = 'El código de barras es requerido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.retail_price <= 0) {
      newErrors.retail_price = 'El precio debe ser mayor a 0';
    }

    if (formData.cost_price < 0) {
      newErrors.cost_price = 'El costo no puede ser negativo';
    }

    if (formData.minimum_stock !== undefined && formData.minimum_stock <= 0) {
      newErrors.minimum_stock = 'El stock mínimo debe ser mayor a 0';
    }

    if (formData.maximum_stock !== undefined && formData.maximum_stock <= 0) {
      newErrors.maximum_stock = 'El stock máximo debe ser mayor a 0';
    }

    if (
      formData.minimum_stock !== undefined &&
      formData.maximum_stock !== undefined &&
      formData.maximum_stock < formData.minimum_stock
    ) {
      newErrors.maximum_stock = 'El stock máximo debe ser mayor o igual al mínimo';
    }

    if (!formData.category) {
      newErrors.category = 'Debe seleccionar una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Preparar datos del producto con imágenes
      const productData: ProductCreate = {
        ...formData,
        main_image: mainImage || undefined,
        // TEMPORAL: Deshabilitar imágenes adicionales hasta que se arregle el backend
        additional_images: ENABLE_ADDITIONAL_IMAGES && additionalImages.length > 0 ? additionalImages.map((file, index) => ({ 
          image: file, 
          order: index + 1,
          is_active: true 
        })) : undefined
      };

      const newProduct = await productService.createProduct(productData);
      
      // Verificar si se creó exitosamente
      if (newProduct) {
        onProductCreated(newProduct);
        onClose();
        
        // Resetear formulario
        setFormData({
          name: '',
          description: '',
          bar_code: '',
          retail_price: 0,
          cost_price: 0,
          category: 1,
          minimum_stock: 0,
          maximum_stock: 0
        });
        setErrors({});
        
        // Resetear imágenes
        setMainImage(null);
        setMainImagePreview('');
        setAdditionalImages([]);
        setAdditionalImagePreviews([]);
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Manejar errores del servidor
      if (error.response?.data) {
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            serverErrors[key] = error.response.data[key][0];
          } else {
            serverErrors[key] = error.response.data[key];
          }
        });
        setErrors(serverErrors);
      } else {
        setErrors({ general: 'Error al crear el producto. Intenta nuevamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Producto</h2>
                <p className="text-sm text-gray-500">Agregar producto al catálogo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Grid de campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código de barras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Código de Barras *
              </label>
              <input
                type="text"
                name="bar_code"
                value={formData.bar_code}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.bar_code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: 123456789012"
                required
              />
              {errors.bar_code && <p className="text-red-500 text-xs mt-1">{errors.bar_code}</p>}
            </div>

            {/* Nombre del producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Nombre del producto"
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio de Venta *
              </label>
              <input
                type="number"
                name="retail_price"
                value={formData.retail_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.retail_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
                required
              />
              {errors.retail_price && <p className="text-red-500 text-xs mt-1">{errors.retail_price}</p>}
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Costo
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.cost_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.cost_price && <p className="text-red-500 text-xs mt-1">{errors.cost_price}</p>}
            </div>

            {/* Stock mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowUpDown className="w-4 h-4 inline mr-1" />
                Stock Mínimo *
              </label>
              <input
                type="number"
                name="minimum_stock"
                value={formData.minimum_stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.minimum_stock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: 10"
                required
              />
              {errors.minimum_stock && <p className="text-red-500 text-xs mt-1">{errors.minimum_stock}</p>}
            </div>

            {/* Stock máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowUpDown className="w-4 h-4 inline mr-1" />
                Stock Máximo *
              </label>
              <input
                type="number"
                name="maximum_stock"
                value={formData.maximum_stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.maximum_stock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: 100"
                required
              />
              {errors.maximum_stock && <p className="text-red-500 text-xs mt-1">{errors.maximum_stock}</p>}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="Descripción detallada del producto..."
            />
          </div>

          {/* Sección de imágenes */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Imágenes del Producto
            </h3>

            {/* Imagen principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen Principal
              </label>
              <div className="space-y-4">
                {mainImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={mainImagePreview}
                      alt="Imagen principal"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeMainImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí o haz clic para seleccionar</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageChange}
                      className="hidden"
                      id="main-image-input"
                    />
                    <label
                      htmlFor="main-image-input"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Seleccionar Imagen
                    </label>
                  </div>
                )}
                {errors.main_image && <p className="text-red-500 text-xs mt-1">{errors.main_image}</p>}
              </div>
            </div>

            {/* Imágenes adicionales */}
            {ENABLE_ADDITIONAL_IMAGES ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes Adicionales (Máximo 4)
                </label>
                <div className="space-y-4">
                  {additionalImagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Imagen adicional ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {additionalImages.length < 4 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 mb-2">Imágenes adicionales del producto</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesChange}
                        className="hidden"
                        id="additional-images-input"
                      />
                      <label
                        htmlFor="additional-images-input"
                        className="cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Agregar Imágenes
                      </label>
                    </div>
                  )}
                  {errors.additional_images && <p className="text-red-500 text-xs mt-1">{errors.additional_images}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Imágenes adicionales temporalmente deshabilitadas
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Por el momento, solo puedes subir la imagen principal. Las imágenes adicionales estarán disponibles pronto.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};