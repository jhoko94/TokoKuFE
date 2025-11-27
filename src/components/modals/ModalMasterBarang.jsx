import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { TrashIcon } from '@heroicons/react/24/outline';

// Data default untuk barang baru
const DEFAULT_FORM_DATA = {
  id: null,
  sku: '',
  name: '',
  distributorId: '',
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
  // Ini penting agar input barcode untuk unit 1 tidak bentrok dgn unit 2
  const [newBarcodes, setNewBarcodes] = useState([]);
  
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
      
      setFormData({
        ...productToEdit,
        units: sortedUnits
      });
      // Siapkan state untuk input barcode (satu string kosong untuk setiap unit)
      setNewBarcodes(new Array(sortedUnits.length).fill(''));
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
  
  // Untuk input "barcode baru"
  const handleNewBarcodeChange = (index, value) => {
    setNewBarcodes(prev => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
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
  
  const handleAddBarcode = (unitIndex) => {
    const barcode = newBarcodes[unitIndex].trim();
    if (!barcode) return;
    
    setFormData(prev => {
        const newUnits = [...prev.units];
        const unit = newUnits[unitIndex];
        // Cek duplikat
        if (!unit.barcodes.includes(barcode)) {
            unit.barcodes = [...unit.barcodes, barcode];
        }
        return { ...prev, units: newUnits };
    });
    // Kosongkan input "barcode baru"
    handleNewBarcodeChange(unitIndex, '');
  };
  
  const handleRemoveBarcode = (unitIndex, barcodeToRemove) => {
    setFormData(prev => {
        const newUnits = [...prev.units];
        newUnits[unitIndex].barcodes = newUnits[unitIndex].barcodes.filter(b => b !== barcodeToRemove);
        return { ...prev, units: newUnits };
    });
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
    
    // Validasi Distributor
    if (!formData.distributorId) {
      newErrors.distributorId = 'Distributor harus dipilih';
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
      await saveProduct({
        ...formData,
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
            <div>
                <label className="block text-sm font-medium text-gray-700">Distributor:</label>
                <select 
                  name="distributorId" 
                  value={formData.distributorId} 
                  onChange={handleFormChange}
                  className={`w-full p-2 mt-1 border rounded-lg bg-white ${errors.distributorId ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">-- Pilih Distributor --</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.distributorId && <p className="text-red-500 text-xs mt-1">{errors.distributorId}</p>}
            </div>
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
                    
                    {/* Barcode untuk satuan kecil */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Barcodes Terdaftar:</label>
                      <div className="flex flex-wrap gap-1 my-1 p-2 border rounded bg-white min-h-[38px]">
                        {formData.units[0].barcodes.map(b => (
                          <span key={b} className="bg-gray-200 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                            {b}
                            <button type="button" onClick={() => handleRemoveBarcode(0, b)} className="text-red-500 hover:text-red-700">&times;</button>
                          </span>
                        ))}
                        {formData.units[0].barcodes.length === 0 && <span className="text-xs text-gray-500 italic">Belum ada barcode</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input type="text" placeholder="Scan/Input barcode baru..."
                          value={newBarcodes[0] || ''}
                          onChange={(e) => handleNewBarcodeChange(0, e.target.value)}
                          onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddBarcode(0); }}}
                          className="w-2/3 p-2 border border-gray-300 rounded-lg"
                        />
                        <button type="button" onClick={() => handleAddBarcode(0)} 
                          className="w-1/3 bg-blue-500 text-white text-sm font-bold py-2 px-3 rounded hover:bg-blue-600">
                          + Tambah
                        </button>
                      </div>
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
                        
                        {/* Barcode untuk satuan besar */}
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Barcodes Terdaftar:</label>
                          <div className="flex flex-wrap gap-1 my-1 p-2 border rounded bg-white min-h-[38px]">
                            {unit.barcodes.map(b => (
                              <span key={b} className="bg-gray-200 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                                {b}
                                <button type="button" onClick={() => handleRemoveBarcode(actualIndex, b)} className="text-red-500 hover:text-red-700">&times;</button>
                              </span>
                            ))}
                            {unit.barcodes.length === 0 && <span className="text-xs text-gray-500 italic">Belum ada barcode</span>}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input type="text" placeholder="Scan/Input barcode baru..."
                              value={newBarcodes[actualIndex] || ''}
                              onChange={(e) => handleNewBarcodeChange(actualIndex, e.target.value)}
                              onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddBarcode(actualIndex); }}}
                              className="w-2/3 p-2 border border-gray-300 rounded-lg"
                            />
                            <button type="button" onClick={() => handleAddBarcode(actualIndex)} 
                              className="w-1/3 bg-green-500 text-white text-sm font-bold py-2 px-3 rounded hover:bg-green-600">
                              + Tambah
                            </button>
                          </div>
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