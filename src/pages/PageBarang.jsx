import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatStockDisplay } from '../utils/formatters'; // Kita perlu formatStockDisplay
import { BookOpenIcon } from '@heroicons/react/24/outline';

// Impor modal yang akan kita buat
import ModalTambahStok from '../components/modals/ModalTambahStok';
import ModalKartuStok from '../components/modals/ModalKartuStok';

function PageBarang() {
  // 1. Ambil data global
  const { products } = useStore();
  
  // 2. State lokal
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk mengontrol modal. Kita simpan 'product' yg dipilih.
  const [productToAddStock, setProductToAddStock] = useState(null);
  const [productToViewCard, setProductToViewCard] = useState(null);

  // 3. Logika filtering (sama seperti PageUtang)
  const filteredProducts = useMemo(() => {
    // Pastikan products tidak null/undefined sebelum filter
    if (!products) return []; 
    return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]); // Kalkulasi ulang jika products atau searchTerm berubah

  // 4. Render JSX
  return (
    <>
      <div className="page-content p-4 md:p-8">
        
        {/* Search Bar */}
        <input 
          type="text" 
          id="inventory-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama atau kode barang..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
        />
        
        {/* Daftar Barang */}
        <div id="inventory-list" className="space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500">Barang tidak ditemukan.</p>
          ) : (
            filteredProducts.map(product => {
              const stockInBaseUnit = product.stock; 
              const displayStock = formatStockDisplay(product, stockInBaseUnit);
              const isLowStock = stockInBaseUnit <= product.minStock;
              
              return (
                <div key={product.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">
                      {product.name} <span className="text-sm text-gray-500 font-normal">({product.sku})</span>
                    </p>
                    <p className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                      Sisa Stok: {displayStock} (Min: {product.minStock})
                    </p>
                  </div>
                  
                  {/* Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => setProductToViewCard(product)} // Buka modal Kartu Stok
                      className="bg-gray-500 text-white font-bold py-2 px-3 rounded-lg shadow hover:bg-gray-600 text-sm flex items-center justify-center space-x-1"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      <span>Kartu</span>
                    </button>
                    <button 
                      onClick={() => setProductToAddStock(product)} // Buka modal Tambah Stok
                      className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow hover:bg-blue-700 text-sm"
                    >
                      + STOK
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Render Modal (Secara Kondisional) */}
      
      {productToAddStock && (
        <ModalTambahStok 
          product={productToAddStock}
          onClose={() => setProductToAddStock(null)}
        />
      )}

      {productToViewCard && (
        <ModalKartuStok
          product={productToViewCard}
          onClose={() => setProductToViewCard(null)}
        />
      )}
    </>
  );
}

export default PageBarang;