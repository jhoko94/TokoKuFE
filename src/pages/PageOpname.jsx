import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi'; // Kita pakai ulang modal ini

function PageOpname() {
  const { products, processStockOpname } = useStore();
  
  // State untuk menampung SEMUA input fisik
  // Format: { [productId]: 123 }
  const [physicalStocks, setPhysicalStocks] = useState({});
  
  // State untuk modal konfirmasi
  const [modalData, setModalData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi state 'physicalStocks' saat halaman dimuat
  // Kita set semua input fisik = stok sistem
  useEffect(() => {
    const initialStocks = {};
    products.forEach(p => {
      initialStocks[p.id] = p.stock;
    });
    setPhysicalStocks(initialStocks);
  }, [products]); // Jalankan jika 'products' berubah (misal setelah terima PO)

  // Handler untuk mengubah satu input
  const handleStockChange = (productId, value) => {
    setPhysicalStocks(prev => ({
      ...prev,
      [productId]: value === '' ? '' : parseInt(value) // Simpan sbg angka
    }));
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
      <div className="page-content p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Stok Opname</h2>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil'}
          </button>
        </div>
        <p className="text-gray-600 mb-4">Masukkan jumlah stok fisik (nyata) untuk setiap barang. Stok yang tidak diubah tidak akan disesuaikan.</p>
        
        <div id="opname-list" className="space-y-3">
          {products.map(product => {
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
          })}
        </div>
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