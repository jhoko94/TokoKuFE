import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ModalPilihUkuranKertas from '../components/modals/ModalPilihUkuranKertas'; // Modal untuk pilih ukuran kertas
import Pagination from '../components/Pagination';
import { generatePOPDF } from '../utils/generatePOPDF';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

function PageCekPesanan() {
  const { fetchPendingPOsPaginated, deletePO, showToast } = useStore();
  const navigate = useNavigate();
  
  // State untuk PO yang akan didownload (untuk modal pilihan ukuran kertas)
  const [poToDownload, setPoToDownload] = useState(null);
  // State untuk PO yang akan dihapus (untuk modal konfirmasi)
  const [poToDelete, setPoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data dengan pagination
  useEffect(() => {
    const loadPOs = async () => {
      setIsLoading(true);
      try {
        const response = await fetchPendingPOsPaginated(currentPage, itemsPerPage);
        setPendingPOs(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat PO:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPOs();
  }, [currentPage, itemsPerPage, fetchPendingPOsPaginated]);

  // Handler untuk klik tombol Download - tampilkan modal pilihan ukuran kertas
  const handleDownloadClick = (po) => {
    setPoToDownload(po);
  };

  // Handler untuk download PO setelah user memilih ukuran kertas
  const handleDownloadPO = async (paperSize) => {
    if (!poToDownload) return;
    
    try {
      // Format PO Number dari ID
      const poNumber = poToDownload.id ? `PO-${poToDownload.id.slice(-8).toUpperCase()}` : `PO-${Date.now()}`;
      
      // Format data untuk PDF
      const poForPDF = {
        id: poNumber,
        poId: poToDownload.id,
        distributor: poToDownload.distributor || {},
        createdAt: poToDownload.createdAt || new Date().toISOString(),
        status: poToDownload.status || 'PENDING',
        items: (poToDownload.items || []).map(item => {
          // Pastikan product name tersedia
          const productName = item.product?.name || 'N/A';
          return {
            productId: item.productId,
            product: item.product || { name: productName },
            productName: productName,
            qty: item.qty || 0,
            unitName: item.unitName || 'Pcs'
          };
        })
      };
      
      await generatePOPDF(poForPDF, null, paperSize);
      setPoToDownload(null); // Tutup modal setelah download
    } catch (error) {
      console.error("Gagal download PO:", error);
      alert(`Gagal download PO: ${error.message}`);
      setPoToDownload(null); // Tutup modal jika error
    }
  };

  // Handler untuk klik tombol Hapus - tampilkan modal konfirmasi
  const handleDeleteClick = (po) => {
    setPoToDelete(po);
  };

  // Handler untuk konfirmasi hapus PO
  const handleConfirmDelete = async () => {
    if (!poToDelete) return;
    
    setIsDeleting(true);
    try {
      await deletePO(poToDelete.id);
      setPoToDelete(null); // Tutup modal setelah sukses
      
      // Reload data PO
      const response = await fetchPendingPOsPaginated(currentPage, itemsPerPage);
      setPendingPOs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Gagal menghapus PO:", error);
      // Error sudah di-handle di deletePO dengan showToast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Cek Pesanan (PO) Pending</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">Konfirmasi barang yang datang untuk menambah stok.</p>
        
        <div id="pending-po-list" className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loader mx-auto mb-2"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : pendingPOs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Tidak ada pesanan (PO) yang sedang ditunggu.</p>
          ) : (
            pendingPOs.map(po => (
              <div key={po.id} className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  {/* Informasi PO */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2 truncate">
                      {po.distributor?.name || 'N/A'}
                    </p>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                      <p className="break-all">
                        <span className="font-medium">ID:</span> <span className="font-mono">{po.id}</span>
                      </p>
                      <p>
                        <span className="font-medium">Dibuat:</span> {new Date(po.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      <p>
                        <span className="font-medium text-yellow-600">Status:</span>{' '}
                        <span className="font-semibold text-yellow-600">{po.status}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleDownloadClick(po)}
                      className="flex-1 sm:flex-none bg-green-600 text-white font-bold py-2.5 px-3 sm:px-4 rounded-lg shadow hover:bg-green-700 active:bg-green-800 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] transition-colors"
                      title="Download PO"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Download</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/konfirmasi-pesanan/${po.id}`)}
                      className="flex-1 sm:flex-none bg-blue-600 text-white font-bold py-2.5 px-3 sm:px-4 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 text-sm sm:text-base min-h-[44px] transition-colors"
                    >
                      CEK
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(po)}
                      className="flex-1 sm:flex-none bg-red-600 text-white font-bold py-2.5 px-3 sm:px-4 rounded-lg shadow hover:bg-red-700 active:bg-red-800 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] transition-colors"
                      title="Hapus PO"
                    >
                      <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Hapus</span>
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

      {/* Render Modal Pilih Ukuran Kertas (jika poToDownload di-set) */}
      {poToDownload && (
        <ModalPilihUkuranKertas
          onConfirm={handleDownloadPO}
          onCancel={() => setPoToDownload(null)}
        />
      )}

      {/* Render Modal Konfirmasi Hapus PO (jika poToDelete di-set) */}
      {poToDelete && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => !isDeleting && setPoToDelete(null)}></div>
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Hapus Pesanan (PO)</h3>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Apakah Anda yakin ingin menghapus pesanan ini?
                </p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Supplier:</span> {poToDelete.distributor?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ID:</span> <span className="font-mono text-xs">{poToDelete.id}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Status:</span> {poToDelete.status}
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-3">
                  ⚠️ Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setPoToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-300 text-gray-800 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-5 h-5" />
                      <span>Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default PageCekPesanan;