import { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom'; // Untuk pindah halaman
import { generatePOPDF } from '../utils/generatePOPDF'; // Impor utilitas PDF kita
import { formatStockDisplay } from '../utils/formatters';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi'; // Kita akan pakai ulang modal ini
import ModalTambahBarangPO from '../components/modals/ModalTambahBarangPO';
import Pagination from '../components/Pagination';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function PagePesanan() {
  const { distributors, createPO, fetchPOSuggestions } = useStore();
  const navigate = useNavigate(); // Hook untuk navigasi
  
  // State lokal
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  
  // State untuk menyimpan { [productId]: { qty: 0, unit: 'Pcs' } }
  const [poItems, setPoItems] = useState({});
  
  const [modalData, setModalData] = useState(null); // State untuk ModalKonfirmasi
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk pagination
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk produk yang ditambahkan manual (bukan dari saran stok menipis)
  const [manualProducts, setManualProducts] = useState([]); // Array of { productId, product, qty, unit }
  const [isModalTambahBarangOpen, setIsModalTambahBarangOpen] = useState(false);
  
  // Ref untuk scroll ke section "Barang yang Ditambahkan Manual"
  const manualProductsSectionRef = useRef(null);
  
  // Track previous length untuk detect penambahan produk baru
  const prevManualProductsLengthRef = useRef(0);

  // Fetch suggestions saat distributor atau page berubah
  useEffect(() => {
    if (!selectedDistributorId) {
      setSuggestedProducts([]);
      setPagination({ page: 1, limit: 25, total: 0, totalPages: 0 });
      return;
    }

    const loadSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetchPOSuggestions(selectedDistributorId, currentPage, itemsPerPage);
        setSuggestedProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });
      } catch (error) {
        console.error("Gagal memuat saran PO:", error);
        setSuggestedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [selectedDistributorId, currentPage, itemsPerPage, fetchPOSuggestions]);

  // 2. Event Handlers
  const handleDistributorChange = (e) => {
    const distId = e.target.value;
    setSelectedDistributorId(distId);
    setPoItems({}); // Reset input barang setiap ganti distributor
    setManualProducts([]); // Reset produk manual
    setCurrentPage(1); // Reset ke page 1 saat ganti distributor
  };
  
  // Handler untuk mengubah Qty atau Unit barang
  const handleItemChange = (productId, field, value, isManual = false) => {
    if (isManual) {
      // Update manual products
      setManualProducts(prev => prev.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            [field === 'qty' ? 'qty' : 'unitName']: value
          };
        }
        return item;
      }));
    } else {
      // Update suggested products (existing logic)
      const product = suggestedProducts.find(p => p.id === productId);
      const defaultUnit = product?.units?.[0]?.name || 'Pcs';
      
      setPoItems(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          qty: prev[productId]?.qty || '', // qty default
          unit: prev[productId]?.unit || defaultUnit, // unit default
          [field]: value, // Timpa field yang diubah
        }
      }));
    }
  };
  
  // Handler untuk menambahkan produk dari modal
  const handleAddManualProduct = (productData) => {
    // Cek apakah produk sudah ada (baik di suggested atau manual)
    const existsInSuggested = suggestedProducts.some(p => p.id === productData.productId);
    const existsInManual = manualProducts.some(p => p.productId === productData.productId);
    
    if (existsInSuggested || existsInManual) {
      setModalData({
        title: "Perhatian",
        message: "Produk ini sudah ada dalam daftar PO.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
      return;
    }
    
    // Tambahkan ke manual products
    setManualProducts(prev => [...prev, {
      productId: productData.productId,
      product: productData.product,
      qty: productData.qty,
      unitName: productData.unitName
    }]);
    
    setIsModalTambahBarangOpen(false);
  };
  
  // Handler untuk menambahkan multiple products (dari multi-select)
  const handleAddMultipleProducts = (productsData) => {
    // Filter produk yang belum ada
    const newProducts = productsData.filter(productData => {
      const existsInSuggested = suggestedProducts.some(p => p.id === productData.productId);
      const existsInManual = manualProducts.some(p => p.productId === productData.productId);
      return !existsInSuggested && !existsInManual;
    });
    
    if (newProducts.length === 0) {
      setModalData({
        title: "Perhatian",
        message: "Semua produk yang dipilih sudah ada dalam daftar PO.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
      return;
    }
    
    // Tambahkan semua produk baru
    setManualProducts(prev => [...prev, ...newProducts.map(productData => ({
      productId: productData.productId,
      product: productData.product,
      qty: productData.qty,
      unitName: productData.unitName
    }))]);
    
    setIsModalTambahBarangOpen(false);
  };
  
  // Auto-scroll ke section "Barang yang Ditambahkan Manual" ketika produk baru ditambahkan
  useEffect(() => {
    // Cek apakah ada produk baru yang ditambahkan (length bertambah)
    if (manualProducts.length > prevManualProductsLengthRef.current && manualProductsSectionRef.current) {
      // Delay sedikit untuk memastikan DOM sudah ter-render
      setTimeout(() => {
        manualProductsSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
    
    // Update previous length
    prevManualProductsLengthRef.current = manualProducts.length;
  }, [manualProducts.length]);
  
  // Handler untuk menghapus produk manual
  const handleRemoveManualProduct = (productId) => {
    setManualProducts(prev => prev.filter(item => item.productId !== productId));
  };
  
  // 3. Logika Submit (inti)
  const handleFinalizePO = () => {
    // Validasi distributor
    if (!selectedDistributorId) {
      setModalData({
        title: "Error",
        message: "Distributor harus dipilih terlebih dahulu.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
      return;
    }

    const distributor = distributors.find(d => d.id === selectedDistributorId);
    if (!distributor) {
      setModalData({
        title: "Error",
        message: "Distributor tidak ditemukan. Silakan pilih distributor lagi.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
      return;
    }

    // Gabungkan produk dari saran stok menipis dan produk yang ditambahkan manual
    const suggestedItems = Object.entries(poItems)
      .map(([productId, data]) => {
        const qty = Number(data.qty);
        if (qty > 0) {
          const product = suggestedProducts.find(p => p.id === productId);
          if (product) {
            return {
              productId: productId,
              product: product,
              qty: qty,
              unitName: data.unit
            };
          }
        }
        return null;
      })
      .filter(Boolean);
    
    // Tambahkan produk manual yang qty > 0
    const manualItems = manualProducts
      .filter(item => Number(item.qty) > 0)
      .map(item => ({
        productId: item.productId,
        product: item.product,
        qty: Number(item.qty),
        unitName: item.unitName
      }));
    
    const finalOrderList = [...suggestedItems, ...manualItems];

    if (finalOrderList.length === 0) {
      // Buka modal konfirmasi tipe "Info" (hanya tombol OK)
      setModalData({
        title: "Perhatian",
        message: "Anda belum memasukkan jumlah barang yang ingin dipesan.",
        onConfirm: () => setModalData(null), // Tutup modal
        onCancel: null // Sembunyikan tombol Batal
      });
      return;
    }

    // Buat objek PO
    const newPO = {
      id: `PO-${Date.now().toString().slice(-5)}`, // ID unik dummy
      distributor: distributor,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      items: finalOrderList 
    };
    
    // Buka modal konfirmasi tipe "Konfirmasi & Buat PDF" dengan tabel
    setModalData({
      title: "Konfirmasi & Buat PDF",
      message: null, // Tidak perlu message jika pakai tabel
      items: finalOrderList, // Kirim items untuk ditampilkan di tabel
      distributorName: distributor.name,
      onConfirm: (paperSize) => proceedToSave(newPO, paperSize), // Fungsi untuk eksekusi dengan ukuran kertas
      onCancel: () => setModalData(null) // Tutup modal
    });
  };

  // Fungsi async yang dipanggil setelah user klik OK di modal
  const proceedToSave = async (newPO, paperSize = 'a4') => {
    if (isSubmitting) return; // Mencegah double-click
    
    // Validasi ulang distributor
    if (!selectedDistributorId || !newPO.distributor) {
      setModalData({
        title: "Error",
        message: "Distributor harus dipilih terlebih dahulu.",
        onConfirm: () => setModalData(null),
        onCancel: null
      });
      return;
    }
    
    setIsSubmitting(true);
    setModalData(null); // Tutup modal konfirmasi
    
    try {
      // Format data untuk backend: { distributorId, items: [{ productId, qty, unitName }] }
      const poDataForBackend = {
        distributorId: selectedDistributorId,
        items: newPO.items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          unitName: item.unitName
        }))
      };
      
      // 1. Simpan ke backend dulu (untuk mendapatkan PO ID yang valid)
      const savedPO = await createPO(poDataForBackend);
      
      // Validasi savedPO dengan pesan error yang jelas
      if (!savedPO) {
        throw new Error('Gagal membuat PO: Tidak ada response dari server');
      }
      
      if (!savedPO.id) {
        console.error('Response PO tidak valid:', savedPO);
        throw new Error('Gagal membuat PO: ID tidak ditemukan di response');
      }
      
      // 2. Buat PDF dengan data yang sudah disimpan (menggunakan savedPO dari backend)
      // Format PO Number dari ID (ambil 8 karakter terakhir untuk display)
      const poNumber = savedPO.id ? `PO-${savedPO.id.slice(-8).toUpperCase()}` : `PO-${Date.now()}`;
      
      const poForPDF = {
        id: poNumber, // Gunakan format PO-XXXX untuk PDF
        poId: savedPO.id, // Simpan ID asli juga
        distributor: newPO.distributor,
        createdAt: savedPO.createdAt || new Date().toISOString(),
        status: savedPO.status || 'PENDING',
        items: newPO.items // Tetap gunakan items dengan product data untuk PDF
      };
      
      // Generate PDF dengan ukuran kertas yang dipilih
      await generatePOPDF(poForPDF, null, paperSize);
      
      // 3. Reset halaman
      setSelectedDistributorId('');
      setPoItems({});
      setManualProducts([]);
      
      // 4. Tampilkan notifikasi sukses dan pindah halaman
      // Notifikasi sudah ditampilkan oleh createPO di StoreContext
      setTimeout(() => {
        navigate('/cek-pesanan'); // Pindah ke halaman Cek Pesanan
      }, 1000);
      
      // Kita bisa tampilkan modal sukses di sini jika mau
      
    } catch (error) {
      console.error("Gagal buat PO atau PDF:", error);
      // Tampilkan modal error dengan pesan yang lebih spesifik
      const errorMessage = error.message || "Gagal menyimpan PO atau membuat PDF. Silakan coba lagi.";
      setModalData({
        title: "Error",
        message: errorMessage,
        onConfirm: () => setModalData(null),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Render JSX
  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-32 sm:pb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Buat Pesanan Barang (PO)</h2>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <label htmlFor="distributor-select" className="block text-sm font-medium text-gray-700">
            1. Pilih Distributor:
          </label>
          <select 
            id="distributor-select" 
            value={selectedDistributorId}
            onChange={handleDistributorChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
          >
            <option value="">-- Pilih Distributor --</option>
            {distributors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        
        {/* Konten akan muncul jika distributor dipilih */}
        {selectedDistributorId && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">
                2. Berikut adalah saran barang yang stoknya menipis. Masukkan jumlah yang ingin Anda pesan.
              </p>
              <button
                onClick={() => setIsModalTambahBarangOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Tambah Barang Lain</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              ) : suggestedProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Stok barang dari distributor ini aman.</p>
              ) : (
                suggestedProducts.map(product => {
                  // Siapkan opsi unit
                  const unitOptions = product.units
                    .sort((a, b) => b.conversion - a.conversion)
                    .map(unit => 
                      <option key={unit.id} value={unit.name}>{unit.name}</option>
                    );
                    
                  // Ambil nilai dari state 'poItems'
                  const currentQty = poItems[product.id]?.qty || '';
                  const currentUnit = poItems[product.id]?.unit || product.units[0].name;

                  return (
                    <div key={product.id} className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-lg">{product.name}</p>
                        {product.isDefaultSupplier && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Supplier Utama
                          </span>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-red-600">
                          Stok dari Supplier: {formatStockDisplay(product, product.stockFromSupplier || 0)} | 
                          Stok Total: {formatStockDisplay(product, product.totalStock || product.stock)} | 
                          Min: {product.minStock}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input 
                          type="number"
                          value={currentQty}
                          onChange={(e) => handleItemChange(product.id, 'qty', e.target.value)}
                          placeholder="Jumlah" 
                          className="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <select 
                          value={currentUnit}
                          onChange={(e) => handleItemChange(product.id, 'unit', e.target.value)}
                          className="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                        >
                          {unitOptions}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
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

            {/* Daftar Barang yang Ditambahkan Manual */}
            {manualProducts.length > 0 && (
              <div ref={manualProductsSectionRef} className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Barang yang Ditambahkan Manual
                </h3>
                <div className="space-y-3">
                  {manualProducts.map(item => {
                    const product = item.product;
                    const unitOptions = product.units
                      .sort((a, b) => b.conversion - a.conversion)
                      .map(unit => 
                        <option key={unit.id} value={unit.name}>{unit.name}</option>
                      );
                    
                    return (
                      <div key={item.productId} className="border border-gray-200 p-4 rounded-lg bg-blue-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-lg">{product.name}</p>
                            <p className="text-sm font-medium text-gray-600">
                              Stok: {formatStockDisplay(product, product.stock)} (Min: {product.minStock})
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveManualProduct(item.productId)}
                            className="ml-2 p-1 text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input 
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.productId, 'qty', e.target.value, true)}
                            placeholder="Jumlah" 
                            className="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm"
                            min="1"
                          />
                          <select 
                            value={item.unitName}
                            onChange={(e) => handleItemChange(item.productId, 'unit', e.target.value, true)}
                            className="w-1/2 p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                          >
                            {unitOptions}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tombol Buat PO - muncul jika ada produk (baik saran maupun manual) */}
            <div className="mb-12 sm:mb-4 mt-6">
              <button 
                id="btn-finalize-po"
                onClick={handleFinalizePO}
                disabled={isSubmitting || !selectedDistributorId}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px]"
              >
                {isSubmitting ? 'Memproses...' : 'Buat PO'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render Modal Konfirmasi (jika modalData di-set) */}
      {modalData && (
        <ModalKonfirmasi
          title={modalData.title}
          message={modalData.message}
          items={modalData.items}
          distributorName={modalData.distributorName}
          onConfirm={modalData.onConfirm}
          onCancel={modalData.onCancel} // Tombol Batal akan tersembunyi jika onCancel null
        />
      )}
      
      {/* Modal Tambah Barang PO */}
      <ModalTambahBarangPO
        isOpen={isModalTambahBarangOpen}
        onClose={() => setIsModalTambahBarangOpen(false)}
        distributorId={selectedDistributorId}
        onProductSelect={handleAddManualProduct}
        onMultipleProductSelect={handleAddMultipleProducts}
        existingProductIds={[
          ...suggestedProducts.map(p => p.id),
          ...manualProducts.map(p => p.productId)
        ]}
      />
    </>
  );
}

export default PagePesanan;