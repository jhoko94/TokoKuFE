import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import ModalReturPembelian from '../components/modals/ModalReturPembelian';
import Pagination from '../components/Pagination';

function PageReturPembelian() {
  const { getAllReturPembelian } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [returList, setReturList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRetur = async () => {
      setIsLoading(true);
      try {
        const response = await getAllReturPembelian(currentPage, itemsPerPage, searchTerm);
        setReturList(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat retur pembelian:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRetur();
  }, [currentPage, itemsPerPage, searchTerm, getAllReturPembelian]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="page-content p-2 sm:p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Retur Pembelian</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Retur Baru</span>
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nomor PO atau nama supplier..." 
        className="w-full p-2 sm:p-3 mb-4 border border-gray-300 rounded-lg shadow-sm text-base"
      />

      {/* Daftar Retur */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Retur</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tanggal</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Catatan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : returList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Tidak ada retur yang sesuai dengan pencarian' : 'Belum ada retur pembelian'}
                  </td>
                </tr>
              ) : (
                returList.map(retur => (
                  <tr key={retur.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">{retur.poNumber}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{retur.distributor.name}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatRupiah(Number(retur.total))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {new Date(retur.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate" title={retur.note || '-'}>
                      {retur.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Modal Retur */}
      {isModalOpen && (
        <ModalReturPembelian
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => {
            // Reload data
            const response = await getAllReturPembelian(currentPage, itemsPerPage, searchTerm);
            setReturList(response.data);
            setPagination(response.pagination);
          }}
        />
      )}
    </div>
  );
}

export default PageReturPembelian;

