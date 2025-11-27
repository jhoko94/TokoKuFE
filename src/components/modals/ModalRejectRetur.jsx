import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalRejectRetur({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
    setReason('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Tolak Retur Penjualan</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-gray-700 mb-3">Apakah Anda yakin ingin menolak retur penjualan ini?</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan Penolakan (Opsional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-base"
              rows="3"
              placeholder="Masukkan alasan penolakan..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tolak Retur
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalRejectRetur;

