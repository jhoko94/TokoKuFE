import { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useStore } from '../../context/StoreContext';

function ModalKirimEmail({ isOpen, onClose, customer, onConfirm }) {
  const { getEmailQuota } = useStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [emailQuota, setEmailQuota] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Load email quota saat modal dibuka
  useEffect(() => {
    if (isOpen && customer?.isBulk) {
      const loadQuota = async () => {
        try {
          const quota = await getEmailQuota();
          setEmailQuota(quota);
        } catch (error) {
          console.error('Failed to load email quota:', error);
        }
      };
      loadQuota();
    }
  }, [isOpen, customer, getEmailQuota]);

  // Calculate estimated time based on number of emails
  useEffect(() => {
    if (customer?.isBulk && customer?.customers) {
      const emailsToSend = customer.customers.filter(c => c.email).length;
      // Each email takes ~500ms delay + processing time (~100ms) = ~600ms per email
      // Batch of 10 emails = ~6 seconds per batch
      const batches = Math.ceil(emailsToSend / 10);
      const estimatedSeconds = batches * 6 + (emailsToSend % 10) * 0.6;
      setEstimatedTime(Math.ceil(estimatedSeconds));
    } else {
      setEstimatedTime(0);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      alert('Subject email harus diisi');
      return;
    }
    if (!message.trim()) {
      alert('Pesan email harus diisi');
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    
    // Simulate progress (since we can't get real-time updates)
    const emailsToSend = customer.isBulk 
      ? customer.customers.filter(c => c.email).length 
      : 1;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Don't go to 100% until done
        return prev + (100 / emailsToSend / 10); // Increment gradually
      });
    }, 500);

    try {
      await onConfirm(subject.trim(), message.trim());
      setProgress(100);
      setSubject('');
      setMessage('');
      setTimeout(() => {
        onClose();
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error sending email:', error);
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Kirim Email</h3>
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
                  Mengirim email ke: <strong>{customer.name}</strong>
                </p>
                {customer.customers && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Detail Pelanggan:
                    </p>
                    {customer.customers.filter(c => c.email).length > 0 ? (
                      <>
                        <div className="text-xs text-blue-800 space-y-1 max-h-32 overflow-y-auto">
                          {customer.customers.filter(c => c.email).map(c => (
                            <div key={c.id} className="flex items-center justify-between">
                              <span>{c.name}</span>
                              <span className="text-green-600">
                                {c.email}
                              </span>
                            </div>
                          ))}
                        </div>
                        {customer.customers.filter(c => !c.email).length > 0 && (
                          <p className="text-xs text-blue-700 mt-2">
                            Total: {customer.customers.filter(c => c.email).length} dengan email,{' '}
                            {customer.customers.filter(c => !c.email).length} tanpa email (tidak ditampilkan)
                          </p>
                        )}
                        {emailQuota && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700 mb-1">
                              Kuota Email: {emailQuota.remaining} dari {emailQuota.limit} tersedia hari ini
                            </p>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(emailQuota.count / emailQuota.limit) * 100}%` }}
                              ></div>
                            </div>
                            {customer.customers.filter(c => c.email).length > emailQuota.remaining && (
                              <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Hanya {emailQuota.remaining} email yang akan dikirim (kuota terbatas)
                              </p>
                            )}
                            {estimatedTime > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                ⏱️ Estimasi waktu: ~{estimatedTime} detik
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-blue-700">
                        Tidak ada pelanggan dengan email
                      </p>
                    )}
                  </div>
                )}
                {customer.customers && customer.customers.filter(c => c.email).length === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Tidak ada pelanggan yang dipilih memiliki alamat email.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Mengirim email ke: <strong>{customer.name}</strong> ({customer.email || 'Email tidak tersedia'})
                </p>
                
                {!customer.email && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Pelanggan ini tidak memiliki alamat email. Silakan tambahkan email terlebih dahulu.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Notifikasi Tagihan, Promo Spesial, dll"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting || (customer.isBulk ? customer.customers?.filter(c => c.email).length === 0 : !customer.email)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan email Anda di sini..."
                  rows={10}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  required
                  disabled={isSubmitting || (customer.isBulk ? customer.customers?.filter(c => c.email).length === 0 : !customer.email)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Baris baru akan otomatis diubah menjadi line break
                </p>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isSubmitting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Mengirim email...
                </span>
                <span className="text-sm text-blue-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {estimatedTime > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  Mohon tunggu, proses ini mungkin memakan waktu beberapa saat...
                </p>
              )}
            </div>
          )}

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={
                isSubmitting || 
                !subject.trim() || 
                !message.trim() ||
                (customer.isBulk 
                  ? customer.customers?.filter(c => c.email).length === 0 
                  : !customer.email)
              }
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>Kirim Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalKirimEmail;

