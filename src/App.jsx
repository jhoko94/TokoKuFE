import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import MenuProtectedRoute from "./components/MenuProtectedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import PageLogin from "./pages/PageLogin";
import PageJualan from "./pages/PageJualan";
import PageUtang from "./pages/PageUtang";
import PageBarang from "./pages/PageBarang";
import PageMasterBarang from "./pages/PageMasterBarang";
import PageMasterBarangList from "./pages/PageMasterBarangList";
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
import PageUserManagement from "./pages/PageUserManagement";
import PageRoleMenuManagement from "./pages/PageRoleMenuManagement";
import PageRoleManagement from "./pages/PageRoleManagement";

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
            {/* Master Data - Menggunakan permission dari database */}
            <Route 
              path="master-barang" 
              element={
                <MenuProtectedRoute menuPath="/master-barang">
                  <PageMasterBarang />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="barang-master" 
              element={
                <MenuProtectedRoute menuPath="/barang-master">
                  <PageMasterBarangList />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="master-pelanggan" 
              element={
                <MenuProtectedRoute menuPath="/master-pelanggan">
                  <PageMasterPelanggan />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="master-supplier" 
              element={
                <MenuProtectedRoute menuPath="/master-supplier">
                  <PageMasterSupplier />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Transaksi - Menggunakan permission dari database */}
            <Route 
              index 
              element={
                <MenuProtectedRoute>
                  <PageJualan />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="history-penjualan" 
              element={
                <MenuProtectedRoute menuPath="/history-penjualan">
                  <PageHistoryPenjualan />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="retur-penjualan" 
              element={
                <MenuProtectedRoute menuPath="/retur-penjualan">
                  <PageReturPenjualan />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Pembelian - Menggunakan permission dari database */}
            <Route 
              path="pesan-barang" 
              element={
                <MenuProtectedRoute menuPath="/pesan-barang">
                  <PagePesanan />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="cek-pesanan" 
              element={
                <MenuProtectedRoute menuPath="/cek-pesanan">
                  <PageCekPesanan />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="retur-pembelian" 
              element={
                <MenuProtectedRoute menuPath="/retur-pembelian">
                  <PageReturPembelian />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Stok - Menggunakan permission dari database */}
            <Route 
              path="barang" 
              element={
                <MenuProtectedRoute menuPath="/barang">
                  <PageBarang />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="opname" 
              element={
                <MenuProtectedRoute menuPath="/opname">
                  <PageOpname />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="kartu-stok" 
              element={
                <MenuProtectedRoute menuPath="/kartu-stok">
                  <PageKartuStok />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Piutang & Hutang - Menggunakan permission dari database */}
            <Route 
              path="utang" 
              element={
                <MenuProtectedRoute menuPath="/utang">
                  <PageUtang />
                </MenuProtectedRoute>
              } 
            />
            <Route 
              path="hutang-supplier" 
              element={
                <MenuProtectedRoute menuPath="/hutang-supplier">
                  <PageHutangSupplier />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Laporan - Menggunakan permission dari database */}
            <Route 
              path="laporan" 
              element={
                <MenuProtectedRoute menuPath="/laporan">
                  <PageLaporan />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Help - Menggunakan permission dari database */}
            <Route 
              path="help" 
              element={
                <MenuProtectedRoute menuPath="/help">
                  <PageHelp />
                </MenuProtectedRoute>
              } 
            />
            
            {/* Profile - Menggunakan permission dari database */}
            <Route 
              path="profile" 
              element={
                <MenuProtectedRoute menuPath="/profile">
                  <PageProfile />
                </MenuProtectedRoute>
              } 
            />
            
            {/* User Management - Hanya ADMIN */}
            <Route 
              path="user-management" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <PageUserManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="role-menu-management" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <PageRoleMenuManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="role-management" 
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <PageRoleManagement />
                </RoleProtectedRoute>
              } 
            />
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;