import React, { useState } from 'react';

// Interface para los datos de checkout
interface CheckoutData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  billing_address?: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'check';
  notes?: string;
  same_billing_address?: boolean;
}

// Interface para información de pago
interface PaymentInfo {
  method: 'cash' | 'card' | 'transfer' | 'check';
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  transfer_reference?: string;
  check_number?: string;
}

interface CartCheckoutProps {
  cartItems: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_amount: number;
    final_price: number;
  }>;
  cartSummary: {
    total_items: number;
    subtotal: number;
    total_discount: number;
    taxes: number;
    total_amount: number;
  };
  onCheckoutComplete?: (orderId: number) => void;
  onCancel?: () => void;
  className?: string;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({
  cartItems,
  cartSummary,
  onCheckoutComplete,
  onCancel,
  className = ''
}) => {
  // Estados
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    billing_address: '',
    payment_method: 'cash',
    notes: '',
    same_billing_address: true
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'cash'
  });

  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'review'>('info');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validación de campos
  const validateCustomerInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!checkoutData.customer_name.trim()) {
      newErrors.customer_name = 'El nombre es obligatorio';
    }

    if (!checkoutData.customer_email.trim()) {
      newErrors.customer_email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(checkoutData.customer_email)) {
      newErrors.customer_email = 'El email no es válido';
    }

    if (!checkoutData.shipping_address.trim()) {
      newErrors.shipping_address = 'La dirección de envío es obligatoria';
    }

    if (!checkoutData.same_billing_address && !checkoutData.billing_address?.trim()) {
      newErrors.billing_address = 'La dirección de facturación es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentInfo.method === 'card') {
      if (!paymentInfo.card_number?.trim()) {
        newErrors.card_number = 'El número de tarjeta es obligatorio';
      }
      if (!paymentInfo.card_expiry?.trim()) {
        newErrors.card_expiry = 'La fecha de vencimiento es obligatoria';
      }
      if (!paymentInfo.card_cvv?.trim()) {
        newErrors.card_cvv = 'El CVV es obligatorio';
      }
    } else if (paymentInfo.method === 'transfer') {
      if (!paymentInfo.transfer_reference?.trim()) {
        newErrors.transfer_reference = 'La referencia de transferencia es obligatoria';
      }
    } else if (paymentInfo.method === 'check') {
      if (!paymentInfo.check_number?.trim()) {
        newErrors.check_number = 'El número de cheque es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo de pasos
  const handleNextStep = () => {
    if (currentStep === 'info' && validateCustomerInfo()) {
      setCurrentStep('payment');
    } else if (currentStep === 'payment' && validatePaymentInfo()) {
      setCurrentStep('review');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('info');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  // Procesar checkout
  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // Simular procesamiento de orden por ahora
      // En producción, esto debería integrar con el orderService
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      // Generar un ID de orden simulado
      const orderId = Math.floor(Math.random() * 10000) + 1000;
      
      if (onCheckoutComplete) {
        onCheckoutComplete(orderId);
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      setErrors({ checkout: 'Error al procesar la orden. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Render del paso de información del cliente
  const renderCustomerInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={checkoutData.customer_name}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, customer_name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customer_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingrese el nombre completo"
          />
          {errors.customer_name && (
            <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={checkoutData.customer_email}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, customer_email: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customer_email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="correo@ejemplo.com"
          />
          {errors.customer_email && (
            <p className="text-red-500 text-xs mt-1">{errors.customer_email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={checkoutData.customer_phone}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, customer_phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Número de teléfono"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección de envío *
        </label>
        <textarea
          value={checkoutData.shipping_address}
          onChange={(e) => setCheckoutData(prev => ({ ...prev, shipping_address: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.shipping_address ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Dirección completa de envío"
        />
        {errors.shipping_address && (
          <p className="text-red-500 text-xs mt-1">{errors.shipping_address}</p>
        )}
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={checkoutData.same_billing_address}
            onChange={(e) => setCheckoutData(prev => ({ 
              ...prev, 
              same_billing_address: e.target.checked 
            }))}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            Usar la misma dirección para facturación
          </span>
        </label>
      </div>

      {!checkoutData.same_billing_address && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección de facturación *
          </label>
          <textarea
            value={checkoutData.billing_address}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, billing_address: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.billing_address ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Dirección de facturación"
          />
          {errors.billing_address && (
            <p className="text-red-500 text-xs mt-1">{errors.billing_address}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales
        </label>
        <textarea
          value={checkoutData.notes}
          onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Instrucciones especiales o comentarios"
        />
      </div>
    </div>
  );

  // Render del paso de información de pago
  const renderPaymentInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'cash', label: 'Efectivo', icon: '💵' },
            { key: 'card', label: 'Tarjeta', icon: '💳' },
            { key: 'transfer', label: 'Transferencia', icon: '🏦' },
            { key: 'check', label: 'Cheque', icon: '📝' }
          ].map(method => (
            <button
              key={method.key}
              type="button"
              onClick={() => {
                setPaymentInfo(prev => ({ ...prev, method: method.key as any }));
                setCheckoutData(prev => ({ ...prev, payment_method: method.key as any }));
              }}
              className={`p-3 border-2 rounded-lg text-center transition-colors ${
                paymentInfo.method === method.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{method.icon}</div>
              <div className="text-xs font-medium">{method.label}</div>
            </button>
          ))}
        </div>
      </div>

      {paymentInfo.method === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de tarjeta *
            </label>
            <input
              type="text"
              value={paymentInfo.card_number}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, card_number: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.card_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1234 5678 9012 3456"
            />
            {errors.card_number && (
              <p className="text-red-500 text-xs mt-1">{errors.card_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vencimiento *
            </label>
            <input
              type="text"
              value={paymentInfo.card_expiry}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, card_expiry: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.card_expiry ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="MM/AA"
            />
            {errors.card_expiry && (
              <p className="text-red-500 text-xs mt-1">{errors.card_expiry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV *
            </label>
            <input
              type="text"
              value={paymentInfo.card_cvv}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, card_cvv: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.card_cvv ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123"
            />
            {errors.card_cvv && (
              <p className="text-red-500 text-xs mt-1">{errors.card_cvv}</p>
            )}
          </div>
        </div>
      )}

      {paymentInfo.method === 'transfer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referencia de transferencia *
          </label>
          <input
            type="text"
            value={paymentInfo.transfer_reference}
            onChange={(e) => setPaymentInfo(prev => ({ ...prev, transfer_reference: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.transfer_reference ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Número de referencia"
          />
          {errors.transfer_reference && (
            <p className="text-red-500 text-xs mt-1">{errors.transfer_reference}</p>
          )}
        </div>
      )}

      {paymentInfo.method === 'check' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de cheque *
          </label>
          <input
            type="text"
            value={paymentInfo.check_number}
            onChange={(e) => setPaymentInfo(prev => ({ ...prev, check_number: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.check_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Número del cheque"
          />
          {errors.check_number && (
            <p className="text-red-500 text-xs mt-1">{errors.check_number}</p>
          )}
        </div>
      )}
    </div>
  );

  // Render del paso de revisión
  const renderReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Resumen de la Orden</h3>
      
      {/* Resumen de productos */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Productos ({cartSummary.total_items})</h4>
        <div className="space-y-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product_name} × {item.quantity}</span>
              <span>${item.final_price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Información del cliente */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Información del Cliente</h4>
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Nombre:</span> {checkoutData.customer_name}</p>
          <p><span className="font-medium">Email:</span> {checkoutData.customer_email}</p>
          {checkoutData.customer_phone && (
            <p><span className="font-medium">Teléfono:</span> {checkoutData.customer_phone}</p>
          )}
          <p><span className="font-medium">Envío:</span> {checkoutData.shipping_address}</p>
        </div>
      </div>

      {/* Información de pago */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Método de Pago</h4>
        <p className="text-sm capitalize">{paymentInfo.method}</p>
      </div>

      {/* Totales */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Totales</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${cartSummary.subtotal.toLocaleString()}</span>
          </div>
          {cartSummary.total_discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento:</span>
              <span>-${cartSummary.total_discount.toLocaleString()}</span>
            </div>
          )}
          {cartSummary.taxes > 0 && (
            <div className="flex justify-between">
              <span>Impuestos:</span>
              <span>${cartSummary.taxes.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>${cartSummary.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {errors.checkout && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{errors.checkout}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'info', label: 'Información', step: 1 },
            { key: 'payment', label: 'Pago', step: 2 },
            { key: 'review', label: 'Revisión', step: 3 }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.key
                  ? 'bg-blue-600 text-white'
                  : index < ['info', 'payment', 'review'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.step}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep === step.key ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
              {index < 2 && (
                <div className={`w-16 h-px mx-4 ${
                  index < ['info', 'payment', 'review'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {currentStep === 'info' && renderCustomerInfo()}
        {currentStep === 'payment' && renderPaymentInfo()}
        {currentStep === 'review' && renderReview()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep !== 'info' && (
            <button
              type="button"
              onClick={handlePreviousStep}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="ml-3 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        <div>
          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Procesando...' : 'Confirmar Orden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartCheckout;