import { useState, useRef } from 'react';
import { XMarkIcon, QrCodeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function ModalBarcodeGenerator({ isOpen, onClose, product, unit, onBarcodeGenerated }) {
  const [barcodeValue, setBarcodeValue] = useState(unit?.barcodes?.[0] || '');
  const [barcodeType, setBarcodeType] = useState('Code128');
  const canvasRef = useRef(null);

  if (!isOpen || !product || !unit) return null;

  const generateBarcode = () => {
    if (!barcodeValue.trim()) {
      alert('Barcode value tidak boleh kosong');
      return;
    }

    // Generate barcode menggunakan API external (atau bisa pakai library jsbarcode)
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue)}&code=${barcodeType}&dpi=96`;
    
    // Simpan ke canvas untuk download
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = barcodeUrl;
  };

  const downloadBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `barcode-${product.sku}-${unit.name}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleSave = () => {
    if (!barcodeValue.trim()) {
      alert('Barcode value tidak boleh kosong');
      return;
    }

    // Panggil callback untuk save barcode ke backend
    if (onBarcodeGenerated) {
      onBarcodeGenerated(barcodeValue, barcodeType);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Generate Barcode</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produk
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-gray-600">SKU: {product.sku} | {unit.name}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="Masukkan nilai barcode"
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
            {unit.barcodes && unit.barcodes.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Barcode saat ini: {unit.barcodes.join(', ')}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Barcode
            </label>
            <select
              value={barcodeType}
              onChange={(e) => setBarcodeType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="Code128">Code 128</option>
              <option value="EAN13">EAN-13</option>
              <option value="EAN8">EAN-8</option>
              <option value="Code39">Code 39</option>
              <option value="ITF">ITF-14</option>
            </select>
          </div>

          {/* Preview */}
          {barcodeValue && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
              <div className="text-center bg-white p-4 rounded border border-gray-200">
                <img
                  src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue)}&code=${barcodeType}&dpi=96`}
                  alt="Barcode Preview"
                  className="max-w-full h-auto mx-auto"
                  onError={(e) => {
                    e.target.src = '';
                    e.target.alt = 'Gagal memuat barcode';
                  }}
                />
                <div className="mt-2 text-sm text-gray-600">{barcodeValue}</div>
              </div>
            </div>
          )}

          {/* Hidden canvas for download */}
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
            {barcodeValue && (
              <button
                onClick={downloadBarcode}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!barcodeValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Barcode
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ModalBarcodeGenerator;

