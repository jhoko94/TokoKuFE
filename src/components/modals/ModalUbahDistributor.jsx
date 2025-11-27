import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalUbahDistributor({ isOpen, onClose, distributors, selectedCount, onConfirm }) {
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDistributorId) {
      alert('Pilih distributor terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedDistributorId);
      setSelectedDistributorId('');
      onClose();
    } catch (error) {
      console.error('Error updating distributor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Ubah Distributor</h3>
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
              Anda akan mengubah distributor untuk <strong>{selectedCount} produk</strong> yang dipilih.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Distributor Baru
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Distributor --</option>
              {distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting || !selectedDistributorId}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalUbahDistributor;

