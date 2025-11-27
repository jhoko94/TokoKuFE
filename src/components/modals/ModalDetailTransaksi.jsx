import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../../utils/formatters';

function ModalDetailTransaksi({ transaction, isOpen, onClose }) {
  if (!isOpen || !transaction) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Detail Transaksi</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Info Transaksi */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Informasi Transaksi</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Invoice:</span>
                <span className="ml-2 font-medium">{transaction.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Tanggal:</span>
                <span className="ml-2 font-medium">
                  {new Date(transaction.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Pelanggan:</span>
                <span className="ml-2 font-medium">{transaction.customer?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Tipe:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  transaction.type === 'LUNAS' 
                    ? 'bg-green-100 text-green-800' 
                    : transaction.type === 'BON'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {transaction.type}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold mb-3">Item yang Dibeli</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Satuan</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Diskon</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{item.productName}</td>
                        <td className="px-4 py-2 text-sm">{item.unitName}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.qty}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatRupiah(Number(item.price))}</td>
                        <td className="px-4 py-2 text-sm text-right text-red-600">
                          {formatRupiah(Number(item.discount || 0))}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {formatRupiah(Number(item.subtotal))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-2 text-center text-gray-500 text-sm">
                        Tidak ada item
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-right font-semibold">Subtotal:</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatRupiah(Number(transaction.subtotal))}
                    </td>
                  </tr>
                  {transaction.discount > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 text-right text-red-600">Diskon:</td>
                      <td className="px-4 py-2 text-right text-red-600 font-semibold">
                        -{formatRupiah(Number(transaction.discount))}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-right font-bold text-lg">Total:</td>
                    <td className="px-4 py-2 text-right font-bold text-lg">
                      {formatRupiah(Number(transaction.total))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pembayaran */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Informasi Pembayaran</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Bayar:</span>
                <span className="ml-2 font-medium">{formatRupiah(Number(transaction.paid || 0))}</span>
              </div>
              {transaction.change > 0 && (
                <div>
                  <span className="text-gray-600">Kembalian:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatRupiah(Number(transaction.change))}
                  </span>
                </div>
              )}
              {transaction.type === 'BON' && (
                <div className="col-span-2">
                  <span className="text-gray-600">Sisa Hutang:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {formatRupiah(Number(transaction.total) - Number(transaction.paid || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Catatan */}
          {transaction.note && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold mb-2">Catatan:</h4>
              <p className="text-sm text-gray-700">{transaction.note}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}

export default ModalDetailTransaksi;

