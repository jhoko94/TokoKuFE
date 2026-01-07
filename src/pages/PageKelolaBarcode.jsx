import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import ModalPilihUkuranKertas from '../components/modals/ModalPilihUkuranKertas';
import Pagination from '../components/Pagination';
import { generateBarcodePDF, generateMultipleBarcodePDF } from '../utils/generateBarcodePDF';

// Component untuk checkbox dengan indeterminate state
function CheckboxWithIndeterminate({ checked, indeterminate, onChange }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={checked}
      onChange={onChange}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  );
}

function PageKelolaBarcode() {
  const navigate = useNavigate();
  const { 
    fetchBarcodesPaginated, 
    deleteBarcode, 
    bulkDeleteBarcodes,
    products,
    distributors,
    generateBarcode
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [barcodes, setBarcodes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeToDelete, setBarcodeToDelete] = useState(null);
  const [selectedBarcodes, setSelectedBarcodes] = useState(new Set());
  const [barcodesToBulkDelete, setBarcodesToBulkDelete] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set()); // Set of row keys (productId-distributorId-unitId)
  const [barcodeToDownload, setBarcodeToDownload] = useState(null); // Barcode yang akan di-download PDF
  const [barcodesToBulkDownload, setBarcodesToBulkDownload] = useState(null); // Barcodes yang akan di-download PDF (multi)

  // Fetch data dengan pagination
  useEffect(() => {
    const loadBarcodes = async () => {
      setIsLoading(true);
      try {
        const response = await fetchBarcodesPaginated(
          currentPage,
          itemsPerPage,
          searchTerm,
          filterProduct,
          filterDistributor,
          filterUnit
        );
        setBarcodes(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat barcode:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBarcodes();
  }, [currentPage, itemsPerPage, searchTerm, filterProduct, filterDistributor, filterUnit, fetchBarcodesPaginated]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProduct, filterDistributor, filterUnit]);

  // Handler untuk reload data setelah delete
  const reloadBarcodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetchBarcodesPaginated(
        currentPage,
        itemsPerPage,
        searchTerm,
        filterProduct,
        filterDistributor,
        filterUnit
      );
      setBarcodes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Gagal memuat barcode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk navigate ke halaman tambah barcode
  const handleOpenTambahBarcode = () => {
    navigate('/tambah-barcode');
  };


  // Handler untuk delete
  const handleDelete = async () => {
    if (!barcodeToDelete) return;
    try {
      await deleteBarcode(barcodeToDelete.id);
      await reloadBarcodes();
      setBarcodeToDelete(null);
    } catch (error) {
      // Error sudah ditangani di deleteBarcode
    }
  };

  // Handler untuk bulk delete
  const handleBulkDelete = async () => {
    if (!barcodesToBulkDelete || barcodesToBulkDelete.length === 0) return;
    try {
      await bulkDeleteBarcodes(barcodesToBulkDelete);
      await reloadBarcodes();
      setBarcodesToBulkDelete(null);
      setSelectedBarcodes(new Set());
    } catch (error) {
      // Error sudah ditangani di bulkDeleteBarcodes
    }
  };

  // Handler untuk download PDF barcode (tampilkan modal pilihan ukuran dulu)
  const handleDownloadPDF = (barcode) => {
    setBarcodeToDownload(barcode);
  };

  // Handler untuk konfirmasi download setelah pilih ukuran kertas
  const handleConfirmDownload = async (paperSize) => {
    if (barcodeToDownload) {
      try {
        await generateBarcodePDF(barcodeToDownload, paperSize);
        setBarcodeToDownload(null);
      } catch (error) {
        console.error("Gagal download PDF barcode:", error);
        alert('Gagal download PDF barcode');
      }
    }
  };

  // Handler untuk konfirmasi bulk download setelah pilih ukuran kertas
  const handleConfirmBulkDownload = async (paperSize) => {
    if (barcodesToBulkDownload && barcodesToBulkDownload.length > 0) {
      try {
        // Ambil data barcode lengkap dari state barcodes
        const selectedBarcodeData = barcodesToBulkDownload.map(barcodeId => {
          return barcodes.find(b => b.id === barcodeId);
        }).filter(Boolean); // Filter out undefined
        
        if (selectedBarcodeData.length === 0) {
          alert('Tidak ada barcode yang valid untuk di-download');
          setBarcodesToBulkDownload(null);
          return;
        }

        await generateMultipleBarcodePDF(selectedBarcodeData, paperSize);
        setBarcodesToBulkDownload(null);
        setSelectedBarcodes(new Set()); // Clear selection setelah download
      } catch (error) {
        console.error("Gagal download PDF multiple barcode:", error);
        alert('Gagal download PDF barcode');
      }
    }
  };

  // Get unique units from barcodes for filter
  const uniqueUnits = Array.from(new Set(barcodes.map(b => b.unit.id))).map(unitId => {
    const barcode = barcodes.find(b => b.unit.id === unitId);
    return barcode ? barcode.unit : null;
  }).filter(Boolean);

  // Group barcodes by Product + Distributor + Unit
  const groupedBarcodes = barcodes.reduce((acc, barcode) => {
    const key = `${barcode.product.id}-${barcode.distributor.id}-${barcode.unit.id}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        product: barcode.product,
        distributor: barcode.distributor,
        unit: barcode.unit,
        barcodes: [],
        totalStock: 0
      };
    }
    acc[key].barcodes.push(barcode);
    acc[key].totalStock += barcode.stock || 0;
    return acc;
  }, {});

  const groupedBarcodesArray = Object.values(groupedBarcodes);

  // Toggle expand row
  const toggleExpand = (key) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold">Kelola Barcode</h2>
        <button 
          onClick={handleOpenTambahBarcode}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Barcode</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari produk atau barcode..." 
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        />
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="">Semua Produk</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
        <select
          value={filterDistributor}
          onChange={(e) => setFilterDistributor(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="">Semua Distributor</option>
          {distributors.map(distributor => (
            <option key={distributor.id} value={distributor.id}>{distributor.name}</option>
          ))}
        </select>
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="">Semua Satuan</option>
          {uniqueUnits.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedBarcodes.size > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-900">
              {selectedBarcodes.size} barcode dipilih
            </span>
            <button
              onClick={() => setSelectedBarcodes(new Set())}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Batal
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBarcodesToBulkDownload(Array.from(selectedBarcodes))}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download PDF {selectedBarcodes.size} Barcode</span>
            </button>
            <button
              onClick={() => setBarcodesToBulkDelete(Array.from(selectedBarcodes))}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-700 flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Hapus {selectedBarcodes.size} Barcode</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={barcodes.length > 0 && selectedBarcodes.size === barcodes.length}
                    onChange={() => {
                      if (selectedBarcodes.size === barcodes.length) {
                        setSelectedBarcodes(new Set());
                      } else {
                        setSelectedBarcodes(new Set(barcodes.map(b => b.id)));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distributor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : groupedBarcodesArray.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterProduct || filterDistributor || filterUnit 
                      ? 'Tidak ada barcode yang sesuai dengan filter' 
                      : 'Belum ada barcode'}
                  </td>
                </tr>
              ) : (
                groupedBarcodesArray.map(group => {
                  const isExpanded = expandedRows.has(group.key);
                  const allBarcodeIds = group.barcodes.map(b => b.id);
                  const allSelected = allBarcodeIds.every(id => selectedBarcodes.has(id));
                  const someSelected = allBarcodeIds.some(id => selectedBarcodes.has(id));

                  return (
                    <React.Fragment key={group.key}>
                      {/* Main row - Product */}
                      <tr className="hover:bg-gray-50 bg-white">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleExpand(group.key)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="w-5 h-5" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <CheckboxWithIndeterminate
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={() => {
                              setSelectedBarcodes(prev => {
                                const newSet = new Set(prev);
                                if (allSelected) {
                                  allBarcodeIds.forEach(id => newSet.delete(id));
                                } else {
                                  allBarcodeIds.forEach(id => newSet.add(id));
                                }
                                return newSet;
                              });
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{group.product.name}</div>
                          <div className="text-sm text-gray-500">{group.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.distributor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.unit.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.barcodes.length} barcode
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.barcodes[0]?.stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleExpand(group.key)}
                            className="text-blue-600 hover:text-blue-900"
                            title={isExpanded ? "Tutup" : "Lihat Barcode"}
                          >
                            {isExpanded ? "Tutup" : "Lihat Barcode"}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded row - Barcodes */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="px-0 py-0 bg-gray-50">
                            <div className="px-6 py-4">
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase w-12">
                                        <CheckboxWithIndeterminate
                                          checked={allSelected}
                                          indeterminate={someSelected && !allSelected}
                                          onChange={() => {
                                            setSelectedBarcodes(prev => {
                                              const newSet = new Set(prev);
                                              if (allSelected) {
                                                allBarcodeIds.forEach(id => newSet.delete(id));
                                              } else {
                                                allBarcodeIds.forEach(id => newSet.add(id));
                                              }
                                              return newSet;
                                            });
                                          }}
                                        />
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Barcode</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {group.barcodes.map(barcode => (
                                      <tr key={barcode.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <input
                                            type="checkbox"
                                            checked={selectedBarcodes.has(barcode.id)}
                                            onChange={() => {
                                              setSelectedBarcodes(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(barcode.id)) {
                                                  newSet.delete(barcode.id);
                                                } else {
                                                  newSet.add(barcode.id);
                                                }
                                                return newSet;
                                              });
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <div className="text-sm font-mono text-gray-900">{barcode.barcode}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                          <div className="flex items-center justify-end space-x-2">
                                            <button
                                              onClick={() => handleDownloadPDF(barcode)}
                                              className="text-blue-600 hover:text-blue-900"
                                              title="Download PDF"
                                            >
                                              <ArrowDownTrayIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                              onClick={() => setBarcodeToDelete(barcode)}
                                              className="text-red-600 hover:text-red-900"
                                              title="Hapus"
                                            >
                                              <TrashIcon className="w-5 h-5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={pagination.total}
          />
        </div>
      )}

      {/* Modal Konfirmasi Delete */}
      {barcodeToDelete && (
        <ModalKonfirmasi
          message={`Apakah Anda yakin ingin menghapus barcode "${barcodeToDelete.barcode}"?`}
          onConfirm={handleDelete}
          onCancel={() => setBarcodeToDelete(null)}
        />
      )}

      {/* Modal Konfirmasi Bulk Delete */}
      {barcodesToBulkDelete && (
        <ModalKonfirmasi
          message={`Apakah Anda yakin ingin menghapus ${barcodesToBulkDelete.length} barcode?`}
          onConfirm={handleBulkDelete}
          onCancel={() => setBarcodesToBulkDelete(null)}
        />
      )}

      {/* Modal Pilih Ukuran Kertas untuk Download PDF (Single) */}
      {barcodeToDownload && (
        <ModalPilihUkuranKertas
          onConfirm={handleConfirmDownload}
          onCancel={() => setBarcodeToDownload(null)}
        />
      )}

      {/* Modal Pilih Ukuran Kertas untuk Download PDF (Multiple) */}
      {barcodesToBulkDownload && (
        <ModalPilihUkuranKertas
          onConfirm={handleConfirmBulkDownload}
          onCancel={() => setBarcodesToBulkDownload(null)}
        />
      )}
    </div>
  );
}

export default PageKelolaBarcode;

