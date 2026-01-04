import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalMasterPelanggan({ customerToEdit, onClose }) {
  const { saveCustomer } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'TETAP', // Default ke TETAP karena UMUM hanya untuk "Pelanggan Umum" yang dibuat otomatis
    address: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDefaultCustomer = customerToEdit?.name === 'Pelanggan Umum';

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        type: typeof customerToEdit.type === 'object' ? customerToEdit.type.code : (customerToEdit.type || 'UMUM'),
        address: customerToEdit.address || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'TETAP', // Default ke TETAP karena UMUM hanya untuk "Pelanggan Umum" yang dibuat otomatis
        address: '',
        phone: '',
        email: '',
      });
    }
    setErrors({});
  }, [customerToEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nama pelanggan harus diisi';
    } else if (!customerToEdit && formData.name.trim() === 'Pelanggan Umum') {
      // Mencegah create customer baru dengan nama "Pelanggan Umum"
      newErrors.name = 'Nama "Pelanggan Umum" tidak bisa digunakan karena sudah menjadi default customer';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        ...(customerToEdit && { id: customerToEdit.id }),
      };
      await saveCustomer(dataToSave);
      onClose();
    } catch (error) {
      // Error sudah ditangani di saveCustomer
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {customerToEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isDefaultCustomer && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Catatan:</strong> "Pelanggan Umum" adalah default customer dan tidak bisa diubah nama atau tipenya. Hanya alamat, telepon, dan email yang bisa diubah.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pelanggan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isDefaultCustomer}
              className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'} ${isDefaultCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Masukkan nama pelanggan"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Pelanggan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={isDefaultCustomer}
              className={`w-full p-2 border border-gray-300 rounded-lg ${isDefaultCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              {/* UMUM tidak ditampilkan karena hanya untuk "Pelanggan Umum" yang dibuat otomatis */}
              <option value="TETAP">TETAP</option>
              <option value="GROSIR">GROSIR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Masukkan alamat pelanggan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Telepon
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Masukkan email pelanggan"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : customerToEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalMasterPelanggan;
