import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalKartuStok({ product, onClose }) {
  const { getStockCard } = useStore(); // Ambil fungsi dari context
  
  // State lokal untuk menampung data hasil fetch (dummy)
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      return <div className="loader"></div>; // Gunakan class .loader dari CSS kita
    }
    
    if (!cardData) {
      return <p className="text-center text-red-500">Gagal memuat riwayat (dummy).</p>;
    }

    // Render data jika sukses
    return (
      <>
        <div className="bg-blue-50 p-2 rounded-md font-bold text-blue-800">
          Stok Akhir: {cardData.finalStock} {cardData.baseUnitName}
        </div>
        {cardData.entries.map((entry, index) => {
          const qtyClass = entry.qtyChange > 0 ? 'text-green-600' : 'text-red-600';
          const qtySign = entry.qtyChange > 0 ? '+' : '';
          
          return (
            <div key={index} className="border-b border-gray-200 pb-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{entry.type}</span>
                <span className={`font-bold ${qtyClass}`}>{qtySign}{entry.qtyChange}</span>
              </div>
              <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-700">{entry.note}</p>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div id="modal-stock-card" className="modal-content">
        <h3 id="stock-card-title" className="text-xl font-bold mb-4">
          Kartu Stok: {product.name}
        </h3>
        <div id="stock-card-list" className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {renderContent()}
        </div>
        <button onClick={onClose} className="w-full mt-4 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
          Tutup
        </button>
      </div>
    </>
  );
}