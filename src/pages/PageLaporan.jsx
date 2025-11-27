import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';
import Pagination from '../components/Pagination';
import { 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

function PageLaporan() {
  const { getReports, exportSales } = useStore();
  
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockItemsPerPage, setLowStockItemsPerPage] = useState(25);

  // useEffect ini akan berjalan saat halaman dimuat atau period berubah
  useEffect(() => {
    setIsLoading(true);
    // Kirim period dan pagination untuk low stock items
    const params = new URLSearchParams({
      period,
      page: lowStockPage.toString(),
      limit: lowStockItemsPerPage.toString(),
    });
    getReports(period, lowStockPage, lowStockItemsPerPage) // Kirim period dan pagination
      .then(data => {
        setReports(data);
      })
      .catch(err => {
        console.error("Gagal memuat laporan:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getReports, period, lowStockPage, lowStockItemsPerPage]);

  // Reset low stock page saat period berubah
  useEffect(() => {
    setLowStockPage(1);
  }, [period]);

  // Tampilkan loader selagi data diambil
  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Ringkasan Laporan</h1>
        <div className="loader"></div>
      </div>
    );
  }

  // Tampilkan pesan error jika data gagal dimuat
  if (!reports) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Ringkasan Laporan</h1>
        <p className="text-center text-red-500">Gagal memuat data laporan.</p>
      </div>
    );
  }

  const handleExport = () => {
    exportSales(period);
  };

  // Hitung rata-rata transaksi
  const avgTransaction = reports.totalTransactions > 0 
    ? reports.totalSales / reports.totalTransactions 
    : 0;

  // Format period label
  const periodLabels = {
    today: 'Hari Ini',
    week: '7 Hari Terakhir',
    month: 'Bulan Ini',
    all: 'Semua Waktu'
  };

  // Render laporan jika data sukses dimuat
  return (
    <div className="page-content p-2 sm:p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ringkasan Laporan</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Periode: {periodLabels[period]}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="all">Semua</option>
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Penjualan */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
              <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Total Penjualan</h3>
          <p className="text-xl sm:text-2xl font-bold truncate">{formatRupiah(reports.totalSales || 0)}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">{reports.totalTransactions || 0} transaksi</p>
        </div>

        {/* Jumlah Transaksi */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
              <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Jumlah Transaksi</h3>
          <p className="text-xl sm:text-2xl font-bold">{reports.totalTransactions || 0}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-2 truncate">
            Rata-rata: {formatRupiah(avgTransaction)}
          </p>
        </div>

        {/* Piutang Pelanggan */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
              <ArrowTrendingDownIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Piutang Pelanggan</h3>
          <p className="text-xl sm:text-2xl font-bold truncate">{formatRupiah(reports.totalDebt || 0)}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">Belum dibayar</p>
        </div>

        {/* Hutang Supplier */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
              <CubeIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Hutang Supplier</h3>
          <p className="text-xl sm:text-2xl font-bold truncate">{formatRupiah(reports.totalSupplierDebt || 0)}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">Belum dibayar</p>
        </div>
      </div>

      {/* Grafik Penjualan Harian */}
      {reports.dailySales && reports.dailySales.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />
              Penjualan Harian
            </h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-h-[200px] py-4">
              {reports.dailySales.map((day, idx) => {
                const maxTotal = Math.max(...reports.dailySales.map(d => d.total), 1);
                const height = (day.total / maxTotal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${new Date(day.date).toLocaleDateString('id-ID')}: ${formatRupiah(day.total)}`}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="font-semibold">{formatRupiah(day.total)}</div>
                      <div className="text-gray-500">{new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                      <div className="text-gray-400">{day.count} transaksi</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Barang Terlaris */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-green-600" />
              Barang Terlaris
            </h3>
          </div>
          {reports.topSelling.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada penjualan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Terjual</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.topSelling.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                        {item.qty} unit
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.transactions} kali
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stok Menipis */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-600" />
              Stok Menipis
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
              {reports.lowStockPagination?.total || reports.lowStockItems?.length || 0} item
            </span>
          </div>
          {!reports.lowStockItems || reports.lowStockItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Stok aman, tidak ada barang yang menipis.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stok</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.lowStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-red-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600 text-right">
                          {item.stock}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.minStock}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Menipis
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination untuk Stok Menipis */}
              {reports.lowStockPagination && reports.lowStockPagination.total > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={reports.lowStockPagination.page}
                    totalPages={reports.lowStockPagination.totalPages}
                    onPageChange={setLowStockPage}
                    itemsPerPage={reports.lowStockPagination.limit}
                    totalItems={reports.lowStockPagination.total}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setLowStockItemsPerPage(newItemsPerPage);
                      setLowStockPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Riwayat Opname */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CubeIcon className="w-6 h-6 mr-2 text-purple-600" />
            Riwayat Stok Opname Terakhir
          </h3>
        </div>
        {reports.opnameHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tidak ada riwayat opname.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal/Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Perubahan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.opnameHistory.map((entry, index) => {
                  const qtyClass = entry.qtyChange > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
                  const qtySign = entry.qtyChange > 0 ? '+' : '';
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {new Date(entry.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.product.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        <span className={qtyClass}>
                          {qtySign}{entry.qtyChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PageLaporan;