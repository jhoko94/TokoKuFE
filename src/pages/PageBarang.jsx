import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatStockDisplay } from '../utils/formatters'; // Kita perlu formatStockDisplay
import { BookOpenIcon, ArrowsRightLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

// Impor modal yang akan kita buat
import ModalTambahStok from '../components/modals/ModalTambahStok';
import ModalKartuStok from '../components/modals/ModalKartuStok';
import ModalTransferStok from '../components/modals/ModalTransferStok';
import Pagination from '../components/Pagination';

function PageBarang() {
  // 1. Ambil fungsi dari store
  const { fetchProductsPaginated, distributors, user } = useStore();
  
  // Cek apakah user adalah ADMIN atau MANAGER (untuk tombol tambah stok)
  const userRole = typeof user?.role === 'object' ? user?.role?.code : user?.role;
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';
  
  // 2. State lokal
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk mengontrol modal. Kita simpan 'product' yg dipilih.
  const [productToAddStock, setProductToAddStock] = useState(null);
  const [productToViewCard, setProductToViewCard] = useState(null);
  const [productToTransfer, setProductToTransfer] = useState(null);

  // 3. Fetch data dengan pagination
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsPaginated(
          currentPage, 
          itemsPerPage, 
          searchTerm, 
          '', // unitSmall
          '', // unitLarge
          filterDistributor
        );
        setProducts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat produk:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, itemsPerPage, searchTerm, filterDistributor, fetchProductsPaginated]);

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDistributor]);

  // 4. Render JSX
  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Cek Barang</h2>
        
        {/* Filter dan Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <input 
            type="text" 
            id="inventory-search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau kode barang..." 
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm text-base"
          />
          <select
            value={filterDistributor}
            onChange={(e) => setFilterDistributor(e.target.value)}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-base"
          >
            <option value="">Semua Distributor</option>
            {distributors.map(distributor => (
              <option key={distributor.id} value={distributor.id}>
                {distributor.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Tabel Barang */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Distributor</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Min Stok</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-4 md:px-6 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="loader mb-2"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-4 md:px-6 py-8 text-center text-gray-500">
                    Barang tidak ditemukan.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const stockInBaseUnit = Number(product.stock) || 0; 
                  const displayStock = formatStockDisplay(product, stockInBaseUnit);
                  const isLowStock = stockInBaseUnit <= (product.minStock || 0);
                  
                  return (
                    <tr key={product.id} className={isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="text-sm sm:text-base font-medium text-gray-900 break-words">{product.name}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1 space-y-0.5">
                          {product.sku && <div>SKU: {product.sku}</div>}
                          {product.distributor?.name && <div>Dist: {product.distributor.name}</div>}
                          {product.minStock !== undefined && <div>Min: {product.minStock}</div>}
                        </div>
                        {(product.brand || product.category) && (
                          <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                            {product.brand && <span>Brand: {product.brand}</span>}
                            {product.brand && product.category && <span className="mx-1">•</span>}
                            {product.category && <span>Kategori: {product.category}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        <span className="font-mono">{product.sku || '-'}</span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                        {product.distributor?.name || '-'}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className={`text-xs sm:text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {displayStock || `${stockInBaseUnit || 0} unit`}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                        {product.minStock || 0}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button 
                            onClick={() => setProductToViewCard(product)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
                            title="Lihat Kartu Stok"
                          >
                            <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            onClick={() => setProductToTransfer(product)}
                            className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors active:bg-purple-100"
                            title="Transfer Stok"
                          >
                            <ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {/* Tombol Tambah Stok - Hanya untuk ADMIN dan MANAGER */}
                          {isAdminOrManager && (
                            <button 
                              onClick={() => setProductToAddStock(product)}
                              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:bg-blue-100"
                              title="Tambah Stok"
                            >
                              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.total > 0 && (
          <div className="mt-4 sm:mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={pagination.limit}
              totalItems={pagination.total}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
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

      {productToTransfer && (
        <ModalTransferStok
          isOpen={!!productToTransfer}
          onClose={() => setProductToTransfer(null)}
          product={productToTransfer}
          onSuccess={async () => {
            // Reload data
            const response = await fetchProductsPaginated(
              currentPage, 
              itemsPerPage, 
              searchTerm, 
              '', 
              '', 
              filterDistributor
            );
            setProducts(response.data);
            setPagination(response.pagination);
          }}
        />
      )}
    </>
  );
}

export default PageBarang;