import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalUbahSatuan({ isOpen, onClose, unitType, selectedCount, onConfirm }) {
  const [unitName, setUnitName] = useState('');
  const [price, setPrice] = useState('');
  const [conversion, setConversion] = useState(unitType === 'small' ? '1' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const unitTypeLabel = unitType === 'small' ? 'Kecil' : 'Besar';
  const defaultConversion = unitType === 'small' ? 1 : 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!unitName.trim()) {
      alert('Nama satuan harus diisi');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert('Harga satuan harus > 0');
      return;
    }
    const conversionNum = parseInt(conversion) || defaultConversion;
    if (unitType === 'small' && conversionNum !== 1) {
      alert('Satuan kecil harus memiliki conversion = 1');
      return;
    }
    if (unitType === 'large' && conversionNum <= 1) {
      alert('Satuan besar harus memiliki conversion > 1');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(unitName.trim(), parseFloat(price), conversionNum);
      setUnitName('');
      setPrice('');
      setConversion(unitType === 'small' ? '1' : '');
      onClose();
    } catch (error) {
      console.error('Error updating unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Ubah Satuan {unitTypeLabel}</h3>
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
              Anda akan mengubah satuan <strong>{unitTypeLabel.toLowerCase()}</strong> untuk <strong>{selectedCount} produk</strong> yang dipilih.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Satuan
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Contoh: PCS, BOX, KARTON"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Satuan
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konversi (dari satuan kecil)
                  {unitType === 'small' && (
                    <span className="text-xs text-gray-500 ml-2">(Harus = 1)</span>
                  )}
                  {unitType === 'large' && (
                    <span className="text-xs text-gray-500 ml-2">(Harus &gt; 1)</span>
                  )}
                </label>
                <input
                  type="number"
                  min={unitType === 'small' ? '1' : '2'}
                  value={conversion}
                  onChange={(e) => setConversion(e.target.value)}
                  placeholder={unitType === 'small' ? '1' : '2'}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting || unitType === 'small'}
                />
                {unitType === 'small' && (
                  <p className="text-xs text-gray-500 mt-1">Satuan kecil selalu memiliki conversion = 1</p>
                )}
              </div>
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !unitName.trim() || !price || parseFloat(price) <= 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalUbahSatuan;

