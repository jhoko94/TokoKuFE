import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function ModalReturPenjualan({ isOpen, onClose, onSuccess }) {
  const { customers, getAllTransactions, createReturPenjualan, getReturPenjualanByInvoice, user } = useStore();
  const isKasir = user?.role === 'KASIR';
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [previousReturs, setPreviousReturs] = useState([]); // Retur sebelumnya untuk invoice ini
  const [returItems, setReturItems] = useState([]);
  const [note, setNote] = useState('');
  const [adminPassword, setAdminPassword] = useState(''); // Password admin untuk KASIR
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load transactions saat customer atau invoice number berubah
  useEffect(() => {
    if (selectedCustomer && invoiceNumber) {
      loadTransactions();
      setPreviousReturs([]); // Reset retur sebelumnya saat invoice berubah
    }
  }, [selectedCustomer, invoiceNumber]);

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setInvoiceNumber('');
      setSelectedCustomer('');
      setTransactions([]);
      setSelectedTransaction(null);
      setPreviousReturs([]);
      setReturItems([]);
      setNote('');
      setAdminPassword('');
      setError('');
    }
  }, [isOpen]);

  const loadTransactions = async () => {
    try {
      const response = await getAllTransactions(1, 100, invoiceNumber);
      const filtered = response.data.filter(t => 
        t.customerId === selectedCustomer && 
        t.invoiceNumber.toLowerCase().includes(invoiceNumber.toLowerCase())
      );
      setTransactions(filtered);
      if (filtered.length === 1) {
        const transaction = filtered[0];
        setSelectedTransaction(transaction);
        // Load retur sebelumnya untuk invoice ini
        if (transaction.invoiceNumber) {
          try {
            const returs = await getReturPenjualanByInvoice(transaction.invoiceNumber);
            setPreviousReturs(returs);
          } catch (error) {
            console.error("Gagal memuat retur sebelumnya:", error);
            setPreviousReturs([]);
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat transaksi:", error);
    }
  };

  const handleSelectTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setReturItems([]);
    
    // Load retur sebelumnya untuk invoice ini
    if (transaction.invoiceNumber) {
      try {
        const returs = await getReturPenjualanByInvoice(transaction.invoiceNumber);
        setPreviousReturs(returs);
      } catch (error) {
        console.error("Gagal memuat retur sebelumnya:", error);
        setPreviousReturs([]);
      }
    }
  };

  const handleAddItem = (item) => {
    const existingItem = returItems.find(ri => ri.productId === item.productId && ri.unitName === item.unitName);
    
    // Cari unit conversion dari products
    // Coba dari item.product dulu, kalau tidak ada cari dari selectedTransaction.items
    const product = item.product || selectedTransaction.items.find(i => i.productId === item.productId)?.product;
    const unit = product?.units?.find(u => u.name === item.unitName);
    const conversion = unit?.conversion || 1;
    
    // Cek tidak melebihi qty di transaksi
    const txItem = selectedTransaction.items.find(i => 
      i.productId === item.productId && i.unitName === item.unitName
    );
    const currentReturQty = existingItem ? existingItem.qty : 0;
    
    // Hitung total retur sebelumnya untuk item ini
    const previousReturQty = previousReturs.reduce((total, retur) => {
      const returItem = retur.items.find(ri => 
        ri.productId === item.productId && ri.unitName === item.unitName
      );
      return total + (returItem ? returItem.qty : 0);
    }, 0);
    
    const totalReturQty = previousReturQty + currentReturQty + 1;
    
    if (txItem && totalReturQty > txItem.qty) {
      const remaining = txItem.qty - previousReturQty;
      setError(
        `Jumlah retur tidak boleh melebihi jumlah yang dibeli. ` +
        `Dibeli: ${txItem.qty}, Sudah diretur: ${previousReturQty}, Maksimal bisa diretur: ${remaining}`
      );
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    if (existingItem) {
      setReturItems(returItems.map(ri => 
        ri.productId === item.productId && ri.unitName === item.unitName
          ? { ...ri, qty: ri.qty + 1, subtotal: ri.priceAtRetur * (ri.qty + 1) }
          : ri
      ));
    } else {
      setReturItems([...returItems, {
        productId: item.productId,
        productName: item.productName,
        unitName: item.unitName,
        qty: 1,
        priceAtRetur: item.price,
        conversion: conversion,
        subtotal: item.price * 1,
      }]);
    }
  };

  const handleUpdateQty = (index, change) => {
    const updated = [...returItems];
    const newQty = updated[index].qty + change;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      // Cek tidak melebihi qty di transaksi
      const item = updated[index];
      const txItem = selectedTransaction.items.find(i => 
        i.productId === item.productId && i.unitName === item.unitName
      );
      
      // Hitung total retur sebelumnya untuk item ini
      const previousReturQty = previousReturs.reduce((total, retur) => {
        const returItem = retur.items.find(ri => 
          ri.productId === item.productId && ri.unitName === item.unitName
        );
        return total + (returItem ? returItem.qty : 0);
      }, 0);
      
      const totalReturQty = previousReturQty + newQty;
      
      if (txItem && totalReturQty > txItem.qty) {
        const remaining = txItem.qty - previousReturQty;
        setError(
          `Jumlah retur tidak boleh melebihi jumlah yang dibeli. ` +
          `Dibeli: ${txItem.qty}, Sudah diretur: ${previousReturQty}, Maksimal bisa diretur: ${remaining}`
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      updated[index].qty = newQty;
      updated[index].subtotal = updated[index].priceAtRetur * newQty;
    }
    setReturItems(updated);
  };

  const handleRemoveItem = (index) => {
    setReturItems(returItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!invoiceNumber.trim()) {
      setError('Nomor invoice harus diisi');
      return;
    }
    if (!selectedCustomer) {
      setError('Pelanggan harus dipilih');
      return;
    }
    if (!selectedTransaction) {
      setError('Transaksi harus dipilih');
      return;
    }
    if (returItems.length === 0) {
      setError('Minimal harus ada 1 item yang diretur');
      return;
    }

    // Validasi password admin jika user adalah KASIR
    if (isKasir && !adminPassword.trim()) {
      setError('Password admin harus diisi untuk melakukan retur penjualan');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReturPenjualan({
        invoiceNumber: invoiceNumber.trim(),
        customerId: selectedCustomer,
        items: returItems,
        note: note.trim() || null,
        adminPassword: isKasir ? adminPassword.trim() : null, // Kirim password jika KASIR
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Gagal membuat retur penjualan');
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
          <h3 className="text-xl font-bold">Retur Penjualan</h3>
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
                Nomor Invoice <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Masukkan nomor invoice"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pelanggan <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setSelectedTransaction(null);
                  setReturItems([]);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Pelanggan</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List Transaksi */}
          {selectedCustomer && invoiceNumber && transactions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Transaksi:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => handleSelectTransaction(tx)}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedTransaction?.id === tx.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{tx.invoiceNumber}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Total: {formatRupiah(Number(tx.total))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items dari Transaksi */}
          {selectedTransaction && selectedTransaction.items && selectedTransaction.items.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item yang Dapat Diretur:
              </label>
              {previousReturs.length > 0 && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <strong>Info:</strong> Invoice ini sudah pernah diretur sebelumnya. 
                  Jumlah yang sudah diretur akan ditampilkan di bawah.
                </div>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {selectedTransaction.items.map((item, idx) => {
                  // Hitung retur sebelumnya untuk item ini
                  const previousReturQty = previousReturs.reduce((total, retur) => {
                    const returItem = retur.items.find(ri => 
                      ri.productId === item.productId && ri.unitName === item.unitName
                    );
                    return total + (returItem ? returItem.qty : 0);
                  }, 0);
                  
                  // Hitung retur yang sedang dipilih
                  const currentReturQty = returItems.find(ri => 
                    ri.productId === item.productId && ri.unitName === item.unitName
                  )?.qty || 0;
                  
                  const totalReturQty = previousReturQty + currentReturQty;
                  const remaining = item.qty - totalReturQty;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          {item.qty} {item.unitName} @ {formatRupiah(Number(item.price))}
                        </div>
                        {(previousReturQty > 0 || currentReturQty > 0) && (
                          <div className="text-xs">
                            {previousReturQty > 0 && (
                              <span className="text-orange-600">
                                Sudah diretur sebelumnya: {previousReturQty}
                              </span>
                            )}
                            {previousReturQty > 0 && currentReturQty > 0 && <span className="mx-1">•</span>}
                            {currentReturQty > 0 && (
                              <span className="text-blue-600">
                                Retur saat ini: {currentReturQty}
                              </span>
                            )}
                            <span className="text-gray-600 ml-1">
                              • Sisa bisa diretur: {remaining}
                            </span>
                          </div>
                        )}
                      </div>
                      {remaining > 0 && (
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Harga</th>
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
                        <td className="px-4 py-2 text-sm">{formatRupiah(Number(item.priceAtRetur))}</td>
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

          {/* Password Admin - Hanya untuk KASIR */}
          {isKasir && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Admin <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Masukkan password admin untuk konfirmasi"
                required
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Silakan minta admin/pemilik toko untuk memasukkan password
              </p>
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

export default ModalReturPenjualan;

