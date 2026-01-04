import { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext'; // Hook state global kita
import { formatRupiah, findProductByBarcode } from '../utils/formatters'; // Utilitas
import { getCustomerType, canCustomerBon } from '../utils/normalize';
// Impor modal Anda
import ModalAddProduct from '../components/modals/ModalAddProduct';
import ModalPrintStruk from '../components/modals/ModalPrintStruk'; 

function PageJualan() {
  // 1. Ambil state global (Read-only)
  const { customers, products, processTransaction, showToast, payDebt, getTransactionByInvoice, apiFetch } = useStore();
  
  // 2. State Lokal (Spesifik untuk halaman ini)
  const [cart, setCart] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null); // Akan di-set dari customers[0]
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useChangeForDebt, setUseChangeForDebt] = useState(false); // Gunakan kembalian untuk bayar utang
  const [uangBayar, setUangBayar] = useState(''); // Uang yang dibayarkan pelanggan
  const [discount, setDiscount] = useState(''); // Diskon total transaksi
  const [note, setNote] = useState(''); // Catatan transaksi
  const [lastTransaction, setLastTransaction] = useState(null); // Transaksi terakhir untuk print struk
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const barcodeInputRef = useRef(null);

  // Set default customer saat customers loaded
  // Prioritas: "Pelanggan Umum" (nama) > customer dengan type UMUM > customer pertama
  useEffect(() => {
    if (customers.length > 0 && !currentCustomer) {
      // Prioritas 1: Cari customer dengan nama "Pelanggan Umum"
      let defaultCustomer = customers.find(c => c.name === 'Pelanggan Umum');
      
      // Prioritas 2: Jika tidak ada, cari customer dengan type UMUM
      if (!defaultCustomer) {
        defaultCustomer = customers.find(c => getCustomerType(c) === 'UMUM');
      }
      
      // Prioritas 3: Jika masih tidak ada, ambil customer pertama
      if (!defaultCustomer) {
        defaultCustomer = customers[0];
      }
      
      setCurrentCustomer(defaultCustomer?.id || null);
    }
  }, [customers, currentCustomer]);

  // Reset opsi kembalian ke utang saat ganti customer
  useEffect(() => {
    setUseChangeForDebt(false);
  }, [currentCustomer]);

  // 3. Menghitung nilai (Derived State)
  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const discountNum = parseFloat(discount) || 0;
  const cartTotal = Math.max(0, subtotal - discountNum); // Total setelah diskon
  const selectedCustomer = customers.find(c => c.id === currentCustomer);
  const isBonAllowed = canCustomerBon(selectedCustomer);
  
  // Hitung kembalian dan kekurangan
  const uangBayarNum = parseFloat(uangBayar) || 0;
  const kembalian = uangBayarNum >= cartTotal ? uangBayarNum - cartTotal : 0;
  const isUangCukup = uangBayarNum >= cartTotal;
  const kekurangan = uangBayarNum < cartTotal ? cartTotal - uangBayarNum : 0;
  const hasUangBayar = uangBayarNum > 0;

  // 4. Event Handlers (Menggantikan fungsi JS lama)
  const handleScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = e.target.value.trim();
      setScanError(null);
      
      if (!barcode) return;
      
      try {
        // Panggil API untuk cari produk berdasarkan barcode
        const result = await apiFetch(`/products/by-barcode/${barcode}`);
        
        // result berisi: product, unit, distributorId, stockFromSupplier
        if (result.stockFromSupplier > 0) {
          handleAddToCart(
            result.product, 
            result.unit, 
            result.distributorId, // Supplier yang terikat dengan barcode
            true // dari scan
          );
          e.target.value = '';
          // Focus kembali ke input untuk scan berikutnya
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        } else {
          setScanError(`Stok dari supplier tidak tersedia!`);
          setTimeout(() => setScanError(null), 3000);
        }
      } catch (error) {
        setScanError('Barcode tidak ditemukan!');
        setTimeout(() => setScanError(null), 3000);
      }
    }
  };

  const handleAddToCart = (product, unit, distributorId, fromScan = false) => {
    // Cek stok tersedia dari supplier yang dipilih
    const stockNeeded = 1 * unit.conversion; // 1 item dari unit ini
    
    // Cek apakah sudah ada di cart (dengan distributorId yang sama)
    const existingItem = cart.find(
      item => item.id === product.id && 
      item.unitName === unit.name && 
      item.distributorId === distributorId
    );
    const currentQty = existingItem ? existingItem.qty : 0;
    const totalStockNeeded = (currentQty + 1) * unit.conversion;
    
    // TODO: Validasi stok dari supplier (bisa fetch dari API atau dari state)
    // Untuk sekarang, validasi akan dilakukan di backend saat proses transaksi
    // Kita hanya cek stok total sebagai validasi awal
    const currentStock = product.stock || 0;
    if (currentStock < totalStockNeeded) {
      const availableStock = Math.floor(currentStock / unit.conversion);
      const errorMessage = `Stok ${product.name} tidak cukup! Stok tersedia: ${availableStock} ${unit.name}`;
      
      if (fromScan) {
        // Jika dari scan barcode, gunakan scanError (muncul di bawah input scan)
        setScanError(errorMessage);
        setTimeout(() => setScanError(null), 3000);
      } else {
        // Jika dari dialog, gunakan toast notification
        showToast(errorMessage, 'error');
      }
      return;
    }
    
    setCart(currentCart => {
      if (existingItem) {
        // Update Qty
        return currentCart.map(item => 
          item.id === product.id && 
          item.unitName === unit.name && 
          item.distributorId === distributorId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        // Tambah baru dengan distributorId
        return [...currentCart, {
          id: product.id,
          name: product.name,
          unitName: unit.name,
          price: unit.price,
          conversion: unit.conversion,
          qty: 1,
          distributorId: distributorId // TAMBAHAN: supplier yang terikat
        }];
      }
    });
    setIsModalOpen(false); // Tutup modal jika dibuka
    setScanError(null); // Clear error jika ada
    
    // Notifikasi success hanya jika dari dialog (bukan dari scan)
    if (!fromScan) {
      showToast(`${product.name} (${unit.name}) ditambahkan ke keranjang`, 'success');
    }
  };
  
  const handleUpdateQty = (index, change) => {
    setCart(currentCart => {
      const updatedCart = [...currentCart];
      const item = updatedCart[index];
      const newQty = item.qty + change;
      
      if (newQty <= 0) {
        updatedCart.splice(index, 1); // Hapus jika 0
        return updatedCart;
      }
      
      // Cek stok tersedia untuk qty baru
      const product = products.find(p => p.id === item.id);
      if (product) {
        const stockNeeded = newQty * item.conversion;
        if (product.stock < stockNeeded) {
          setScanError(`Stok ${item.name} tidak cukup! Stok tersedia: ${Math.floor(product.stock / item.conversion)} ${item.unitName}`);
          setTimeout(() => setScanError(null), 3000);
          return currentCart; // Jangan update jika stok tidak cukup
        }
      }
      
      updatedCart[index].qty = newQty;
      return updatedCart;
    });
  };

  const handleTransaction = async (type) => {
    if (!currentCustomer) {
      setScanError('Pilih pelanggan terlebih dahulu!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    if (cart.length === 0) {
      setScanError('Keranjang masih kosong!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    // Validasi uang bayar untuk transaksi LUNAS (full payment)
    if (type === 'LUNAS') {
      if (!uangBayar || uangBayarNum < cartTotal) {
        setScanError(`Uang yang dibayarkan tidak cukup! Total: ${formatRupiah(cartTotal)}`);
        setTimeout(() => setScanError(null), 3000);
        return;
      }
    }
    
    const customerBeforeTx = selectedCustomer;
    const changeBeforeTx = kembalian;

    setIsProcessing(true);
    setScanError(null);
    
    try {
      // Siapkan data transaksi lengkap
      const transactionData = {
        subtotal: subtotal,
        discount: discountNum,
        total: cartTotal,
        paid: type === 'LUNAS' ? uangBayarNum : 0,
        change: type === 'LUNAS' ? kembalian : 0,
        note: note.trim() || null,
      };

      // Jika kembalian digunakan untuk bayar hutang, tambahkan ke note
      let finalNote = note.trim() || '';
      if (type === 'LUNAS' && useChangeForDebt && customerBeforeTx?.debt > 0 && changeBeforeTx > 0) {
        const debtBefore = Number(customerBeforeTx.debt || 0);
        const amountToDebt = Math.min(changeBeforeTx, debtBefore);
        if (amountToDebt > 0) {
          const remainingChange = changeBeforeTx - amountToDebt;
          const debtNote = `[Kembalian digunakan untuk bayar utang: ${formatRupiah(amountToDebt)}${remainingChange > 0 ? `, sisa kembalian: ${formatRupiah(remainingChange)}` : ''}]`;
          finalNote = finalNote ? `${finalNote}\n${debtNote}` : debtNote;
        }
      }
      
      // Update transactionData dengan note yang sudah dimodifikasi
      transactionData.note = finalNote || null;

      const result = await processTransaction(type, currentCustomer, cart, transactionData);
      
      // Proses pembayaran utang jika kembalian digunakan
      if (type === 'LUNAS' && useChangeForDebt && customerBeforeTx?.debt > 0 && changeBeforeTx > 0) {
        const debtBefore = Number(customerBeforeTx.debt || 0);
        const amountToDebt = Math.min(changeBeforeTx, debtBefore);
        if (amountToDebt > 0) {
          const updatedCustomer = await payDebt(currentCustomer, amountToDebt);
          // Update customer di state lokal jika perlu (payDebt sudah update di StoreContext)
        }
      }
      
      // Ambil detail transaksi lengkap untuk print struk
      let transactionDetail = null;
      if (result.invoiceNumber) {
        try {
          transactionDetail = await getTransactionByInvoice(result.invoiceNumber);
          setLastTransaction(transactionDetail);
          setIsPrintModalOpen(true);
        } catch (error) {
          console.error("Gagal mengambil detail transaksi:", error);
        }
      }
      
      // Success
      let successMsg;
      if (type === 'LUNAS') {
        let debtMessage = '';
        if (useChangeForDebt && customerBeforeTx?.debt > 0 && changeBeforeTx > 0) {
          const debtBefore = Number(customerBeforeTx.debt || 0);
          const amountToDebt = Math.min(changeBeforeTx, debtBefore);
          if (amountToDebt > 0) {
            const remainingChange = changeBeforeTx - amountToDebt;
            debtMessage = ` Kembalian dibayarkan ke utang sebesar ${formatRupiah(amountToDebt)}${remainingChange > 0 ? `, sisa kembalian: ${formatRupiah(remainingChange)}` : ''}.`;
          }
        }
        successMsg = `Transaksi LUNAS berhasil! Invoice: ${result.invoiceNumber || 'N/A'}. Kembalian: ${formatRupiah(changeBeforeTx)}${debtMessage}`;
      } else {
        successMsg = `Transaksi ${type} berhasil! Invoice: ${result.invoiceNumber || 'N/A'}`;
      }
      showToast(successMsg, 'success');
      
      // Reset cart, customer, dan semua input
      setCart([]);
      setUangBayar('');
      setDiscount('');
      setNote('');
      setUseChangeForDebt(false);
      const umumCustomer = customers.find(c => getCustomerType(c) === 'UMUM') || customers[0];
      setCurrentCustomer(umumCustomer?.id || null);
      // Focus kembali ke barcode scanner
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error) {
      showToast(error.message || 'Gagal memproses transaksi', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handler untuk pembayaran sebagian (sebagian LUNAS, sisanya BON)
  const handlePartialPayment = async () => {
    if (!currentCustomer) {
      setScanError('Pilih pelanggan terlebih dahulu!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    if (cart.length === 0) {
      setScanError('Keranjang masih kosong!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    if (!hasUangBayar) {
      setScanError('Masukkan uang yang dibayarkan terlebih dahulu!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    if (!isBonAllowed) {
      setScanError('Pelanggan UMUM tidak bisa melakukan pembayaran sebagian!');
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    setIsProcessing(true);
    setScanError(null);
    
    try {
      const amountToPay = uangBayarNum;
      const kekurangan = cartTotal - uangBayarNum;
      
      // Tambahkan informasi pembayaran sebagian ke note
      const partialNote = `[Pembayaran Sebagian: Dibayar tunai ${formatRupiah(amountToPay)}, sisanya masuk utang ${formatRupiah(kekurangan)}]`;
      const finalNote = note.trim() ? `${note.trim()}\n${partialNote}` : partialNote;
      
      // Proses transaksi BON untuk seluruh cart (menambah utang sebesar total)
      const transactionData = {
        subtotal: subtotal,
        discount: discountNum,
        total: cartTotal,
        paid: amountToPay, // Simpan jumlah yang dibayar tunai
        change: 0,
        note: finalNote,
      };

      const result = await processTransaction('BON', currentCustomer, cart, transactionData);
      
      // Ambil detail transaksi lengkap untuk print struk
      let transactionDetail = null;
      if (result.invoiceNumber) {
        try {
          transactionDetail = await getTransactionByInvoice(result.invoiceNumber);
          setLastTransaction(transactionDetail);
          setIsPrintModalOpen(true);
        } catch (error) {
          console.error("Gagal mengambil detail transaksi:", error);
        }
      }
      
      const successMsg = `Pembayaran sebagian berhasil! Dibayar tunai: ${formatRupiah(amountToPay)}, Masuk utang: ${formatRupiah(kekurangan)}. Invoice: ${result.invoiceNumber || 'N/A'}`;
      showToast(successMsg, 'success');
      
      // Reset cart, customer, dan semua input
      setCart([]);
      setUangBayar('');
      setDiscount('');
      setNote('');
      const umumCustomer = customers.find(c => getCustomerType(c) === 'UMUM') || customers[0];
      setCurrentCustomer(umumCustomer?.id || null);
      // Focus kembali ke barcode scanner
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error) {
      showToast(error.message || 'Gagal memproses pembayaran sebagian', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handler untuk tombol cepat uang bayar
  const handleQuickAmount = (amount) => {
    const newAmount = cartTotal + amount;
    setUangBayar(newAmount.toString());
  };

  // 5. Render (JSX)
  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-32 sm:pb-8">
        {/* Layout 2 Kolom: Kiri (Scan & Cart) dan Kanan (Summary & Tombol) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Kolom Kiri: Scan Barcode, Tambah Manual, Cart Items */}
          <div className="space-y-3 sm:space-y-4">
            {/* Input Barcode Scanner */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <label htmlFor="barcode-scanner" className="block text-sm font-medium text-gray-700">Scan Barcode:</label>
              <input 
                ref={barcodeInputRef}
                type="text" 
                id="barcode-scanner" 
                onKeyPress={handleScan}
                placeholder="Klik di sini dan scan..." 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
                autoFocus
              />
              {scanError && <p className="text-red-500 text-sm mt-1">{scanError}</p>}
            </div>

            {/* Tombol Tambah Manual */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700">Atau Tambah Manual:</label>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="mt-1 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition text-sm sm:text-base"
              >
                Cari Barang...
              </button>
            </div>

            {/* Render Cart */}
            <div id="cart-items" className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 pt-4 bg-white p-4 rounded-lg shadow">Keranjang masih kosong</div>
              ) : (
                cart.map((item, index) => {
                  const subtotal = item.price * item.qty;
                  return (
                    <div key={`${item.id}-${item.unitName}`} className="bg-white p-2 sm:p-3 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{formatRupiah(item.price)} x {item.unitName}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-800 mt-1">Subtotal: {formatRupiah(subtotal)}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                        <button 
                          onClick={() => handleUpdateQty(index, -1)} 
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition text-lg"
                        >
                          -
                        </button>
                        <span className="font-medium w-8 sm:w-10 text-center text-base sm:text-lg">{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateQty(index, 1)} 
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Pelanggan, Summary Transaksi, Tombol */}
          <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-4 lg:self-start pb-8 sm:pb-0">
            {/* Pilih Pelanggan */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700 mb-1">Pelanggan:</label>
                <select 
                  id="customer-select" 
                  value={currentCustomer || ''}
                  onChange={(e) => setCurrentCustomer(e.target.value)}
                  className="block w-full py-2.5 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base bg-white"
                >
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({getCustomerType(cust) || cust.type})
                      {cust.debt > 0 && ` - Utang: ${formatRupiah(Number(cust.debt))}`}
                    </option>
                  ))}
                </select>
            </div>
            
              {/* Total, Uang Bayar, Kembalian & Tombol Bayar */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg border border-gray-200 space-y-3 pb-4">
              {/* Total Belanja */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-medium text-gray-700">Subtotal:</span>
                  <span className="text-lg sm:text-xl font-semibold text-gray-700">{formatRupiah(subtotal)}</span>
                </div>
                
                {/* Input Diskon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diskon:</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
                    min="0"
                    max={subtotal}
                    step="1000"
                  />
                </div>
                
                {discountNum > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Diskon:</span>
                    <span className="text-red-600 font-semibold">-{formatRupiah(discountNum)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                  <span className="text-base sm:text-lg font-medium text-gray-700">Total Belanja:</span>
                  <span id="cart-total" className="text-xl sm:text-2xl font-bold text-purple-700">{formatRupiah(cartTotal)}</span>
                </div>
              </div>
              
              {/* Catatan Transaksi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional):</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan catatan untuk transaksi ini..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base resize-none"
                  rows="2"
                />
              </div>
              
              {/* Input Uang Bayar (Hanya untuk LUNAS) */}
              {cart.length > 0 && (
                <div>
                  <label htmlFor="uang-bayar" className="block text-sm font-medium text-gray-700 mb-1">
                    Uang yang Dibayarkan:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      id="uang-bayar"
                      value={uangBayar}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Jika kosong, izinkan (untuk bisa clear input)
                        if (value === '' || value === '-') {
                          setUangBayar(value);
                          return;
                        }
                        // Konversi ke number dan validasi
                        const numValue = parseFloat(value);
                        // Hanya set jika nilai >= 0 atau NaN (untuk handle input yang belum lengkap)
                        if (isNaN(numValue) || numValue >= 0) {
                          setUangBayar(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent minus sign and negative numbers
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="0"
                      className={`flex-1 p-3 border rounded-lg text-base sm:text-lg font-semibold ${
                        isUangCukup && cartTotal > 0
                          ? 'border-green-500 bg-green-50'
                          : uangBayarNum > 0 && !isUangCukup
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      min="0"
                      step="1000"
                    />
                    {/* Tombol Cepat */}
                    {cartTotal > 0 && (
                      <div className="flex gap-1 sm:flex-col sm:gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAmount(0)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-xs sm:text-sm flex-1"
                          title="Pas"
                        >
                          Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAmount(1000)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-xs sm:text-sm flex-1"
                          title="+1rb"
                        >
                          +1rb
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAmount(5000)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-xs sm:text-sm flex-1"
                          title="+5rb"
                        >
                          +5rb
                        </button>
                      </div>
                    )}
                  </div>
                  {uangBayarNum > 0 && !isUangCukup && (
                    <p className="text-red-500 text-xs mt-1">
                      Uang tidak cukup! Kurang: {formatRupiah(cartTotal - uangBayarNum)}
                    </p>
                  )}
                </div>
              )}
              
              {/* Kembalian (Tampil jika uang cukup) */}
              {isUangCukup && uangBayarNum > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">Kembalian:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-700">{formatRupiah(kembalian)}</span>
                  </div>
                  {selectedCustomer?.debt > 0 && kembalian > 0 && (
                    <label className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-green-900">
                      <input
                        type="checkbox"
                        checked={useChangeForDebt}
                        onChange={(e) => setUseChangeForDebt(e.target.checked)}
                        className="h-4 w-4 text-green-600 border-green-300 rounded focus:ring-green-500 mt-0.5 flex-shrink-0"
                      />
                      <span>Gunakan kembalian untuk bayar utang (utang saat ini: {formatRupiah(Number(selectedCustomer.debt || 0))})</span>
                    </label>
                  )}
                </div>
              )}
              
              {/* Info Kekurangan (Jika uang kurang) */}
              {!isUangCukup && hasUangBayar && cartTotal > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-yellow-800">Kekurangan:</span>
                    <span className="text-lg sm:text-xl font-bold text-yellow-700">{formatRupiah(kekurangan)}</span>
                  </div>
                  {isBonAllowed && (
                    <p className="text-xs text-yellow-700">
                      Pelanggan bisa membayar sebagian, sisanya masuk utang
                    </p>
                  )}
                </div>
              )}
              
              {/* Tombol Bayar */}
              <div className="space-y-2 pt-2 border-t border-gray-200 overflow-visible">
                {/* Baris 1: LUNAS dan BON */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => handleTransaction('LUNAS')} 
                      disabled={isProcessing || cart.length === 0 || !isUangCukup}
                      className={`flex-1 bg-green-600 text-white font-bold py-3 sm:py-3 px-4 rounded-lg shadow hover:bg-green-700 active:bg-green-800 transition text-sm sm:text-base min-h-[48px] flex items-center justify-center ${(isProcessing || cart.length === 0 || !isUangCukup) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessing ? 'Memproses...' : 'LUNAS'}
                    </button>
                    <button 
                      onClick={() => handleTransaction('BON')} 
                      disabled={!isBonAllowed || isProcessing || cart.length === 0}
                      className={`flex-1 bg-yellow-500 text-white font-bold py-3 sm:py-3 px-4 rounded-lg shadow hover:bg-yellow-600 active:bg-yellow-700 transition text-sm sm:text-base min-h-[48px] flex items-center justify-center ${(!isBonAllowed || isProcessing || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessing ? 'Memproses...' : 'MASUK BON'}
                    </button>
                </div>
                
                {/* Baris 2: Bayar Sebagian (Hanya muncul jika uang kurang dan customer bisa BON) */}
                {/* Kondisi: cart ada, uang tidak cukup, ada uang bayar */}
                {cart.length > 0 && !isUangCukup && hasUangBayar && isBonAllowed && (
                  <button 
                    onClick={handlePartialPayment}
                    disabled={isProcessing}
                    type="button"
                    className="w-full bg-orange-500 text-white font-bold py-3 px-3 sm:px-4 rounded-lg shadow-lg hover:bg-orange-600 active:bg-orange-700 transition text-xs sm:text-sm min-h-[48px] flex items-center justify-center"
                  >
                    {isProcessing ? (
                      'Memproses...'
                    ) : (
                      <span className="text-center">
                        <span className="block sm:inline">Bayar Sebagian</span>
                        <span className="block sm:inline sm:ml-1 text-xs">({formatRupiah(uangBayarNum)} LUNAS, {formatRupiah(kekurangan)} BON)</span>
                      </span>
                    )}
                  </button>
                )}
                
                {/* Info jika customer UMUM dan uang kurang */}
                {cart.length > 0 && !isUangCukup && hasUangBayar && !isBonAllowed && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-700 text-center">
                      <strong>Info:</strong> Pelanggan UMUM harus membayar penuh. Pilih pelanggan lain untuk pembayaran sebagian.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Modal (Komponen Terpisah) */}
      <ModalAddProduct 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductSelect={handleAddToCart}
      />

      <ModalPrintStruk
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setLastTransaction(null);
        }}
        transaction={lastTransaction}
      />
    </>
  );
}

export default PageJualan;