import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

function ModalReturPembelian({ isOpen, onClose, onSuccess }) {
  const { distributors, createReturPembelian, fetchCompletedPOs } = useStore();
  const [poNumber, setPoNumber] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [completedPOs, setCompletedPOs] = useState([]);
  const [returItems, setReturItems] = useState([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);

  // Filter POs berdasarkan distributor
  const filteredPOs = selectedDistributor
    ? completedPOs.filter(po => po.distributorId === selectedDistributor && po.status === 'COMPLETED')
    : [];

  // Load completed POs saat distributor dipilih
  useEffect(() => {
    if (selectedDistributor) {
      setIsLoadingPOs(true);
      fetchCompletedPOs(selectedDistributor)
        .then(data => {
          setCompletedPOs(data);
        })
        .catch(err => {
          console.error("Gagal mengambil PO completed:", err);
          setError('Gagal mengambil data PO');
        })
        .finally(() => {
          setIsLoadingPOs(false);
        });
    } else {
      setCompletedPOs([]);
    }
    setSelectedPO(null);
    setReturItems([]);
    setPoNumber('');
  }, [selectedDistributor, fetchCompletedPOs]);

  // Auto-select PO saat poNumber berubah
  useEffect(() => {
    if (selectedDistributor && poNumber && filteredPOs.length > 0) {
      // Cari PO berdasarkan ID (format PO-XXXX atau langsung ID)
      const poId = poNumber.trim();
      let found = null;
      
      if (poId.startsWith('PO-')) {
        const suffix = poId.slice(3).toUpperCase();
        found = filteredPOs.find(po => po.id.slice(-8).toUpperCase() === suffix);
      } else {
        found = filteredPOs.find(po => 
          po.id.toLowerCase().includes(poId.toLowerCase())
        );
      }
      
      if (found) {
        setSelectedPO(found);
        setPoNumber(`PO-${found.id.slice(-8).toUpperCase()}`);
      }
    }
  }, [selectedDistributor, poNumber, filteredPOs]);

  const handleSelectPO = (po) => {
    setSelectedPO(po);
    setReturItems([]);
    setPoNumber(`PO-${po.id.slice(-8).toUpperCase()}`);
  };

  const handleAddItem = (item) => {
    const product = item.product;
    const unit = product.units.find(u => u.name === item.unitName);
    if (!unit) return;

    const existingItem = returItems.find(ri => 
      ri.productId === item.productId && ri.unitName === item.unitName
    );
    
    if (existingItem) {
      setReturItems(returItems.map(ri => 
        ri.productId === item.productId && ri.unitName === item.unitName
          ? { ...ri, qty: ri.qty + 1 }
          : ri
      ));
    } else {
      // Cek stok tersedia
      const stockAvailable = Math.floor(product.stock / unit.conversion);
      if (stockAvailable < 1) {
        setError(`Stok ${product.name} tidak cukup untuk diretur`);
        setTimeout(() => setError(''), 3000);
        return;
      }

      setReturItems([...returItems, {
        productId: item.productId,
        productName: product.name,
        unitName: item.unitName,
        qty: 1,
        priceAtRetur: 0, // Harga saat retur (bisa diisi manual atau dari PO)
        conversion: unit.conversion,
      }]);
    }
  };

  const handleUpdateQty = (index, change) => {
    const updated = [...returItems];
    const item = updated[index];
    const newQty = item.qty + change;
    
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      // Cek stok tersedia
      const product = selectedPO.items.find(i => i.productId === item.productId)?.product;
      if (product) {
        const unit = product.units.find(u => u.name === item.unitName);
        if (unit) {
          const stockAvailable = Math.floor(product.stock / unit.conversion);
          if (newQty > stockAvailable) {
            setError(`Stok ${product.name} tidak cukup. Stok tersedia: ${stockAvailable} ${item.unitName}`);
            setTimeout(() => setError(''), 3000);
            return;
          }
        }
      }
      
      updated[index].qty = newQty;
      updated[index].subtotal = updated[index].priceAtRetur * newQty;
    }
    setReturItems(updated);
  };

  const handleUpdatePrice = (index, price) => {
    const updated = [...returItems];
    updated[index].priceAtRetur = parseFloat(price) || 0;
    updated[index].subtotal = updated[index].priceAtRetur * updated[index].qty;
    setReturItems(updated);
  };

  const handleRemoveItem = (index) => {
    setReturItems(returItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!poNumber.trim()) {
      setError('Nomor PO harus diisi');
      return;
    }
    if (!selectedDistributor) {
      setError('Supplier harus dipilih');
      return;
    }
    if (!selectedPO) {
      setError('PO harus dipilih');
      return;
    }
    if (returItems.length === 0) {
      setError('Minimal harus ada 1 item yang diretur');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReturPembelian({
        poNumber: poNumber.trim(),
        distributorId: selectedDistributor,
        items: returItems,
        note: note.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Gagal membuat retur pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRetur = returItems.reduce((acc, item) => acc + (item.priceAtRetur * item.qty), 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Retur Pembelian</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor PO <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Masukkan nomor PO"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistributor}
                onChange={(e) => {
                  setSelectedDistributor(e.target.value);
                  setSelectedPO(null);
                  setReturItems([]);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Supplier</option>
                {distributors.map(distributor => (
                  <option key={distributor.id} value={distributor.id}>{distributor.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List PO */}
          {selectedDistributor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih PO (yang sudah diterima):
              </label>
              {isLoadingPOs ? (
                <div className="text-center py-4 text-gray-500">Memuat data PO...</div>
              ) : filteredPOs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Tidak ada PO yang sudah diterima untuk supplier ini
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredPOs.map(po => (
                    <div
                      key={po.id}
                      onClick={() => handleSelectPO(po)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedPO?.id === po.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold">PO-{po.id.slice(-8).toUpperCase()}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(po.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {po.distributor.name} - {po.items.length} item
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Items dari PO */}
          {selectedPO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item yang Dapat Diretur:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {selectedPO.items.map((item, idx) => {
                  const product = item.product;
                  const unit = product.units.find(u => u.name === item.unitName);
                  const stockAvailable = unit ? Math.floor(product.stock / unit.conversion) : 0;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.qty} {item.unitName} | Stok tersedia: {stockAvailable} {item.unitName}
                        </div>
                      </div>
                      {stockAvailable > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Tambah
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items Retur */}
          {returItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Retur:
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Satuan</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Harga Retur</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {returItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{item.productName}</td>
                        <td className="px-4 py-2 text-sm">{item.unitName}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-12 text-center">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.priceAtRetur}
                            onChange={(e) => handleUpdatePrice(idx, e.target.value)}
                            className="w-24 p-1 border border-gray-300 rounded text-sm"
                            min="0"
                            step="1000"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold">
                          {formatRupiah(Number(item.priceAtRetur * item.qty))}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-4 py-2 text-right font-semibold">Total Retur:</td>
                      <td className="px-4 py-2 font-bold text-lg">{formatRupiah(totalRetur)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (Opsional):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="2"
              placeholder="Tambahkan catatan untuk retur ini..."
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
              disabled={isSubmitting || returItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Retur'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalReturPembelian;

