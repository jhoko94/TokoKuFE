import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import ModalBayarUtang from '../components/modals/ModalBayarUtang'; // Modal yang akan kita buat

function PageUtang() {
  // 1. Ambil data pelanggan dari state global
  const { customers } = useStore();
  
  // 2. State lokal untuk search dan modal
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk menyimpan customer MANA yang akan bayar utang
  // null = modal tertutup
  // non-null = modal terbuka
  const [customerToPay, setCustomerToPay] = useState(null);

  // 3. Logika Filtering dan Perhitungan (Mirip script.js lama)
  // useMemo digunakan untuk optimasi agar tidak kalkulasi ulang di setiap render
  const customersWithDebt = useMemo(() => {
    return customers
      .filter(c => c.debt > 0) // Hanya yang punya utang
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())); // Filter by search
  }, [customers, searchTerm]); // Kalkulasi ulang HANYA jika customers atau searchTerm berubah

  const totalDebt = useMemo(() => {
    // Hitung total dari SEMUA utang, bukan hanya yang terfilter
    return customers.reduce((acc, c) => acc + c.debt, 0);
  }, [customers]); // Kalkulasi ulang HANYA jika customers berubah


  // 4. Render JSX
  return (
    <>
      <div className="page-content p-4 md:p-8">
        
        {/* Ringkasan Total Utang */}
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Total Utang Beredar</h3>
          <p id="total-debt-summary" className="text-3xl font-bold text-red-600">
            {formatRupiah(totalDebt)}
          </p>
        </div>
        
        {/* Search Bar */}
        <input 
          type="text" 
          id="debt-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama pelanggan..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
        />
        
        {/* Daftar Utang */}
        <div id="debt-list" className="space-y-3">
          {customersWithDebt.length === 0 ? (
            <p className="text-center text-gray-500">Tidak ada pelanggan yang berutang.</p>
          ) : (
            customersWithDebt.map(customer => (
              <div key={customer.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{customer.name}</p>
                  <p className="text-red-600 font-medium">{formatRupiah(customer.debt)}</p>
                </div>
                <button 
                  onClick={() => setCustomerToPay(customer)} // Buka modal dengan data customer ini
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700"
                >
                  BAYAR
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Render Modal (Secara Kondisional)
        Modal hanya akan render jika customerToPay BUKAN null.
      */}
      {customerToPay && (
        <ModalBayarUtang 
          customer={customerToPay}
          onClose={() => setCustomerToPay(null)} // Fungsi untuk menutup modal
        />
      )}
    </>
  );
}

export default PageUtang;