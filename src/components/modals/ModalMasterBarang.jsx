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

export default function ModalMasterBarang({ productToEdit, onClose }) {
  const { distributors, saveProduct } = useStore(); // Ambil data & fungsi dari Context
  
  // 'formData' adalah state lokal yang menampung SEMUA data di form
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  
  // 'newBarcodes' adalah state terpisah untuk mengelola input "barcode baru"
  // Ini penting agar input barcode untuk unit 1 tidak bentrok dgn unit 2
  const [newBarcodes, setNewBarcodes] = useState([]); 

  // 1. Logika Inisialisasi Form
  useEffect(() => {
    if (productToEdit) {
      // Mode EDIT: Isi form dengan data produk
      setFormData(productToEdit);
      // Siapkan state untuk input barcode (satu string kosong untuk setiap unit)
      setNewBarcodes(new Array(productToEdit.units.length).fill(''));
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
            { name: '', price: 0, conversion: 1, barcodes: [] } // Data unit baru
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
  const handleSubmit = (e) => {
    e.preventDefault();
    // ... (Validasi Anda: cek SKU duplikat, nama, dll) ...
    // if (!formData.sku || !formData.name || !formData.distributorId) {
    //   alert("Kode, Nama, dan Distributor wajib diisi.");
    //   return;
    // }
    
    // Panggil fungsi dari Context untuk menyimpan
    saveProduct(formData);
    onClose(); // Tutup modal
  };

  // 5. Render JSX
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="modal-content !max-w-lg"> {/* Override max-width */}
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">Kode Barang (SKU):</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleFormChange}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Barang:</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Distributor:</label>
                <select name="distributorId" value={formData.distributorId} onChange={handleFormChange}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-lg bg-white" required>
                  <option value="">-- Pilih Distributor --</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Stok Minimum ({baseUnitName}):</label>
                <input type="number" name="minStock" value={formData.minStock} onChange={handleFormChange}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-lg" />
            </div>

            {/* --- Bagian Unit (Logika Dinamis) --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan, Harga Jual, & Barcode:</label>
              <div className="space-y-2 mt-2">
                
                {formData.units.map((unit, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                    {/* Baris 1: Nama & Konversi */}
                    <div className="flex gap-2">
                      <input type="text" placeholder="Nama Satuan" value={unit.name}
                        onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                        className={`w-1/2 p-2 border ... ${index === 0 ? 'font-bold' : ''}`} required />
                      
                      <div className="w-1/2 flex items-center gap-1">
                        <label className="text-sm">Isi:</label>
                        <input type="number" placeholder="Isi" value={unit.conversion}
                          readOnly={index === 0} // Unit dasar (index 0) selalu 1
                          onChange={(e) => handleUnitChange(index, 'conversion', parseInt(e.target.value) || 1)}
                          className={`w-1/3 p-2 border ... ${index === 0 ? 'bg-gray-200' : ''}`} required />
                        <span className="text-sm">{baseUnitName}</span>
                        {index > 0 && (
                          <button type="button" onClick={() => handleRemoveUnit(index)} className="text-red-500 hover:text-red-700 ml-auto">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Baris 2: Harga */}
                    <input type="number" placeholder="Harga Jual (Rp)" value={unit.price}
                      onChange={(e) => handleUnitChange(index, 'price', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border ..." required />
                    
                    {/* Baris 3: Barcode */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Barcodes Terdaftar:</label>
                      <div className="flex flex-wrap gap-1 my-1 p-2 border rounded bg-white min-h-[38px]">
                        {unit.barcodes.map(b => (
                          <span key={b} className="bg-gray-200 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                            {b}
                            <button type="button" onClick={() => handleRemoveBarcode(index, b)} className="text-red-500 hover:text-red-700">&times;</button>
                          </span>
                        ))}
                        {unit.barcodes.length === 0 && <span className="text-xs text-gray-500 italic">Belum ada barcode</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input type="text" placeholder="Scan/Input barcode baru..."
                          value={newBarcodes[index] || ''}
                          onChange={(e) => handleNewBarcodeChange(index, e.target.value)}
                          onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddBarcode(index); }}}
                          className="w-2/3 p-2 border ..."
                        />
                        <button type="button" onClick={() => handleAddBarcode(index)} 
                          className="w-1/3 bg-blue-500 text-white text-sm font-bold py-2 px-3 rounded hover:bg-blue-600">
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddUnit} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                + Tambah Satuan (Karton, Dus, Pack, dll)
              </button>
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