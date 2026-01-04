import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, QrCodeIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

function ModalBarcodeGenerator({ isOpen, onClose, product, unit, onBarcodeGenerated, onBarcodeDeleted }) {
  // Pilih distributor default (supplier utama atau distributor pertama)
  const defaultDistributor = product?.distributors?.find(d => d.isDefault) || product?.distributors?.[0];
  const defaultDistributorId = defaultDistributor?.distributorId || defaultDistributor?.distributor?.id || defaultDistributor?.id;
  
  const [selectedDistributorId, setSelectedDistributorId] = useState(defaultDistributorId || '');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeType, setBarcodeType] = useState('Code128');
  const canvasRef = useRef(null);

  // Update barcodeValue saat distributor atau unit berubah
  useEffect(() => {
    if (isOpen && unit && selectedDistributorId && product?.distributors) {
      // Get barcodes untuk kombinasi distributor + unit yang dipilih
      const distributor = product.distributors.find(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        return distId === selectedDistributorId;
      });
      
      if (distributor) {
        // Filter barcode untuk unit yang dipilih
        const barcodes = (distributor.barcodes || []).filter(b => {
          const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
          return bUnitId === unit.id || (!bUnitId && unit.conversion === 1); // Fallback untuk backward compatibility
        });
        
        if (barcodes.length > 0) {
          const first = barcodes[0];
          const firstBarcode = typeof first === 'string' ? first : (first?.barcode || '');
          setBarcodeValue(firstBarcode);
        } else {
          setBarcodeValue('');
        }
      } else {
        setBarcodeValue('');
      }
    }
  }, [isOpen, unit, selectedDistributorId, product]);

  // Update selectedDistributorId saat product berubah
  useEffect(() => {
    if (isOpen && product) {
      const defaultDist = product.distributors?.find(d => d.isDefault) || product.distributors?.[0];
      const distId = defaultDist?.distributorId || defaultDist?.distributor?.id || defaultDist?.id;
      if (distId) {
        setSelectedDistributorId(distId);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product || !unit) return null;

  const generateBarcode = () => {
    const barcodeStr = typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || '');
    if (!barcodeStr.trim()) {
      alert('Barcode value tidak boleh kosong');
      return;
    }

    // Generate barcode menggunakan API external (atau bisa pakai library jsbarcode)
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeStr)}&code=${barcodeType}&dpi=96`;
    
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
    const barcodeStr = typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || String(barcodeValue || ''));
    if (!barcodeStr.trim()) {
      alert('Barcode value tidak boleh kosong');
      return;
    }

    if (!selectedDistributorId) {
      alert('Distributor harus dipilih');
      return;
    }

    // Panggil callback untuk save barcode ke backend dengan distributorId
    if (onBarcodeGenerated) {
      onBarcodeGenerated(barcodeStr, barcodeType, selectedDistributorId);
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

          {/* Pilih Distributor */}
          {product.distributors && product.distributors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distributor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                required
              >
                {product.distributors.map(dist => {
                  const distId = dist.distributorId || dist.distributor?.id || dist.id;
                  const distName = dist.distributor?.name || dist.distributor?.name || 'N/A';
                  return (
                    <option key={distId} value={distId}>
                      {distName} {dist.isDefault ? '(Supplier Utama)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Value <span className="text-red-500">*</span>
            </label>
            
            {/* Tampilkan barcode yang sudah ada */}
            {(() => {
              if (!product?.distributors || !selectedDistributorId || !unit) return null;
              
              const distributor = product.distributors.find(d => {
                const distId = d.distributorId || d.distributor?.id || d.id;
                return distId === selectedDistributorId;
              });
              
              if (!distributor) return null;
              
              // Filter barcode untuk unit yang dipilih
              const currentBarcodes = (distributor.barcodes || []).filter(b => {
                const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
                return bUnitId === unit.id || (!bUnitId && unit.conversion === 1);
              });
              
              if (currentBarcodes.length > 0) {
                return (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Barcode yang sudah ada ({currentBarcodes.length}):
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                      {currentBarcodes.map((b, index) => {
                        const bValue = typeof b === 'string' ? b : (b?.barcode || b);
                        const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
                        const isSelected = barcodeValue === bValue;
                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-blue-500 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setBarcodeValue(bValue)}
                              className="flex-1 text-left"
                              title={isSelected ? 'Barcode terpilih untuk generate' : 'Klik untuk pilih barcode ini'}
                            >
                              {bValue}
                            </button>
                            {onBarcodeDeleted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Hapus barcode "${bValue}"?`)) {
                                    onBarcodeDeleted(bValue, selectedDistributorId, bUnitId || unit.id);
                                  }
                                }}
                                className={`ml-1 p-0.5 rounded hover:bg-opacity-20 ${
                                  isSelected ? 'hover:bg-white' : 'hover:bg-red-100'
                                }`}
                                title="Hapus barcode"
                              >
                                <TrashIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Klik barcode di atas untuk memilih, atau input barcode baru di bawah
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            
            <input
              type="text"
              value={typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || String(barcodeValue || ''))}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="Masukkan nilai barcode baru atau pilih dari daftar di atas"
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
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
          {barcodeValue && (() => {
            const barcodeStr = typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || String(barcodeValue || ''));
            return barcodeStr ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                <div className="text-center bg-white p-4 rounded border border-gray-200">
                  <img
                    src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeStr)}&code=${barcodeType}&dpi=96`}
                    alt="Barcode Preview"
                    className="max-w-full h-auto mx-auto"
                    onError={(e) => {
                      e.target.src = '';
                      e.target.alt = 'Gagal memuat barcode';
                    }}
                  />
                  <div className="mt-2 text-sm text-gray-600">{barcodeStr}</div>
                </div>
              </div>
            ) : null;
          })()}

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
            {(() => {
              const barcodeStr = typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || String(barcodeValue || ''));
              return barcodeStr ? (
                <button
                  onClick={downloadBarcode}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
              ) : null;
            })()}
            <button
              onClick={handleSave}
              disabled={(() => {
                const barcodeStr = typeof barcodeValue === 'string' ? barcodeValue : (barcodeValue?.barcode || String(barcodeValue || ''));
                return !barcodeStr || !barcodeStr.trim();
              })()}
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

