import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useStore();

  // Tunggu sampai loading selesai sebelum mengecek authentication
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

