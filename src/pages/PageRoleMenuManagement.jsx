import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PageRoleMenuManagement() {
  const { showToast } = useStore();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRoleMenus(selectedRole.id);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRoles(data.roles || []);
      if (data.roles && data.roles.length > 0 && !selectedRole) {
        setSelectedRole(data.roles[0]);
      }
    } catch (error) {
      showToast('Gagal memuat roles', 'error');
    }
  };

  const loadRoleMenus = async (roleId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/menus/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMenus(data.menus || []);
    } catch (error) {
      showToast('Gagal memuat menu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenuAccess = async (menuId, currentAccess) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/menus/${menuId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roleId: selectedRole.id,
          canAccess: !currentAccess
        })
      });

      if (response.ok) {
        showToast('Permission berhasil diupdate', 'success');
        loadRoleMenus(selectedRole.id);
      } else {
        const data = await response.json();
        showToast(data.error || 'Gagal update permission', 'error');
      }
    } catch (error) {
      showToast('Gagal update permission', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedMenus = menus.reduce((acc, menu) => {
    const category = menu.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(menu);
    return acc;
  }, {});

  const categoryLabels = {
    'MASTER_DATA': 'Master Data',
    'TRANSAKSI': 'Transaksi',
    'STOK': 'Stok',
    'PIUTANG_HUTANG': 'Piutang & Hutang',
    'LAPORAN': 'Laporan',
    'BANTUAN': 'Bantuan',
    'AKUN': 'Akun',
    'OTHER': 'Lainnya'
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Akses Menu</h1>
        <p className="text-sm text-gray-600 mt-1">Atur menu yang bisa diakses setiap role</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Pilih Role</h2>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedRole?.id === role.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  <div className="text-xs opacity-75">{role.code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              Memuat menu...
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              {selectedRole && (
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">
                    Akses Menu untuk: <span className="text-purple-600">{selectedRole.name}</span>
                  </h2>
                </div>
              )}
              <div className="p-4 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {Object.entries(groupedMenus).map(([category, categoryMenus]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {categoryMenus.map(menu => (
                        <div
                          key={menu.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{menu.name}</div>
                              <div className="text-xs text-gray-500">{menu.path}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleMenuAccess(menu.id, menu.canAccess)}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              menu.canAccess
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={menu.canAccess ? 'Akses diizinkan' : 'Akses ditolak'}
                          >
                            {menu.canAccess ? (
                              <CheckIcon className="w-5 h-5" />
                            ) : (
                              <XMarkIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

