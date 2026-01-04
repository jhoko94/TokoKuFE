import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useState, useEffect } from 'react';

/**
 * MenuProtectedRoute - Melindungi route berdasarkan permission menu dari database
 * @param {Object} props
 * @param {React.ReactNode} props.children - Komponen yang akan di-render jika user memiliki akses
 * @param {string} props.menuPath - Path menu yang harus dicek (e.g., '/pesan-barang')
 */
function MenuProtectedRoute({ children, menuPath }) {
  const { user, isAuthenticated, isLoading } = useStore();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState(null);
  const [checking, setChecking] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      checkMenuAccess();
    }
  }, [isAuthenticated, user, menuPath, location.pathname, isLoading]);

  const checkMenuAccess = async () => {
    try {
      setChecking(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setHasAccess(false);
        setChecking(false);
        return;
      }
      
      // Get user menus dari API
      const response = await fetch(`${API_URL}/menus/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const menus = data.menus || [];
        
        // Cek apakah path yang diakses ada di list menu user
        // Normalize path untuk matching
        const pathToCheck = menuPath || location.pathname;
        const normalizedPath = pathToCheck === '/' ? '/' : pathToCheck.replace(/\/$/, '');
        
        const hasMenuAccess = menus.some(menu => {
          const menuPathNormalized = menu.path === '/' ? '/' : menu.path.replace(/\/$/, '');
          return menuPathNormalized === normalizedPath;
        });

        setHasAccess(hasMenuAccess);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking menu access:', error);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  };

  // Tunggu sampai loading selesai
  if (isLoading || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Jika tidak terautentikasi, redirect ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika tidak punya akses, tampilkan error
  if (hasAccess === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Silakan hubungi administrator untuk mendapatkan akses.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default MenuProtectedRoute;

