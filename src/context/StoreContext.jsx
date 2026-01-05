import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { normalizeUser, normalizeCustomer, normalizeCustomers, normalizeTransaction, normalizeTransactions } from '../utils/normalize';

// BARU: Tentukan URL API dari file .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 1. Buat Context
const StoreContext = createContext();

// Helper untuk fetch dengan authentication
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  options.headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    // Parse error data
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    // Jika unauthorized, clear token dan redirect ke login
    // TAPI: Jangan redirect jika ini adalah verifyToken (endpoint /auth/me)
    // Biarkan verifyToken handle sendiri
    if (response.status === 401 && !endpoint.includes('/auth/me')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
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
    const [warehouses, setWarehouses] = useState([]);
    
    // BARU: State untuk toast notifications
    const [toast, setToast] = useState(null);
    
    // Cek token dan user di localStorage saat inisialisasi (synchronous)
    const getInitialAuth = () => {
      if (typeof window === 'undefined') return { user: null, isAuthenticated: false, isLoading: false };
      
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          return { user, isAuthenticated: true, isLoading: true };
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return { user: null, isAuthenticated: false, isLoading: false };
        }
      }
      return { user: null, isAuthenticated: false, isLoading: false };
    };
    
    const initialAuth = getInitialAuth();
    
    // BARU: State untuk authentication - inisialisasi dari localStorage
    const [user, setUser] = useState(initialAuth.user);
    const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);
    const [isLoading, setIsLoading] = useState(initialAuth.isLoading);
    
    // Helper untuk menampilkan toast
    const showToast = useCallback((message, type = 'success') => {
      setToast({ message, type });
    }, []);
    
    const hideToast = useCallback(() => {
      setToast(null);
    }, []);
    
    // Verifikasi token dengan backend saat mount (jika ada token)
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // Verifikasi token dengan backend
      const verifyToken = async () => {
        try {
          const response = await apiFetch('/auth/me');
          // Token valid, update user data
          // Backend mengembalikan { user: {...} }, jadi kita perlu akses response.user
          const userData = response.user || response;
          const normalizedUser = normalizeUser(userData);
          setUser(normalizedUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        } catch (error) {
          // Log error untuk debugging
          console.error('Token verification failed:', error.message);
          
          // Hanya hapus token jika benar-benar error 401 (unauthorized)
          // Jangan hapus untuk error lain (500, network error, dll)
          if (error.message && (
            error.message.includes('Token tidak valid') || 
            error.message.includes('Token telah kadaluarsa') ||
            error.message.includes('Token tidak ditemukan') ||
            error.message.includes('unauthorized') ||
            error.message.includes('401')
          )) {
            // Token tidak valid, hapus dari localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Error lain (500, network, dll) - jangan hapus token, biarkan user tetap login
            console.warn('Non-auth error during token verification, keeping token:', error.message);
            // Tetap set loading false agar UI tidak stuck
            setIsLoading(false);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      verifyToken();
    }, []);
    
    
    // Login function
    const login = async (username, password) => {
      try {
        const response = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        
        const normalizedUser = normalizeUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        setIsAuthenticated(true);
        showToast('Login berhasil', 'success');
        return response;
      } catch (error) {
        showToast(error.message || 'Login gagal', 'error');
        throw error;
      }
    };
    
    // Logout function
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      showToast('Logout berhasil', 'success');
    };

    // Update profile function
    const updateProfile = async (profileData) => {
      try {
        const response = await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });
        
        // Update user di state dan localStorage
        const updatedUser = response.user || response;
        const normalizedUser = normalizeUser(updatedUser);
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        showToast(response.message || 'Profile berhasil diperbarui', 'success');
        return response;
      } catch (error) {
        showToast(error.message || 'Gagal memperbarui profile', 'error');
        throw error;
      }
    };

    // Change password function
    const changePassword = async (passwordData) => {
      try {
        const response = await apiFetch('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          }),
        });
        showToast(response.message || 'Password berhasil diubah', 'success');
        return response;
      } catch (error) {
        showToast(error.message || 'Gagal mengubah password', 'error');
        throw error;
      }
    };

    // Get store information
    const getStore = useCallback(async () => {
      try {
        const response = await apiFetch('/store');
        return response;
      } catch (error) {
        console.error("Gagal mengambil data toko:", error);
        throw error;
      }
    }, []);

    // Update store information
    const updateStore = async (storeData) => {
      try {
        const response = await apiFetch('/store', {
          method: 'PUT',
          body: JSON.stringify(storeData),
        });
        showToast(response.message || 'Informasi toko berhasil diperbarui', 'success');
        return response;
      } catch (error) {
        showToast(error.message || 'Gagal memperbarui informasi toko', 'error');
        throw error;
      }
    };

    // BARU: Buat fungsi `init` untuk memuat semua data awal dari /bootstrap
    // Note: Bootstrap tetap load semua data untuk dropdown/search, tapi untuk tabel kita pakai pagination
    const init = useCallback(async () => {
      // Jangan init jika belum login
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await apiFetch('/bootstrap');
        // Normalize customers untuk backward compatibility
        setCustomers(normalizeCustomers(data.customers || []));
        // Products di bootstrap tetap semua untuk dropdown/search
        // Tapi untuk tabel, kita akan fetch dengan pagination
        setProducts(data.products || []);
        setDistributors(data.distributors || []);
        // PendingPOs di bootstrap tetap semua untuk referensi
        setPendingPOs(data.pendingPOs || []);
        // Warehouses
        setWarehouses(data.warehouses || []);
      } catch (error) {
        console.error("Gagal memuat data bootstrap:", error);
        // Set default empty arrays jika error
        setCustomers([]);
        setProducts([]);
        setDistributors([]);
        setPendingPOs([]);
        setWarehouses([]);
        // Jika error 401, redirect sudah ditangani di apiFetch
      } finally {
        setIsLoading(false);
      }
    }, []);

    // Fungsi untuk fetch customers dengan pagination
    const fetchCustomersPaginated = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/customers?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data pelanggan:", error);
        throw error;
      }
    }, []);

    // Fungsi untuk fetch products dengan pagination
    const fetchProductsPaginated = useCallback(async (page = 1, limit = 25, search = '', unitSmall = '', unitLarge = '', distributorId = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        if (unitSmall) {
          params.append('unitSmall', unitSmall);
        }
        if (unitLarge) {
          params.append('unitLarge', unitLarge);
        }
        if (distributorId) {
          params.append('distributorId', distributorId);
        }
        const response = await apiFetch(`/products?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
        throw error;
      }
    }, []);

    // Fungsi untuk mencari product by exact name match (dengan optional distributorId)
    const getProductByName = useCallback(async (name, distributorId = null) => {
      try {
        const params = new URLSearchParams({ name: name.trim() });
        if (distributorId) {
          params.append('distributorId', distributorId);
        }
        const response = await apiFetch(`/products/search-by-name?${params.toString()}`);
        return response;
      } catch (error) {
        // Jika 404, berarti produk tidak ditemukan (ini normal)
        if (error.message && (error.message.includes('404') || error.message.includes('tidak ditemukan'))) {
          return null;
        }
        console.error("Gagal mencari produk:", error);
        // Return null untuk error lainnya juga, agar tidak crash
        return null;
      }
    }, []);

    // Fungsi untuk fetch customers with debt dengan pagination
    const fetchCustomersWithDebtPaginated = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/customers/debt?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data utang:", error);
        throw error;
      }
    }, []);

    // Fungsi untuk fetch PO suggestions (low stock products) dengan pagination
    const fetchPOSuggestions = useCallback(async (distributorId, page = 1, limit = 25) => {
      try {
        const params = new URLSearchParams({
          distributorId: distributorId,
          page: page.toString(),
          limit: limit.toString(),
        });
        const response = await apiFetch(`/products/suggestions?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil saran PO:", error);
        throw error;
      }
    }, []);

    // Fungsi untuk fetch pending POs dengan pagination
    const fetchPendingPOsPaginated = useCallback(async (page = 1, limit = 25) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        const response = await apiFetch(`/purchase-orders?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data PO:", error);
        throw error;
      }
    }, []);

    // Fungsi untuk fetch completed POs (untuk retur pembelian)
    const fetchCompletedPOs = useCallback(async (distributorId = '') => {
      try {
        const params = new URLSearchParams({
          status: 'COMPLETED',
          limit: '1000', // Ambil semua completed POs
        });
        if (distributorId) {
          params.append('distributorId', distributorId);
        }
        const response = await apiFetch(`/purchase-orders?${params.toString()}`);
        return response.data || [];
      } catch (error) {
        console.error("Gagal mengambil data PO completed:", error);
        throw error;
      }
    }, []);

    // BARU: Panggil `init` saat komponen pertama kali dimuat
    useEffect(() => {
      if (isAuthenticated) {
        init();
      }
    }, [init, isAuthenticated]);


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
          showToast('Produk berhasil diupdate', 'success');
        } else {
          // Tambahkan produk baru ke state
          setProducts(prev => [...prev, savedProduct]);
          showToast('Produk berhasil ditambahkan', 'success');
        }
        
        // Refresh distributor untuk update productCount
        // Karena produk ditambah/diedit bisa mengubah productCount distributor
        try {
          const bootstrapData = await apiFetch('/bootstrap');
          setDistributors(bootstrapData.distributors || []);
        } catch (refreshError) {
          console.error("Gagal refresh distributor:", refreshError);
          // Jangan throw error, karena save product sudah berhasil
        }
      } catch (error) {
        console.error("Gagal menyimpan produk:", error);
        showToast(error.message || 'Gagal menyimpan produk', 'error');
        throw error; // Lempar error agar modal bisa menanganinya
      }
    };
    
    // (PageMasterBarang)
    const bulkDeleteProducts = async (productIds) => {
      try {
        const response = await apiFetch('/products/bulk', {
          method: 'DELETE',
          body: JSON.stringify({ ids: productIds }),
        });
        showToast(response.message || `Berhasil menghapus ${productIds.length} produk`, 'success');
        
        // Refresh distributor untuk update productCount
        try {
          const bootstrapData = await apiFetch('/bootstrap');
          setDistributors(bootstrapData.distributors || []);
        } catch (refreshError) {
          console.error("Gagal refresh distributor:", refreshError);
        }
        
        return response;
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
        showToast(error.message || 'Gagal menghapus produk', 'error');
        throw error;
      }
    };

    const deleteProduct = async (productId) => {
      try {
        await apiFetch(`/products/${productId}`, { method: 'DELETE' });
        // Hapus produk dari state
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('Produk berhasil dihapus', 'success');
        
        // Refresh distributor untuk update productCount
        try {
          const bootstrapData = await apiFetch('/bootstrap');
          setDistributors(bootstrapData.distributors || []);
        } catch (refreshError) {
          console.error("Gagal refresh distributor:", refreshError);
        }
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
        showToast(error.message || 'Gagal menghapus produk', 'error');
        throw error;
      }
    };

    // (PageMasterBarang) - Bulk update distributor
    const bulkUpdateDistributor = async (productIds, distributorId) => {
      try {
        const result = await apiFetch('/products/bulk-update-distributor', {
          method: 'PUT',
          body: JSON.stringify({ productIds, distributorId }),
        });
        showToast(result.message || `Berhasil mengubah distributor untuk ${result.updatedCount} produk`, 'success');
        return result;
      } catch (error) {
        console.error("Gagal mengubah distributor:", error);
        showToast(error.message || 'Gagal mengubah distributor', 'error');
        throw error;
      }
    };

    // (PageMasterBarang) - Bulk update satuan kecil/besar
    const bulkUpdateUnit = async (productIds, unitType, unitName, price, conversion) => {
      try {
        const result = await apiFetch('/products/bulk-update-unit', {
          method: 'PUT',
          body: JSON.stringify({ productIds, unitType, unitName, price, conversion }),
        });
        showToast(result.message || `Berhasil mengubah satuan untuk ${result.updatedCount} produk`, 'success');
        return result;
      } catch (error) {
        console.error("Gagal mengubah satuan:", error);
        showToast(error.message || 'Gagal mengubah satuan', 'error');
        throw error;
      }
    };

    // (PageMasterBarang) - Bulk update minimal stok
    const bulkUpdateMinStock = async (productIds, minStock) => {
      try {
        const result = await apiFetch('/products/bulk-update-minstock', {
          method: 'PUT',
          body: JSON.stringify({ productIds, minStock }),
        });
        showToast(result.message || `Berhasil mengubah minimal stok untuk ${result.updatedCount} produk`, 'success');
        return result;
      } catch (error) {
        console.error("Gagal mengubah minimal stok:", error);
        showToast(error.message || 'Gagal mengubah minimal stok', 'error');
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
        // Update customer di state (untuk sinkronisasi dengan PageJualan)
        const normalizedCustomer = normalizeCustomer(updatedCustomer);
        setCustomers(prev => prev.map(c => c.id === normalizedCustomer.id ? normalizedCustomer : c));
        showToast('Pembayaran utang berhasil', 'success');
        return updatedCustomer;
      } catch (error) {
        console.error("Gagal bayar utang:", error);
        showToast(error.message || 'Gagal bayar utang', 'error');
        throw error;
      }
    };

    // (PageMasterPelanggan) - Kirim email ke pelanggan
    const sendEmailToCustomer = async (customerId, subject, message) => {
      try {
        const result = await apiFetch(`/customers/${customerId}/send-email`, {
          method: 'POST',
          body: JSON.stringify({ subject, message }),
        });
        showToast(result.message || 'Email berhasil dikirim', 'success');
        return result;
      } catch (error) {
        console.error("Gagal mengirim email:", error);
        showToast(error.message || 'Gagal mengirim email', 'error');
        throw error;
      }
    };

    // (PageMasterPelanggan) - Bulk send email ke banyak pelanggan
    const bulkSendEmail = async (customerIds, subject, message, onProgress) => {
      try {
        const result = await apiFetch('/customers/bulk-send-email', {
          method: 'POST',
          body: JSON.stringify({ customerIds, subject, message }),
        });
        
        // Tampilkan summary
        if (result.emailsFailed > 0 || result.skipped.length > 0) {
          const skippedCount = result.skipped.filter(s => s.reason === 'Kuota harian sudah habis').length;
          let message = `Email dikirim ke ${result.emailsSent} pelanggan`;
          if (result.emailsFailed > 0) {
            message += `. ${result.emailsFailed} gagal`;
          }
          if (skippedCount > 0) {
            message += `. ${skippedCount} di-skip (kuota habis)`;
          }
          showToast(message, 'warning');
        } else {
          showToast(
            `Email berhasil dikirim ke ${result.emailsSent} pelanggan`, 
            'success'
          );
        }
        
        return result;
      } catch (error) {
        console.error("Gagal mengirim email:", error);
        showToast(error.message || 'Gagal mengirim email', 'error');
        throw error;
      }
    };

    // Get email quota
    const getEmailQuota = useCallback(async () => {
      try {
        const result = await apiFetch('/customers/email-quota');
        return result;
      } catch (error) {
        console.error("Gagal mengambil kuota email:", error);
        throw error;
      }
    }, []);

    // (PageMasterPelanggan) - Kirim WhatsApp ke pelanggan
    const sendWhatsAppToCustomer = async (customerId, message) => {
      try {
        const result = await apiFetch(`/customers/${customerId}/send-whatsapp`, {
          method: 'POST',
          body: JSON.stringify({ message }),
        });
        showToast(result.message || 'Pesan WhatsApp berhasil dikirim', 'success');
        return result;
      } catch (error) {
        console.error("Gagal mengirim WhatsApp:", error);
        showToast(error.message || 'Gagal mengirim pesan WhatsApp', 'error');
        throw error;
      }
    };

    // (PageMasterPelanggan) - Bulk send WhatsApp ke banyak pelanggan
    const bulkSendWhatsApp = async (customerIds, message) => {
      try {
        const result = await apiFetch('/customers/bulk-send-whatsapp', {
          method: 'POST',
          body: JSON.stringify({ customerIds, message }),
        });
        
        // Tampilkan summary
        if (result.messagesFailed > 0 || result.skipped.length > 0) {
          const skippedCount = result.skipped.filter(s => s.reason === 'Tidak memiliki nomor telepon').length;
          let message = `Pesan WhatsApp dikirim ke ${result.messagesSent} pelanggan`;
          if (result.messagesFailed > 0) {
            message += `. ${result.messagesFailed} gagal`;
          }
          if (skippedCount > 0) {
            message += `. ${skippedCount} di-skip (tidak ada nomor telepon)`;
          }
          showToast(message, 'warning');
        } else {
          showToast(
            `Pesan WhatsApp berhasil dikirim ke ${result.messagesSent} pelanggan`, 
            'success'
          );
        }
        
        return result;
      } catch (error) {
        console.error("Gagal mengirim WhatsApp:", error);
        showToast(error.message || 'Gagal mengirim pesan WhatsApp', 'error');
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
        showToast('Stok berhasil ditambahkan', 'success');
      } catch (error) {
        console.error("Gagal menambah stok:", error);
        showToast(error.message || 'Gagal menambah stok', 'error');
        throw error;
      }
    };

    // (PageBarang)
    const getStockCard = async (productId) => {
      // Fungsi ini sudah memanggil API, jadi kita hanya teruskan
      return apiFetch(`/products/${productId}/stock-card`);
    };

    // (PageLaporan)
    const getReports = async (period = 'today', page = 1, limit = 25) => {
      // Fungsi ini sudah memanggil API, jadi kita hanya teruskan
      const params = new URLSearchParams({ 
        period,
        page: page.toString(),
        limit: limit.toString(),
      });
      return apiFetch(`/reports?${params.toString()}`);
    };
    
    // (PagePesanan)
    const createPO = async (newPOData) => {
      try {
        // newPOData = { distributorId, items: [{ productId, qty, unitName }] }
        const newPO = await apiFetch('/purchase-orders', {
          method: 'POST',
          body: JSON.stringify(newPOData),
        });
        
        // Validasi response
        if (!newPO || !newPO.id) {
          throw new Error('Response tidak valid dari server');
        }
        
        // Tambahkan PO baru ke state (API mengembalikan PO yg sudah di-join)
        setPendingPOs(prev => [...prev, newPO]);
        showToast('Purchase Order berhasil dibuat', 'success');
        
        // Return PO untuk digunakan di PagePesanan
        return newPO;
      } catch (error) {
        console.error("Gagal membuat PO:", error);
        showToast(error.message || 'Gagal membuat PO', 'error');
        throw error;
      }
    };

    // (PageCekPesanan)
    const confirmPOReceived = async (poToConfirm, newBarcodeData) => {
      try {
        // Pastikan newBarcodeData adalah object (bukan undefined/null)
        const barcodeData = newBarcodeData || {};
        
        await apiFetch(`/purchase-orders/${poToConfirm.id}/receive`, {
          method: 'POST',
          body: JSON.stringify({ newBarcodeData: barcodeData }),
        });
        
        // BARU: Setelah sukses, kita harus sinkronkan ulang semua data
        // karena stok produk berubah dan PO hilang.
        // Cara termudah dan paling aman adalah memanggil init() lagi.
        await init();
        showToast('PO berhasil diterima dan stok diperbarui', 'success');
        
      } catch (error) {
        console.error("Gagal menerima PO:", error);
        showToast(error.message || 'Gagal menerima PO', 'error');
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

    // (PageJualan) - Proses transaksi penjualan
    const processTransaction = async (type, customerId, cart, transactionData = {}) => {
      try {
        const payload = {
          type,
          customerId,
          cart,
          subtotal: transactionData.subtotal || 0,
          discount: transactionData.discount || 0,
          total: transactionData.total || 0,
          paid: transactionData.paid || 0,
          change: transactionData.change || 0,
          note: transactionData.note || null,
        };
        
        const result = await apiFetch('/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        // Setelah transaksi berhasil, refresh data (karena stok berubah)
        await init();
        
        // Jika transaksi BON, update customer debt di state langsung dari response
        // (setelah init() untuk memastikan data terbaru)
        if (type === 'BON' && result.customer) {
          const normalizedCustomer = normalizeCustomer(result.customer);
          setCustomers(prev => prev.map(c => c.id === normalizedCustomer.id ? normalizedCustomer : c));
        }
        
        return result;
      } catch (error) {
        console.error("Gagal memproses transaksi:", error);
        throw error;
      }
    };

    // (PageRetur) - Proses retur transaksi
    const processRetur = async (returData) => {
      try {
        const result = await apiFetch('/returs', {
          method: 'POST',
          body: JSON.stringify(returData),
        });
        
        // Setelah retur berhasil, refresh data (stok & utang berubah)
        await init();
        showToast('Retur berhasil diproses', 'success');
        return result;
      } catch (error) {
        console.error("Gagal memproses retur:", error);
        showToast(error.message || 'Gagal memproses retur', 'error');
        throw error;
      }
    };

    // Import produk (CSV IPOS)
    const importProducts = async (items) => {
      try {
        const result = await apiFetch('/products/import', {
          method: 'POST',
          body: JSON.stringify({ items }),
        });
        await init();
        return result;
      } catch (error) {
        console.error("Gagal import produk:", error);
        showToast(error.message || 'Gagal import produk', 'error');
        throw error;
      }
    };

    // CRUD Customer
    const saveCustomer = async (customerData) => {
      const isEditing = !!customerData.id;
      const endpoint = isEditing ? `/customers/${customerData.id}` : '/customers';
      const method = isEditing ? 'PUT' : 'POST';

      try {
        const savedCustomer = await apiFetch(endpoint, {
          method,
          body: JSON.stringify(customerData),
        });

        const normalizedCustomer = normalizeCustomer(savedCustomer);
        if (isEditing) {
          setCustomers(prev => prev.map(c => c.id === normalizedCustomer.id ? normalizedCustomer : c));
          showToast('Pelanggan berhasil diupdate', 'success');
        } else {
          setCustomers(prev => [...prev, normalizedCustomer]);
          showToast('Pelanggan berhasil ditambahkan', 'success');
        }
        return savedCustomer;
      } catch (error) {
        console.error("Gagal menyimpan pelanggan:", error);
        showToast(error.message || 'Gagal menyimpan pelanggan', 'error');
        throw error;
      }
    };

    const deleteCustomer = async (customerId) => {
      try {
        await apiFetch(`/customers/${customerId}`, { method: 'DELETE' });
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        showToast('Pelanggan berhasil dihapus', 'success');
      } catch (error) {
        console.error("Gagal menghapus pelanggan:", error);
        showToast(error.message || 'Gagal menghapus pelanggan', 'error');
        throw error;
      }
    };

    // CRUD Distributor
    const saveDistributor = async (distributorData) => {
      const isEditing = !!distributorData.id;
      const endpoint = isEditing ? `/distributors/${distributorData.id}` : '/distributors';
      const method = isEditing ? 'PUT' : 'POST';

      try {
        const savedDistributor = await apiFetch(endpoint, {
          method,
          body: JSON.stringify(distributorData),
        });

        if (isEditing) {
          setDistributors(prev => prev.map(d => {
            if (d.id === savedDistributor.id) {
              // Pertahankan productCount dari data lama jika tidak ada di response
              return {
                ...savedDistributor,
                productCount: savedDistributor.productCount ?? savedDistributor._count?.products ?? d.productCount ?? d._count?.products ?? 0
              };
            }
            return d;
          }));
          showToast('Supplier berhasil diupdate', 'success');
        } else {
          // Untuk create, productCount sudah 0 (supplier baru)
          const newDistributor = {
            ...savedDistributor,
            productCount: savedDistributor.productCount ?? savedDistributor._count?.products ?? 0
          };
          setDistributors(prev => [...prev, newDistributor]);
          showToast('Supplier berhasil ditambahkan', 'success');
        }
        return savedDistributor;
      } catch (error) {
        console.error("Gagal menyimpan supplier:", error);
        showToast(error.message || 'Gagal menyimpan supplier', 'error');
        throw error;
      }
    };

    const deleteDistributor = async (distributorId) => {
      try {
        await apiFetch(`/distributors/${distributorId}`, { method: 'DELETE' });
        setDistributors(prev => prev.filter(d => d.id !== distributorId));
        showToast('Supplier berhasil dihapus', 'success');
      } catch (error) {
        console.error("Gagal menghapus supplier:", error);
        showToast(error.message || 'Gagal menghapus supplier', 'error');
        throw error;
      }
    };

    const bulkDeleteDistributors = async (distributorIds) => {
      try {
        const response = await apiFetch('/distributors/bulk', {
          method: 'DELETE',
          body: JSON.stringify({ ids: distributorIds }),
        });
        setDistributors(prev => prev.filter(d => !distributorIds.includes(d.id)));
        showToast(response.message || `Berhasil menghapus ${distributorIds.length} supplier`, 'success');
        return response;
      } catch (error) {
        console.error("Gagal menghapus supplier:", error);
        showToast(error.message || 'Gagal menghapus supplier', 'error');
        throw error;
      }
    };

    // Fungsi untuk fetch distributors with debt dengan pagination
    const fetchDistributorsWithDebtPaginated = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/distributors/debt?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data hutang supplier:", error);
        throw error;
      }
    }, []);

    // Bayar hutang supplier
    const payDistributorDebt = async (distributorId, amount) => {
      try {
        const updatedDistributor = await apiFetch(`/distributors/${distributorId}/pay-debt`, {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount) }),
        });
        setDistributors(prev => prev.map(d => d.id === updatedDistributor.id ? updatedDistributor : d));
        showToast('Pembayaran hutang supplier berhasil', 'success');
      } catch (error) {
        console.error("Gagal bayar hutang supplier:", error);
        showToast(error.message || 'Gagal bayar hutang supplier', 'error');
        throw error;
      }
    };

    // Get all transactions
    const getAllTransactions = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/transactions?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data transaksi:", error);
        throw error;
      }
    }, []);

    // Get transaction by invoice number
    const getTransactionByInvoice = useCallback(async (invoiceNumber) => {
      try {
        const response = await apiFetch(`/transactions/${invoiceNumber}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data transaksi:", error);
        throw error;
      }
    }, []);

    // Create retur penjualan
    const createReturPenjualan = async (returData) => {
      try {
        const result = await apiFetch('/retur/penjualan', {
          method: 'POST',
          body: JSON.stringify(returData),
        });
        await init(); // Refresh data karena stok berubah
        showToast('Retur penjualan berhasil', 'success');
        return result;
      } catch (error) {
        console.error("Gagal membuat retur penjualan:", error);
        showToast(error.message || 'Gagal membuat retur penjualan', 'error');
        throw error;
      }
    };

    // Create retur pembelian
    const createReturPembelian = async (returData) => {
      try {
        const result = await apiFetch('/retur/pembelian', {
          method: 'POST',
          body: JSON.stringify(returData),
        });
        await init(); // Refresh data karena stok berubah
        showToast('Retur pembelian berhasil', 'success');
        return result;
      } catch (error) {
        console.error("Gagal membuat retur pembelian:", error);
        showToast(error.message || 'Gagal membuat retur pembelian', 'error');
        throw error;
      }
    };

    // Get all retur penjualan
    const getAllReturPenjualan = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/retur/penjualan?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data retur penjualan:", error);
        throw error;
      }
    }, []);

    // Get retur penjualan by invoice number
    const getReturPenjualanByInvoice = useCallback(async (invoiceNumber) => {
      try {
        const response = await getAllReturPenjualan(1, 100, invoiceNumber);
        // Filter hanya yang sesuai dengan invoice number exact
        const filtered = response.data.filter(r => 
          r.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase()
        );
        return filtered;
      } catch (error) {
        console.error("Gagal mengambil data retur penjualan by invoice:", error);
        throw error;
      }
    }, [getAllReturPenjualan]);

    // Get all retur pembelian
    const getAllReturPembelian = useCallback(async (page = 1, limit = 25, search = '') => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        const response = await apiFetch(`/retur/pembelian?${params.toString()}`);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data retur pembelian:", error);
        throw error;
      }
    }, []);

    // Approve retur penjualan (Hanya ADMIN dan MANAGER)
    const approveReturPenjualan = useCallback(async (returId) => {
      try {
        const result = await apiFetch(`/retur/penjualan/${returId}/approve`, {
          method: 'PUT',
        });
        await init(); // Refresh data karena stok berubah
        showToast('Retur penjualan berhasil disetujui', 'success');
        return result;
      } catch (error) {
        console.error("Gagal menyetujui retur penjualan:", error);
        showToast(error.message || 'Gagal menyetujui retur penjualan', 'error');
        throw error;
      }
    }, [init, showToast]);

    // Reject retur penjualan (Hanya ADMIN dan MANAGER)
    const rejectReturPenjualan = useCallback(async (returId, reason) => {
      try {
        const result = await apiFetch(`/retur/penjualan/${returId}/reject`, {
          method: 'PUT',
          body: JSON.stringify({ reason }),
        });
        showToast('Retur penjualan ditolak', 'success');
        return result;
      } catch (error) {
        console.error("Gagal menolak retur penjualan:", error);
        showToast(error.message || 'Gagal menolak retur penjualan', 'error');
        throw error;
      }
    }, [showToast]);

    // Export functions
    const exportSales = async (period = 'all', startDate = null, endDate = null) => {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ period });
        if (startDate && endDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }
        
        const response = await fetch(`${API_URL}/export/sales?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Gagal export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-penjualan-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Export berhasil', 'success');
      } catch (error) {
        console.error("Gagal export penjualan:", error);
        showToast('Gagal export laporan', 'error');
        throw error;
      }
    };

    const exportProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/export/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Gagal export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master-barang-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Export berhasil', 'success');
      } catch (error) {
        console.error("Gagal export master barang:", error);
        showToast('Gagal export master barang', 'error');
        throw error;
      }
    };

    const exportDebt = async (type = 'customer') => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/export/debt?type=${type}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Gagal export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type === 'customer' ? 'piutang-pelanggan' : 'hutang-supplier'}-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Export berhasil', 'success');
      } catch (error) {
        console.error("Gagal export piutang/hutang:", error);
        showToast('Gagal export laporan', 'error');
        throw error;
      }
    };

    const exportStockHistory = async (productId) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/export/stock-history?productId=${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Gagal export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kartu-stok-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Export berhasil', 'success');
      } catch (error) {
        console.error("Gagal export kartu stok:", error);
        showToast('Gagal export kartu stok', 'error');
        throw error;
      }
    };

    // Get all warehouses
    const getAllWarehouses = useCallback(async () => {
      try {
        const response = await apiFetch('/warehouses');
        setWarehouses(response.data || []);
        return response;
      } catch (error) {
        console.error("Gagal mengambil data gudang:", error);
        throw error;
      }
    }, []);

    // Transfer stock between warehouses
    const transferStock = async (transferData) => {
      try {
        const result = await apiFetch('/warehouses/transfer', {
          method: 'POST',
          body: JSON.stringify(transferData),
        });
        await init(); // Refresh data karena stok berubah
        showToast('Transfer stok berhasil', 'success');
        return result;
      } catch (error) {
        console.error("Gagal transfer stok:", error);
        showToast(error.message || 'Gagal transfer stok', 'error');
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
      toast, // BARU: State toast
      showToast, // BARU: Fungsi untuk menampilkan toast
      hideToast, // BARU: Fungsi untuk menyembunyikan toast
      user, // BARU: Current user
      isAuthenticated, // BARU: Authentication status
      login, // BARU: Login function
      logout, // BARU: Logout function
      
      // Semua fungsi aksi
      saveProduct,
      deleteProduct,
      bulkDeleteProducts,
      bulkUpdateDistributor,
      bulkUpdateUnit,
      bulkUpdateMinStock,
      payDebt,
      sendEmailToCustomer,
      bulkSendEmail,
      getEmailQuota,
      sendWhatsAppToCustomer,
      bulkSendWhatsApp,
      addStock,
      getStockCard,
      getReports,
      createPO,
      confirmPOReceived,
      processStockOpname,
      processTransaction, // BARU: Fungsi untuk proses transaksi
      processRetur,
      importProducts,
      fetchProductsPaginated, // Fungsi untuk fetch products dengan pagination
      getProductByName, // Fungsi untuk mencari product by exact name match
      fetchCustomersPaginated, // Fungsi untuk fetch customers dengan pagination
      fetchCustomersWithDebtPaginated, // Fungsi untuk fetch customers dengan pagination
      fetchPOSuggestions, // Fungsi untuk fetch PO suggestions (low stock) dengan pagination
      fetchPendingPOsPaginated, // Fungsi untuk fetch POs dengan pagination
      fetchCompletedPOs, // Fungsi untuk fetch completed POs (untuk retur pembelian)
      saveCustomer, // CRUD Customer
      deleteCustomer,
      saveDistributor, // CRUD Distributor
      deleteDistributor,
      bulkDeleteDistributors,
      fetchDistributorsWithDebtPaginated, // Fetch distributors with debt
      payDistributorDebt, // Bayar hutang supplier
      getAllTransactions, // Get all transactions
      getTransactionByInvoice, // Get transaction by invoice number
      createReturPenjualan, // Create retur penjualan
      createReturPembelian, // Create retur pembelian
      getAllReturPenjualan, // Get all retur penjualan
      getReturPenjualanByInvoice, // Get retur penjualan by invoice
      getAllReturPembelian, // Get all retur pembelian
      approveReturPenjualan, // Approve retur penjualan
      rejectReturPenjualan, // Reject retur penjualan
      exportSales, // Export laporan penjualan
      exportProducts, // Export master barang
      exportDebt, // Export piutang/hutang
      exportStockHistory, // Export kartu stok
      warehouses, // List warehouses
      getAllWarehouses, // Get all warehouses
      transferStock, // Transfer stock between warehouses
      updateProfile, // Update user profile
      changePassword, // Change user password
      getStore, // Get store information
      updateStore, // Update store information
      apiFetch, // Export apiFetch untuk penggunaan langsung (e.g., scan barcode)
    };

    // BARU: Tampilkan loader jika data awal belum siap (hanya jika sudah authenticated dan benar-benar loading)
    // Jangan tampilkan loading jika tidak authenticated (untuk halaman login)
    if (isLoading && isAuthenticated) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      );
    }

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// 3. Buat Custom Hook (Tidak berubah)
export function useStore() {
    return useContext(StoreContext);
}