import { NavLink } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowRightOnRectangleIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import * as HeroIcons from "@heroicons/react/24/outline";

// Helper untuk styling NavLink
const getNavLinkClass = ({ isActive }) => {
  const baseClass = "nav-button";
  return isActive ? `${baseClass} active` : baseClass;
};

function Sidebar() {
  const { user, logout } = useStore();
  const [userMenus, setUserMenus] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Get icon component dari heroicons
  const getIcon = (iconName) => {
    if (!iconName) return Squares2X2Icon;
    const IconComponent = HeroIcons[iconName] || Squares2X2Icon;
    return IconComponent;
  };

  // Group menus by category
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

  return (
    <nav className="hidden md:flex md:flex-col md:w-64 bg-white shadow-lg border-r border-gray-200 h-screen overflow-hidden">
      <ul className="flex flex-col py-4 space-y-1 overflow-y-auto flex-1 min-h-0">
        {Object.entries(groupedMenus).map(([category, menus]) => (
          <div key={category}>
            <li className="px-4 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {categoryLabels[category] || category}
              </div>
            </li>
            {menus.map(menu => {
              const IconComponent = getIcon(menu.icon);
              return (
                <li key={menu.id}>
                  <NavLink to={menu.path} className={getNavLinkClass}>
                    <IconComponent className="w-6 h-6" />
                    <span>{menu.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </div>
        ))}
      </ul>
      
      {/* User Info & Logout - Fixed at bottom */}
      <div className="mt-auto p-4 border-t border-gray-200 bg-white">
        {user && (
          <div className="mb-3">
            <NavLink to="/profile" className="block text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors">
              {user.name}
            </NavLink>
            <div className="text-xs text-gray-500">
              {typeof user.role === 'object' ? (user.role?.name || user.role?.code) : user.role}
            </div>
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