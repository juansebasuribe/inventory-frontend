import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  DollarSign,
  Upload,
  Trash2,
  Save,
} from "lucide-react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { getProductImageUrl } from "../../../shared/utils/url.utils";
import type {
  Product,
  ProductUpdate,
} from "../../../shared/types/product.types";

interface Category {
  id: number;
  name: string;
  level: number;
  is_active: boolean;
}

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated: (product: Product) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}) => {
  const _instanceId = React.useRef(Math.random().toString(36).slice(2, 9));

  React.useEffect(() => {
    if (isOpen) {
      // tslint:disable-next-line:no-console
      console.log(`[mount] ProductEditModal id=${_instanceId.current} product=${product?.bar_code} time=${Date.now()}`);
    }
    return () => {
      // tslint:disable-next-line:no-console
      console.log(`[unmount] ProductEditModal id=${_instanceId.current} product=${product?.bar_code} time=${Date.now()}`);
    };
  }, [isOpen, product?.bar_code]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    retail_price: 0,
    cost_price: 0,
    category: 1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentMainImage, setCurrentMainImage] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Cargar categorías
  useEffect(() => {
    if (isOpen) {
      categoryService
        .getCategories()
        .then((data) => setCategories(data.results || []))
        .catch((error) => console.error("Error loading categories:", error));
    }
  }, [isOpen]);

  // Cargar datos del producto
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        retail_price: product.retail_price,
        cost_price: product.cost_price,
        category: product.category,
      });

      if (product.main_image) {
        setCurrentMainImage(getProductImageUrl(product));
      }

      setMainImage(null);
      setMainImagePreview("");
      setErrors({});
    }
  }, [isOpen, product?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("⚠️ No se seleccionó archivo");
      return;
    }

    console.log("📸 Archivo seleccionado:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!file.type.startsWith("image/")) {
      console.error("❌ Tipo de archivo inválido:", file.type);
      setErrors((prev) => ({ ...prev, main_image: "Debe ser una imagen válida" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error("❌ Archivo muy grande:", file.size);
      setErrors((prev) => ({ ...prev, main_image: "Imagen debe ser menor a 5MB" }));
      return;
    }

    setMainImage(file);
    console.log("✅ Archivo guardado en estado mainImage");

    const reader = new FileReader();
    reader.onload = (e) => {
      setMainImagePreview(e.target?.result as string);
      console.log("✅ Preview creado exitosamente");
    };
    reader.onerror = (error) => {
      console.error("❌ Error al crear preview:", error);
    };
    reader.readAsDataURL(file);

    if (errors.main_image) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.main_image;
        return newErrors;
      });
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview("");
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = "";
      } catch (e) {
        // some older browsers may throw, but it's safe to ignore here
        console.warn('Could not reset file input value', e);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nombre requerido";
    }

    if (formData.retail_price <= 0) {
      newErrors.retail_price = "Precio debe ser mayor a 0";
    }

    if (formData.cost_price <= 0) {
      newErrors.cost_price = "Costo debe ser mayor a 0";
    }

    if (formData.retail_price <= formData.cost_price) {
      newErrors.retail_price = "Precio debe ser mayor al costo";
    }

    if (!formData.category) {
      newErrors.category = "Categoría requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !product) return;

    setLoading(true);

    try {
      const productData: ProductUpdate = {
        ...formData,
        main_image: mainImage || undefined,
      };

      console.log("📤 Datos de actualización:", {
        barCode: product.bar_code,
        hasMainImage: !!mainImage,
        mainImageInfo: mainImage ? {
          name: mainImage.name,
          size: mainImage.size,
          type: mainImage.type
        } : null,
        formFields: Object.keys(formData)
      });

      const updatedProduct = await productService.updateProduct(
        product.bar_code,
        productData
      );

      console.log("✅ Producto actualizado exitosamente");
      
      // IMPORTANTE: Resetear loading
      setLoading(false);
      
      // Notificar la actualización (esto cerrará el modal desde el padre)
      onProductUpdated(updatedProduct);
      
    } catch (error: any) {
      console.error("❌ Error al actualizar:", error);

      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Error al actualizar el producto";

      setErrors({ general: errorMessage });
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
              <p className="text-gray-600 text-sm mt-1">{product.bar_code}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Información
              </h3>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nombre del producto"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:opacity-50"
                  placeholder="Descripción del producto..."
                  disabled={loading}
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Precios e imagen */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Precios e Imagen
              </h3>

              {/* Precio de venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  name="retail_price"
                  value={formData.retail_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    errors.retail_price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors.retail_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.retail_price}</p>
                )}
              </div>

              {/* Precio de costo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Costo *
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    errors.cost_price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors.cost_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.cost_price}</p>
                )}
              </div>

              {/* Imagen principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Principal
                </label>

                {currentMainImage && !mainImagePreview && (
                  <div className="mb-3">
                    <img
                      src={currentMainImage}
                      alt="Imagen actual"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {mainImagePreview && (
                  <div className="mb-3">
                    <img
                      src={mainImagePreview}
                      alt="Nueva imagen"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-green-500"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition text-center disabled:opacity-50">
                    <Upload className="w-4 h-4 inline mr-2" />
                    <span className="text-sm">Cambiar imagen</span>
                    <input
                      type="file"
                      id="main-image-input"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleMainImageChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>

                  {mainImage && (
                    <button
                      type="button"
                      onClick={removeMainImage}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {errors.main_image && (
                  <p className="text-red-500 text-xs mt-2">{errors.main_image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );

  return modalContent;
};

export default ProductEditModal;
