import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { UserCircleIcon, PencilIcon, KeyIcon, ShieldCheckIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import { getUserRole } from '../utils/normalize';

function PageProfile() {
  const { user, showToast, updateProfile, changePassword, getStore, updateStore } = useStore();
  
  // Cek apakah user adalah ADMIN atau MANAGER (untuk edit toko)
  const userRole = getUserRole(user);
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [store, setStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  
  // Form state untuk edit profile
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  
  // Form state untuk edit store
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    npwp: '',
    owner: '',
    description: '',
    logo: '',
  });
  
  // Form state untuk change password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [storeErrors, setStoreErrors] = useState({});

  // Load store data
  useEffect(() => {
    const loadStore = async () => {
      try {
        setIsLoadingStore(true);
        const storeData = await getStore();
        setStore(storeData);
        setStoreData({
          name: storeData.name || '',
          address: storeData.address || '',
          phone: storeData.phone || '',
          email: storeData.email || '',
          website: storeData.website || '',
          npwp: storeData.npwp || '',
          owner: storeData.owner || '',
          description: storeData.description || '',
          logo: storeData.logo || '',
        });
      } catch (error) {
        console.error("Gagal memuat data toko:", error);
      } finally {
        setIsLoadingStore(false);
      }
    };
    loadStore();
  }, [getStore]);

  // Handler untuk edit profile
  const handleEditProfile = () => {
    setIsEditing(true);
    setFormData({
      name: user?.name || '',
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
    });
    setErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error untuk field ini
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveProfile = async () => {
    // Validasi
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nama harus diisi';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await updateProfile({ name: formData.name });
      setIsEditing(false);
    } catch (error) {
      // Error sudah ditangani di updateProfile
    }
  };

  // Handler untuk change password
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  const handleCancelChangePassword = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error untuk field ini
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSavePassword = async () => {
    // Validasi
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Password saat ini harus diisi';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password baru minimal 6 karakter';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Password konfirmasi tidak cocok';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Konfirmasi sebelum change password
    setModalData({
      title: 'Konfirmasi Ubah Password',
      message: 'Apakah Anda yakin ingin mengubah password?',
      onConfirm: async () => {
        try {
          await changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          });
          setIsChangingPassword(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setModalData(null);
        } catch (error) {
          // Error sudah ditangani di changePassword
          setModalData(null);
        }
      },
      onCancel: () => setModalData(null)
    });
  };

  // Handler untuk edit store
  const handleEditStore = () => {
    setIsEditingStore(true);
    setStoreErrors({});
  };

  const handleCancelEditStore = () => {
    setIsEditingStore(false);
    // Reset ke data asli
    if (store) {
      setStoreData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        website: store.website || '',
        npwp: store.npwp || '',
        owner: store.owner || '',
        description: store.description || '',
        logo: store.logo || '',
      });
    }
    setStoreErrors({});
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error untuk field ini
    if (storeErrors[name]) {
      setStoreErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveStore = async () => {
    // Validasi
    const newErrors = {};
    if (!storeData.name.trim()) {
      newErrors.name = 'Nama toko harus diisi';
    }
    if (storeData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeData.email)) {
      newErrors.email = 'Email tidak valid';
    }
    if (storeData.website && storeData.website.trim() && !/^https?:\/\/.+/.test(storeData.website)) {
      newErrors.website = 'Website harus dimulai dengan http:// atau https://';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setStoreErrors(newErrors);
      return;
    }

    try {
      const response = await updateStore(storeData);
      setStore(response.store);
      setIsEditingStore(false);
    } catch (error) {
      // Error sudah ditangani di updateStore
    }
  };

  if (!user) {
    return (
      <div className="page-content p-4 md:p-8">
        <p className="text-gray-500">Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-content p-2 sm:p-4 md:p-8 pb-16 sm:pb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Profile Pengguna</h2>

        {/* Card Profile */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{user.name || 'N/A'}</h3>
                <p className="text-sm sm:text-base text-gray-600">{user.username || 'N/A'}</p>
                <span className={`inline-block mt-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  userRole === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : userRole === 'MANAGER'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userRole || 'USER'}
                </span>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={handleEditProfile}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
          </div>

          {/* Informasi Profile */}
          {!isEditing ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Nama</label>
                  <p className="text-sm sm:text-base text-gray-900">{user.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-sm sm:text-base text-gray-900">{user.username || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Role</label>
                  <p className="text-sm sm:text-base text-gray-900">{userRole || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={user.username || ''}
                    disabled
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Simpan
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Change Password */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Ubah Password</h3>
            </div>
            {!isChangingPassword && (
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base"
              >
                <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Ubah Password</span>
                <span className="sm:hidden">Ubah</span>
              </button>
            )}
          </div>

          {!isChangingPassword ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheckIcon className="w-5 h-5 text-green-600" />
              <span>Password Anda aman. Klik tombol di atas untuk mengubah password.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimal 6 karakter"
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={handleSavePassword}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Simpan Password
                </button>
                <button
                  onClick={handleCancelChangePassword}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Store Profile */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <BuildingStorefrontIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Profile Toko</h3>
                <p className="text-xs sm:text-sm text-gray-500">Informasi toko Anda</p>
              </div>
            </div>
            {/* Tombol Edit Toko - Hanya untuk ADMIN dan MANAGER */}
            {!isEditingStore && isAdminOrManager && (
              <button
                onClick={handleEditStore}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Edit Toko</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
          </div>

          {isLoadingStore ? (
            <div className="text-center py-8">
              <div className="loader mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Memuat data toko...</p>
            </div>
          ) : !isEditingStore ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Nama Toko</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Pemilik</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.owner || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Alamat</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.address || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Telepon</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Website</label>
                  <p className="text-sm sm:text-base text-gray-900">
                    {store?.website ? (
                      <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {store.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">NPWP</label>
                  <p className="text-sm sm:text-base text-gray-900">{store?.npwp || '-'}</p>
                </div>
                {store?.description && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Deskripsi</label>
                    <p className="text-sm sm:text-base text-gray-900 whitespace-pre-line">{store.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko *</label>
                  <input
                    type="text"
                    name="name"
                    value={storeData.name}
                    onChange={handleStoreChange}
                    className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                      storeErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {storeErrors.name && <p className="text-red-500 text-xs mt-1">{storeErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pemilik</label>
                  <input
                    type="text"
                    name="owner"
                    value={storeData.owner}
                    onChange={handleStoreChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    name="address"
                    value={storeData.address}
                    onChange={handleStoreChange}
                    rows={3}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={storeData.phone}
                    onChange={handleStoreChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={storeData.email}
                    onChange={handleStoreChange}
                    className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                      storeErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {storeErrors.email && <p className="text-red-500 text-xs mt-1">{storeErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={storeData.website}
                    onChange={handleStoreChange}
                    placeholder="https://..."
                    className={`w-full p-2 sm:p-3 border rounded-lg text-base ${
                      storeErrors.website ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {storeErrors.website && <p className="text-red-500 text-xs mt-1">{storeErrors.website}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                  <input
                    type="text"
                    name="npwp"
                    value={storeData.npwp}
                    onChange={handleStoreChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    name="description"
                    value={storeData.description}
                    onChange={handleStoreChange}
                    rows={4}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                    placeholder="Deskripsi tentang toko Anda..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    name="logo"
                    value={storeData.logo}
                    onChange={handleStoreChange}
                    placeholder="https://..."
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL gambar logo toko (opsional)</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={handleSaveStore}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Simpan
                </button>
                <button
                  onClick={handleCancelEditStore}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {modalData && (
        <ModalKonfirmasi
          title={modalData.title}
          message={modalData.message}
          onConfirm={modalData.onConfirm}
          onCancel={modalData.onCancel}
        />
      )}
    </>
  );
}

export default PageProfile;

