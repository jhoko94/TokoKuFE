import { NavLink } from "react-router-dom";
// Impor SEMUA ikon yang dibutuhkan
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  ArchiveBoxIcon, 
  PencilSquareIcon,
  DocumentChartBarIcon, // <-- BARU
  InboxArrowDownIcon, // <-- BARU
  ClipboardDocumentCheckIcon, // <-- BARU
  CalculatorIcon // <-- BARU
} from "@heroicons/react/24/outline";

// Helper untuk styling NavLink
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button"; // (style.css Anda)
  return isActive ? `${baseClass} active` : baseClass;
};

function Sidebar() {
  return (
    <nav className="hidden md:flex md:flex-col md:w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-2xl font-bold text-blue-600">{import.meta.env.VITE_TOKO_NAME}</h1>
      </div>
      <ul className="flex flex-col py-4 space-y-1">
        <li>
          <NavLink to="/" className={getNavLinkClass}>
            <ShoppingCartIcon className="w-6 h-6" />
            <span>Jualan Baru</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/utang" className={getNavLinkClass}>
            <CreditCardIcon className="w-6 h-6" />
            <span>Catatan Utang</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/barang" className={getNavLinkClass}>
            <ArchiveBoxIcon className="w-6 h-6" />
            <span>Cek Barang</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/master-barang" className={getNavLinkClass}>
            <PencilSquareIcon className="w-6 h-6" />
            <span>Master Barang</span>
          </NavLink>
        </li>
        
        {/* --- TAMBAHAN YANG HILANG --- */}
        <li>
          <NavLink to="/laporan" className={getNavLinkClass}>
            <DocumentChartBarIcon className="w-6 h-6" />
            <span>Laporan</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/pesan-barang" className={getNavLinkClass}>
            <InboxArrowDownIcon className="w-6 h-6" />
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
          <NavLink to="/opname" className={getNavLinkClass}>
            <CalculatorIcon className="w-6 h-6" />
            <span>Stok Opname</span>
          </NavLink>
        </li>
        {/* --- AKHIR TAMBAHAN --- */}
        
      </ul>
    </nav>
  );
}
export default Sidebar;