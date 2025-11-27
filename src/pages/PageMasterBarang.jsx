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
import Pagination from '../components/Pagination';

function PageMasterBarang() {
  // 1. Ambil fungsi dari store
  const { deleteProduct, fetchProductsPaginated, products: allProducts, exportProducts, distributors, bulkUpdateDistributor, bulkUpdateUnit, saveProduct } = useStore();
  
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
  
  // State untuk mengontrol modal:
  // 'null' = modal tertutup
  // 'new' = modal terbuka untuk "Tambah Baru"
  // {product} = modal terbuka untuk "Edit"
  const [modalState, setModalState] = useState(null);
  const [printLabelState, setPrintLabelState] = useState(null); // {product, unit}
  const [barcodeGenState, setBarcodeGenState] = useState(null); // {product, unit}
  
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
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Distributor</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Satuan Kecil</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Satuan Besar</th>
                      <th scope="col" className="relative px-3 sm:px-6 py-3"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody id="master-inventory-list" className="bg-white divide-y divide-gray-200">
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
                      const satuanKecil = product.units.find(u => u.conversion === 1) || { name: 'N/A' };
                      const satuanBesar = product.units.find(u => u.conversion > 1) || null;
                      const satuanBesarString = satuanBesar 
                          ? `${satuanBesar.name} (${satuanBesar.conversion}x)` 
                          : 'N/A';
                          
                      return (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.distributor?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{satuanKecil.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{satuanBesarString}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {product.units.map(unit => (
                                <div key={unit.id} className="flex gap-1">
                                  <button
                                    onClick={() => setPrintLabelState({ product, unit })}
                                    className="text-blue-500 hover:text-blue-700"
                                    title={`Print Label ${unit.name}`}
                                  >
                                    <PrinterIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setBarcodeGenState({ product, unit })}
                                    className="text-green-500 hover:text-green-700"
                                    title={`Generate Barcode ${unit.name}`}
                                  >
                                    <QrCodeIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => handleOpenModal(product)}
                                className="text-yellow-500 hover:text-yellow-700" 
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => setProductToDelete(product)}
                                className="text-red-500 hover:text-red-700" 
                                title="Hapus"
                              >
                                <TrashIcon className="w-5 h-5" />
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
          onBarcodeGenerated={async (barcodeValue, barcodeType) => {
            // Update barcode di unit
            const product = barcodeGenState.product;
            const unit = barcodeGenState.unit;
            
            // Cari unit di product dan update barcodes
            const updatedUnits = product.units.map(u => {
              if (u.id === unit.id) {
                const newBarcodes = [...(u.barcodes || [])];
                if (!newBarcodes.includes(barcodeValue)) {
                  newBarcodes.push(barcodeValue);
                }
                return { ...u, barcodes: newBarcodes };
              }
              return u;
            });

            // Update product dengan units yang baru
            const updatedProduct = {
              ...product,
              units: updatedUnits
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
    </>
  );
}

export default PageMasterBarang;