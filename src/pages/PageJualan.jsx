import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext'; // Hook state global kita
import { formatRupiah } from '../utils/formatters'; // Utilitas
// Impor modal Anda
import ModalAddProduct from '../components/modals/ModalAddProduct'; 

function PageJualan() {
  // 1. Ambil state global (Read-only)
  const { customers, products } = useStore();
  
  // 2. State Lokal (Spesifik untuk halaman ini)
  const [cart, setCart] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState('c1'); // Default Pelanggan Umum
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanError, setScanError] = useState(null);

  // 3. Menghitung nilai (Derived State)
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const isBonAllowed = customers.find(c => c.id === currentCustomer)?.type !== 'umum';

  // 4. Event Handlers (Menggantikan fungsi JS lama)
  const handleScan = (e) => {
    if (e.key === 'Enter') {
      const barcode = e.target.value;
      setScanError(null);
      // ... (Logika findProductByBarcode Anda di sini) ...
      // const result = findProductByBarcode(barcode, products);
      // if (result) {
      //   handleAddToCart(result.product, result.unit);
      //   e.target.value = '';
      // } else {
      //   setScanError('Barcode tidak ditemukan!');
      // }
    }
  };

  const handleAddToCart = (product, unit) => {
    // ... (Logika Cek Stok Anda di sini) ...
    
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id && item.unitName === unit.name);
      if (existingItem) {
        // Update Qty
        return currentCart.map(item => 
          item.id === product.id && item.unitName === unit.name
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        // Tambah baru
        return [...currentCart, {
          id: product.id,
          name: product.name,
          unitName: unit.name,
          price: unit.price,
          conversion: unit.conversion,
          qty: 1
        }];
      }
    });
    setIsModalOpen(false); // Tutup modal jika dibuka
  };
  
  const handleUpdateQty = (index, change) => {
     setCart(currentCart => {
        const updatedCart = [...currentCart];
        updatedCart[index].qty += change;
        if (updatedCart[index].qty <= 0) {
            updatedCart.splice(index, 1); // Hapus jika 0
        }
        return updatedCart;
     });
  };

  const handleTransaction = (type) => {
    // ... (Logika processTransaction Anda di sini) ...
    // Panggil fungsi dari context:
    // if (type === 'BON') {
    //   payDebt(currentCustomer, cartTotal); // (Ini contoh, idealnya ada fungsi `addTransaction`)
    // }
    // ... Kurangi stok ...
    
    // Reset cart
    setCart([]);
    setCurrentCustomer('c1');
  };

  // 5. Render (JSX)
  return (
    <>
      <div className="page-content p-4 md:p-8">
        
        {/* ... (Input Barcode Scanner) ... */}
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
          <label htmlFor="barcode-scanner" className="block text-sm font-medium text-gray-700">Scan Barcode:</label>
          <input 
            type="text" 
            id="barcode-scanner" 
            onKeyPress={handleScan}
            placeholder="Klik di sini dan scan..." 
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"
          />
          {scanError && <p className="text-red-500 text-sm mt-1">{scanError}</p>}
        </div>

        {/* ... (Tombol Tambah Manual) ... */}
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700">Atau Tambah Manual:</label>
          <button onClick={() => setIsModalOpen(true)} className="mt-1 w-full bg-blue-600 text-white ...">
            Cari Barang...
          </button>
        </div>

        {/* ... (Render Cart) ... */}
        <div id="cart-items" className="space-y-3 mb-4 pb-32 md:pb-0">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 pt-4">Keranjang masih kosong</div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.id}-${item.unitName}`} className="bg-white p-3 rounded-lg shadow flex ...">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-600">{formatRupiah(item.price)} x {item.unitName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpdateQty(index, -1)} className="bg-gray-200 ...">-</button>
                  <span className="font-medium w-8 text-center">{item.qty}</span>
                  <button onClick={() => handleUpdateQty(index, 1)} className="bg-gray-200 ...">+</button>
                </div>
                {/* ... subtotal ... */}
              </div>
            ))
          )}
        </div>

        {/* ... (Pilih Pelanggan) ... */}
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700">Pelanggan:</label>
            <select 
              id="customer-select" 
              value={currentCustomer}
              onChange={(e) => setCurrentCustomer(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 ...">
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name} ({cust.type})</option>
              ))}
            </select>
        </div>
        
        {/* ... (Total & Tombol Bayar) ... */}
        <div className="fixed bottom-0 left-0 right-0 md:static md:mt-8 p-4 bg-white ...">
          <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-700">Total:</span>
              <span id="cart-total" className="text-3xl font-bold text-gray-900">{formatRupiah(cartTotal)}</span>
          </div>
          <div className="flex gap-2">
              <button onClick={() => handleTransaction('LUNAS')} className="w-1/2 bg-green-600 ...">
                  LUNAS
              </button>
              <button 
                onClick={() => handleTransaction('BON')} 
                disabled={!isBonAllowed}
                className={`w-1/2 bg-yellow-500 text-white font-bold ... ${!isBonAllowed && 'opacity-50 cursor-not-allowed'}`}
              >
                  MASUK BON
              </button>
          </div>
        </div>
      </div>

      {/* 6. Modal (Komponen Terpisah) */}
      <ModalAddProduct 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductSelect={handleAddToCart}
      />
    </>
  );
}

export default PageJualan;