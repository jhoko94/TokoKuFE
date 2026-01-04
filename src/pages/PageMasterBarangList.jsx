import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../utils/formatters';
import Pagination from '../components/Pagination';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import ModalTambahBarangSimple from '../components/modals/ModalTambahBarangSimple';

function PageMasterBarangList() {
  // Ambil fungsi dari store
  const { fetchProductsPaginated, distributors, bulkDeleteProducts, saveProduct } = useStore();
  
  // State lokal
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [productsToBulkDelete, setProductsToBulkDelete] = useState(null);
  const [modalState, setModalState] = useState(null); // 'new', null, atau product object untuk edit

  // Fetch data dengan pagination
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

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDistributor]);

  // Handler untuk reload data setelah delete
  const reloadProducts = async () => {
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

  // Handler untuk modal
  const handleOpenModal = (product = null) => {
    if (product) {
      // Mode edit: set product object
      setModalState(product);
    } else {
      // Mode tambah: set ke 'new'
      setModalState('new');
    }
  };

  const handleCloseModal = () => {
    setModalState(null);
  };

  // Handler untuk reload data setelah save
  const handleProductSaved = async () => {
    // Reload data setelah save berhasil
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
      setModalState(null); // Tutup modal
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    }
  };

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold">Master Barang</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Tambah Barang</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Search Bar dan Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama atau kode barang..." 
          className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm text-base"
        />
        <select
          value={filterDistributor}
          onChange={(e) => setFilterDistributor(e.target.value)}
          className="p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-base"
        >
          <option value="">Semua Distributor</option>
          {distributors.map(distributor => (
            <option key={distributor.id} value={distributor.id}>{distributor.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedProducts.size > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-900">
              {selectedProducts.size} produk dipilih
            </span>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Batal
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProductsToBulkDelete(Array.from(selectedProducts))}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-700 flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Hapus {selectedProducts.size} Produk</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabel Master Barang */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto -mx-2 sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow-sm overflow-hidden border border-gray-200 sm:rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProducts.size === products.length}
                        onChange={() => {
                          if (selectedProducts.size === products.length) {
                            setSelectedProducts(new Set());
                          } else {
                            setSelectedProducts(new Set(products.map(p => p.id)));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                      Kode Barang
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama Barang
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                      Satuan
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Harga
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Distributor
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Belum ada produk'}
                      </td>
                    </tr>
                  ) : (
                    products.map(product => {
                      // Ambil satuan kecil (conversion = 1)
                      const satuan = product.units?.find(u => u.conversion === 1) || { name: 'N/A', price: 0 };
                          
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => {
                                setSelectedProducts(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(product.id)) {
                                    newSet.delete(product.id);
                                  } else {
                                    newSet.add(product.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden sm:table-cell">
                            {product.sku}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-700">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">Kode: {product.sku}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {satuan.name}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {formatRupiah(satuan.price || 0)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {product.distributor?.name || 'N/A'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="text-yellow-600 hover:text-yellow-800 p-1"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={pagination.total}
            />
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Barang */}
      {modalState && (
        <ModalTambahBarangSimple
          key={modalState === 'new' ? 'new' : modalState?.id || 'edit'}
          productToEdit={modalState === 'new' || typeof modalState === 'string' ? null : modalState}
          onClose={handleCloseModal}
          onSave={handleProductSaved}
        />
      )}

      {/* Modal Konfirmasi Bulk Delete */}
      {productsToBulkDelete && (
        <ModalKonfirmasi
          title="Hapus Banyak Produk"
          message={`Apakah Anda yakin ingin menghapus ${productsToBulkDelete.length} produk yang dipilih?`}
          onConfirm={async () => {
            try {
              await bulkDeleteProducts(productsToBulkDelete);
              setProductsToBulkDelete(null);
              setSelectedProducts(new Set());
              await reloadProducts();
            } catch (error) {
              // Error sudah ditangani di bulkDeleteProducts
            }
          }}
          onCancel={() => setProductsToBulkDelete(null)}
        />
      )}
    </div>
  );
}

export default PageMasterBarangList;

