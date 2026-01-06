import { useState } from 'react';

export default function ModalKonfirmasi({ title, message, onConfirm, onCancel, items, distributorName }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paperSize, setPaperSize] = useState('a4'); // State untuk ukuran kertas
  const itemsPerPage = 10;
  
  // Hitung pagination untuk items
  const totalPages = items && items.length > 0 ? Math.ceil(items.length / itemsPerPage) : 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items && items.length > 0 ? items.slice(startIndex, endIndex) : [];
  
  // Handler untuk konfirmasi dengan ukuran kertas
  const handleConfirm = () => {
    onConfirm(paperSize); // Kirim ukuran kertas ke onConfirm
  };
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onCancel}></div>
      
      {/* Konten Modal */}
      <div id="modal-confirm" className="modal-content !max-w-5xl max-h-[90vh] overflow-y-auto">
        <h3 id="confirm-title" className="text-xl font-bold mb-4">{title}</h3>
        
        {/* Jika ada items, tampilkan tabel */}
        {items && items.length > 0 ? (
          <div className="mb-6">
            {distributorName && (
              <p className="text-gray-700 mb-3">
                <span className="font-semibold">PO untuk {distributorName}:</span>
              </p>
            )}
            <p className="text-gray-700 mb-4">Mohon siapkan pesanan berikut:</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Nama Barang</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={startIndex + index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{startIndex + index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {item.product?.name || item.productName || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.qty}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.unitName || 'Pcs'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {items && items.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai <span className="font-medium">{Math.min(endIndex, items.length)}</span> dari <span className="font-medium">{items.length}</span> data
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    &lt;
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 min-w-[36px] border rounded-md text-sm font-medium transition ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
            
            {/* Pilihan Ukuran Kertas */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pilih Ukuran Kertas untuk PDF:
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paperSize"
                    value="a4"
                    checked={paperSize === 'a4'}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">A4 (210mm x 297mm)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paperSize"
                    value="thermal"
                    checked={paperSize === 'thermal'}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Thermal (80mm x variabel)</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* Jika tidak ada items, tampilkan message biasa */
          <div 
            id="confirm-message" 
            className="text-gray-700 mb-6"
            dangerouslySetInnerHTML={{ __html: message }}
          >
          </div>
        )}
        
        <div className="flex gap-2">
          {onCancel && (
            <button 
              id="confirm-btn-cancel" 
              onClick={onCancel} 
              className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
            >
              Batal
            </button>
          )}
          <button 
            id="confirm-btn-ok" 
            onClick={handleConfirm}
            className={onCancel ? "w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition" : "w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition"}
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}