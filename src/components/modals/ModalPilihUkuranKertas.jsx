import { useState } from 'react';

export default function ModalPilihUkuranKertas({ onConfirm, onCancel }) {
  const [paperSize, setPaperSize] = useState('a4');

  const handleConfirm = () => {
    onConfirm(paperSize);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onCancel}></div>
      
      {/* Konten Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Pilih Ukuran Kertas</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pilih ukuran kertas untuk PDF:
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
              <input
                type="radio"
                name="paperSize"
                value="a4"
                checked={paperSize === 'a4'}
                onChange={(e) => setPaperSize(e.target.value)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">A4</span>
                <p className="text-xs text-gray-500">210mm x 297mm - Standar kertas A4</p>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
              <input
                type="radio"
                name="paperSize"
                value="thermal"
                checked={paperSize === 'thermal'}
                onChange={(e) => setPaperSize(e.target.value)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Thermal</span>
                <p className="text-xs text-gray-500">80mm x variabel - Untuk printer thermal</p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onCancel} 
            className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
          >
            Batal
          </button>
          <button 
            onClick={handleConfirm}
            className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Download
          </button>
        </div>
      </div>
    </>
  );
}

