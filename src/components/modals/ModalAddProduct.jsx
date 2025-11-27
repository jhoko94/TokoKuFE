import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import Pagination from '../Pagination';

export default function ModalAddProduct({ isOpen, onClose, onProductSelect }) {
  const { fetchProductsPaginated } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  // Debounce search term untuk mengurangi request API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset ke page 1 saat search berubah
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products dengan pagination
  useEffect(() => {
    if (!isOpen) return;

    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsPaginated(currentPage, itemsPerPage, debouncedSearch);
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } catch (error) {
        console.error("Gagal memuat produk:", error);
        setProducts([]);
        // Error akan ditangani oleh error boundary atau user akan melihat list kosong
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [isOpen, currentPage, debouncedSearch, fetchProductsPaginated]);

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
      setProducts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-add-product" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold mb-4">Pilih Barang</h3>
          <input 
            type="text" 
            id="modal-product-search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama barang..." 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Content Area - Flex grow untuk mengambil sisa ruang */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-gray-500">Memuat data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table Container - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {debouncedSearch ? 'Tidak ada produk ditemukan' : 'Tidak ada produk'}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan & Harga</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {product.units?.map(unit => (
                                <span 
                                  key={unit.id}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {unit.name}: {formatRupiah(unit.price)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col gap-1">
                              {product.units?.map(unit => (
                                <button 
                                  key={unit.id}
                                  className="bg-blue-600 text-white font-medium py-1.5 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                                  onClick={() => onProductSelect(product, unit)}
                                >
                                  Pilih {unit.name}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination - Fixed di bawah */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={pagination.total}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </>
  );
}