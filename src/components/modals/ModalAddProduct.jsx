import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';

export default function ModalAddProduct({ isOpen, onClose, onProductSelect }) {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-add-product" className="modal-content">
        <h3 className="text-xl font-bold mb-4">Pilih Barang</h3>
        <input 
          type="text" 
          id="modal-product-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama barang..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
        />
        <div id="modal-product-list" className="space-y-3 max-h-80 overflow-y-auto">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <p className="font-bold">{product.name}</p>
              <p className="text-sm text-gray-500 mb-2">Pilih satuan:</p>
              <div className="flex gap-2 flex-wrap">
                {product.units.map(unit => (
                  <button 
                    key={unit.id}
                    className="flex-1 bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg text-sm hover:bg-blue-200"
                    onClick={() => onProductSelect(product, unit)} // Kirim data produk & unit
                  >
                    {unit.name} ({formatRupiah(unit.price)})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
          Batal
        </button>
      </div>
    </>
  );
}