import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import ModalBayarUtang from '../components/modals/ModalBayarUtang'; // Modal yang akan kita buat
import Pagination from '../components/Pagination';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function PageUtang() {
  // 1. Ambil fungsi dari store
  const { fetchCustomersWithDebtPaginated, exportDebt } = useStore();
  
  // 2. State lokal untuk search dan modal
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [customersWithDebt, setCustomersWithDebt] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  
  // State untuk menyimpan customer MANA yang akan bayar utang
  // null = modal tertutup
  // non-null = modal terbuka
  const [customerToPay, setCustomerToPay] = useState(null);

  // 3. Fetch data dengan pagination
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await fetchCustomersWithDebtPaginated(currentPage, itemsPerPage, searchTerm);
        setCustomersWithDebt(response.data);
        setPagination(response.pagination);
        
        // Hitung total utang dari data yang dimuat (hanya untuk estimasi)
        // Untuk total akurat, perlu endpoint terpisah atau hitung dari semua halaman
        const pageTotal = response.data.reduce((acc, c) => acc + Number(c.debt || 0), 0);
        setTotalDebt(pageTotal);
      } catch (error) {
        console.error("Gagal memuat data utang:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [currentPage, itemsPerPage, searchTerm, fetchCustomersWithDebtPaginated]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 5. Render JSX
  return (
    <>
      <div className="page-content p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Piutang Pelanggan</h2>
          <button
            onClick={() => exportDebt('customer')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>
        
        {/* Ringkasan Total Utang */}
        <div className="mb-4 card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Total Piutang Pelanggan:</span>
            <span className="text-2xl font-bold text-red-600">
              {formatRupiah(totalDebt)}
              {pagination.total > customersWithDebt.length && (
                <span className="text-sm text-gray-500 font-normal ml-2">
                  (dari {customersWithDebt.length} pelanggan di halaman ini)
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* Search Bar */}
        <input 
          type="text" 
          id="debt-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama pelanggan..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Daftar Utang */}
        <div id="debt-list" className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loader mx-auto mb-2"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : customersWithDebt.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Tidak ada pelanggan yang berutang.</p>
          ) : (
            customersWithDebt.map(customer => (
              <div key={customer.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    {customer.type && (
                      <p className="text-sm text-gray-600 mt-1">Tipe: {typeof customer.type === 'object' ? customer.type.name || customer.type.code : customer.type}</p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-600 mt-1">{customer.address}</p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">Piutang:</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(Number(customer.debt || 0))}</p>
                    <button 
                      onClick={() => setCustomerToPay(customer)}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                    >
                      Bayar Utang
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
      </div>

      {/* 5. Render Modal (Secara Kondisional)
        Modal hanya akan render jika customerToPay BUKAN null.
      */}
      {customerToPay && (
        <ModalBayarUtang 
          customer={customerToPay}
          onClose={async () => {
            setCustomerToPay(null);
            // Reload data setelah bayar utang
            try {
              const response = await fetchCustomersWithDebtPaginated(currentPage, itemsPerPage, searchTerm);
              setCustomersWithDebt(response.data);
              setPagination(response.pagination);
              const pageTotal = response.data.reduce((acc, c) => acc + Number(c.debt || 0), 0);
              setTotalDebt(pageTotal);
            } catch (error) {
              console.error("Gagal reload data:", error);
            }
          }}
        />
      )}
    </>
  );
}

export default PageUtang;