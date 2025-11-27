import { useState } from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

function ModalKirimWhatsApp({ isOpen, onClose, customer, onConfirm }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert('Pesan WhatsApp harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(message.trim());
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">Kirim WhatsApp</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            {customer.isBulk ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Mengirim pesan WhatsApp ke: <strong>{customer.name}</strong>
                </p>
                {customer.customers && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Detail Pelanggan:
                    </p>
                    {customer.customers.filter(c => c.phone).length > 0 ? (
                      <>
                        <div className="text-xs text-green-800 space-y-1 max-h-32 overflow-y-auto">
                          {customer.customers.filter(c => c.phone).map(c => (
                            <div key={c.id} className="flex items-center justify-between">
                              <span>{c.name}</span>
                              <span className="text-green-600">
                                {c.phone}
                              </span>
                            </div>
                          ))}
                        </div>
                        {customer.customers.filter(c => !c.phone).length > 0 && (
                          <p className="text-xs text-green-700 mt-2">
                            Total: {customer.customers.filter(c => c.phone).length} dengan nomor telepon,{' '}
                            {customer.customers.filter(c => !c.phone).length} tanpa nomor telepon (tidak ditampilkan)
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-green-700">
                        Tidak ada pelanggan dengan nomor telepon
                      </p>
                    )}
                  </div>
                )}
                {customer.customers && customer.customers.filter(c => c.phone).length === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Tidak ada pelanggan yang dipilih memiliki nomor telepon.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Mengirim pesan WhatsApp ke: <strong>{customer.name}</strong> ({customer.phone || 'Nomor telepon tidak tersedia'})
                </p>
                
                {!customer.phone && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Pelanggan ini tidak memiliki nomor telepon. Silakan tambahkan nomor telepon terlebih dahulu.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan WhatsApp Anda di sini..."
                  rows={10}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
                  required
                  disabled={isSubmitting || (customer.isBulk ? customer.customers?.filter(c => c.phone).length === 0 : !customer.phone)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Baris baru akan otomatis diubah menjadi line break
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={
                isSubmitting || 
                !message.trim() ||
                (customer.isBulk 
                  ? customer.customers?.filter(c => c.phone).length === 0 
                  : !customer.phone)
              }
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Kirim WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalKirimWhatsApp;

