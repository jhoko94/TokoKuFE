import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { XMarkIcon, ArrowRightIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

function ModalTransferStok({ isOpen, onClose, product, onSuccess }) {
  const { warehouses, transferStock } = useStore();
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    if (product && product.units && product.units.length > 0) {
      setUnitName(product.units[0].name);
    }
  }, [product]);

  useEffect(() => {
    // Load available stock when warehouse or product changes
    if (fromWarehouseId && product) {
      loadAvailableStock();
    }
  }, [fromWarehouseId, product]);

  const loadAvailableStock = async () => {
    try {
      // TODO: Fetch stock from warehouse
      // For now, we'll use product stock as fallback
      setAvailableStock(product.stock);
    } catch (error) {
      console.error("Gagal memuat stok:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fromWarehouseId) {
      setError('Gudang asal harus dipilih');
      return;
    }
    if (!toWarehouseId) {
      setError('Gudang tujuan harus dipilih');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError('Gudang asal dan tujuan tidak boleh sama');
      return;
    }
    if (!unitName) {
      setError('Satuan harus dipilih');
      return;
    }
    if (!qty || qty <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }

    const unit = product.units.find(u => u.name === unitName);
    if (!unit) {
      setError('Satuan tidak ditemukan');
      return;
    }

    const stockNeeded = qty * unit.conversion;
    if (availableStock < stockNeeded) {
      setError(`Stok tidak cukup. Stok tersedia: ${Math.floor(availableStock / unit.conversion)} ${unitName}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await transferStock({
        productId: product.id,
        fromWarehouseId,
        toWarehouseId,
        qty,
        unitName,
        note: note.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Gagal transfer stok');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  const selectedUnit = product.units.find(u => u.name === unitName);
  const stockInUnit = selectedUnit ? Math.floor(availableStock / selectedUnit.conversion) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Transfer Stok Antar Gudang</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produk
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-gray-600">SKU: {product.sku}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Gudang <span className="text-red-500">*</span>
              </label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Gudang</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.isDefault && '(Default)'}
                  </option>
                ))}
              </select>
              {fromWarehouseId && (
                <div className="mt-1 text-xs text-gray-500">
                  Stok tersedia: {stockInUnit} {unitName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ke Gudang <span className="text-red-500">*</span>
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Gudang</option>
                {warehouses
                  .filter(wh => wh.id !== fromWarehouseId)
                  .map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.isDefault && '(Default)'}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Satuan <span className="text-red-500">*</span>
              </label>
              <select
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                {product.units.map(unit => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={stockInUnit}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (Opsional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="2"
              placeholder="Tambahkan catatan untuk transfer ini..."
            />
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowRightIcon className="w-5 h-5" />
              <span>{isSubmitting ? 'Memproses...' : 'Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalTransferStok;

