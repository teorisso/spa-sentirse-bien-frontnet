import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface PagoDebitoModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  discountApplied?: boolean;
  onPay: () => void;
}

const formatoPesos = (valor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);

const PagoDebitoModal: React.FC<PagoDebitoModalProps> = ({ isOpen, onClose, amount, discountApplied = false, onPay }) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  const reset = () => {
    setCardName('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, ''); // solo dígitos

    if (digits.length === 0) {
      setExpiry('');
      return;
    }

    if (digits.length <= 2) {
      setExpiry(digits);
      return;
    }

    // Limitar a 4 dígitos (MMYY)
    digits = digits.slice(0, 4);

    const formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    setExpiry(formatted);
  };

  const handlePagar = async () => {
    if (!cardName || !/^[0-9]{16}$/.test(cardNumber.replace(/\s+/g, '')) || !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry) || !/^[0-9]{3}$/.test(cvv)) {
      toast.error('Por favor completa los datos de la tarjeta correctamente');
      return;
    }
    try {
      setProcessing(true);
      await new Promise((res) => setTimeout(res, 1200)); // pequeña simulación
      onPay();
      toast.success('Pago realizado con éxito');
      reset();
      onClose();
    } catch (err) {
      toast.error('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-md"
          >
            {/* header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary">Pago con Débito</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" title="Cerrar modal">✕</button>
            </div>

            {/* contenido */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre en la tarjeta</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Número de tarjeta</label>
                <input
                  type="text"
                  maxLength={19}
                  inputMode="numeric"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim())}
                  placeholder="XXXX XXXX XXXX XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Vencimiento (MM/AA)</label>
                  <input
                    type="text"
                    maxLength={5}
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="08/27"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-md text-center">
                {discountApplied && <p className="text-sm text-green-700 mb-1">Descuento aplicado -15%</p>}
                <p className="text-lg font-semibold text-primary">Total: {formatoPesos(amount)}</p>
              </div>
            </div>

            {/* acciones */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-60"
                disabled={processing}
              >
                {processing ? 'Procesando…' : 'Pagar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PagoDebitoModal; 