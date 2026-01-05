import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useStore } from '../context/StoreContext';

// Logika NavLink yang sama dengan Sidebar
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button";
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
  const [userMenus, setUserMenus] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Load user menus (sama seperti Sidebar)
  useEffect(() => {
    if (user) {
      loadUserMenus();
    }
  }, [user]);

  const loadUserMenus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/menus/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserMenus(data.menus || []);
      }
    } catch (error) {
      console.error('Gagal memuat menu:', error);
    }
  };

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
      }
    };
    loadStore();
  }, [getStore]);

  // Get icon component dari heroicons (sama seperti Sidebar)
  const getIcon = (iconName) => {
    if (!iconName) return Squares2X2Icon;
    const IconComponent = HeroIcons[iconName] || Squares2X2Icon;
    return IconComponent;
  };

  // Group menus by category (sama seperti Sidebar)
  const groupedMenus = userMenus.reduce((acc, menu) => {
    const category = menu.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(menu);
    return acc;
  }, {});

  const categoryLabels = {
    'MASTER_DATA': 'Master Data',
    'TRANSAKSI': 'Transaksi',
    'STOK': 'Stok',
    'PIUTANG_HUTANG': 'Piutang & Hutang',
    'LAPORAN': 'Laporan',
    'BANTUAN': 'Bantuan',
    'AKUN': 'Akun',
    'OTHER': 'Lainnya'
  };

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
                {typeof user?.role === 'object' ? user?.role?.name : user?.role}
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
      
      {/* Mobile Menu Dropdown - Menggunakan data dari API seperti Sidebar */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-30 p-4 border-t border-gray-100 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="space-y-4">
            {Object.entries(groupedMenus).map(([category, menus]) => (
              <div key={category}>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {categoryLabels[category] || category}
                </div>
                <ul className="flex flex-col space-y-1">
                  {menus.map(menu => {
                    const MenuIconComponent = getIcon(menu.icon);
                    return (
                      <li key={menu.id}>
                        <MobileNavLink 
                          to={menu.path} 
                          title={menu.name} 
                          icon={<MenuIconComponent className="w-5 h-5" />} 
                          onClick={closeMenu} 
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
