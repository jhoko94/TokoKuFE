import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function ModalTambahBarangSimple({ productToEdit, onClose, onSave }) {
  const { distributors, saveProduct } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    unitName: 'Pcs',
    price: '',
    distributorId: '',
    hasBarcode: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi form jika mode edit
  useEffect(() => {
    if (productToEdit && productToEdit.id) {
      // Mode EDIT: Ambil satuan kecil (conversion = 1)
      const satuan = productToEdit.units?.find(u => u.conversion === 1) || { name: 'Pcs', price: 0 };
      // Ambil distributor default
      const defaultDistributor = productToEdit.distributors?.find(d => d.isDefault) || productToEdit.distributors?.[0];
      
      // Baca hasBarcode langsung dari unit (disimpan di database)
      setFormData({
        name: productToEdit.name || '',
        unitName: satuan.name || 'Pcs',
        price: satuan.price?.toString() || '0',
        distributorId: defaultDistributor?.distributorId || defaultDistributor?.distributor?.id || '',
        hasBarcode: satuan.hasBarcode || false,
      });
    } else {
      // Mode TAMBAH: Reset form
      setFormData({
        name: '',
        unitName: 'Pcs',
        price: '',
        distributorId: '',
        hasBarcode: false,
      });
      setErrors({});
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Untuk checkbox
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // Untuk field price, hanya terima angka
    if (name === 'price') {
      // Hapus karakter non-numeric kecuali titik untuk desimal
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Nama barang harus diisi';
    }
    
    if (!formData.unitName || !formData.unitName.trim()) {
      newErrors.unitName = 'Satuan harus diisi';
    }
    
    if (!formData.price || formData.price.trim() === '') {
      newErrors.price = 'Harga harus diisi';
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        newErrors.price = 'Harga harus lebih dari 0';
      }
    }
    
    if (!formData.distributorId) {
      newErrors.distributorId = 'Distributor harus dipilih';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data sesuai yang diharapkan backend
      // Ubah nama barang dan satuan menjadi huruf besar semua
      let productData;
      
      if (productToEdit && productToEdit.id) {
        // Mode EDIT: gunakan ID dan SKU yang sudah ada
        // Pertahankan satuan besar (conversion > 1) jika ada
        const satuanBesar = (productToEdit.units || []).filter(u => u.conversion > 1);
        
        // Pertahankan semua distributor yang ada, update yang default
        const existingDistributors = (productToEdit.distributors || []).map(d => ({
          distributorId: d.distributorId || d.distributor?.id,
          isDefault: d.isDefault || false
        }));
        
        // Update distributor default atau tambahkan jika belum ada
        const updatedDistributors = existingDistributors.length > 0
          ? existingDistributors.map(d => ({
              distributorId: d.distributorId,
              isDefault: d.distributorId === formData.distributorId
            }))
          : [{
              distributorId: formData.distributorId,
              isDefault: true
            }];
        
        // Pastikan distributor yang dipilih ada di list
        const selectedDistributorExists = updatedDistributors.some(d => d.distributorId === formData.distributorId);
        if (!selectedDistributorExists) {
          updatedDistributors[0] = {
            distributorId: formData.distributorId,
            isDefault: true
          };
        }
        
        productData = {
          id: productToEdit.id,
          sku: productToEdit.sku,
          name: formData.name.trim().toUpperCase(),
          distributors: updatedDistributors,
          minStock: productToEdit.minStock || 0,
          units: [
            // Satuan dasar (diupdate)
            {
              name: formData.unitName.trim().toUpperCase(),
              price: parseFloat(formData.price) || 0,
              conversion: 1,
              hasBarcode: formData.hasBarcode || false
            },
            // Satuan besar (dipertahankan jika ada)
            ...satuanBesar.map(u => ({
              name: u.name,
              price: parseFloat(u.price),
              conversion: parseInt(u.conversion),
              hasBarcode: u.hasBarcode || false
            }))
          ]
        };
      } else {
        // Mode TAMBAH: generate SKU baru
        const skuPrefix = formData.name.trim().substring(0, 3).toUpperCase().padEnd(3, 'X');
        const timestamp = Date.now().toString().slice(-6);
        const sku = `${skuPrefix}${timestamp}`;
        
        productData = {
          sku: sku,
          name: formData.name.trim().toUpperCase(),
          distributors: [
            {
              distributorId: formData.distributorId,
              isDefault: true
            }
          ],
          minStock: 0,
          units: [
            {
              name: formData.unitName.trim().toUpperCase(),
              price: parseFloat(formData.price) || 0,
              conversion: 1,
              hasBarcode: formData.hasBarcode || false
            }
          ]
        };
      }
      
      await saveProduct(productData);
      onSave(); // Panggil callback untuk reload data
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      // Error sudah ditangani di saveProduct (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">{productToEdit && productToEdit.id ? 'Edit Barang' : 'Tambah Barang Baru'}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Nama Barang */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama barang"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Satuan */}
          <div className="mb-4">
            <label htmlFor="unitName" className="block text-sm font-medium text-gray-700 mb-2">
              Satuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="unitName"
              name="unitName"
              value={formData.unitName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.unitName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Contoh: Pcs, Kg, Liter, dll"
            />
            {errors.unitName && (
              <p className="mt-1 text-sm text-red-500">{errors.unitName}</p>
            )}
          </div>

          {/* Harga */}
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Harga <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">Rp</span>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          {/* Distributor */}
          <div className="mb-4">
            <label htmlFor="distributorId" className="block text-sm font-medium text-gray-700 mb-2">
              Distributor <span className="text-red-500">*</span>
            </label>
            <select
              id="distributorId"
              name="distributorId"
              value={formData.distributorId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.distributorId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Distributor</option>
              {distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
            {errors.distributorId && (
              <p className="mt-1 text-sm text-red-500">{errors.distributorId}</p>
            )}
          </div>

          {/* Punya Barcode */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasBarcode"
                checked={formData.hasBarcode}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Punya Barcode</span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Centang jika produk ini memiliki barcode. Barcode dapat ditambahkan nanti saat menerima pesanan barang.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

