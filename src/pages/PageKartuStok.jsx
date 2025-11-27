import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatStockDisplay } from '../utils/formatters';
import ModalKartuStok from '../components/modals/ModalKartuStok';
import Pagination from '../components/Pagination';
import { BookOpenIcon } from '@heroicons/react/24/outline';

function PageKartuStok() {
  const { fetchProductsPaginated, distributors } = useStore();
  
  // State untuk pagination dan search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk modal kartu stok
  const [productToViewCard, setProductToViewCard] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDistributor]);

  // Fetch products dengan pagination
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsPaginated(
          currentPage, 
          itemsPerPage, 
          debouncedSearch, 
          '', // unitSmall
          '', // unitLarge
          filterDistributor
        );
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });
      } catch (error) {
        console.error("Gagal memuat produk:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, filterDistributor, fetchProductsPaginated]);

  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Kartu Stok</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">Cari dan lihat kartu stok untuk setiap produk</p>
        
        {/* Filter dan Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau kode barang..." 
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
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
        
        {/* Tabel Produk */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distributor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="loader mb-2"></div>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Barang tidak ditemukan.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const stockInBaseUnit = Number(product.stock) || 0;
                  const displayStock = formatStockDisplay(product, stockInBaseUnit);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.brand && (
                          <div className="text-xs text-gray-500">Brand: {product.brand}</div>
                        )}
                        {product.category && (
                          <div className="text-xs text-gray-500">Kategori: {product.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.distributor?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {displayStock || `${stockInBaseUnit || 0} unit`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setProductToViewCard(product)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <BookOpenIcon className="h-4 w-4 mr-2" />
                          Lihat Kartu Stok
                        </button>
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

      {/* Modal Kartu Stok */}
      {productToViewCard && (
        <ModalKartuStok
          product={productToViewCard}
          onClose={() => setProductToViewCard(null)}
        />
      )}
    </>
  );
}

export default PageKartuStok;

