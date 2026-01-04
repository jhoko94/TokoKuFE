import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalUbahMinStock({ isOpen, onClose, selectedCount, onConfirm }) {
  const [minStock, setMinStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const minStockNum = parseInt(minStock);
    if (isNaN(minStockNum) || minStockNum < 0) {
      alert('Stok minimum harus >= 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(minStockNum);
      setMinStock('');
      onClose();
    } catch (error) {
      console.error('Error updating min stock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Ubah Minimal Stok</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Anda akan mengubah stok minimum untuk <strong>{selectedCount} produk</strong> yang dipilih.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stok Minimum Baru
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="Masukkan stok minimum"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-2">
              Stok minimum digunakan untuk alert ketika stok produk mencapai batas minimum.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || minStock === '' || parseInt(minStock) < 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalUbahMinStock;

