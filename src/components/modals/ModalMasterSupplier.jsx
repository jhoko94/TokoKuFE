import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalMasterSupplier({ distributorToEdit, onClose }) {
  const { saveDistributor } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (distributorToEdit) {
      setFormData({
        name: distributorToEdit.name || '',
        address: distributorToEdit.address || '',
        phone: distributorToEdit.phone || '',
        email: distributorToEdit.email || '',
        contactPerson: distributorToEdit.contactPerson || '',
      });
    } else {
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        contactPerson: '',
      });
    }
    setErrors({});
  }, [distributorToEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nama supplier harus diisi';
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
        ...(distributorToEdit && { id: distributorToEdit.id }),
      };
      await saveDistributor(dataToSave);
      onClose();
    } catch (error) {
      // Error sudah ditangani di saveDistributor
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
            {distributorToEdit ? 'Edit Supplier' : 'Tambah Supplier Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Supplier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Masukkan nama supplier"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
              placeholder="Masukkan alamat supplier"
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
              placeholder="Masukkan email supplier"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Masukkan nama contact person"
            />
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
              {isSubmitting ? 'Menyimpan...' : distributorToEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalMasterSupplier;

