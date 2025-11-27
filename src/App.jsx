import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import PageLogin from "./pages/PageLogin";
import PageJualan from "./pages/PageJualan";
import PageUtang from "./pages/PageUtang";
import PageBarang from "./pages/PageBarang";
import PageMasterBarang from "./pages/PageMasterBarang";
import PageLaporan from "./pages/PageLaporan";
import PagePesanan from "./pages/PagePesanan";
import PageCekPesanan from "./pages/PageCekPesanan";
import PageOpname from "./pages/PageOpname";
// Halaman baru untuk IPOS5
import PageMasterPelanggan from "./pages/PageMasterPelanggan";
import PageMasterSupplier from "./pages/PageMasterSupplier";
import PageReturPenjualan from "./pages/PageReturPenjualan";
import PageReturPembelian from "./pages/PageReturPembelian";
import PageHutangSupplier from "./pages/PageHutangSupplier";
import PageKartuStok from "./pages/PageKartuStok";
import PageHistoryPenjualan from "./pages/PageHistoryPenjualan";
import PageHelp from "./pages/PageHelp";
import PageProfile from "./pages/PageProfile";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<PageLogin />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Master Data - Hanya ADMIN dan MANAGER */}
            <Route 
              path="master-barang" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageMasterBarang />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="master-pelanggan" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageMasterPelanggan />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="master-supplier" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageMasterSupplier />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Transaksi - Semua role bisa akses */}
            <Route index element={<PageJualan />} />
            <Route path="history-penjualan" element={<PageHistoryPenjualan />} />
            <Route path="retur-penjualan" element={<PageReturPenjualan />} />
            
            {/* Pembelian - Hanya ADMIN dan MANAGER */}
            <Route 
              path="pesan-barang" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PagePesanan />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="cek-pesanan" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageCekPesanan />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="retur-pembelian" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageReturPembelian />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Stok */}
            <Route path="barang" element={<PageBarang />} />
            {/* Stok Opname - Hanya ADMIN dan MANAGER */}
            <Route 
              path="opname" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageOpname />
                </RoleProtectedRoute>
              } 
            />
            <Route path="kartu-stok" element={<PageKartuStok />} />
            
            {/* Piutang & Hutang */}
            <Route path="utang" element={<PageUtang />} />
            {/* Hutang Supplier - Hanya ADMIN dan MANAGER */}
            <Route 
              path="hutang-supplier" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageHutangSupplier />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Laporan - Hanya ADMIN dan MANAGER */}
            <Route 
              path="laporan" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PageLaporan />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Help - Semua role bisa akses */}
            <Route path="help" element={<PageHelp />} />
            
            {/* Profile - Semua role bisa akses */}
            <Route path="profile" element={<PageProfile />} />
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;