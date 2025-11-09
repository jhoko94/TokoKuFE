import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import ModalCekPesanan from '../components/modals/ModalCekPesanan'; // Modal yg akan kita buat

function PageCekPesanan() {
  const { pendingPOs } = useStore();
  
  // State untuk mengontrol modal: PO mana yang sedang dicek
  const [poToCek, setPoToCek] = useState(null);

  return (
    <>
      <div className="page-content p-4 md:p-8">
        <h2 className="text-2xl font-bold mb-4">Cek Pesanan (PO) Pending</h2>
        <p className="text-gray-600 mb-4">Konfirmasi barang yang datang untuk menambah stok.</p>
        
        <div id="pending-po-list" className="space-y-3">
          {pendingPOs.length === 0 ? (
            <p className="text-center text-gray-500">Tidak ada pesanan (PO) yang sedang ditunggu.</p>
          ) : (
            pendingPOs.map(po => (
              <div key={po.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{po.distributor.name}</p>
                  <p className="text-sm text-gray-600">ID: {po.id}</p>
                  <p className="text-sm text-gray-600">Dibuat: {new Date(po.createdAt).toLocaleString('id-ID')}</p>
                  <p className="text-sm font-medium text-yellow-600">Status: {po.status}</p>
                </div>
                <button 
                  onClick={() => setPoToCek(po)} // Buka modal dengan data PO ini
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700"
                >
                  CEK
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Render Modal (jika poToCek di-set) */}
      {poToCek && (
        <ModalCekPesanan
          po={poToCek}
          onClose={() => setPoToCek(null)}
        />
      )}
    </>
  );
}

export default PageCekPesanan;