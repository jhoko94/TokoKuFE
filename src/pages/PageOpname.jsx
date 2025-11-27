import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import Pagination from '../components/Pagination';

function PageOpname() {
  const { fetchProductsPaginated, processStockOpname } = useStore();
  
  // State untuk pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk menampung SEMUA input fisik (disimpan di localStorage untuk persist across pages)
  // Format: { [productId]: 123 }
  const [physicalStocks, setPhysicalStocks] = useState(() => {
    // Load dari localStorage jika ada
    const saved = localStorage.getItem('opname_physicalStocks');
    return saved ? JSON.parse(saved) : {};
  });
  
  // State untuk modal konfirmasi
  const [modalData, setModalData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products dengan pagination
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsPaginated(currentPage, itemsPerPage, debouncedSearch);
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });
        
        // Inisialisasi physicalStocks untuk produk yang belum ada di state
        setPhysicalStocks(prev => {
          const updated = { ...prev };
          response.data?.forEach(p => {
            if (updated[p.id] === undefined) {
              updated[p.id] = p.stock;
            }
          });
          // Simpan ke localStorage
          localStorage.setItem('opname_physicalStocks', JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error("Gagal memuat produk:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, fetchProductsPaginated]);

  // Handler untuk mengubah satu input
  const handleStockChange = (productId, value) => {
    const updated = {
      ...physicalStocks,
      [productId]: value === '' ? '' : parseInt(value) // Simpan sbg angka
    };
    setPhysicalStocks(updated);
    // Simpan ke localStorage
    localStorage.setItem('opname_physicalStocks', JSON.stringify(updated));
  };

  // Handler untuk tombol "Simpan Hasil"
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    let adjustmentsSummary = []; // Untuk pesan di modal
    const adjustments = []; // Untuk dikirim ke context
    
    products.forEach(product => {
      const fisik = physicalStocks[product.id];
      const sistem = product.stock;
      const baseUnit = (product.units.find(u => u.conversion === 1) || product.units[0]).name;

      // Cek jika valid (bukan string kosong) DAN berbeda
      if (fisik !== '' && !isNaN(fisik) && fisik !== sistem) {
        const selisih = fisik - sistem;
        adjustments.push({
          productId: product.id,
          physicalStock: fisik,
        });
        adjustmentsSummary.push(
          `<b>${product.name}</b>: ${sistem} &rarr; ${fisik} (${selisih > 0 ? '+' : ''}${selisih} ${baseUnit})`
        );
      }
    });

    if (adjustments.length > 0) {
      try {
        await processStockOpname(adjustments);
        
        // Hapus perubahan yang sudah disubmit dari localStorage
        const updated = { ...physicalStocks };
        adjustments.forEach(adj => {
          // Set ke nilai baru (stok sistem yang sudah diupdate)
          const product = products.find(p => p.id === adj.productId);
          if (product) {
            updated[adj.productId] = adj.physicalStock;
          }
        });
        setPhysicalStocks(updated);
        localStorage.setItem('opname_physicalStocks', JSON.stringify(updated));
        
        // Reload data untuk mendapatkan stok terbaru
        const response = await fetchProductsPaginated(currentPage, itemsPerPage, debouncedSearch);
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });
        
        // Update physicalStocks dengan stok terbaru
        setPhysicalStocks(prev => {
          const updated = { ...prev };
          response.data?.forEach(p => {
            updated[p.id] = p.stock;
          });
          localStorage.setItem('opname_physicalStocks', JSON.stringify(updated));
          return updated;
        });
        
        // Tampilkan modal sukses
        setModalData({
          title: "Stok Opname Selesai",
          message: "Penyesuaian stok berhasil disimpan:<br><br>" + adjustmentsSummary.join('<br>'),
          onConfirm: () => setModalData(null), // Cukup tutup modal
          onCancel: null
        });
      } catch (err) {
        // Tampilkan modal error
        setModalData({
          title: "Error",
          message: "Gagal menyimpan penyesuaian stok.",
          onConfirm: () => setModalData(null),
          onCancel: null
        });
      }
    } else {
      // Tidak ada perubahan
      setModalData({
        title: "Info",
        message: "Tidak ada perubahan stok yang disimpan.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Stok Opname</h2>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base min-h-[48px]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil'}
          </button>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-4">Masukkan jumlah stok fisik (nyata) untuk setiap barang. Stok yang tidak diubah tidak akan disesuaikan.</p>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau kode barang..." 
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="loader mx-auto mb-2"></div>
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <>
            <div id="opname-list" className="space-y-3">
              {products.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Barang tidak ditemukan.</p>
              ) : (
                products.map(product => {
            const baseUnit = (product.units.find(u => u.conversion === 1) || product.units[0]);
            
            return (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm text-gray-600">Stok Sistem: 
                    <strong>{product.stock}</strong> {baseUnit.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Stok Fisik:</label>
                  <input 
                    type="number"
                    // Ambil nilai dari state 'physicalStocks'
                    value={physicalStocks[product.id] ?? ''} // '??' untuk handle jika undefined
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    className="w-24 p-2 border border-gray-300 rounded-md shadow-sm text-center"
                  />
                </div>
              </div>
            );
          }))}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={pagination.total}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </>
        )}
      </div>

      {/* Render Modal Konfirmasi (jika modalData di-set) */}
      {modalData && (
        <ModalKonfirmasi
          title={modalData.title}
          message={modalData.message}
          onConfirm={modalData.onConfirm}
          onCancel={modalData.onCancel}
        />
      )}
    </>
  );
}

export default PageOpname;