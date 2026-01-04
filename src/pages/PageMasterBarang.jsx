import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { PlusIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, ArrowDownTrayIcon, PrinterIcon, QrCodeIcon } from '@heroicons/react/24/outline';

// Impor modal yang akan kita buat
import ModalMasterBarang from '../components/modals/ModalMasterBarang';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi'; // Modal generic
import ModalImportProducts from '../components/modals/ModalImportProducts';
import ModalPrintLabel from '../components/modals/ModalPrintLabel';
import ModalBarcodeGenerator from '../components/modals/ModalBarcodeGenerator';
import ModalUbahDistributor from '../components/modals/ModalUbahDistributor';
import ModalUbahSatuan from '../components/modals/ModalUbahSatuan';
import ModalUbahMinStock from '../components/modals/ModalUbahMinStock';
import Pagination from '../components/Pagination';

function PageMasterBarang() {
  // 1. Ambil fungsi dari store
  const { deleteProduct, fetchProductsPaginated, products: allProducts, exportProducts, distributors, bulkUpdateDistributor, bulkUpdateUnit, bulkUpdateMinStock, saveProduct, init } = useStore();
  
  // 2. State Lokal
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSatuanKecil, setFilterSatuanKecil] = useState('');
  const [filterSatuanBesar, setFilterSatuanBesar] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk bulk update distributor dan satuan
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isUbahDistributorModalOpen, setIsUbahDistributorModalOpen] = useState(false);
  const [isUbahSatuanModalOpen, setIsUbahSatuanModalOpen] = useState(false);
  const [ubahSatuanType, setUbahSatuanType] = useState(null); // 'small' atau 'large'
  const [isUbahMinStockModalOpen, setIsUbahMinStockModalOpen] = useState(false);
  
  // State untuk mengontrol modal:
  // 'null' = modal tertutup
  // 'new' = modal terbuka untuk "Tambah Baru"
  // {product} = modal terbuka untuk "Edit"
  const [modalState, setModalState] = useState(null);
  const [printLabelState, setPrintLabelState] = useState(null); // {product, unit}
  const [barcodeGenState, setBarcodeGenState] = useState(null); // {product, unit}
  const [openDropdownId, setOpenDropdownId] = useState(null); // ID produk yang dropdown-nya terbuka
  
  // State untuk modal konfirmasi hapus
  const [productToDelete, setProductToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 3. Fetch data dengan pagination
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsPaginated(
          currentPage, 
          itemsPerPage, 
          searchTerm,
          filterSatuanKecil,
          filterSatuanBesar,
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
  }, [currentPage, itemsPerPage, searchTerm, filterSatuanKecil, filterSatuanBesar, filterDistributor, fetchProductsPaginated]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSatuanKecil, filterSatuanBesar, filterDistributor]);

  // Get unique satuan kecil dan besar dari semua products untuk dropdown
  // Menggunakan allProducts dari bootstrap untuk mendapatkan semua satuan yang ada
  const { satuanKecilList, satuanBesarList } = useMemo(() => {
    const kecilSet = new Set();
    const besarSet = new Set();
    
    (allProducts || []).forEach(product => {
      (product.units || []).forEach(unit => {
        if (unit.conversion === 1) {
          kecilSet.add(unit.name);
        } else if (unit.conversion > 1) {
          besarSet.add(unit.name);
        }
      });
    });
    
    return {
      satuanKecilList: Array.from(kecilSet).sort(),
      satuanBesarList: Array.from(besarSet).sort()
    };
  }, [allProducts]);

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'KODE ITEM',
      'BARCODE',
      'NAMA ITEM',
      'SATUAN',
      'HARGA JUAL',
      'HARGA POKOK',
      'STOK AWAL',
      'STOK MINIMUM',
      'KODE SUPPLIER',
      'MEREK',
      'JENIS',
      'KETERANGAN'
    ];
    
    const csvContent = [
      headers.join(','),
      'CONTOH001,1234567890123,Contoh Produk,PCS,10000,8000,100,10,SUPPLIER001,Merek A,Kategori A,Contoh keterangan'
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_produk.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Event Handlers
  const handleOpenModal = (product = null) => {
    // Jika tidak ada produk, set 'new'. Jika ada, set ke produk itu.
    setModalState(product ? product : 'new');
  };
  
  const handleCloseModal = () => {
    setModalState(null);
  };

  // Handler untuk reload data setelah save
  const handleProductSaved = async () => {
    // Reload data setelah save berhasil
    try {
      // Refresh bootstrap data untuk update dropdown satuan (allProducts)
      await init();
      
      // Reload tabel dengan data terbaru
      const response = await fetchProductsPaginated(
        currentPage, 
        itemsPerPage, 
        searchTerm,
        filterSatuanKecil,
        filterSatuanBesar,
        filterDistributor
      );
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Gagal memuat produk setelah save:", error);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id);
        setProductToDelete(null); // Tutup modal konfirmasi
        // Reload data setelah delete
        const response = await fetchProductsPaginated(
          currentPage, 
          itemsPerPage, 
          searchTerm,
          filterSatuanKecil,
          filterSatuanBesar,
          filterDistributor
        );
        setProducts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        // Error sudah ditangani di deleteProduct
      }
    }
  };

  // Handle checkbox selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  // Handle bulk update distributor
  const handleBulkUpdateDistributor = async (distributorId) => {
    try {
      await bulkUpdateDistributor(Array.from(selectedProducts), distributorId);
      setSelectedProducts(new Set());
      // Reload data setelah update
      const response = await fetchProductsPaginated(
        currentPage, 
        itemsPerPage, 
        searchTerm,
        filterSatuanKecil,
        filterSatuanBesar,
        filterDistributor
      );
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      // Error sudah ditangani di bulkUpdateDistributor
    }
  };

  // Handle bulk update satuan
  const handleBulkUpdateSatuan = async (unitName, price, conversion) => {
    try {
      await bulkUpdateUnit(Array.from(selectedProducts), ubahSatuanType, unitName, price, conversion);
      setSelectedProducts(new Set());
      // Reload data setelah update
      const response = await fetchProductsPaginated(
        currentPage, 
        itemsPerPage, 
        searchTerm,
        filterSatuanKecil,
        filterSatuanBesar,
        filterDistributor
      );
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      // Error sudah ditangani di bulkUpdateUnit
    }
  };

  // Handle bulk update min stock
  const handleBulkUpdateMinStock = async (minStock) => {
    try {
      await bulkUpdateMinStock(Array.from(selectedProducts), minStock);
      setSelectedProducts(new Set());
      // Reload data setelah update
      const response = await fetchProductsPaginated(
        currentPage, 
        itemsPerPage, 
        searchTerm,
        filterSatuanKecil,
        filterSatuanBesar,
        filterDistributor
      );
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      // Error sudah ditangani di bulkUpdateMinStock
    }
  };

  // Handle open ubah satuan modal
  const handleOpenUbahSatuan = (type) => {
    setUbahSatuanType(type);
    setIsUbahSatuanModalOpen(true);
  };

  // 6. Render JSX
  return (
    <>
      <div className="page-content p-4 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-2xl font-bold">Master Barang</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button 
              onClick={handleDownloadTemplate}
              className="bg-gray-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Template CSV</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-emerald-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => exportProducts()}
              className="bg-purple-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button 
              onClick={() => handleOpenModal()} // Buka modal mode 'new'
              className="bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Barang Baru</span>
              <span className="sm:hidden">Baru</span>
            </button>
          </div>
        </div>

        {/* Search Bar dan Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <input 
            type="text" 
            id="master-inventory-search" 
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
          <select
            value={filterSatuanKecil}
            onChange={(e) => setFilterSatuanKecil(e.target.value)}
            className="p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-base hidden md:block"
          >
            <option value="">Semua Satuan Kecil</option>
            {satuanKecilList.map(satuan => (
              <option key={satuan} value={satuan}>{satuan}</option>
            ))}
          </select>
          <select
            value={filterSatuanBesar}
            onChange={(e) => setFilterSatuanBesar(e.target.value)}
            className="p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm bg-white text-base hidden lg:block"
          >
            <option value="">Semua Satuan Besar</option>
            {satuanBesarList.map(satuan => (
              <option key={satuan} value={satuan}>{satuan}</option>
            ))}
          </select>
        </div>

        {/* Bulk Action Bar */}
        {selectedProducts.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.size} produk dipilih
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsUbahDistributorModalOpen(true)}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>Ubah Distributor</span>
              </button>
              <button
                onClick={() => handleOpenUbahSatuan('small')}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 flex items-center space-x-2"
              >
                <span>Ubah Satuan Kecil</span>
              </button>
              <button
                onClick={() => handleOpenUbahSatuan('large')}
                className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 flex items-center space-x-2"
              >
                <span>Ubah Satuan Besar</span>
              </button>
              <button
                onClick={() => setIsUbahMinStockModalOpen(true)}
                className="bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-orange-700 flex items-center space-x-2"
              >
                <span>Ubah Minimal Stok</span>
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
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Kode Barang</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Satuan Kecil</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Satuan Besar</th>
                      <th scope="col" className="relative px-3 sm:px-6 py-3"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody id="master-inventory-list" className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          Memuat data...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Belum ada produk'}
                        </td>
                      </tr>
                    ) : (
                      products.map(product => {
                      // Ambil satuan kecil (conversion = 1)
                      const satuanKecil = product.units.find(u => u.conversion === 1) || { name: 'N/A' };
                      
                      // Ambil semua satuan besar (conversion > 1) dan urutkan
                      const satuanBesarList = product.units
                        .filter(u => u.conversion > 1)
                        .sort((a, b) => a.conversion - b.conversion);
                      
                      // Format satuan besar: tampilkan semua, pisahkan dengan koma
                      const satuanBesarString = satuanBesarList.length > 0
                          ? satuanBesarList.map(u => `${u.name} (${u.conversion}x)`).join(', ')
                          : 'N/A';
                          
                      return (
                        <tr key={product.id}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden sm:table-cell">{product.sku}</td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-700">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">Kode: {product.sku}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{satuanKecil.name}</td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                            <div className="max-w-xs truncate" title={satuanBesarString}>
                              {satuanBesarString}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenModal(product)}
                                className="text-yellow-600 hover:text-yellow-800 p-1"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              
                              {/* Print & Barcode - Dropdown jika lebih dari 1 unit */}
                              {product.units && product.units.length > 1 ? (
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenDropdownId(openDropdownId === product.id ? null : product.id)}
                                    className="text-blue-500 hover:text-blue-700 p-1 relative"
                                    title="Print Label / Generate Barcode"
                                  >
                                    <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                      {product.units.length}
                                    </span>
                                  </button>
                                  {/* Dropdown Menu */}
                                  {openDropdownId === product.id && (
                                    <>
                                      {/* Backdrop untuk menutup dropdown saat klik di luar */}
                                      <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setOpenDropdownId(null)}
                                      ></div>
                                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                        <div className="py-1 max-h-64 overflow-y-auto">
                                          {product.units.map(unit => (
                                            <div key={unit.id} className="border-b border-gray-100 last:border-b-0">
                                              <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50">
                                                {unit.name} {unit.conversion > 1 && `(${unit.conversion}x)`}
                                              </div>
                                              <div className="flex">
                                                <button
                                                  onClick={() => {
                                                    setPrintLabelState({ product, unit });
                                                    setOpenDropdownId(null);
                                                  }}
                                                  className="flex-1 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors"
                                                  title={`Print Label ${unit.name}`}
                                                >
                                                  <PrinterIcon className="w-3.5 h-3.5" />
                                                  <span>Print</span>
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setBarcodeGenState({ product, unit });
                                                    setOpenDropdownId(null);
                                                  }}
                                                  className="flex-1 px-3 py-2 text-xs text-green-600 hover:bg-green-50 flex items-center justify-center gap-1.5 transition-colors"
                                                  title={`Generate Barcode ${unit.name}`}
                                                >
                                                  <QrCodeIcon className="w-3.5 h-3.5" />
                                                  <span>Barcode</span>
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : product.units && product.units.length === 1 ? (
                                // Jika hanya 1 unit, tampilkan langsung tanpa dropdown
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setPrintLabelState({ product, unit: product.units[0] })}
                                    className="text-blue-500 hover:text-blue-700 p-1"
                                    title={`Print Label ${product.units[0].name}`}
                                  >
                                    <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                  <button
                                    onClick={() => setBarcodeGenState({ product, unit: product.units[0] })}
                                    className="text-green-500 hover:text-green-700 p-1"
                                    title={`Generate Barcode ${product.units[0].name}`}
                                  >
                                    <QrCodeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>
                              ) : null}
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => setProductToDelete(product)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
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
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          />
          </div>
        )}
      </div>

      {/* 7. Render Modal (Secara Kondisional) */}
      
      {/* Modal Tambah/Edit Barang */}
      {modalState && (
        <ModalMasterBarang
          // Jika modalState adalah 'new', kirim null. Jika objek, kirim objek itu.
          productToEdit={modalState === 'new' ? null : modalState}
          onClose={handleCloseModal}
          onSave={handleProductSaved}
        />
      )}
      
      {/* Modal Konfirmasi Hapus */}
      {productToDelete && (
        <ModalKonfirmasi
          title="Hapus Barang"
          message={`Apakah Anda yakin ingin menghapus <strong>${productToDelete.name}</strong> (${productToDelete.sku})? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setProductToDelete(null)}
        />
      )}

      {isImportModalOpen && (
        <ModalImportProducts
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Modal Print Label */}
      {printLabelState && (
        <ModalPrintLabel
          isOpen={!!printLabelState}
          onClose={() => setPrintLabelState(null)}
          product={printLabelState.product}
          unit={printLabelState.unit}
        />
      )}

      {/* Modal Barcode Generator */}
      {barcodeGenState && (
        <ModalBarcodeGenerator
          isOpen={!!barcodeGenState}
          onClose={() => setBarcodeGenState(null)}
          product={barcodeGenState.product}
          unit={barcodeGenState.unit}
          onBarcodeGenerated={async (barcodeValue, barcodeType, distributorId) => {
            // Barcode sekarang terikat dengan distributor, jadi kita perlu update melalui saveProduct
            const product = barcodeGenState.product;
            const unit = barcodeGenState.unit;
            
            // Gunakan distributor default jika tidak ada distributorId yang dipilih
            const targetDistributorId = distributorId || (product.distributors?.find(d => d.isDefault)?.distributorId || product.distributors?.[0]?.distributorId);
            
            if (!targetDistributorId) {
              alert('Produk ini belum memiliki distributor. Silakan tambahkan distributor terlebih dahulu.');
              return;
            }

            // Update product dengan menambahkan barcode ke distributor yang sesuai
            const updatedDistributors = (product.distributors || []).map(dist => {
              const distId = dist.distributorId || dist.distributor?.id || dist.id;
              if (distId === targetDistributorId) {
                // Tambahkan barcode ke distributor ini untuk unit yang dipilih
                const existingBarcodes = dist.barcodes || [];
                const barcodeExists = existingBarcodes.some(b => {
                  const bValue = typeof b === 'string' ? b : (b?.barcode || b);
                  const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
                  return bValue === barcodeValue && bUnitId === unit.id;
                });
                
                if (!barcodeExists) {
                  return {
                    ...dist,
                    barcodes: [...existingBarcodes, { barcode: barcodeValue, unitId: unit.id }]
                  };
                }
              }
              return dist;
            });

            // Update product dengan distributors yang baru
            const updatedProduct = {
              ...product,
              distributors: updatedDistributors
            };

            // Save ke backend
            try {
              await saveProduct(updatedProduct);
              // Reload data
              const response = await fetchProductsPaginated(currentPage, itemsPerPage, searchTerm, filterSatuanKecil, filterSatuanBesar, filterDistributor);
              setProducts(response.data);
              setPagination(response.pagination);
            } catch (error) {
              console.error("Gagal menyimpan barcode:", error);
            }
          }}
          onBarcodeDeleted={async (barcodeValue, distributorId, unitId) => {
            // Hapus barcode dari distributor
            const product = barcodeGenState.product;
            
            // Update product dengan menghapus barcode dari distributor yang sesuai
            const updatedDistributors = (product.distributors || []).map(dist => {
              const distId = dist.distributorId || dist.distributor?.id || dist.id;
              if (distId === distributorId) {
                // Hapus barcode dari distributor ini
                const filteredBarcodes = (dist.barcodes || []).filter(b => {
                  const bValue = typeof b === 'string' ? b : (b?.barcode || b);
                  const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
                  return !(bValue === barcodeValue && bUnitId === unitId);
                });
                
                return {
                  ...dist,
                  barcodes: filteredBarcodes
                };
              }
              return dist;
            });

            // Update product dengan distributors yang baru
            const updatedProduct = {
              ...product,
              distributors: updatedDistributors
            };

            // Save ke backend
            try {
              await saveProduct(updatedProduct);
              // Reload data
              const response = await fetchProductsPaginated(currentPage, itemsPerPage, searchTerm, filterSatuanKecil, filterSatuanBesar, filterDistributor);
              setProducts(response.data);
              setPagination(response.pagination);
            } catch (error) {
              console.error("Gagal menghapus barcode:", error);
            }
          }}
        />
      )}

      {/* Modal Ubah Distributor */}
      {isUbahDistributorModalOpen && (
        <ModalUbahDistributor
          isOpen={isUbahDistributorModalOpen}
          onClose={() => setIsUbahDistributorModalOpen(false)}
          distributors={distributors}
          selectedCount={selectedProducts.size}
          onConfirm={handleBulkUpdateDistributor}
        />
      )}

      {/* Modal Ubah Satuan */}
      {isUbahSatuanModalOpen && ubahSatuanType && (
        <ModalUbahSatuan
          isOpen={isUbahSatuanModalOpen}
          onClose={() => {
            setIsUbahSatuanModalOpen(false);
            setUbahSatuanType(null);
          }}
          unitType={ubahSatuanType}
          selectedCount={selectedProducts.size}
          onConfirm={handleBulkUpdateSatuan}
        />
      )}

      {/* Modal Ubah Minimal Stok */}
      {isUbahMinStockModalOpen && (
        <ModalUbahMinStock
          isOpen={isUbahMinStockModalOpen}
          onClose={() => setIsUbahMinStockModalOpen(false)}
          selectedCount={selectedProducts.size}
          onConfirm={handleBulkUpdateMinStock}
        />
      )}
    </>
  );
}

export default PageMasterBarang;