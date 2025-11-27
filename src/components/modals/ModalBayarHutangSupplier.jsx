import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalBayarHutangSupplier({ distributor, onClose, onSuccess }) {
  const { payDistributorDebt } = useStore();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const maxAmount = Number(distributor.debt || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || amountNum <= 0) {
      setError('Jumlah bayar harus lebih dari 0');
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Jumlah bayar tidak boleh melebihi hutang (${formatRupiah(maxAmount)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await payDistributorDebt(distributor.id, amountNum);
      onSuccess();
    } catch (error) {
      setError(error.message || 'Gagal menyimpan pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Bayar Hutang Supplier</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Supplier:</p>
          <p className="text-lg font-semibold">{distributor.name}</p>
          <p className="text-sm text-gray-600 mt-2">Hutang saat ini:</p>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(maxAmount)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Bayar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Masukkan jumlah bayar"
              min="0"
              max={maxAmount}
              step="1000"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Maksimal: {formatRupiah(maxAmount)}
            </p>
          </div>

          {amountNum > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hutang saat ini:</span>
                <span className="font-semibold">{formatRupiah(maxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Jumlah bayar:</span>
                <span className="font-semibold text-blue-600">-{formatRupiah(amountNum)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-300">
                <span className="font-medium">Sisa hutang:</span>
                <span className="font-bold text-red-600">{formatRupiah(maxAmount - amountNum)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || amountNum <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Bayar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalBayarHutangSupplier;

