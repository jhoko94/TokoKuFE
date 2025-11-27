import { NavLink } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
// Impor SEMUA ikon yang dibutuhkan
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  ArchiveBoxIcon, 
  PencilSquareIcon,
  DocumentChartBarIcon,
  InboxArrowDownIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  TruckIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  UserIcon
} from "@heroicons/react/24/outline";

// Helper untuk styling NavLink
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button"; // (style.css Anda)
  return isActive ? `${baseClass} active` : baseClass;
};

function Sidebar() {
  const { user, logout } = useStore();
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Cek apakah user adalah ADMIN atau MANAGER
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="hidden md:flex md:flex-col md:w-64 bg-white shadow-lg border-r border-gray-200 h-screen overflow-hidden">
      <ul className="flex flex-col py-4 space-y-1 overflow-y-auto flex-1 min-h-0">
        {/* MASTER DATA - Hanya untuk ADMIN dan MANAGER */}
        {isAdminOrManager && (
          <>
            <li className="px-4 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Master Data</div>
            </li>
            <li>
              <NavLink to="/master-barang" className={getNavLinkClass}>
                <PencilSquareIcon className="w-6 h-6" />
                <span>Master Barang</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/master-pelanggan" className={getNavLinkClass}>
                <UserGroupIcon className="w-6 h-6" />
                <span>Master Pelanggan</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/master-supplier" className={getNavLinkClass}>
                <BuildingStorefrontIcon className="w-6 h-6" />
                <span>Master Supplier</span>
              </NavLink>
            </li>
          </>
        )}

        {/* TRANSAKSI */}
        <li className="px-4 py-2 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaksi</div>
        </li>
        <li>
          <NavLink to="/" className={getNavLinkClass}>
            <ShoppingCartIcon className="w-6 h-6" />
            <span>Penjualan</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history-penjualan" className={getNavLinkClass}>
            <ClockIcon className="w-6 h-6" />
            <span>History Penjualan</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/retur-penjualan" className={getNavLinkClass}>
            <ArrowPathIcon className="w-6 h-6" />
            <span>Retur Penjualan</span>
          </NavLink>
        </li>
        {/* Pembelian - Hanya untuk ADMIN dan MANAGER */}
        {isAdminOrManager && (
          <>
            <li>
              <NavLink to="/pesan-barang" className={getNavLinkClass}>
                <TruckIcon className="w-6 h-6" />
                <span>Pesan Barang (PO)</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/cek-pesanan" className={getNavLinkClass}>
                <ClipboardDocumentCheckIcon className="w-6 h-6" />
                <span>Cek Pesanan</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/retur-pembelian" className={getNavLinkClass}>
                <ArrowPathIcon className="w-6 h-6" />
                <span>Retur Pembelian</span>
              </NavLink>
            </li>
          </>
        )}

        {/* STOK */}
        <li className="px-4 py-2 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</div>
        </li>
        <li>
          <NavLink to="/barang" className={getNavLinkClass}>
            <ArchiveBoxIcon className="w-6 h-6" />
            <span>Cek Barang</span>
          </NavLink>
        </li>
        {/* Stok Opname - Hanya untuk ADMIN dan MANAGER */}
        {isAdminOrManager && (
          <li>
            <NavLink to="/opname" className={getNavLinkClass}>
              <CalculatorIcon className="w-6 h-6" />
              <span>Stok Opname</span>
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/kartu-stok" className={getNavLinkClass}>
            <BookOpenIcon className="w-6 h-6" />
            <span>Kartu Stok</span>
          </NavLink>
        </li>

        {/* PIUTANG & HUTANG */}
        <li className="px-4 py-2 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Piutang & Hutang</div>
        </li>
        <li>
          <NavLink to="/utang" className={getNavLinkClass}>
            <CreditCardIcon className="w-6 h-6" />
            <span>Piutang Pelanggan</span>
          </NavLink>
        </li>
        {/* Hutang Supplier - Hanya untuk ADMIN dan MANAGER */}
        {isAdminOrManager && (
          <li>
            <NavLink to="/hutang-supplier" className={getNavLinkClass}>
              <BanknotesIcon className="w-6 h-6" />
              <span>Hutang Supplier</span>
            </NavLink>
          </li>
        )}

        {/* LAPORAN - Hanya untuk ADMIN dan MANAGER */}
        {isAdminOrManager && (
          <>
            <li className="px-4 py-2 mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Laporan</div>
            </li>
            <li>
              <NavLink to="/laporan" className={getNavLinkClass}>
                <DocumentChartBarIcon className="w-6 h-6" />
                <span>Laporan</span>
              </NavLink>
            </li>
          </>
        )}

        {/* BANTUAN */}
        <li className="px-4 py-2 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bantuan</div>
        </li>
        <li>
          <NavLink to="/help" className={getNavLinkClass}>
            <QuestionMarkCircleIcon className="w-6 h-6" />
            <span>Panduan Penggunaan</span>
          </NavLink>
        </li>
        
        {/* PROFILE */}
        <li className="px-4 py-2 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Akun</div>
        </li>
        <li>
          <NavLink to="/profile" className={getNavLinkClass}>
            <UserIcon className="w-6 h-6" />
            <span>Profile</span>
          </NavLink>
        </li>
      </ul>
      
      {/* User Info & Logout - Fixed at bottom */}
      <div className="mt-auto p-4 border-t border-gray-200 bg-white">
        {user && (
          <div className="mb-3">
            <NavLink to="/profile" className="block text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors">
              {user.name}
            </NavLink>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
export default Sidebar;