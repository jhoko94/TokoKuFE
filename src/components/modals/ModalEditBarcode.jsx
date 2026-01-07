import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalEditBarcode({ barcode, onClose, onSave }) {
  const { updateBarcode, generateBarcode } = useStore();
  
  const [barcodeValue, setBarcodeValue] = useState(barcode?.barcode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handler untuk generate barcode
  const handleGenerateBarcode = async () => {
    try {
      const response = await generateBarcode(1);
      if (response.barcodes && response.barcodes.length > 0) {
        setBarcodeValue(response.barcodes[0]);
      }
    } catch (error) {
      console.error("Gagal generate barcode:", error);
    }
  };

  // Handler untuk submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!barcodeValue || !barcodeValue.trim()) {
      setErrors({ barcode: 'Barcode harus diisi' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBarcode(barcode.id, barcodeValue.trim());
      onSave();
    } catch (error) {
      // Error sudah ditangani di updateBarcode
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!barcode) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[101] p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Edit Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info Produk (Read-only) */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Produk</div>
            <div className="font-medium text-gray-900">{barcode.product.name}</div>
            <div className="text-sm text-gray-500">{barcode.product.sku}</div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Distributor</div>
            <div className="font-medium text-gray-900">{barcode.distributor.name}</div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Satuan</div>
            <div className="font-medium text-gray-900">{barcode.unit.name}</div>
          </div>

          {/* Input Barcode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcodeValue}
                onChange={(e) => {
                  setBarcodeValue(e.target.value);
                  setErrors({ ...errors, barcode: '' });
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm font-mono"
                required
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Generate
              </button>
            </div>
            {errors.barcode && (
              <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

