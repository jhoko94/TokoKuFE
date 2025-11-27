import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import ModalCekPesanan from '../components/modals/ModalCekPesanan'; // Modal yg akan kita buat
import Pagination from '../components/Pagination';
import { generatePOPDF } from '../utils/generatePOPDF';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function PageCekPesanan() {
  const { fetchPendingPOsPaginated } = useStore();
  
  // State untuk mengontrol modal: PO mana yang sedang dicek
  const [poToCek, setPoToCek] = useState(null);
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

  // Handler untuk download PO
  const handleDownloadPO = async (po) => {
    try {
      // Format PO Number dari ID
      const poNumber = po.id ? `PO-${po.id.slice(-8).toUpperCase()}` : `PO-${Date.now()}`;
      
      // Format data untuk PDF
      const poForPDF = {
        id: poNumber,
        poId: po.id,
        distributor: po.distributor || {},
        createdAt: po.createdAt || new Date().toISOString(),
        status: po.status || 'PENDING',
        items: (po.items || []).map(item => {
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
      
      await generatePOPDF(poForPDF);
    } catch (error) {
      console.error("Gagal download PO:", error);
      alert(`Gagal download PO: ${error.message}`);
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
                      onClick={() => handleDownloadPO(po)}
                      className="flex-1 sm:flex-none bg-green-600 text-white font-bold py-2.5 px-3 sm:px-4 rounded-lg shadow hover:bg-green-700 active:bg-green-800 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] transition-colors"
                      title="Download PO"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Download</span>
                    </button>
                    <button 
                      onClick={() => setPoToCek(po)}
                      className="flex-1 sm:flex-none bg-blue-600 text-white font-bold py-2.5 px-3 sm:px-4 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 text-sm sm:text-base min-h-[44px] transition-colors"
                    >
                      CEK
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

      {/* Render Modal (jika poToCek di-set) */}
      {poToCek && (
        <ModalCekPesanan
          po={poToCek}
          onClose={() => setPoToCek(null)}
        />
      )}
    </>
  );
}

export default PageCekPesanan;