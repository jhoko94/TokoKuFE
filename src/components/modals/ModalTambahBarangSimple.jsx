import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ModalTambahBarangSimple({ productToEdit, onClose, onSave }) {
  const { distributors, saveProduct, getProductByName, fetchProductsPaginated } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    unitName: 'Pcs',
    price: '',
    distributorId: '',
    hasBarcode: false,
  });
  
  // State untuk multiple units (saat edit)
  const [units, setUnits] = useState([]);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk autocomplete
  const [productNameSuggestions, setProductNameSuggestions] = useState([]);
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null); // Product yang sudah ada (jika ditemukan)
  const [hasProductWithDifferentDistributor, setHasProductWithDifferentDistributor] = useState(false); // Flag untuk produk dengan nama sama tapi distributor berbeda
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Inisialisasi form jika mode edit
  useEffect(() => {
    if (productToEdit && productToEdit.id) {
      // Mode EDIT: Ambil semua satuan dan urutkan (conversion = 1 dulu)
      const allUnits = productToEdit.units || [];
      const sortedUnits = [...allUnits].sort((a, b) => {
        if (a.conversion === 1 && b.conversion !== 1) return -1;
        if (a.conversion !== 1 && b.conversion === 1) return 1;
        return a.conversion - b.conversion;
      });
      
      // Set semua units
      setUnits(sortedUnits);
      
      // Ambil satuan kecil (conversion = 1) untuk form data default
      const satuan = sortedUnits.find(u => u.conversion === 1) || sortedUnits[0] || { name: 'Pcs', price: 0 };
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
      // Clear selected product dan suggestions saat mode edit
      setSelectedExistingProduct(null);
      setProductNameSuggestions([]);
    } else {
      // Mode TAMBAH: Reset form
      setFormData({
        name: '',
        unitName: 'Pcs',
        price: '',
        distributorId: '',
        hasBarcode: false,
      });
      setUnits([]);
      setErrors({});
      setSelectedExistingProduct(null);
      setHasProductWithDifferentDistributor(false);
      setProductNameSuggestions([]);
    }
  }, [productToEdit]);
  
  // Handler untuk mengubah unit
  const handleUnitChange = (index, field, value) => {
    setUnits(prev => {
      const newUnits = [...prev];
      if (field === 'price') {
        newUnits[index] = { ...newUnits[index], [field]: parseFloat(value) || 0 };
      } else if (field === 'conversion') {
        newUnits[index] = { ...newUnits[index], [field]: parseInt(value) || 1 };
      } else {
        newUnits[index] = { ...newUnits[index], [field]: value };
      }
      return newUnits;
    });
  };
  
  // Handler untuk menambah unit baru
  const handleAddUnit = () => {
    setUnits(prev => {
      // Cari conversion terbesar
      const maxConversion = prev.length > 0 
        ? Math.max(...prev.map(u => u.conversion || 1))
        : 1;
      
      return [
        ...prev,
        {
          name: '',
          price: 0,
          conversion: maxConversion + 1,
          hasBarcode: false
        }
      ];
    });
  };
  
  // Handler untuk menghapus unit
  const handleRemoveUnit = (index) => {
    // Jangan hapus satuan dengan conversion = 1 (satuan dasar)
    const unit = units[index];
    if (unit && unit.conversion === 1) {
      setErrors({ unitName: 'Satuan dasar tidak bisa dihapus' });
      return;
    }
    
    setUnits(prev => prev.filter((_, i) => i !== index));
  };

  // Handler untuk search autocomplete nama barang
  const handleNameChange = async (value) => {
    setFormData(prev => ({ ...prev, name: value }));
    
    // Clear error
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
    
    // Clear selected product dan flag jika nama berubah
    if (selectedExistingProduct && selectedExistingProduct.name.toUpperCase() !== value.toUpperCase().trim()) {
      setSelectedExistingProduct(null);
      setHasProductWithDifferentDistributor(false);
    }
    
    // Debounce search
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Hanya search jika tidak dalam mode edit dan panjang >= 2
    if (productToEdit && productToEdit.id) {
      return; // Jangan search saat edit
    }
    
    if (value.trim().length < 2) {
      setProductNameSuggestions([]);
      setSelectedExistingProduct(null);
      setHasProductWithDifferentDistributor(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setIsSearchingProduct(true);
        
        // Cek exact match berdasarkan nama + distributor (jika distributor sudah dipilih)
        // Hanya cek jika distributor sudah dipilih
        if (formData.distributorId) {
          try {
            const exactProduct = await getProductByName(value.trim(), formData.distributorId);
            if (exactProduct) {
              setSelectedExistingProduct(exactProduct);
              setHasProductWithDifferentDistributor(false);
              setProductNameSuggestions([]);
              setIsSearchingProduct(false);
              return;
            }
            
            // Tidak ada exact match, cek apakah ada produk dengan nama yang sama tapi distributor berbeda
            const productByNameOnly = await getProductByName(value.trim());
            if (productByNameOnly && productByNameOnly.distributors && productByNameOnly.distributors.length > 0) {
              const productDistributors = productByNameOnly.distributors || [];
              const hasDifferentDistributor = !productDistributors.some(d => 
                (d.distributorId || d.distributor?.id) === formData.distributorId
              );
              
              if (hasDifferentDistributor) {
                setHasProductWithDifferentDistributor(true);
                setSelectedExistingProduct(null);
              } else {
                setHasProductWithDifferentDistributor(false);
                setSelectedExistingProduct(productByNameOnly);
              }
            } else {
              setHasProductWithDifferentDistributor(false);
              setSelectedExistingProduct(null);
            }
          } catch (exactError) {
            console.error('Error searching exact product:', exactError);
            setHasProductWithDifferentDistributor(false);
            setSelectedExistingProduct(null);
          }
        } else {
          // Jika distributor belum dipilih, cari untuk autocomplete suggestions
          const response = await fetchProductsPaginated(1, 5, value.trim());
          const products = response.data || [];
          setProductNameSuggestions(products);
          setSelectedExistingProduct(null);
          setHasProductWithDifferentDistributor(false);
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setProductNameSuggestions([]);
      } finally {
        setIsSearchingProduct(false);
      }
    }, 500); // 500ms debounce
    
    setDebounceTimer(timer);
  };
  
  // Handler untuk cek produk saat distributor berubah
  const handleDistributorChange = async (distributorId) => {
    setFormData(prev => ({ ...prev, distributorId }));
    
    // Clear error
    if (errors.distributorId) {
      setErrors(prev => ({ ...prev, distributorId: '' }));
    }
    
    // Jangan cek produk saat mode edit
    if (productToEdit && productToEdit.id) {
      setSelectedExistingProduct(null);
      return;
    }
    
    // Jika nama sudah diisi dan distributor dipilih, cek apakah produk dengan nama + distributor sudah ada
    if (formData.name && formData.name.trim().length >= 2 && distributorId) {
      try {
        // Cek exact match: nama + distributor yang sama
        const exactProduct = await getProductByName(formData.name.trim(), distributorId);
        if (exactProduct) {
          // Produk dengan nama + distributor yang sama ditemukan
          setSelectedExistingProduct(exactProduct);
          setHasProductWithDifferentDistributor(false);
        } else {
          // Tidak ada exact match, cek apakah ada produk dengan nama yang sama (tanpa filter distributor)
          const productByNameOnly = await getProductByName(formData.name.trim());
          if (productByNameOnly && productByNameOnly.distributors && productByNameOnly.distributors.length > 0) {
            // Ada produk dengan nama yang sama, cek apakah distributor berbeda
            const productDistributors = productByNameOnly.distributors || [];
            const hasDifferentDistributor = !productDistributors.some(d => 
              (d.distributorId || d.distributor?.id) === distributorId
            );
            
            if (hasDifferentDistributor) {
              // Distributor berbeda, akan buat SKU baru
              setSelectedExistingProduct(null);
              setHasProductWithDifferentDistributor(true);
            } else {
              // Distributor sama (seharusnya tidak masuk sini karena exact match sudah dicek)
              setSelectedExistingProduct(productByNameOnly);
              setHasProductWithDifferentDistributor(false);
            }
          } else {
            // Tidak ada produk dengan nama yang sama (productByNameOnly adalah null atau tidak punya distributor)
            // Akan buat produk baru
            setSelectedExistingProduct(null);
            setHasProductWithDifferentDistributor(false);
          }
        }
      } catch (error) {
        console.error('Error checking product:', error);
        // Jika error, anggap tidak ada produk (akan buat baru)
        setSelectedExistingProduct(null);
        setHasProductWithDifferentDistributor(false);
      }
    } else {
      // Jika distributor dihapus atau nama belum diisi, clear selected product
      setSelectedExistingProduct(null);
      setHasProductWithDifferentDistributor(false);
    }
  };
  
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
    
    // Untuk field name, gunakan handler khusus untuk autocomplete
    if (name === 'name') {
      handleNameChange(value);
      return;
    }
    
    // Untuk field distributor, gunakan handler khusus
    if (name === 'distributorId') {
      handleDistributorChange(value);
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
  
  // Handler untuk memilih product dari suggestions
  const handleSelectProduct = (product) => {
    setFormData(prev => ({ ...prev, name: product.name }));
    setSelectedExistingProduct(product);
    setProductNameSuggestions([]);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Nama barang harus diisi';
    }
    
    // Validasi units (jika mode edit dengan multiple units)
    if (productToEdit && productToEdit.id && units.length > 0) {
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        if (!unit.name || !unit.name.trim()) {
          newErrors.unitName = `Satuan ${i + 1} harus diisi`;
          break;
        }
        const priceValue = parseFloat(unit.price);
        if (isNaN(priceValue) || priceValue <= 0) {
          newErrors.unitName = `Harga satuan ${i + 1} harus lebih dari 0`;
          break;
        }
      }
    } else {
      // Validasi untuk mode tambah atau edit sederhana
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
        // Gunakan units dari state (jika ada) atau fallback ke formData
        const unitsToSave = units.length > 0 
          ? units.map(u => ({
              name: u.name.trim().toUpperCase(),
              price: parseFloat(u.price) || 0,
              conversion: parseInt(u.conversion) || 1,
              hasBarcode: u.hasBarcode || false
            }))
          : [
              // Fallback: gunakan formData
              {
                name: formData.unitName.trim().toUpperCase(),
                price: parseFloat(formData.price) || 0,
                conversion: 1,
                hasBarcode: formData.hasBarcode || false
              }
            ];
        
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
          units: unitsToSave
        };
      } else if (selectedExistingProduct) {
        // Mode TAMBAH UNIT: Nama + Distributor sudah ada, tambahkan unit baru ke product yang sudah ada
        // Pastikan distributor yang dipilih sama dengan distributor produk yang ditemukan
        const existingDistributors = selectedExistingProduct.distributors || [];
        const distributorExists = existingDistributors.some(d => 
          (d.distributorId || d.distributor?.id) === formData.distributorId
        );
        
        // Jika distributor berbeda, buat SKU baru (tidak boleh masuk ke sini, tapi untuk safety)
        if (!distributorExists) {
          // Seharusnya tidak sampai sini karena sudah dicek di handleDistributorChange
          // Tapi untuk safety, buat SKU baru
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
        } else {
          // Distributor sama, tambahkan unit baru
          const existingUnits = selectedExistingProduct.units || [];
          
          // Cek apakah unit dengan nama yang sama sudah ada
          const unitExists = existingUnits.some(u => 
            u.name.toUpperCase() === formData.unitName.toUpperCase().trim()
          );
          
          if (unitExists) {
            setErrors({ unitName: 'Satuan ini sudah ada untuk produk ini' });
            setIsSubmitting(false);
            return;
          }
          
          // Pertahankan semua unit yang sudah ada
          const allUnits = [
            ...existingUnits.map(u => ({
              name: u.name,
              price: parseFloat(u.price),
              conversion: parseInt(u.conversion),
              hasBarcode: u.hasBarcode || false
            })),
            // Tambahkan unit baru
            {
              name: formData.unitName.trim().toUpperCase(),
              price: parseFloat(formData.price) || 0,
              conversion: 1, // Default untuk satuan baru di modal ini
              hasBarcode: formData.hasBarcode || false
            }
          ];
          
          // Pertahankan semua distributor yang sudah ada
          const updatedDistributors = existingDistributors.map(d => ({
            distributorId: d.distributorId || d.distributor?.id,
            isDefault: d.isDefault || false
          }));
          
          productData = {
            id: selectedExistingProduct.id,
            sku: selectedExistingProduct.sku, // Gunakan SKU yang sama
            name: selectedExistingProduct.name, // Gunakan nama yang sama
            distributors: updatedDistributors,
            minStock: selectedExistingProduct.minStock || 0,
            units: allUnits
          };
        }
      } else {
        // Mode TAMBAH BARU: generate SKU baru
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
          {/* Nama Barang - dengan Autocomplete */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={productToEdit && productToEdit.id ? "Masukkan nama barang" : "Cari atau ketik nama barang..."}
              />
              {isSearchingProduct && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {/* Dropdown suggestions */}
              {productNameSuggestions.length > 0 && !selectedExistingProduct && !(productToEdit && productToEdit.id) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {productNameSuggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Indicator jika product sudah ditemukan */}
              {selectedExistingProduct && !(productToEdit && productToEdit.id) && (
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Produk ditemukan (SKU: {selectedExistingProduct.sku}) - Unit baru akan ditambahkan</span>
                </div>
              )}
              
              {/* Indicator jika nama sudah ada tapi distributor berbeda - hanya untuk mode tambah */}
              {hasProductWithDifferentDistributor && !(productToEdit && productToEdit.id) && (
                <div className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Nama sudah ada dengan distributor berbeda - SKU baru akan dibuat</span>
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Satuan dan Harga */}
          {productToEdit && productToEdit.id && units.length > 0 ? (
            // Mode EDIT: Tampilkan semua satuan
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan & Harga <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {units.map((unit, index) => (
                  <div key={unit.id || index} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          Nama Satuan
                          {unit.conversion === 1 && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={unit.name || ''}
                          onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                          className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            unit.conversion === 1 ? 'font-semibold bg-white' : 'bg-white'
                          }`}
                          placeholder="Contoh: Pcs, Liter, dll"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600 mb-1">Konversi</label>
                        <input
                          type="number"
                          value={unit.conversion || 1}
                          onChange={(e) => handleUnitChange(index, 'conversion', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-200"
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Harga</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs text-gray-500">Rp</span>
                          <input
                            type="text"
                            value={unit.price?.toString() || '0'}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                              handleUnitChange(index, 'price', numericValue);
                            }}
                            className="w-full pl-8 pr-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {unit.conversion !== 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(index)}
                          className="mt-6 p-1 text-red-600 hover:text-red-800"
                          title="Hapus satuan"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.hasBarcode || false}
                          onChange={(e) => handleUnitChange(index, 'hasBarcode', e.target.checked)}
                          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Punya Barcode</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.unitName && (
                <p className="mt-1 text-sm text-red-500">{errors.unitName}</p>
              )}
            </div>
          ) : (
            // Mode TAMBAH: Tampilkan form sederhana
            <>
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
            </>
          )}

          {/* Distributor - hanya untuk mode tambah */}
          {(!productToEdit || !productToEdit.id) && (
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
          )}


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

