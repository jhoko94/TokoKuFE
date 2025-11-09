import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom'; // Untuk pindah halaman
import { generatePOPDF } from '../utils/generatePOPDF'; // Impor utilitas PDF kita
import { formatStockDisplay } from '../utils/formatters';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi'; // Kita akan pakai ulang modal ini

function PagePesanan() {
  const { distributors, products, createPO } = useStore();
  const navigate = useNavigate(); // Hook untuk navigasi
  
  // State lokal
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  
  // State untuk menyimpan { [productId]: { qty: 0, unit: 'Pcs' } }
  const [poItems, setPoItems] = useState({});
  
  const [modalData, setModalData] = useState(null); // State untuk ModalKonfirmasi
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Logika Filtering (Derived State)
  const suggestedProducts = useMemo(() => {
    if (!selectedDistributorId) return [];
    
    // Filter produk dari distributor yg dipilih & stok menipis
    return products.filter(p => 
      p.distributorId === selectedDistributorId && p.stock <= p.minStock
    );
  }, [products, selectedDistributorId]);

  // 2. Event Handlers
  const handleDistributorChange = (e) => {
    const distId = e.target.value;
    setSelectedDistributorId(distId);
    setPoItems({}); // Reset input barang setiap ganti distributor
  };
  
  // Handler untuk mengubah Qty atau Unit barang
  const handleItemChange = (productId, field, value) => {
    // Ambil unit default jika belum ada
    const defaultUnit = products.find(p => p.id === productId)?.units[0]?.name || 'Pcs';
    
    setPoItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        qty: prev[productId]?.qty || '', // qty default
        unit: prev[productId]?.unit || defaultUnit, // unit default
        [field]: value, // Timpa field yang diubah
      }
    }));
  };
  
  // 3. Logika Submit (inti)
  const handleFinalizePO = () => {
    const distributor = distributors.find(d => d.id === selectedDistributorId);
    if (!distributor) return;

    // Filter dari state 'poItems'
    const finalOrderList = Object.entries(poItems)
      .map(([productId, data]) => {
        const qty = Number(data.qty);
        if (qty > 0) {
          return {
            productId: productId,
            product: products.find(p => p.id === productId), // Sertakan data produk lengkap
            qty: qty,
            unitName: data.unit
          };
        }
        return null;
      })
      .filter(Boolean); // Hapus yg null

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
    
    // Buat pesan konfirmasi
    let poMessage = `PO untuk ${distributor.name}:<br>Mohon siapkan pesanan berikut:<br><br>`;
    newPO.items.forEach(item => {
      poMessage += `- ${item.product.name} (${item.qty} ${item.unitName})<br>`;
    });

    // Buka modal konfirmasi tipe "Konfirmasi & Buat PDF"
    setModalData({
      title: "Konfirmasi & Buat PDF",
      message: poMessage,
      onConfirm: () => proceedToSave(newPO), // Fungsi untuk eksekusi
      onCancel: () => setModalData(null) // Tutup modal
    });
  };

  // Fungsi async yang dipanggil setelah user klik OK di modal
  const proceedToSave = async (newPO) => {
    if (isSubmitting) return; // Mencegah double-click
    
    setIsSubmitting(true);
    setModalData(null); // Tutup modal konfirmasi
    
    try {
      // 1. Buat PDF
      await generatePOPDF(newPO);
      
      // 2. Simpan ke state global
      await createPO(newPO);
      
      // 3. Reset halaman
      setSelectedDistributorId('');
      setPoItems({});
      
      // 4. Pindah halaman (opsional, atau tampilkan notif sukses)
      navigate('/'); // Kembali ke halaman Jualan
      
      // Kita bisa tampilkan modal sukses di sini jika mau
      
    } catch (error) {
      console.error("Gagal buat PO atau PDF:", error);
      // Tampilkan modal error
      setModalData({
        title: "Error",
        message: "Gagal menyimpan PO atau membuat PDF. Silakan coba lagi.",
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
      <div className="page-content p-4 md:p-8">
        <h2 className="text-2xl font-bold mb-4">Buat Pesanan Barang (PO)</h2>

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
            <p className="text-gray-700 mb-4">
              2. Berikut adalah saran barang yang stoknya menipis. Masukkan jumlah yang ingin Anda pesan.
            </p>
            
            <div className="space-y-3 mb-4">
              {suggestedProducts.length === 0 ? (
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
                      <p className="font-bold text-lg">{product.name}</p>
                      <p className="text-sm font-medium text-red-600">
                        Sisa Stok: {formatStockDisplay(product, product.stock)} (Min: {product.minStock})
                      </p>
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

            {suggestedProducts.length > 0 && (
              <button 
                id="btn-finalize-po"
                onClick={handleFinalizePO}
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Buat PO'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Render Modal Konfirmasi (jika modalData di-set) */}
      {modalData && (
        <ModalKonfirmasi
          title={modalData.title}
          message={modalData.message}
          onConfirm={modalData.onConfirm}
          onCancel={modalData.onCancel} // Tombol Batal akan tersembunyi jika onCancel null
        />
      )}
    </>
  );
}

export default PagePesanan;