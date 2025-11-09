import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Logika NavLink yang sama dengan Sidebar
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button"; // (style.css Anda)
  return isActive ? `${baseClass} active` : baseClass;
};

// Wrapper untuk menutup menu saat pindah halaman
function MobileNavLink({ to, title, icon, onClick }) {
  return (
    <NavLink to={to} className={getNavLinkClass} onClick={onClick}>
      {icon}
      <span>{title}</span>
    </NavLink>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="md:hidden bg-white shadow-md relative">
      <div className="flex items-center justify-between p-4">
        <h1 id="page-title" className="text-xl font-bold text-blue-600">
          TokoKu
        </h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen 
            ? <XMarkIcon className="w-6 h-6 text-gray-600" />
            : <Bars3Icon className="w-6 h-6 text-gray-600" />
          }
        </button>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-30 p-4 border-t border-gray-100">
          <ul className="flex flex-col space-y-1">
            <li>
              <MobileNavLink to="/" title="Jualan Baru" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/utang" title="Catatan Utang" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/barang" title="Cek Barang" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/master-barang" title="Master Barang" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/laporan" title="Laporan" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/pesan-barang" title="Pesan Barang (PO)" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/cek-pesanan" title="Cek Pesanan" onClick={closeMenu} />
            </li>
            <li>
              <MobileNavLink to="/opname" title="Stok Opname" onClick={closeMenu} />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;