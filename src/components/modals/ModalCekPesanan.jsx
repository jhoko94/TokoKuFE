import { useState } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalCekPesanan({ po, onClose }) {
  const { products, confirmPOReceived } = useStore();
  
  // State untuk menampung input barcode baru
  // Format: { [productId]: { [unitId]: 'barcode_baru' } }
  const [newBarcodes, setNewBarcodes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler untuk input barcode
  const handleBarcodeChange = (productId, unitId, value) => {
    setNewBarcodes(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [unitId]: value,
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Panggil fungsi global, kirim PO-nya dan state barcode baru
      await confirmPOReceived(po, newBarcodes);
      onClose();
    } catch (err) {
      console.error("Gagal konfirmasi PO:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div id="modal-cek-po" className="modal-content">
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold mb-2">Konfirmasi Pesanan</h3>
          <p className="text-lg font-medium mb-4">{po.distributor.name}</p>
          <p className="text-sm text-gray-600 mb-2">Barang yang datang (perbarui barcode jika perlu):</p>
          
          <div id="po-cek-item-list" className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {po.items.map(item => {
              // Cari data produk "live" di state global
              let product = products.find(p => p.id === item.productId);
              // Jika tidak ada (barang baru), gunakan snapshot dari PO
              if (!product) {
                product = item.product;
              }
              
              if (!product) return null; // Safety check

              return (
                <div key={item.productId || product.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <p className="font-bold text-gray-800">{item.qty} {item.unitName} - {product.name}</p>
                  
                  {/* Render input untuk SEMUA unit */}
                  {product.units.map(unit => {
                    const barcodeTags = unit.barcodes.map(b => (
                      <span key={b} className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">{b}</span>
                    ));
                    
                    return (
                      <div key={unit.id} className="mt-2">
                        <label className="text-sm font-medium text-gray-700">Barcode u/ {unit.name}:</label>
                        <div className="flex flex-wrap gap-1 my-1">
                          {barcodeTags.length > 0 ? barcodeTags : <span className="text-xs text-gray-500">Belum ada barcode</span>}
                        </div>
                        <input 
                          type="text" 
                          value={newBarcodes[product.id]?.[unit.id] || ''}
                          onChange={(e) => handleBarcodeChange(product.id, unit.id, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                          placeholder="Scan/Input barcode BARU..."
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
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