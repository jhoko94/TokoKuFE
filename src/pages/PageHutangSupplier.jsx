import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import ModalBayarHutangSupplier from '../components/modals/ModalBayarHutangSupplier';
import Pagination from '../components/Pagination';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function PageHutangSupplier() {
  const { distributors, fetchDistributorsWithDebtPaginated, payDistributorDebt, exportDebt } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [distributorsWithDebt, setDistributorsWithDebt] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [distributorToPay, setDistributorToPay] = useState(null);

  useEffect(() => {
    const loadDistributors = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDistributorsWithDebtPaginated(currentPage, itemsPerPage, searchTerm);
        setDistributorsWithDebt(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat data hutang supplier:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDistributors();
  }, [currentPage, itemsPerPage, searchTerm, fetchDistributorsWithDebtPaginated]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Hitung total hutang dari semua distributors
  const totalDebt = distributors.reduce((acc, d) => acc + Number(d.debt || 0), 0);

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Hutang Supplier</h2>
        <button
          onClick={() => exportDebt('supplier')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Ringkasan */}
      <div className="mb-4 card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-700">Total Hutang ke Supplier:</span>
          <span className="text-2xl font-bold text-blue-700">{formatRupiah(totalDebt)}</span>
        </div>
      </div>

      {/* Search Bar */}
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nama supplier..." 
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
      />

      {/* Daftar Hutang */}
      <div id="debt-list" className="space-y-3">
        {isLoading ? (
          <p className="text-center text-gray-500">Memuat data...</p>
        ) : distributorsWithDebt.length === 0 ? (
          <p className="text-center text-gray-500">Tidak ada supplier yang berhutang.</p>
        ) : (
          distributorsWithDebt.map(distributor => (
            <div key={distributor.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{distributor.name}</h3>
                  {distributor.address && (
                    <p className="text-sm text-gray-600 mt-1">{distributor.address}</p>
                  )}
                  {distributor.phone && (
                    <p className="text-sm text-gray-600">{distributor.phone}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-600">Hutang:</p>
                  <p className="text-2xl font-bold text-red-600">{formatRupiah(Number(distributor.debt || 0))}</p>
                  <button
                    onClick={() => setDistributorToPay(distributor)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Bayar Hutang
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && pagination.total > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
        />
        </div>
      )}

      {/* Modal Bayar Hutang */}
      {distributorToPay && (
        <ModalBayarHutangSupplier
          distributor={distributorToPay}
          onClose={() => setDistributorToPay(null)}
          onSuccess={async () => {
            setDistributorToPay(null);
            // Reload data
            const response = await fetchDistributorsWithDebtPaginated(currentPage, itemsPerPage, searchTerm);
            setDistributorsWithDebt(response.data);
            setPagination(response.pagination);
          }}
        />
      )}
    </div>
  );
}

export default PageHutangSupplier;

