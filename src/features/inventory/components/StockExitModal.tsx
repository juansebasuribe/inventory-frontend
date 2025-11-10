import React, { useState, useEffect } from "react";
import { X, Minus, AlertCircle } from "lucide-react";
import { inventoryService } from "../../products/services/inventoryService";
import { apiClient } from "../../../shared/services";

interface StockExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

interface ExitData {
  warehouse_id: string;
  product_code: string;
  quantity: number;
  reason: string;
  notes: string;
}

export const StockExitModal: React.FC<StockExitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ExitData>({
    warehouse_id: "",
    product_code: "",
    quantity: 0,
    reason: "sale",
    notes: "",
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reasons = [
    { value: "sale", label: "Venta" },
    { value: "damaged", label: "Dañado" },
    { value: "loss", label: "Pérdida" },
    { value: "transfer", label: "Transferencia" },
    { value: "adjustment", label: "Ajuste" },
  ];

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
    }
  }, [isOpen]);

  const loadWarehouses = async () => {
    try {
      // Cargar ubicaciones reales del backend
      const response = await apiClient.get<any>('/api/warehouse/v1/locations/');
      
      // Mapear los datos: usar 'code' como ID para enviar al backend
      const locations = response.results?.map((loc: any) => ({
        id: loc.code,      // Usar el 'code' como identificador
        code: loc.code,
        name: loc.name,
      })) || [];
      
      setWarehouses(locations);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      // Fallback a datos hardcodeados si hay error
      setWarehouses([
        { id: "LOC001", code: "LOC001", name: "Ubicación Principal" },
        { id: "LOC002", code: "LOC002", name: "Bodega 1" },
      ]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.warehouse_id) {
      newErrors.warehouse_id = "Almacén requerido";
    }
    if (!formData.product_code.trim()) {
      newErrors.product_code = "Código de producto requerido";
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = "Cantidad debe ser mayor a 0";
    }
    if (!formData.reason) {
      newErrors.reason = "Razón requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await inventoryService.createMovement({
        movement_type: "exit",
        product_barcode: formData.product_code,
        quantity: formData.quantity,
        from_location_code: String(formData.warehouse_id),
        reference_number: formData.reason,
        notes: formData.notes,
      });

      onSubmit();
      onClose();
      
      // Reset form
      setFormData({
        warehouse_id: "",
        product_code: "",
        quantity: 0,
        reason: "sale",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setErrors({ general: error.message || "Error al registrar salida" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Salida de Stock</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Almacén */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación / Almacén *
            </label>
            <select
              value={formData.warehouse_id}
              onChange={(e) =>
                setFormData({ ...formData, warehouse_id: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                errors.warehouse_id ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            >
              <option value="">Seleccionar ubicación...</option>
              {warehouses.map((wh) => (
                <option key={wh.code} value={wh.code}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
            {errors.warehouse_id && (
              <p className="text-red-500 text-xs mt-1">{errors.warehouse_id}</p>
            )}
          </div>

          {/* Código de Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Producto
            </label>
            <input
              type="text"
              value={formData.product_code}
              onChange={(e) =>
                setFormData({ ...formData, product_code: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                errors.product_code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: PLK-001"
              disabled={loading}
            />
            {errors.product_code && (
              <p className="text-red-500 text-xs mt-1">{errors.product_code}</p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                errors.quantity ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0"
              min="1"
              disabled={loading}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Razón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón de Salida
            </label>
            <select
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                errors.reason ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
              placeholder="Descripción adicional..."
              rows={3}
              disabled={loading}
            />
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Registrar Salida
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockExitModal;
