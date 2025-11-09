import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';

function PageLaporan() {
  const { getReports } = useStore();
  
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect ini akan berjalan saat halaman dimuat
  useEffect(() => {
    setIsLoading(true);
    getReports() // Sekarang fungsi ini ada
      .then(data => {
        setReports(data);
      })
      .catch(err => {
        console.error("Gagal memuat laporan:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getReports]);

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

  // Render laporan jika data sukses dimuat
  return (
    <div className="page-content p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Ringkasan Laporan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Keuangan */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Keuangan</h3>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Total Penjualan:</span>
            <span className="font-bold text-green-600">
              {formatRupiah(reports.totalSales)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Utang:</span>
            <span className="font-bold text-red-600">
              {formatRupiah(reports.totalDebt)}
            </span>
          </div>
        </div>

        {/* Stok */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Stok</h3>
          <p className="font-medium">Barang Terlaris:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
            {reports.topSelling.length === 0 ? (
              <li className="text-gray-500 text-base">Belum ada penjualan.</li>
            ) : (
              reports.topSelling.map(item => (
                <li key={item.name} className="text-lg">{item.name} ({item.qty} unit dasar)</li>
              ))
            )}
          </ul>
          <p className="font-medium">Stok Menipis:</p>
          <ul className="list-disc list-inside text-sm text-red-600">
            {reports.lowStockItems.length === 0 ? (
              <li className="text-gray-500 text-base">Stok aman.</li>
            ) : (
              reports.lowStockItems.map(item => (
                <li key={item.id} className="text-lg">{item.name} (Sisa {item.stock})</li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Riwayat Opname */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Riwayat Stok Opname Terakhir</h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {reports.opnameHistory.length === 0 ? (
            <li className="text-gray-500 text-base">Tidak ada riwayat opname.</li>
          ) : (
            reports.opnameHistory.map((entry, index) => {
              const qtyClass = entry.qtyChange > 0 ? 'text-green-600' : 'text-red-600';
              const qtySign = entry.qtyChange > 0 ? '+' : '';
              return (
                <li key={index} className="border-b pb-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{entry.product.name}</span>
                    <span className={`font-bold ${qtyClass}`}>{qtySign}{entry.qtyChange}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('id-ID')}</span>
                  <span className="text-sm text-gray-600"> ({entry.note})</span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export default PageLaporan;