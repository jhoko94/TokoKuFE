import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

/**
 * RoleProtectedRoute - Melindungi route berdasarkan role user
 * @param {Object} props
 * @param {React.ReactNode} props.children - Komponen yang akan di-render jika user memiliki akses
 * @param {string[]} props.allowedRoles - Array role yang diizinkan mengakses (e.g., ['ADMIN', 'MANAGER'])
 */
function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useStore();

  // Tunggu sampai loading selesai
  if (isLoading) {
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

  // Jika tidak ada allowedRoles, izinkan semua user yang sudah login
  if (allowedRoles.length === 0) {
    return children;
  }

  // Cek apakah user memiliki role yang diizinkan
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500">
            Role yang diizinkan: {allowedRoles.join(', ')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Role Anda: {user?.role || 'Tidak diketahui'}
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

export default RoleProtectedRoute;

