import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../../utils/formatters';

function ModalPrintLabel({ isOpen, onClose, product, unit }) {
  const [qty, setQty] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const printRef = useRef(null);

  // Pilih distributor default (supplier utama atau distributor pertama)
  const defaultDistributor = product?.distributors?.find(d => d.isDefault) || product?.distributors?.[0];
  const defaultDistributorId = defaultDistributor?.distributorId || defaultDistributor?.distributor?.id || defaultDistributor?.id;

  // Update selectedDistributorId saat product berubah
  useEffect(() => {
    if (isOpen && product && defaultDistributorId) {
      setSelectedDistributorId(defaultDistributorId);
    }
  }, [isOpen, product, defaultDistributorId]);

  // Update selectedBarcode saat distributor atau barcodes berubah
  useEffect(() => {
    if (isOpen && selectedDistributorId && unit && product) {
      // Get barcodes untuk kombinasi distributor + unit yang dipilih
      let barcodes = [];
      if (product?.distributors && selectedDistributorId) {
        const distributor = product.distributors.find(d => {
          const distId = d.distributorId || d.distributor?.id || d.id;
          return distId === selectedDistributorId;
        });
        
        if (distributor) {
          // Filter barcode untuk unit yang dipilih
          const filteredBarcodes = (distributor.barcodes || []).filter(b => {
            const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
            return bUnitId === unit.id || (!bUnitId && unit.conversion === 1);
          });
          
          barcodes = filteredBarcodes.map(b => {
            return typeof b === 'string' ? b : (b?.barcode || b);
          }).filter(b => b);
        }
      }
      
      // Fallback: cek unit.barcodes langsung (untuk backward compatibility)
      if (barcodes.length === 0 && unit.barcodes && unit.barcodes.length > 0) {
        barcodes = unit.barcodes.map(b => {
          return typeof b === 'string' ? b : (b?.barcode || b);
        }).filter(b => b);
      }
      
      if (barcodes.length > 0) {
        // Jika barcode yang dipilih masih ada di list, tetap pakai itu
        // Jika tidak, pakai barcode pertama
        const currentBarcode = selectedBarcode;
        if (!currentBarcode || !barcodes.includes(currentBarcode)) {
          setSelectedBarcode(barcodes[0]);
        }
      } else {
        setSelectedBarcode('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDistributorId, unit?.id, product?.id]);

  // Get semua barcode untuk kombinasi distributor + unit yang dipilih
  const getBarcodesForCombo = () => {
    if (!product?.distributors || !selectedDistributorId || !unit) return [];
    
    const distributor = product.distributors.find(d => {
      const distId = d.distributorId || d.distributor?.id || d.id;
      return distId === selectedDistributorId;
    });
    
    if (!distributor) return [];
    
    // Filter barcode untuk unit yang dipilih
    const barcodes = (distributor.barcodes || []).filter(b => {
      const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
      return bUnitId === unit.id || (!bUnitId && unit.conversion === 1); // Fallback untuk backward compatibility
    });
    
    // Extract barcode values
    const barcodeValues = barcodes.map(b => {
      return typeof b === 'string' ? b : (b?.barcode || b);
    }).filter(b => b); // Filter out null/undefined
    
    // Fallback: cek unit.barcodes langsung (untuk backward compatibility)
    if (barcodeValues.length === 0 && unit.barcodes && unit.barcodes.length > 0) {
      return unit.barcodes.map(b => {
        return typeof b === 'string' ? b : (b?.barcode || b);
      }).filter(b => b);
    }
    
    return barcodeValues;
  };

  const availableBarcodes = getBarcodesForCombo();
  const barcodeValue = selectedBarcode || availableBarcodes[0] || null;

  if (!isOpen || !product || !unit) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${product.name}</title>
          <style>
            @page {
              size: 3in 2in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: Arial, sans-serif;
            }
            .label {
              width: 100%;
              border: 1px solid #000;
              padding: 8px;
              box-sizing: border-box;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
              text-align: center;
            }
            .barcode-container {
              text-align: center;
              margin: 8px 0;
            }
            .barcode {
              max-width: 100%;
              height: auto;
            }
            .price {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin-top: 4px;
            }
            .sku {
              font-size: 10px;
              text-align: center;
              color: #666;
              margin-top: 4px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .label {
                page-break-after: always;
                margin-bottom: 0;
              }
            }
          </style>
        </head>
        <body>
          ${Array(qty).fill(0).map(() => `
            <div class="label">
              <div class="product-name">${product.name}</div>
              ${barcodeValue ? `
                <div class="barcode-container">
                  <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue)}&code=Code128&dpi=96" 
                       alt="Barcode" class="barcode" />
                </div>
              ` : ''}
              ${showPrice ? `<div class="price">${formatRupiah(Number(unit.price))}</div>` : ''}
              <div class="sku">SKU: ${product.sku} | ${unit.name}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Print Label Harga</h3>
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

          {/* Pilih Distributor jika ada banyak distributor */}
          {product.distributors && product.distributors.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distributor (untuk barcode)
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
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

          {/* Pilih Barcode jika ada banyak barcode */}
          {availableBarcodes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Barcode <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBarcode}
                onChange={(e) => setSelectedBarcode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                required
              >
                {availableBarcodes.map((barcode, index) => (
                  <option key={index} value={barcode}>
                    {barcode}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Tersedia {availableBarcodes.length} barcode untuk kombinasi distributor dan satuan ini
              </p>
            </div>
          )}

          {/* Info jika hanya ada 1 barcode */}
          {availableBarcodes.length === 1 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                Barcode yang akan digunakan: <span className="font-semibold">{availableBarcodes[0]}</span>
              </p>
            </div>
          )}

          {/* Warning jika tidak ada barcode */}
          {availableBarcodes.length === 0 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ Tidak ada barcode untuk kombinasi distributor dan satuan ini. Label akan dicetak tanpa barcode.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Label
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPrice"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showPrice" className="text-sm text-gray-700">
              Tampilkan Harga
            </label>
          </div>

          {/* Preview */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
            <div ref={printRef} className="bg-white p-3 border border-gray-200 rounded">
              <div className="text-center font-bold text-sm mb-2">{product.name}</div>
              {barcodeValue ? (
                <div className="text-center mb-2">
                  <img 
                    src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue)}&code=Code128&dpi=96`}
                    alt="Barcode"
                    className="max-w-full h-auto"
                    onError={(e) => {
                      e.target.src = '';
                      e.target.alt = 'Gagal memuat barcode';
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-xs text-gray-500 mb-2">No barcode</div>
              )}
              {showPrice && (
                <div className="text-center font-bold text-base">
                  {formatRupiah(Number(unit.price))}
                </div>
              )}
              <div className="text-center text-xs text-gray-500 mt-1">
                SKU: {product.sku} | {unit.name}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ModalPrintLabel;

