import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ModalRole from '../components/modals/ModalRole';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';

function PageRoleManagement() {
  const { showToast } = useStore();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal memuat data role');
      }
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      console.error('Gagal memuat roles:', error);
      showToast('Gagal memuat data role', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (roleData) => {
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!roleData.id;
      const url = isEdit ? `${API_URL}/roles/${roleData.id}` : `${API_URL}/roles`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
          isActive: roleData.isActive
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan role');
      }

      showToast(data.message || (isEdit ? 'Role berhasil diupdate' : 'Role berhasil dibuat'), 'success');
      await loadRoles();
    } catch (error) {
      console.error('Gagal menyimpan role:', error);
      showToast(error.message || 'Gagal menyimpan role', 'error');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus role');
      }

      showToast(data.message || 'Role berhasil dihapus', 'success');
      setRoleToDelete(null);
      await loadRoles();
    } catch (error) {
      console.error('Gagal menghapus role:', error);
      showToast(error.message || 'Gagal menghapus role', 'error');
      setRoleToDelete(null);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold">Manajemen Role</h2>
        <button 
          onClick={() => setModalState('new')}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Role Baru</span>
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari kode atau nama role..." 
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Jumlah User
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Tidak ada role yang sesuai dengan pencarian' : 'Belum ada role'}
                  </td>
                </tr>
              ) : (
                filteredRoles.map(role => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {role.userCount || 0} user
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {role.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button 
                        onClick={() => setModalState(role)} 
                        className="text-yellow-500 hover:text-yellow-700"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setRoleToDelete(role)} 
                        className="text-red-500 hover:text-red-700"
                        title="Hapus"
                        disabled={role.userCount > 0}
                      >
                        <TrashIcon className={`w-5 h-5 ${role.userCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState && (
        <ModalRole
          roleToEdit={modalState === 'new' ? null : modalState}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}

      {roleToDelete && (
        <ModalKonfirmasi
          isOpen={!!roleToDelete}
          title="Hapus Role"
          message={`Apakah Anda yakin ingin menghapus role "${roleToDelete.name}"?${
            roleToDelete.userCount > 0 
              ? `\n\nTidak dapat menghapus role karena masih ada ${roleToDelete.userCount} user yang menggunakan role ini.`
              : '\n\nTindakan ini tidak dapat dibatalkan.'
          }`}
          onConfirm={handleDelete}
          onCancel={() => setRoleToDelete(null)}
          confirmText="Hapus"
          cancelText="Batal"
          confirmColor="red"
          disabled={roleToDelete.userCount > 0}
        />
      )}
    </div>
  );
}

export default PageRoleManagement;

