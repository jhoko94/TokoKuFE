import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// BARU: Tentukan URL API dari file .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 1. Buat Context
const StoreContext = createContext();

// Helper untuk fetch
const apiFetch = async (endpoint, options = {}) => {
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Terjadi kesalahan pada server');
  }
  
  // Handle 204 No Content (untuk DELETE)
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// 2. Buat Provider (Komponen yang "membungkus" aplikasi Anda)
export function StoreProvider({ children }) {
    // BARU: Hapus DUMMY_DATA. State diawali sebagai array kosong.
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [pendingPOs, setPendingPOs] = useState([]);
    
    // BARU: Tambahkan state loading
    const [isLoading, setIsLoading] = useState(true);

    // BARU: Buat fungsi `init` untuk memuat semua data awal dari /bootstrap
    const init = useCallback(async () => {
      try {
        setIsLoading(true);
        const data = await apiFetch('/bootstrap');
        setCustomers(data.customers);
        setProducts(data.products);
        setDistributors(data.distributors);
        setPendingPOs(data.pendingPOs);
      } catch (error) {
        console.error("Gagal memuat data bootstrap:", error);
        // Di sini Anda bisa mengatur state error global
      } finally {
        setIsLoading(false);
      }
    }, []);

    // BARU: Panggil `init` saat komponen pertama kali dimuat
    useEffect(() => {
      init();
    }, [init]);


    // --- FUNGSI PENGUBAH STATE (sekarang terhubung ke API) ---

    // (PageMasterBarang)
    const saveProduct = async (productData) => {
      const isEditing = !!productData.id;
      const endpoint = isEditing ? `/products/${productData.id}` : '/products';
      const method = isEditing ? 'PUT' : 'POST';

      try {
        const savedProduct = await apiFetch(endpoint, {
          method,
          body: JSON.stringify(productData),
        });

        if (isEditing) {
          // Ganti produk lama dengan produk baru di state
          setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
        } else {
          // Tambahkan produk baru ke state
          setProducts(prev => [...prev, savedProduct]);
        }
      } catch (error) {
        console.error("Gagal menyimpan produk:", error);
        throw error; // Lempar error agar modal bisa menanganinya
      }
    };
    
    // (PageMasterBarang)
    const deleteProduct = async (productId) => {
      try {
        await apiFetch(`/products/${productId}`, { method: 'DELETE' });
        // Hapus produk dari state
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
        throw error;
      }
    };

    // (PageUtang)
    const payDebt = async (customerId, amount) => {
      try {
        const updatedCustomer = await apiFetch(`/customers/${customerId}/pay-debt`, {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount) }),
        });
        // Update customer di state
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      } catch (error) {
        console.error("Gagal bayar utang:", error);
        throw error;
      }
    };
    
    // (PageBarang)
    const addStock = async (productId, unitName, quantity) => {
      try {
        const updatedProduct = await apiFetch(`/products/${productId}/add-stock`, {
          method: 'POST',
          body: JSON.stringify({ qty: Number(quantity), unitName }),
        });
        // Update produk di state
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } catch (error) {
        console.error("Gagal menambah stok:", error);
        throw error;
      }
    };

    // (PageBarang)
    const getStockCard = async (productId) => {
      // Fungsi ini sudah memanggil API, jadi kita hanya teruskan
      return apiFetch(`/products/${productId}/stock-card`);
    };

    // (PageLaporan)
    const getReports = async () => {
      // Fungsi ini sudah memanggil API, jadi kita hanya teruskan
      return apiFetch('/reports');
    };
    
    // (PagePesanan)
    const createPO = async (newPOData) => {
      try {
        // newPOData = { distributorId, items: [{ productId, qty, unitName }] }
        const newPO = await apiFetch('/purchase-orders', {
          method: 'POST',
          body: JSON.stringify(newPOData),
        });
        // Tambahkan PO baru ke state (API mengembalikan PO yg sudah di-join)
        setPendingPOs(prev => [...prev, newPO]);
      } catch (error) {
        console.error("Gagal membuat PO:", error);
        throw error;
      }
    };

    // (PageCekPesanan)
    const confirmPOReceived = async (poToConfirm, newBarcodeData) => {
      try {
        await apiFetch(`/purchase-orders/${poToConfirm.id}/receive`, {
          method: 'POST',
          body: JSON.stringify({ newBarcodeData }),
        });
        
        // BARU: Setelah sukses, kita harus sinkronkan ulang semua data
        // karena stok produk berubah dan PO hilang.
        // Cara termudah dan paling aman adalah memanggil init() lagi.
        await init(); 
        
      } catch (error) {
        console.error("Gagal menerima PO:", error);
        throw error;
      }
    };

    // (PageOpname)
    const processStockOpname = async (adjustments) => {
      try {
        await apiFetch('/reports/opname', {
          method: 'POST',
          body: JSON.stringify({ adjustments }),
        });
        
        // BARU: Sama seperti terima PO, stok opname mengubah banyak stok produk.
        // Kita panggil init() lagi untuk sinkronisasi.
        await init();

      } catch (error) {
        console.error("Gagal proses opname:", error);
        throw error;
      }
    };

    // Nilai yang akan dibagikan ke seluruh aplikasi
    const value = {
      customers,
      products,
      distributors,
      pendingPOs,
      isLoading, // BARU: Bagikan status loading
      init, // BARU: Bagikan fungsi init (opsional, tapi berguna)
      
      // Semua fungsi aksi
      saveProduct,
      deleteProduct,
      payDebt,
      addStock,
      getStockCard,
      getReports,
      createPO,
      confirmPOReceived,
      processStockOpname,
    };

    // BARU: Tampilkan loader jika data awal belum siap
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="loader"></div>
        </div>
      );
    }

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// 3. Buat Custom Hook (Tidak berubah)
export function useStore() {
    return useContext(StoreContext);
}