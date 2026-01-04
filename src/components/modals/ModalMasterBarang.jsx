import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { TrashIcon } from '@heroicons/react/24/outline';

// Data default untuk barang baru
const DEFAULT_FORM_DATA = {
  id: null,
  sku: '',
  name: '',
  distributors: [], // Array of { distributorId, isDefault }
  minStock: 10,
  units: [
    { name: 'Pcs', price: 0, conversion: 1, barcodes: [] } // Satuan dasar
  ]
};

export default function ModalMasterBarang({ productToEdit, onClose, onSave }) {
  const { distributors, saveProduct } = useStore(); // Ambil data & fungsi dari Context
  
  // 'formData' adalah state lokal yang menampung SEMUA data di form
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  
  // 'newBarcodes' adalah state terpisah untuk mengelola input "barcode baru"
  // Format: { [distributorId_unitId]: barcodeValue }
  // Contoh: { "dist1_unit1": "123456", "dist1_unit2": "789012" }
  const [newBarcodes, setNewBarcodes] = useState({});
  
  // State untuk modal tambah distributor
  const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  
  // State untuk error validation
  const [errors, setErrors] = useState({}); 

  // 1. Logika Inisialisasi Form
  useEffect(() => {
    if (productToEdit) {
      // Mode EDIT: Isi form dengan data produk
      // PENTING: Sort units untuk memastikan satuan kecil (conversion = 1) selalu di index 0
      const sortedUnits = [...(productToEdit.units || [])].sort((a, b) => {
        // Satuan dengan conversion = 1 harus di index 0
        if (a.conversion === 1 && b.conversion !== 1) return -1;
        if (a.conversion !== 1 && b.conversion === 1) return 1;
        // Jika keduanya bukan conversion = 1, urutkan berdasarkan conversion
        return a.conversion - b.conversion;
      });
      
      // Pastikan setiap unit punya barcodes (array), karena sekarang barcodes adalah relasi
      const unitsWithBarcodes = sortedUnits.map(unit => ({
        ...unit,
        barcodes: unit.barcodes ? 
          (Array.isArray(unit.barcodes) ? unit.barcodes : 
           (unit.barcodes.map ? unit.barcodes.map(b => b.barcode || b) : [])) : 
          []
      }));
      
      // Ambil distributors dari ProductDistributor (Many-to-Many)
      const productDistributors = productToEdit.distributors?.map(d => {
        // Normalisasi barcode dari backend: format { barcode, unitId, unit: { id, name } }
        const normalizedBarcodes = (d.barcodes || []).map(b => ({
          barcode: typeof b === 'string' ? b : (b?.barcode || b),
          unitId: typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null,
          unit: typeof b === 'object' ? b?.unit : null
        }));
        
        return {
          distributorId: d.distributorId || d.distributor?.id || d.id,
          isDefault: d.isDefault || false,
          distributor: d.distributor, // Keep distributor info untuk display
          barcodes: normalizedBarcodes // Barcode per distributor dengan format normal
        };
      }) || [];
      
      setFormData({
        ...productToEdit,
        distributors: productDistributors,
        units: unitsWithBarcodes
      });
      // Siapkan state untuk input barcode (satu string kosong untuk setiap unit)
      setNewBarcodes(new Array(unitsWithBarcodes.length).fill(''));
    } else {
      // Mode ADD: Reset form ke default
      setFormData(DEFAULT_FORM_DATA);
      setNewBarcodes(['']); // Hanya satu input barcode untuk unit 'Pcs' default
    }
  }, [productToEdit, onClose]); // Reset form setiap modal dibuka

  const title = productToEdit ? 'Edit Barang' : 'Tambah Barang Baru';
  const baseUnitName = formData.units[0]?.name || 'Satuan';

  // 2. Handler Perubahan Form
  
  // Untuk input level atas (SKU, Nama, dll)
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Untuk input di dalam list 'units'
  const handleUnitChange = (index, field, value) => {
     setFormData(prev => {
        const newUnits = [...prev.units];
        newUnits[index][field] = value;
        
        // Jika nama unit dasar (index 0) berubah, update baseUnitName
        if (index === 0 && field === 'name') {
           const newBaseName = value || 'Satuan';
           // Perbarui nama satuan dasar di unit lain (jika ada)
           // (logika ini ada di script.js lama, tapi lebih baik disederhanakan di React)
        }
        
        return { ...prev, units: newUnits };
     });
  };
  
  // Untuk input "barcode baru" per kombinasi (distributor + unit)
  const handleNewBarcodeChange = (distributorId, unitId, value) => {
    const key = `${distributorId}_${unitId}`;
    setNewBarcodes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 3. Handler Aksi Form Dinamis (Tambah/Hapus)
  
  const handleAddUnit = () => {
    setFormData(prev => ({
        ...prev,
        units: [
            ...prev.units,
            { name: '', price: 0, conversion: 2, barcodes: [] } // Data unit baru - default conversion 2 untuk satuan besar
        ]
    }));
    // Tambahkan juga slot untuk input barcode baru
    setNewBarcodes(prev => [...prev, '']);
  };
  
  const handleRemoveUnit = (index) => {
    setFormData(prev => ({
        ...prev,
        units: prev.units.filter((_, i) => i !== index) // Hapus unit
    }));
    // Hapus juga slot input barcode
    setNewBarcodes(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handler untuk tambah barcode per kombinasi (distributor + unit)
  const handleAddBarcode = (distributorId, unitId) => {
    const key = `${distributorId}_${unitId}`;
    const barcode = (newBarcodes[key] || '').trim();
    if (!barcode) return;
    
    // Cek apakah barcode sudah ada untuk kombinasi ini
    const distributor = formData.distributors.find(d => {
      const distId = d.distributorId || d.distributor?.id || d.id;
      return distId === distributorId;
    });
    
    if (distributor) {
      const existingBarcodes = distributor.barcodes || [];
      const barcodeExists = existingBarcodes.some(b => {
        const bValue = typeof b === 'string' ? b : (b?.barcode || b);
        const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
        return bValue === barcode && bUnitId === unitId;
      });
      
      if (barcodeExists) {
        alert('Barcode ini sudah ada untuk kombinasi distributor dan unit ini');
        return;
      }
      
      // Tambah barcode ke distributor
      setFormData(prev => ({
        ...prev,
        distributors: prev.distributors.map(d => {
          const distId = d.distributorId || d.distributor?.id || d.id;
          if (distId === distributorId) {
            return {
              ...d,
              barcodes: [...(d.barcodes || []), { barcode, unitId }]
            };
          }
          return d;
        })
      }));
      
      // Kosongkan input
      handleNewBarcodeChange(distributorId, unitId, '');
    }
  };
  
  // Handler untuk hapus barcode per kombinasi (distributor + unit)
  const handleRemoveBarcode = (distributorId, unitId, barcodeToRemove) => {
    setFormData(prev => ({
      ...prev,
      distributors: prev.distributors.map(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        if (distId === distributorId) {
          return {
            ...d,
            barcodes: (d.barcodes || []).filter(b => {
              const bValue = typeof b === 'string' ? b : (b?.barcode || b);
              const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
              return !(bValue === barcodeToRemove && bUnitId === unitId);
            })
          };
        }
        return d;
      })
    }));
  };

  // Handler untuk manage distributors
  const handleAddDistributor = () => {
    if (!selectedDistributorId) return;
    
    // Cek apakah distributor sudah ada
    const exists = formData.distributors.some(d => {
      const distId = d.distributorId || d.distributor?.id || d.id;
      return distId === selectedDistributorId;
    });
    if (exists) {
      setErrors({ ...errors, distributors: 'Distributor ini sudah ditambahkan' });
      return;
    }
    
    // Tambah distributor baru
    const isFirst = formData.distributors.length === 0;
    setFormData(prev => ({
      ...prev,
      distributors: [
        ...prev.distributors,
        {
          distributorId: selectedDistributorId,
          isDefault: isFirst // Supplier pertama otomatis jadi default
        }
      ]
    }));
    
    setSelectedDistributorId('');
    setIsAddDistributorModalOpen(false);
    setErrors({ ...errors, distributors: null });
  };

  const handleRemoveDistributor = (distributorIdToRemove) => {
    setFormData(prev => {
      const newDistributors = prev.distributors.filter(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        return distId !== distributorIdToRemove;
      });
      
      // Jika yang dihapus adalah default, set distributor pertama sebagai default
      const removedWasDefault = prev.distributors.find(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        return distId === distributorIdToRemove;
      })?.isDefault;
      if (removedWasDefault && newDistributors.length > 0) {
        newDistributors[0].isDefault = true;
      }
      
      return { ...prev, distributors: newDistributors };
    });
  };

  const handleSetDefaultDistributor = (distributorId) => {
    setFormData(prev => ({
      ...prev,
      distributors: prev.distributors.map(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        return {
          ...d,
          distributorId: distId, // Pastikan distributorId selalu ada
          isDefault: distId === distributorId
        };
      })
    }));
  };
  
  // 4. Handler Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validasi
    const newErrors = {};
    
    // Validasi SKU
    if (!formData.sku || !formData.sku.trim()) {
      newErrors.sku = 'Kode barang (SKU) harus diisi';
    }
    
    // Validasi Nama
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Nama barang harus diisi';
    }
    
    // Validasi Distributor (Minimal 1 distributor)
    if (!formData.distributors || formData.distributors.length === 0) {
      newErrors.distributors = 'Minimal harus ada 1 distributor';
    }
    
    // Validasi Min Stock
    if (formData.minStock === undefined || formData.minStock < 0) {
      newErrors.minStock = 'Stok minimum harus >= 0';
    }
    
    // Validasi Units
    if (!formData.units || formData.units.length === 0) {
      newErrors.units = 'Minimal harus ada 1 satuan';
    } else {
      // PENTING: Sort units untuk memastikan satuan kecil (conversion = 1) selalu di index 0
      const sortedUnits = [...formData.units].sort((a, b) => {
        if (a.conversion === 1 && b.conversion !== 1) return -1;
        if (a.conversion !== 1 && b.conversion === 1) return 1;
        return a.conversion - b.conversion;
      });
      
      sortedUnits.forEach((unit, index) => {
        if (!unit.name || !unit.name.trim()) {
          newErrors[`unit_${index}_name`] = 'Nama satuan harus diisi';
        }
        if (!unit.price || unit.price <= 0) {
          newErrors[`unit_${index}_price`] = 'Harga satuan harus > 0';
        }
        
        // Validasi khusus untuk satuan kecil (index 0)
        if (index === 0) {
          if (unit.conversion !== 1) {
            newErrors[`unit_${index}_conversion`] = 'Satuan kecil harus memiliki konversi = 1';
          }
        } else {
          // Validasi untuk satuan besar (index > 0)
          if (!unit.conversion || unit.conversion <= 1) {
            newErrors[`unit_${index}_conversion`] = 'Satuan besar harus memiliki konversi > 1';
          }
        }
      });
    }
    
    // Jika ada error, tampilkan dan stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // PENTING: Sort units sebelum dikirim ke backend
      // Pastikan satuan kecil (conversion = 1) selalu di index 0
      const sortedUnits = [...formData.units].sort((a, b) => {
        if (a.conversion === 1 && b.conversion !== 1) return -1;
        if (a.conversion !== 1 && b.conversion === 1) return 1;
        return a.conversion - b.conversion;
      });
      
      // Panggil fungsi dari Context untuk menyimpan dengan units yang sudah terurut
      // Normalisasi distributors untuk pastikan distributorId selalu ada, termasuk barcodes
      const normalizedDistributors = formData.distributors.map(d => {
        const distId = d.distributorId || d.distributor?.id || d.id;
        
        // Normalisasi barcode: pastikan format { barcode, unitId }
        const normalizedBarcodes = (d.barcodes || []).map(b => {
          const barcodeValue = typeof b === 'string' ? b : (b?.barcode || b);
          
          // Cari unitId dari barcode data
          let targetUnitId = null;
          if (typeof b === 'object') {
            targetUnitId = b.unitId || b.unit?.id;
          }
          
          // PENTING: Jika unitId adalah temp_unit_X (dari mode create), kita perlu mencari unit yang sesuai
          // berdasarkan index di sortedUnits
          if (targetUnitId && typeof targetUnitId === 'string' && targetUnitId.startsWith('temp_unit_')) {
            // Ini adalah mode create, cari unit berdasarkan index
            const tempIndex = parseInt(targetUnitId.replace('temp_unit_', ''));
            if (!isNaN(tempIndex) && sortedUnits[tempIndex]) {
              // Gunakan id unit jika ada (mode edit), jika belum ada (mode create baru), 
              // kita perlu cari unit berdasarkan urutan di sortedUnits
              if (sortedUnits[tempIndex].id) {
                // Mode edit: unit sudah punya id - GUNAKAN ID INI
                targetUnitId = sortedUnits[tempIndex].id;
              } else {
                // Mode create baru: unit belum punya id
                // Karena ini mode create, unit akan dibuat bersamaan dengan product
                // Kita perlu pastikan urutan unit sesuai dengan sortedUnits
                // Untuk sementara, kita akan gunakan null dan backend akan default ke satuan kecil
                // TAPI ini tidak ideal - kita perlu pastikan unit sudah dibuat dulu
                targetUnitId = null; // Backend akan handle
              }
            } else {
              // Index tidak valid
              targetUnitId = null;
            }
          }
          
          // PENTING: Hanya default ke satuan kecil jika:
          // 1. targetUnitId adalah null/undefined
          // 2. targetUnitId adalah temp_unit_X yang tidak bisa di-resolve
          // Jika targetUnitId sudah valid (ID database), JANGAN diubah!
          const isValidUnitId = targetUnitId && 
                                typeof targetUnitId === 'string' && 
                                !targetUnitId.startsWith('temp_unit_') &&
                                targetUnitId.trim() !== '';
          
          if (!isValidUnitId) {
            // Cari unit dengan conversion = 1 (satuan kecil) sebagai default
            const baseUnit = sortedUnits.find(u => u.conversion === 1) || sortedUnits[0];
            targetUnitId = baseUnit?.id;
          }
          
          return {
            barcode: barcodeValue,
            unitId: targetUnitId
          };
        });
        
        return {
          distributorId: distId,
          isDefault: d.isDefault || false,
          barcodes: normalizedBarcodes
        };
      });
      
      // Kirim distributorId pertama sebagai default untuk backward compatibility dengan backend
      const defaultDistributor = normalizedDistributors.find(d => d.isDefault) || normalizedDistributors[0];
      await saveProduct({
        ...formData,
        distributorId: defaultDistributor?.distributorId, // Untuk backward compatibility
        distributors: normalizedDistributors, // Data lengkap untuk Many-to-Many
        units: sortedUnits
      });
      // Panggil callback onSave jika ada (untuk reload data di parent)
      if (onSave) {
        onSave();
      }
      onClose(); // Tutup modal
    } catch (error) {
      // Error sudah ditangani di context dengan toast
      console.error('Gagal menyimpan produk:', error);
    }
  };

  // 5. Render JSX
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="modal-content !max-w-2xl"> {/* Override max-width untuk form yang lebih lebar */}
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">Kode Barang (SKU):</label>
                <input 
                  type="text" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleFormChange}
                  className={`w-full p-2 mt-1 border rounded-lg ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                  required 
                />
                {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Barang:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleFormChange}
                  className={`w-full p-2 mt-1 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  required 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            {/* Section Distributor (Many-to-Many) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distributor:</label>
              
              {/* List Distributor yang sudah ditambahkan */}
              {formData.distributors && formData.distributors.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {formData.distributors.map((dist, index) => {
                    // Cari distributor dari list atau dari dist.distributor (jika dari backend)
                    const distributor = dist.distributor || distributors.find(d => d.id === dist.distributorId);
                    if (!distributor) return null;
                    
                    return (
                      <div key={dist.distributorId || distributor.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="defaultDistributor"
                            checked={dist.isDefault}
                            onChange={() => handleSetDefaultDistributor(dist.distributorId || distributor.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium">{distributor.name}</span>
                          {dist.isDefault && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Supplier Utama</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDistributor(dist.distributorId || distributor.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Hapus Distributor"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3 italic">Belum ada distributor ditambahkan</p>
              )}
              
              {/* Tombol Tambah Distributor */}
              <button
                type="button"
                onClick={() => setIsAddDistributorModalOpen(true)}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Tambah Distributor
              </button>
              
              {errors.distributors && <p className="text-red-500 text-xs mt-1">{errors.distributors}</p>}
            </div>
            
            {/* Modal Tambah Distributor */}
            {isAddDistributorModalOpen && (
              <>
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsAddDistributorModalOpen(false)}></div>
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md p-6">
                  <h4 className="text-lg font-bold mb-4">Tambah Distributor</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Distributor:</label>
                      <select
                        value={selectedDistributorId}
                        onChange={(e) => setSelectedDistributorId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="">-- Pilih Distributor --</option>
                        {distributors
                          .filter(d => !formData.distributors.some(pd => pd.distributorId === d.id))
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddDistributorModalOpen(false);
                          setSelectedDistributorId('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAddDistributor}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">Stok Minimum ({baseUnitName}):</label>
                <input 
                  type="number" 
                  name="minStock" 
                  value={formData.minStock} 
                  onChange={handleFormChange}
                  className={`w-full p-2 mt-1 border rounded-lg ${errors.minStock ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                />
                {errors.minStock && <p className="text-red-500 text-xs mt-1">{errors.minStock}</p>}
              </div>

            {/* --- Bagian Unit (Logika Dinamis) --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Satuan, Harga Jual, & Barcode:</label>
              {errors.units && <p className="text-red-500 text-xs mt-1">{errors.units}</p>}
              
              {/* SATUAN KECIL */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <label className="text-sm font-semibold text-blue-700">SATUAN KECIL (Satuan Dasar)</label>
                </div>
                <p className="text-xs text-gray-600 mb-2 ml-4">
                  Satuan terkecil untuk barang ini. Contoh: kg, liter, pcs, botol. Konversi selalu = 1.
                </p>
                {formData.units.length > 0 && (
                  <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-2">
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-xs text-gray-600 mb-1 block">Nama Satuan Kecil:</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: kg, liter, pcs" 
                          value={formData.units[0].name}
                          onChange={(e) => handleUnitChange(0, 'name', e.target.value)}
                          className={`w-full p-2 border rounded-lg font-semibold ${errors[`unit_0_name`] ? 'border-red-500' : 'border-blue-300'}`}
                          required 
                        />
                        {errors[`unit_0_name`] && <p className="text-red-500 text-xs mt-1">{errors[`unit_0_name`]}</p>}
                      </div>
                      
                      <div className="w-1/2">
                        <label className="text-xs text-gray-600 mb-1 block">Konversi:</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value="1"
                            readOnly
                            className="w-full p-2 border border-blue-300 rounded-lg bg-gray-200 font-semibold"
                          />
                          <span className="text-sm font-semibold">{formData.units[0]?.name || 'Satuan'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Satuan kecil selalu = 1</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Harga Jual per {formData.units[0]?.name || 'Satuan'}:</label>
                      <input 
                        type="number" 
                        placeholder="Harga Jual (Rp)" 
                        value={formData.units[0].price}
                        onChange={(e) => handleUnitChange(0, 'price', parseInt(e.target.value) || 0)}
                        className={`w-full p-2 border rounded-lg ${errors[`unit_0_price`] ? 'border-red-500' : 'border-blue-300'}`}
                        required 
                        min="1"
                      />
                      {errors[`unit_0_price`] && <p className="text-red-500 text-xs mt-1">{errors[`unit_0_price`]}</p>}
                    </div>
                    
                  </div>
                )}
              </div>

              {/* SATUAN BESAR */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <label className="text-sm font-semibold text-green-700">SATUAN BESAR (Opsional)</label>
                </div>
                <p className="text-xs text-gray-600 mb-2 ml-4">
                  Satuan yang lebih besar dari satuan kecil. Contoh: Karton (isi 12 pcs), Dus (isi 24 botol), Pack (isi 10 kg). 
                  Konversi harus lebih besar dari 1.
                </p>
                <div className="space-y-2">
                  {formData.units.slice(1).map((unit, index) => {
                    const actualIndex = index + 1; // Index sebenarnya di array units
                    return (
                      <div key={actualIndex} className="p-3 border-2 border-green-200 rounded-lg bg-green-50 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-green-700">Satuan Besar #{actualIndex}</span>
                          <button type="button" onClick={() => handleRemoveUnit(actualIndex)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <label className="text-xs text-gray-600 mb-1 block">Nama Satuan Besar:</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: Karton, Dus, Pack" 
                              value={unit.name}
                              onChange={(e) => handleUnitChange(actualIndex, 'name', e.target.value)}
                              className={`w-full p-2 border rounded-lg ${errors[`unit_${actualIndex}_name`] ? 'border-red-500' : 'border-green-300'}`}
                              required 
                            />
                            {errors[`unit_${actualIndex}_name`] && <p className="text-red-500 text-xs mt-1">{errors[`unit_${actualIndex}_name`]}</p>}
                          </div>
                          
                          <div className="w-1/2">
                            <label className="text-xs text-gray-600 mb-1 block">Isi (dalam {baseUnitName}):</label>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                placeholder="Isi" 
                                value={unit.conversion}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  if (val > 1) {
                                    handleUnitChange(actualIndex, 'conversion', val);
                                  }
                                }}
                                className={`w-full p-2 border rounded-lg ${errors[`unit_${actualIndex}_conversion`] ? 'border-red-500' : 'border-green-300'}`}
                                required 
                                min="2"
                              />
                              <span className="text-sm font-semibold">{baseUnitName}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Harus lebih besar dari 1</p>
                            {errors[`unit_${actualIndex}_conversion`] && <p className="text-red-500 text-xs mt-1">{errors[`unit_${actualIndex}_conversion`]}</p>}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Harga Jual per {unit.name || 'Satuan Besar'}:</label>
                          <input 
                            type="number" 
                            placeholder="Harga Jual (Rp)" 
                            value={unit.price}
                            onChange={(e) => handleUnitChange(actualIndex, 'price', parseInt(e.target.value) || 0)}
                            className={`w-full p-2 border rounded-lg ${errors[`unit_${actualIndex}_price`] ? 'border-red-500' : 'border-green-300'}`}
                            required 
                            min="1"
                          />
                          {errors[`unit_${actualIndex}_price`] && <p className="text-red-500 text-xs mt-1">{errors[`unit_${actualIndex}_price`]}</p>}
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={handleAddUnit} className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium">
                  + Tambah Satuan Besar (Karton, Dus, Pack, dll)
                </button>
              </div>
            </div>

            {/* --- Bagian Barcode per Distributor + Unit --- */}
            {formData.distributors && formData.distributors.length > 0 && formData.units && formData.units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode per Distributor & Satuan:</label>
                <p className="text-xs text-gray-600 mb-3">
                  Setiap kombinasi distributor dan satuan dapat memiliki barcode yang berbeda.
                </p>
                
                <div className="space-y-4">
                  {formData.distributors.map((dist) => {
                    const distributor = dist.distributor || distributors.find(d => d.id === (dist.distributorId || dist.id));
                    if (!distributor) return null;
                    
                    const distId = dist.distributorId || distributor.id;
                    
                    return (
                      <div key={distId} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-800">{distributor.name}</span>
                          {dist.isDefault && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Supplier Utama</span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {formData.units.map((unit, unitIndex) => {
                            // PENTING: Gunakan unit.id jika ada (mode edit), jika tidak gunakan temp_unit_X untuk referensi
                            // Tapi saat menyimpan barcode, kita akan gunakan unit.id yang sebenarnya
                            const displayUnitId = unit.id || `temp_unit_${unitIndex}`;
                            const key = `${distId}_${displayUnitId}`;
                            // Untuk menyimpan, kita perlu unit.id yang sebenarnya atau index untuk referensi
                            const saveUnitId = unit.id || `temp_unit_${unitIndex}`;
                            
                            // Ambil barcode untuk kombinasi ini
                            // Untuk create baru, gunakan unitId (temp_unit_0, temp_unit_1, dll); untuk edit, gunakan id
                            const barcodesForThisCombo = (dist.barcodes || []).filter(b => {
                              const bUnitId = typeof b === 'object' ? (b?.unitId || b?.unit?.id) : null;
                              
                              // Pastikan kita membandingkan dengan benar
                              if (unit.id) {
                                // Mode edit: match dengan id database (pastikan tipe data sama)
                                return String(bUnitId) === String(unit.id);
                              } else {
                                // Mode create: match dengan unitId yang sudah dibuat (temp_unit_0, temp_unit_1, dll)
                                // displayUnitId sudah dibuat di atas sebagai: unit.id || `temp_unit_${unitIndex}`
                                return String(bUnitId) === String(displayUnitId);
                              }
                            });
                            
                            return (
                              <div key={displayUnitId} className="p-2 bg-white border border-gray-200 rounded">
                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                  Barcode untuk satuan: <span className="font-semibold">{unit.name}</span>
                                </label>
                                
                                {/* Tampilkan barcode yang sudah ada */}
                                <div className="flex flex-wrap gap-1 my-2 p-2 border rounded bg-gray-50 min-h-[38px]">
                                  {barcodesForThisCombo.map((b, bIndex) => {
                                    const barcodeValue = typeof b === 'string' ? b : (b?.barcode || b);
                                    return (
                                      <span key={bIndex} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                                        {barcodeValue}
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveBarcode(distId, saveUnitId, barcodeValue)} 
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    );
                                  })}
                                  {barcodesForThisCombo.length === 0 && (
                                    <span className="text-xs text-gray-500 italic">Belum ada barcode</span>
                                  )}
                                </div>
                                
                                {/* Input barcode baru */}
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder={`Scan/Input barcode untuk ${distributor.name} - ${unit.name}...`}
                                    value={newBarcodes[key] || ''}
                                    onChange={(e) => handleNewBarcodeChange(distId, displayUnitId, e.target.value)}
                                    onKeyPress={(e) => { 
                                      if(e.key === 'Enter') { 
                                        e.preventDefault(); 
                                        handleAddBarcode(distId, saveUnitId); 
                                      }
                                    }}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => handleAddBarcode(distId, saveUnitId)} 
                                    className="px-4 bg-blue-500 text-white text-sm font-bold py-2 rounded hover:bg-blue-600"
                                  >
                                    + Tambah
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Tombol Aksi */}
          <div className="flex gap-2 mt-6 border-t pt-4">
              <button type="button" onClick={onClose} className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Batal</button>
              <button type="submit" className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
          </div>
        </form>
      </div>
    </>
  );
}