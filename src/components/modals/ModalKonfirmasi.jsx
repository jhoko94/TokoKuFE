export default function ModalKonfirmasi({ title, message, onConfirm, onCancel }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onCancel}></div>
      
      {/* Konten Modal */}
      <div id="modal-confirm" className="modal-content">
        <h3 id="confirm-title" className="text-xl font-bold mb-4">{title}</h3>
        {/* dangerouslySetInnerHTML dipakai agar tag <strong> di pesan kita bisa di-render */}
        <div 
          id="confirm-message" 
          className="text-gray-700 mb-6"
          dangerouslySetInnerHTML={{ __html: message }}
        >
        </div>
        <div className="flex gap-2">
          <button 
            id="confirm-btn-cancel" 
            onClick={onCancel} 
            className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
          >
            Batal
          </button>
          <button 
            id="confirm-btn-ok" 
            onClick={onConfirm}
            className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}