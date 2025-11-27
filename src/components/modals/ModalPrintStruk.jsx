import { useRef, useState, useEffect } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../../utils/formatters';
import { useStore } from '../../context/StoreContext';

function ModalPrintStruk({ isOpen, onClose, transaction }) {
  const printRef = useRef(null);
  const { user, getStore } = useStore();
  const [store, setStore] = useState(null);

  // Load store data when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadStore = async () => {
        try {
          const storeData = await getStore();
          setStore(storeData);
        } catch (error) {
          console.error("Gagal memuat data toko:", error);
          // Set default store jika error
          setStore({
            name: 'Toko Saya',
            address: '',
            phone: '',
            email: '',
          });
        }
      };
      loadStore();
    }
  }, [isOpen, getStore]);

  if (!isOpen || !transaction) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;
    
    // Extract content without the header (since we'll add it separately)
    const contentWithoutHeader = printContent.replace(/<div class="text-center mb-3 pb-3 border-b border-dashed border-gray-400">[\s\S]*?<\/div>/, '');
    
    // Build store info HTML
    const storeInfo = `
      <div class="header">
        <div class="store-name">${store?.name || 'Toko Saya'}</div>
        ${store?.address ? `<div class="store-address">${store.address}</div>` : ''}
        ${store?.phone ? `<div class="store-contact">Telp: ${store.phone}</div>` : ''}
        ${store?.email ? `<div class="store-contact">Email: ${store.email}</div>` : ''}
        ${store?.website ? `<div class="store-contact">${store.website}</div>` : ''}
      </div>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk - ${transaction.invoiceNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-address {
              font-size: 10px;
              margin-bottom: 3px;
            }
            .store-contact {
              font-size: 10px;
              margin-bottom: 3px;
            }
            .invoice-info {
              margin: 10px 0;
            }
            .invoice-info div {
              margin: 3px 0;
            }
            .items {
              margin: 10px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-name {
              flex: 1;
              margin-right: 10px;
            }
            .item-qty {
              text-align: right;
              margin-right: 10px;
              min-width: 30px;
            }
            .item-price {
              text-align: right;
              min-width: 80px;
            }
            .summary {
              margin: 10px 0;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .summary-label {
              flex: 1;
            }
            .summary-value {
              text-align: right;
              min-width: 100px;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
            .note {
              margin: 10px 0;
              font-size: 10px;
              font-style: italic;
            }
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          ${storeInfo}
          ${contentWithoutHeader}
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
          <h3 className="text-xl font-bold">Cetak Struk</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Struk */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-4 max-h-96 overflow-y-auto">
          <div ref={printRef} className="bg-white p-4" style={{ fontFamily: 'Courier New, monospace', fontSize: '12px' }}>
            {/* Header */}
            <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-400">
              <div className="font-bold text-base mb-1">{store?.name || 'Toko Saya'}</div>
              {store?.address && (
                <div className="text-xs">{store.address}</div>
              )}
              {store?.phone && (
                <div className="text-xs">Telp: {store.phone}</div>
              )}
              {store?.email && (
                <div className="text-xs">Email: {store.email}</div>
              )}
              {store?.website && (
                <div className="text-xs">{store.website}</div>
              )}
            </div>

            {/* Invoice Info */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span>Invoice:</span>
                <span className="font-semibold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Tanggal:</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Kasir:</span>
                <span>{user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customer?.name || 'N/A'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-3 pt-3 border-t border-dashed border-gray-400">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="flex-1 mr-2">{item.productName}</span>
                    <span className="text-right">{item.qty} {item.unitName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{formatRupiah(item.price)} x {item.qty}</span>
                    <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mb-3 pt-3 border-t border-dashed border-gray-400">
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-400 mt-2">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>
              {transaction.type === 'LUNAS' && (
                <>
                  <div className="flex justify-between mt-2">
                    <span>Tunai:</span>
                    <span>{formatRupiah(transaction.paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.change)}</span>
                  </div>
                  {/* Tampilkan info jika kembalian digunakan untuk bayar utang */}
                  {transaction.note && transaction.note.includes('[Kembalian digunakan untuk bayar utang') && (
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-xs">
                      <div className="text-gray-600 italic">
                        {transaction.note.split('\n').find(line => line.includes('[Kembalian digunakan'))?.replace(/\[|\]/g, '')}
                      </div>
                    </div>
                  )}
                </>
              )}
              {transaction.type === 'BON' && (
                <>
                  <div className="flex justify-between mt-2 text-red-600">
                    <span>Status:</span>
                    <span className="font-bold">BON</span>
                  </div>
                  {/* Jika ada pembayaran sebagian (paid > 0), tampilkan info */}
                  {transaction.paid > 0 && (
                    <>
                      <div className="flex justify-between mt-2">
                        <span>Dibayar Tunai:</span>
                        <span>{formatRupiah(transaction.paid)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Masuk Utang:</span>
                        <span className="font-semibold">{formatRupiah(transaction.total - transaction.paid)}</span>
                      </div>
                    </>
                  )}
                  {/* Tampilkan info pembayaran sebagian dari note jika ada */}
                  {transaction.note && transaction.note.includes('[Pembayaran Sebagian') && (
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-xs">
                      <div className="text-gray-600 italic">
                        {transaction.note.split('\n').find(line => line.includes('[Pembayaran Sebagian'))?.replace(/\[|\]/g, '')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Note */}
            {transaction.note && (
              <div className="mb-3 text-xs italic">
                <div className="font-semibold">Catatan:</div>
                <div>{transaction.note}</div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400 text-xs">
              <div>Terima kasih atas kunjungan Anda</div>
              <div className="mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default ModalPrintStruk;

