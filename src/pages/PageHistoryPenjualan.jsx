import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import Pagination from '../components/Pagination';
import { EyeIcon, PrinterIcon } from '@heroicons/react/24/outline';
import ModalDetailTransaksi from '../components/modals/ModalDetailTransaksi';
import ModalPrintStruk from '../components/modals/ModalPrintStruk';

function PageHistoryPenjualan() {
  const { getAllTransactions } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await getAllTransactions(currentPage, itemsPerPage, searchTerm);
        setTransactions(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat history penjualan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [currentPage, itemsPerPage, searchTerm, getAllTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handlePrint = (transaction) => {
    setSelectedTransaction(transaction);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">History Penjualan</h2>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nomor invoice atau nama pelanggan..." 
        className="w-full p-2 sm:p-3 mb-4 border border-gray-300 rounded-lg shadow-sm text-base"
      />

      {/* Daftar Transaksi */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diskon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bayar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'Tidak ada transaksi yang sesuai dengan pencarian' : 'Belum ada transaksi penjualan'}
                </td>
              </tr>
            ) : (
              transactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.customer?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      transaction.type === 'LUNAS' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.type === 'BON'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatRupiah(Number(transaction.subtotal))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatRupiah(Number(transaction.discount || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {formatRupiah(Number(transaction.total))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatRupiah(Number(transaction.paid || 0))}
                    {transaction.change > 0 && (
                      <span className="text-green-600 ml-1">
                        (Kembalian: {formatRupiah(Number(transaction.change))})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(transaction)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handlePrint(transaction)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Cetak Struk"
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </button>
                    </div>
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

      {/* Modal Detail Transaksi */}
      {isDetailModalOpen && selectedTransaction && (
        <ModalDetailTransaksi
          transaction={selectedTransaction}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* Modal Print Struk */}
      {isPrintModalOpen && selectedTransaction && (
        <ModalPrintStruk
          transaction={selectedTransaction}
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}

export default PageHistoryPenjualan;

