import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalCekPesanan({ po, onClose }) {
  const { products, confirmPOReceived } = useStore();
  
  // State untuk menampung jumlah yang benar-benar datang
  // Format: { [itemId]: receivedQty }
  const [receivedQtys, setReceivedQtys] = useState({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: log ketika modal di-render
  console.log('ModalCekPesanan rendered with PO:', po);

  // Initialize receivedQtys dengan nilai default dari PO
  useEffect(() => {
    if (po && po.items) {
      const initialQtys = {};
      po.items.forEach(item => {
        initialQtys[item.id] = item.qty || 0;
      });
      setReceivedQtys(initialQtys);
    }
  }, [po]);

  // Handler untuk input jumlah yang datang
  const handleReceivedQtyChange = (itemId, value) => {
    const qty = parseInt(value) || 0;
    setReceivedQtys(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  // Fungsi untuk validasi jumlah yang datang vs jumlah PO
  const getQtyValidation = (item) => {
    const receivedQty = receivedQtys[item.id] || item.qty || 0;
    const poQty = item.qty || 0;
    
    if (receivedQty < poQty) {
      return { type: 'warning', message: `Kurang ${poQty - receivedQty} ${item.unitName}` };
    } else if (receivedQty > poQty) {
      return { type: 'warning', message: `Lebih ${receivedQty - poQty} ${item.unitName}` };
    }
    return { type: 'success', message: 'Sesuai' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validasi: pastikan semua receivedQty sudah diisi
      const poItems = po.items || [];
      const missingQtys = poItems.filter(item => !receivedQtys[item.id] || receivedQtys[item.id] <= 0);
      
      if (missingQtys.length > 0) {
        alert('Mohon isi jumlah yang datang untuk semua item');
        setIsSubmitting(false);
        return;
      }

      // Format data: receivedQtys (barcode di-skip untuk sementara)
      const receivedQtysData = {};
      poItems.forEach(item => {
        receivedQtysData[item.id] = receivedQtys[item.id] || item.qty;
      });

      // Panggil fungsi global, kirim PO-nya dan receivedQtys (barcode kosong)
      await confirmPOReceived(po, receivedQtysData, {});
      onClose();
    } catch (err) {
      console.error("Gagal konfirmasi PO:", err);
      alert(`Gagal konfirmasi PO: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safety check untuk data PO
  if (!po) {
    return null;
  }

  const distributorName = po.distributor?.name || 'N/A';
  const poItems = po.items || [];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={onClose}></div>
      
      <div id="modal-cek-po" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[101] p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold mb-2">Konfirmasi Pesanan</h3>
          <p className="text-lg font-medium mb-4">{distributorName}</p>
          <p className="text-sm text-gray-600 mb-2">Cek dan input jumlah barang yang benar-benar datang:</p>
          
          <div id="po-cek-item-list" className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {poItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Tidak ada item dalam PO ini.</p>
            ) : (
              poItems.map(item => {
                // Cari data produk "live" di state global
                let product = products?.find(p => p.id === item.productId);
                // Jika tidak ada (barang baru), gunakan snapshot dari PO
                if (!product) {
                  product = item.product;
                }
                
                if (!product) {
                  return (
                    <div key={item.productId || `item-${item.id}`} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 shadow-sm">
                      <p className="font-bold text-gray-800">{item.qty} {item.unitName || 'Pcs'} - {item.productName || 'Produk tidak ditemukan'}</p>
                      <p className="text-xs text-yellow-600 mt-1">Data produk tidak lengkap</p>
                    </div>
                  );
                }

                const productUnits = product.units || [];
                const productName = product.name || item.productName || 'N/A';

                const receivedQty = receivedQtys[item.id] !== undefined ? receivedQtys[item.id] : item.qty;
                const qtyValidation = getQtyValidation(item);

                return (
                  <div key={item.productId || product.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{productName}</p>
                        <p className="text-sm text-gray-600">
                          Dipesan: <span className="font-medium">{item.qty} {item.unitName || 'Pcs'}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Input Jumlah yang Datang */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jumlah yang Datang:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={receivedQty}
                          onChange={(e) => handleReceivedQtyChange(item.id, e.target.value)}
                          className="w-24 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                          required
                        />
                        <span className="text-sm text-gray-600">{item.unitName || 'Pcs'}</span>
                        {qtyValidation.type === 'warning' && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            qtyValidation.message.includes('Kurang') 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {qtyValidation.message}
                          </span>
                        )}
                        {qtyValidation.type === 'success' && (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                            ✓ Sesuai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting}
              className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Datang'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}