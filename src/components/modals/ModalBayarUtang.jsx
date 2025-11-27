import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';

// Modal ini menerima props 'customer' (data yg mau dibayar) dan 'onClose' (fungsi untuk menutup)
export default function ModalBayarUtang({ customer, onClose }) {
  const { payDebt } = useStore(); // Ambil fungsi 'payDebt' dari global state
  
  // State lokal HANYA untuk form input di modal ini
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');

  // useEffect ini akan berjalan SETIAP kali modal dibuka (karena props 'customer' berubah)
  // Ini menggantikan 'openPayDebtModal' di script.js lama
  useEffect(() => {
    // Langsung isi input dengan jumlah utang penuh
    if (customer) {
      setAmount(customer.debt);
      setError(''); // Reset error
    }
  }, [customer]); // Dependency: jalankan jika 'customer' berubah

  // Fungsi yang dijalankan saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    setError(''); // Reset error

    const payAmount = Number(amount);

    // Validasi
    if (isNaN(payAmount) || payAmount <= 0) {
      setError('Jumlah bayar tidak valid');
      return;
    }
    if (payAmount > customer.debt) {
      setError('Jumlah bayar melebihi sisa utang');
      return;
    }

    // Panggil fungsi dari context untuk update global state
    try {
      await payDebt(customer.id, payAmount);
      onClose(); // Tutup modal jika sukses (onClose akan trigger reload di PageUtang)
    } catch (err) {
      setError('Gagal menyimpan pembayaran.');
    }
  };

  // Jika customer tidak ada (seharusnya tidak terjadi, tapi sbg pengaman)
  if (!customer) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-pay-debt" className="modal-content">
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold mb-4">Bayar Utang</h3>
          <p className="text-lg font-medium">{customer.name}</p>
          <p className="text-sm text-red-600 mb-4">
            Sisa Utang: <span>{formatRupiah(customer.debt)}</span>
          </p>
          
          <div>
            <label htmlFor="pay-debt-amount" className="block text-sm font-medium text-gray-700">
              Jumlah Bayar (Rp):
            </label>
            <input 
              type="number" 
              id="pay-debt-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 50000" 
              className="w-full p-2 mt-1 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          
          <div className="flex gap-2 mt-6">
            <button 
              type="button" // Tipe 'button' agar tidak submit form
              onClick={onClose} 
              className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Batal
            </button>
            <button 
              type="submit" // Tipe 'submit' untuk menjalankan handleSubmit
              className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Bayar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}