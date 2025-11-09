import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalTambahStok({ product, onClose }) {
  const { addStock } = useStore(); // Ambil fungsi addStock dari context
  
  // State lokal untuk form
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set unit default ke unit pertama di list saat modal dibuka
  useEffect(() => {
    if (product && product.units.length > 0) {
      setUnit(product.units[0].name);
      setQty(1); // Reset qty
      setError(''); // Reset error
    }
  }, [product]); // Jalankan jika 'product' berubah

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const numQty = Number(qty);
    if (isNaN(numQty) || numQty <= 0) {
      setError('Jumlah tidak valid');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Panggil fungsi global
      await addStock(product.id, unit, numQty);
      onClose(); // Tutup modal jika sukses
    } catch (err) {
      setError('Gagal menambah stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-add-stock" className="modal-content">
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold mb-4">Tambah Stok Manual</h3>
          <p className="text-lg font-medium mb-4">{product.name}</p>
          
          <div className="flex gap-2">
            <div className="w-1/2">
              <label htmlFor="add-stock-qty" className="block text-sm font-medium text-gray-700">Jumlah:</label>
              <input 
                type="number" 
                id="add-stock-qty" 
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Jml" 
                className="w-full p-2 mt-1 border border-gray-300 rounded-lg shadow-sm"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="add-stock-unit" className="block text-sm font-medium text-gray-700">Satuan:</label>
              <select 
                id="add-stock-unit" 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-lg shadow-sm bg-white"
              >
                {product.units.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          
          <div className="flex gap-2 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-1/2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}