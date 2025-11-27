import { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'success', onClose, duration }) {
  // Durasi default berdasarkan type: error lebih lama agar user bisa membaca
  const defaultDuration = duration !== undefined 
    ? duration 
    : type === 'error' 
      ? 10000  // 10 detik untuk error (diperpanjang lagi)
      : type === 'success'
        ? 3000  // 3 detik untuk success
        : 4000; // 4 detik untuk info

  // Gunakan useRef untuk menyimpan timer agar tidak di-reset saat re-render
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear timer sebelumnya jika ada
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (defaultDuration > 0) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, defaultDuration);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message, type, defaultDuration, onClose]); // Tambahkan message dan type ke dependencies

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-purple-500';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      <span className="text-xl font-bold">{icon}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-lg"
      >
        ×
      </button>
    </div>
  );
}

