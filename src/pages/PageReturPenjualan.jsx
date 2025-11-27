import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import { PlusIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import ModalReturPenjualan from '../components/modals/ModalReturPenjualan';
import Pagination from '../components/Pagination';

function PageReturPenjualan() {
  const { getAllReturPenjualan } = useStore();
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
        const response = await getAllReturPenjualan(currentPage, itemsPerPage, searchTerm);
        setReturList(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat retur penjualan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRetur();
  }, [currentPage, itemsPerPage, searchTerm, getAllReturPenjualan]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Menunggu Persetujuan
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Ditolak
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="page-content p-2 sm:p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Retur Penjualan</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Retur Baru</span>
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nomor invoice atau nama pelanggan..." 
        className="w-full p-2 sm:p-3 mb-4 border border-gray-300 rounded-lg shadow-sm text-base"
      />

      {/* Daftar Retur */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Retur</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tanggal</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Catatan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : returList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Tidak ada retur yang sesuai dengan pencarian' : 'Belum ada retur penjualan'}
                  </td>
                </tr>
              ) : (
                returList.map(retur => (
                  <tr key={retur.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">{retur.invoiceNumber}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{retur.customer.name}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatRupiah(Number(retur.total))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(retur.status)}
                      {retur.approvedBy && retur.approvedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Disetujui oleh: {retur.approvedBy.name}
                          <br />
                          {new Date(retur.approvedAt).toLocaleString('id-ID')}
                        </div>
                      )}
                      {retur.status === 'REJECTED' && retur.rejectedReason && (
                        <div className="text-xs text-red-600 mt-1" title={retur.rejectedReason}>
                          Alasan: {retur.rejectedReason}
                        </div>
                      )}
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
        <ModalReturPenjualan
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => {
            // Reload data
            const response = await getAllReturPenjualan(currentPage, itemsPerPage, searchTerm);
            setReturList(response.data);
            setPagination(response.pagination);
          }}
        />
      )}
    </div>
  );
}

export default PageReturPenjualan;

