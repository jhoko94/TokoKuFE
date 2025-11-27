import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalKartuStok({ product, onClose }) {
  const { getStockCard, showToast } = useStore(); // Ambil fungsi dari context
  
  // State lokal untuk menampung data hasil fetch (dummy)
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk copy to clipboard
  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${text} berhasil disalin ke clipboard`, 'success');
    } catch (err) {
      console.error('Gagal copy ke clipboard:', err);
      // Fallback untuk browser yang tidak support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`${text} berhasil disalin ke clipboard`, 'success');
      } catch (fallbackErr) {
        showToast('Gagal menyalin ke clipboard', 'error');
      }
    }
  };

  // useEffect ini akan fetch data saat modal dibuka
  useEffect(() => {
    if (product) {
      setIsLoading(true);
      
      // Panggil fungsi getStockCard dari context
      getStockCard(product.id)
        .then(data => {
          setCardData(data);
        })
        .catch(err => {
          console.error("Gagal ambil kartu stok:", err);
          setCardData(null); // Set ke null jika error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [product, getStockCard]); // Dependency

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="loader"></div>
        </div>
      );
    }
    
    if (!cardData) {
      return (
        <div className="text-center text-red-500 py-8">
          Gagal memuat riwayat stok.
        </div>
      );
    }

    // Render data dalam format tabel
    return (
      <>
        {/* Stok Akhir Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Stok Akhir:</span>
            <span className="text-base sm:text-lg font-bold text-blue-800">
              {cardData.finalStock} {cardData.baseUnitName}
            </span>
          </div>
        </div>

        {/* Tabel Riwayat Stok */}
        <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal/Waktu
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Stok Sebelum
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perubahan
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Sesudah
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Unit
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  No PO/Invoice
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cardData.entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 sm:px-4 py-8 text-center text-gray-500">
                    Belum ada riwayat stok
                  </td>
                </tr>
              ) : (
                cardData.entries.map((entry, index) => {
                  const qtyClass = entry.qtyChange > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
                  const qtySign = entry.qtyChange > 0 ? '+' : '';
                  const typeBadgeClass = entry.type === 'Masuk' 
                    ? 'bg-green-100 text-green-800' 
                    : entry.type === 'Keluar' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                        <div className="whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        {/* Info tambahan untuk mobile */}
                        <div className="text-xs text-gray-500 sm:hidden mt-1 space-y-0.5">
                          {entry.qtyBefore !== undefined && <div>Sebelum: {entry.qtyBefore}</div>}
                          {entry.unitName && <div>Unit: {entry.unitName}</div>}
                          {entry.referenceNumber && (
                            <div 
                              onClick={() => handleCopyToClipboard(entry.referenceNumber)}
                              className="text-blue-600 underline cursor-pointer"
                            >
                              No: {entry.referenceNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeBadgeClass}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 text-right hidden sm:table-cell">
                        {entry.qtyBefore}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-right">
                        <span className={qtyClass}>
                          {qtySign}{entry.qtyChange}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900 text-right">
                        {entry.qtyAfter}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 hidden md:table-cell">
                        {entry.unitName || cardData.baseUnitName}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 hidden lg:table-cell">
                        {entry.referenceNumber ? (
                          <span 
                            onClick={() => handleCopyToClipboard(entry.referenceNumber)}
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-dotted hover:decoration-solid transition-colors break-all"
                            title="Klik untuk menyalin"
                          >
                            {entry.referenceNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 max-w-xs hidden xl:table-cell">
                        <div className="truncate" title={entry.note || '-'}>
                          {entry.note || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-stock-card" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[95vw] sm:w-[90vw] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h3 id="stock-card-title" className="text-base sm:text-xl font-bold truncate">
            Kartu Stok: {product.name}
          </h3>
        </div>
        
        {/* Content */}
        <div id="stock-card-list" className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 sm:p-6">
          {renderContent()}
        </div>
        
        {/* Footer */}
        <div className="p-3 sm:p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-gray-300 text-gray-800 font-bold py-2 sm:py-2.5 px-4 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors text-sm sm:text-base min-h-[44px]">
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}