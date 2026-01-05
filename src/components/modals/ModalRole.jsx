import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ModalRole({ roleToEdit, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleToEdit) {
      setFormData({
        code: roleToEdit.code || '',
        name: roleToEdit.name || '',
        description: roleToEdit.description || '',
        isActive: roleToEdit.isActive !== undefined ? roleToEdit.isActive : true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [roleToEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = 'Kode role harus diisi';
    } else {
      const codeRegex = /^[A-Z0-9_]+$/;
      if (!codeRegex.test(formData.code.trim().toUpperCase())) {
        newErrors.code = 'Kode role harus huruf besar, angka, atau underscore';
      }
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nama role harus diisi';
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
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        ...(roleToEdit && { id: roleToEdit.id }),
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      // Error sudah ditangani di onSave
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, code: value });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {roleToEdit ? 'Edit Role' : 'Tambah Role Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={handleCodeChange}
              disabled={!!roleToEdit}
              className={`w-full p-2 border rounded-lg ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } ${roleToEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Contoh: ADMIN, MANAGER, KASIR"
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            {roleToEdit && (
              <p className="text-gray-500 text-xs mt-1">Kode role tidak dapat diubah</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Contoh: Administrator, Manager, Kasir"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Masukkan deskripsi role (opsional)"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Aktif</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : roleToEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ModalRole;

