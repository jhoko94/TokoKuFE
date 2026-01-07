import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function PageKonfirmasiPesanan() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const { products, confirmPOReceived, fetchPendingPOsPaginated } = useStore();
  
  // State untuk menampung jumlah yang benar-benar datang
  // Format: { [itemId]: receivedQty }
  const [receivedQtys, setReceivedQtys] = useState({});
  // State untuk menampung total harga dari invoice
  // Format: { [itemId]: invoiceTotalPrice }
  const [invoiceTotalPrices, setInvoiceTotalPrices] = useState({});
  const [po, setPo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch PO data
  useEffect(() => {
    const loadPO = async () => {
      if (!poId) {
        navigate('/cek-pesanan');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch semua PO dan cari yang sesuai dengan poId
        const response = await fetchPendingPOsPaginated(1, 1000); // Ambil banyak untuk mencari PO
        const foundPO = response.data.find(p => p.id === poId);
        
        if (!foundPO) {
          alert('PO tidak ditemukan');
          navigate('/cek-pesanan');
          return;
        }

        setPo(foundPO);
        
        // Initialize receivedQtys dengan nilai default dari PO
        if (foundPO.items) {
          const initialQtys = {};
          foundPO.items.forEach(item => {
            initialQtys[item.id] = item.qty || 0;
          });
          setReceivedQtys(initialQtys);
        }
      } catch (error) {
        console.error("Gagal memuat PO:", error);
        alert('Gagal memuat data PO');
        navigate('/cek-pesanan');
      } finally {
        setIsLoading(false);
      }
    };

    loadPO();
  }, [poId, navigate, fetchPendingPOsPaginated]);

  // Handler untuk input jumlah yang datang
  const handleReceivedQtyChange = (itemId, value) => {
    // Hanya izinkan angka, hapus karakter non-numerik
    const numericValue = value.replace(/[^0-9]/g, '');
    const qty = numericValue === '' ? 0 : parseInt(numericValue);
    setReceivedQtys(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  // Handler untuk input total harga invoice
  const handleInvoiceTotalPriceChange = (itemId, value) => {
    // Hapus semua karakter selain angka (untuk input yang lebih mudah)
    // User bisa input angka biasa, sistem akan format sendiri
    const cleanedValue = value.replace(/[^0-9]/g, '');
    const price = cleanedValue === '' ? 0 : parseFloat(cleanedValue) || 0;
    setInvoiceTotalPrices(prev => ({
      ...prev,
      [itemId]: price
    }));
  };

  // Format angka menjadi format rupiah
  const formatRupiah = (value) => {
    if (!value || value === 0) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Fungsi untuk validasi jumlah yang datang vs jumlah PO
  const getQtyValidation = (item) => {
    const receivedQty = receivedQtys[item.id] !== undefined ? receivedQtys[item.id] : item.qty;
    const poQty = item.qty || 0;
    
    // Jika jumlah yang datang adalah 0, tidak tampilkan status
    if (receivedQty === 0 || receivedQty === null || receivedQty === undefined) {
      return null;
    }
    
    if (receivedQty < poQty) {
      return { type: 'warning', message: `Kurang ${poQty - receivedQty} ${item.unitName}` };
    } else if (receivedQty > poQty) {
      return { type: 'warning', message: `Lebih ${receivedQty - poQty} ${item.unitName}` };
    }
    return { type: 'success', message: 'Sesuai' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const poItems = po.items || [];
      
      // Validasi: pastikan semua receivedQty sudah diisi
      const missingQtys = poItems.filter(item => !receivedQtys[item.id] || receivedQtys[item.id] <= 0);
      
      if (missingQtys.length > 0) {
        alert('Mohon isi jumlah yang datang untuk semua item');
        setIsSubmitting(false);
        return;
      }

      // Validasi: pastikan semua total harga invoice sudah diisi
      const missingPrices = poItems.filter(item => {
        const price = invoiceTotalPrices[item.id];
        return !price || price <= 0;
      });
      
      if (missingPrices.length > 0) {
        const productNames = missingPrices.map(item => {
          const product = products?.find(p => p.id === item.productId) || item.product;
          return product?.name || item.productName || 'Produk';
        }).join(', ');
        alert(`Mohon isi total harga invoice untuk semua item:\n${productNames}`);
        setIsSubmitting(false);
        return;
      }

      // Format data: receivedQtys dan invoiceTotalPrices
      const receivedQtysData = {};
      const invoiceTotalPricesData = {};
      poItems.forEach(item => {
        receivedQtysData[item.id] = receivedQtys[item.id] || item.qty;
        invoiceTotalPricesData[item.id] = invoiceTotalPrices[item.id];
      });

      // Panggil fungsi global, kirim PO-nya, receivedQtys, dan invoiceTotalPrices
      await confirmPOReceived(po, receivedQtysData, {}, invoiceTotalPricesData);
      
      // Redirect kembali ke halaman Cek Pesanan setelah sukses
      navigate('/cek-pesanan');
    } catch (err) {
      console.error("Gagal konfirmasi PO:", err);
      alert(`Gagal konfirmasi PO: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <div className="text-center py-8">
          <div className="loader mx-auto mb-2"></div>
          <p className="text-gray-500">Memuat data PO...</p>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <p className="text-center text-gray-500 py-8">PO tidak ditemukan.</p>
      </div>
    );
  }

  const distributorName = po.distributor?.name || 'N/A';
  const poItems = po.items || [];

  return (
    <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
      {/* Header dengan tombol kembali */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/cek-pesanan')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="text-sm sm:text-base">Kembali ke Cek Pesanan</span>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Konfirmasi Pesanan</h2>
        <p className="text-lg font-medium text-gray-700 mb-1">{distributorName}</p>
        <p className="text-sm text-gray-600">
          PO ID: <span className="font-mono text-xs">{po.id}</span>
        </p>
        <p className="text-sm text-gray-600">
          Dibuat: {new Date(po.createdAt).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Form Konfirmasi */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Cek dan input jumlah barang yang benar-benar datang beserta total harga dari invoice:
        </p>
        
        <div id="po-cek-item-list" className="space-y-3 sm:space-y-4 mb-6">
          {poItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Tidak ada item dalam PO ini.</p>
          ) : (
            poItems.map(item => {
              // Cari data produk "live" di state global
              let product = products?.find(p => p.id === item.productId);
              // Jika tidak ada (barang baru), gunakan snapshot dari PO
              if (!product) {
                product = item.product;
              }
              
              if (!product) {
                return (
                  <div key={item.productId || `item-${item.id}`} className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200 shadow-sm">
                    <p className="font-bold text-gray-800">{item.qty} {item.unitName || 'Pcs'} - {item.productName || 'Produk tidak ditemukan'}</p>
                    <p className="text-xs text-yellow-600 mt-1">Data produk tidak lengkap</p>
                  </div>
                );
              }

              const productName = product.name || item.productName || 'N/A';
              const receivedQty = receivedQtys[item.id] !== undefined ? receivedQtys[item.id] : item.qty;
              const qtyValidation = getQtyValidation(item);
              
              // Cari unit untuk mendapatkan harga saat ini
              const unit = product.units?.find(u => u.name === item.unitName);
              const currentPrice = unit?.price ? parseFloat(unit.price) : 0;
              
              // Hitung harga per unit baru dari invoice total price
              const invoiceTotalPrice = invoiceTotalPrices[item.id] || 0;
              const newPricePerUnit = receivedQty > 0 && invoiceTotalPrice > 0 
                ? invoiceTotalPrice / receivedQty 
                : currentPrice;
              
              // Format untuk display
              // Input field menampilkan angka biasa (untuk kemudahan input)
              const invoiceTotalPriceDisplay = invoiceTotalPrice > 0 ? invoiceTotalPrice.toString() : '';
              const newPricePerUnitDisplay = newPricePerUnit > 0 ? formatRupiah(newPricePerUnit) : '-';

              return (
                <div key={item.productId || product.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                  {/* Info Produk */}
                  <div className="mb-3 sm:mb-4">
                    <p className="font-bold text-gray-800 text-base sm:text-lg">{productName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Dipesan: <span className="font-medium">{item.qty} {item.unitName || 'Pcs'}</span>
                    </p>
                    {currentPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Harga saat ini: <span className="font-medium">{formatRupiah(currentPrice)}</span> per {item.unitName || 'Pcs'}
                      </p>
                    )}
                  </div>
                  
                  {/* Input Fields */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Jumlah Datang */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className="text-sm font-medium text-gray-700 sm:w-32">
                        Jumlah Datang:
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={receivedQty}
                          onChange={(e) => handleReceivedQtyChange(item.id, e.target.value)}
                          className="w-24 sm:w-32 p-2 sm:p-3 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="0"
                        />
                        <span className="text-sm sm:text-base text-gray-600">{item.unitName || 'Pcs'}</span>
                        {qtyValidation && qtyValidation.type === 'warning' && (
                          <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded font-medium ${
                            qtyValidation.message.includes('Kurang') 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {qtyValidation.message}
                          </span>
                        )}
                        {qtyValidation && qtyValidation.type === 'success' && (
                          <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-green-100 text-green-800 font-medium">
                            ✓ Sesuai
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Total Harga Invoice */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className="text-sm font-medium text-gray-700 sm:w-32">
                        Total Harga Invoice:
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={invoiceTotalPriceDisplay}
                          onChange={(e) => handleInvoiceTotalPriceChange(item.id, e.target.value)}
                          className="flex-1 sm:max-w-xs p-2 sm:p-3 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="0"
                        />
                        {invoiceTotalPriceDisplay && (
                          <span className="text-xs sm:text-sm text-gray-500">
                            {formatRupiah(invoiceTotalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Harga Per Unit (Auto-calculated, Read-only) */}
                    {receivedQty > 0 && invoiceTotalPrice > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-blue-50 p-2 sm:p-3 rounded-md border border-blue-200">
                        <label className="text-sm font-medium text-blue-700 sm:w-32">
                          Harga Per Unit:
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-semibold text-blue-800">
                            {newPricePerUnitDisplay}
                          </span>
                          <span className="text-xs text-blue-600">per {item.unitName || 'Pcs'}</span>
                          {currentPrice > 0 && newPricePerUnit !== currentPrice && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">
                              {newPricePerUnit > currentPrice ? '↑ Naik' : '↓ Turun'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={() => navigate('/cek-pesanan')} 
            disabled={isSubmitting}
            className="w-full sm:w-1/2 bg-gray-300 text-gray-800 font-bold py-2.5 sm:py-3 px-4 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-1/2 bg-green-600 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Datang'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PageKonfirmasiPesanan;

