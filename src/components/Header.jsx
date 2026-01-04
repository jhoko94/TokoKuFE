import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon, 
  UserIcon, 
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  ClockIcon,
  ArrowPathIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  CalculatorIcon,
  BookOpenIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  PencilSquareIcon,
  UserGroupIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../context/StoreContext';
import { getUserRole } from '../utils/normalize';

// Logika NavLink yang sama dengan Sidebar
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button"; // (style.css Anda)
  return isActive ? `${baseClass} active` : baseClass;
};

// Wrapper untuk menutup menu saat pindah halaman
function MobileNavLink({ to, title, icon, onClick }) {
  return (
    <NavLink to={to} className={getNavLinkClass} onClick={onClick}>
      {icon || <span className="w-5 h-5"></span>}
      <span>{title}</span>
    </NavLink>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, getStore } = useStore();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('POS System');
  
  // Get user role (handle both object and string)
  const userRole = getUserRole(user);

  // Load store name
  useEffect(() => {
    const loadStore = async () => {
      try {
        const storeData = await getStore();
        if (storeData?.name) {
          setStoreName(storeData.name);
        }
      } catch (error) {
        console.error("Gagal memuat data toko:", error);
        // Keep default "POS System" if error
      }
    };
    loadStore();
  }, [getStore]);

  const closeMenu = () => setIsMenuOpen(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="md:hidden bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 shadow-md relative">
      <div className="flex items-center justify-between p-4">
        <h1 id="page-title" className="text-xl font-bold text-white truncate">
          {storeName}
        </h1>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-white">
              <span>{user.name}</span>
              <span className="px-2 py-1 bg-white/20 text-white rounded text-xs font-semibold backdrop-blur-sm">
                {userRole || (typeof user?.role === 'object' ? user?.role?.name : user?.role)}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 text-white hover:text-red-200 transition-colors"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-white hover:text-gray-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen 
              ? <XMarkIcon className="w-6 h-6" />
              : <Bars3Icon className="w-6 h-6" />
            }
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-30 p-4 border-t border-gray-100 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Master Data - Hanya untuk ADMIN dan MANAGER */}
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Master Data</div>
                <ul className="flex flex-col space-y-1">
                  <li><MobileNavLink to="/master-barang" title="Kelola Master Barang" icon={<PencilSquareIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                  <li><MobileNavLink to="/barang-master" title="Master Barang" icon={<ArchiveBoxIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                  <li><MobileNavLink to="/master-pelanggan" title="Master Pelanggan" icon={<UserGroupIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                  <li><MobileNavLink to="/master-supplier" title="Master Supplier" icon={<BuildingStorefrontIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                </ul>
              </div>
            )}

            {/* Transaksi */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaksi</div>
              <ul className="flex flex-col space-y-1">
                <li><MobileNavLink to="/" title="Penjualan" icon={<ShoppingCartIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                <li><MobileNavLink to="/history-penjualan" title="History Penjualan" icon={<ClockIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                <li><MobileNavLink to="/retur-penjualan" title="Retur Penjualan" icon={<ArrowPathIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                {/* Pembelian - Hanya untuk ADMIN/MANAGER */}
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <>
                    <li><MobileNavLink to="/pesan-barang" title="Pesan Barang (PO)" icon={<TruckIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                    <li><MobileNavLink to="/cek-pesanan" title="Cek Pesanan" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                    <li><MobileNavLink to="/retur-pembelian" title="Retur Pembelian" icon={<ArrowPathIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                  </>
                )}
              </ul>
            </div>

            {/* Stok */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stok</div>
              <ul className="flex flex-col space-y-1">
                <li><MobileNavLink to="/barang" title="Cek Barang" icon={<ArchiveBoxIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                {/* Stok Opname hanya untuk ADMIN/MANAGER */}
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <li><MobileNavLink to="/opname" title="Stok Opname" icon={<CalculatorIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                )}
                <li><MobileNavLink to="/kartu-stok" title="Kartu Stok" icon={<BookOpenIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
              </ul>
            </div>

            {/* Piutang & Hutang */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Piutang & Hutang</div>
              <ul className="flex flex-col space-y-1">
                <li><MobileNavLink to="/utang" title="Piutang Pelanggan" icon={<CreditCardIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                {/* Hutang Supplier - Hanya untuk ADMIN dan MANAGER */}
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <li><MobileNavLink to="/hutang-supplier" title="Hutang Supplier" icon={<BanknotesIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                )}
              </ul>
            </div>

            {/* Laporan - Hanya untuk ADMIN dan MANAGER */}
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Laporan</div>
                <ul className="flex flex-col space-y-1">
                  <li><MobileNavLink to="/laporan" title="Laporan" icon={<DocumentChartBarIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
                </ul>
              </div>
            )}

            {/* Bantuan */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bantuan</div>
              <ul className="flex flex-col space-y-1">
                <li><MobileNavLink to="/help" title="Panduan Penggunaan" icon={<QuestionMarkCircleIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
              </ul>
            </div>

            {/* Akun */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Akun</div>
              <ul className="flex flex-col space-y-1">
                <li><MobileNavLink to="/profile" title="Profile" icon={<UserIcon className="w-5 h-5" />} onClick={closeMenu} /></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;