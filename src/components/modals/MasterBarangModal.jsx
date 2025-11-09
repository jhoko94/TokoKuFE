import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

// Ini adalah data default untuk barang baru
const DEFAULT_FORM_DATA = {
  id: null,
  sku: '',
  name: '',
  distributorId: '',
  minStock: 10,
  units: [
    { name: 'Pcs', price: 0, conversion: 1, barcodes: [] }
  ]
};

// Modal menerima `productToEdit` (jika mode edit) dan `onClose`, `onSave`
export default function MasterBarangModal({ isOpen, onClose, productToEdit }) {
  const { distributors, saveProduct } = useStore(); // Ambil data & fungsi dari Context
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [newBarcode, setNewBarcode] = useState(''); // State untuk input barcode

  // Jika `productToEdit` berubah (saat modal dibuka), isi form
  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [productToEdit, isOpen]); // Reset saat modal dibuka

  if (!isOpen) return null; // Jangan render apapun jika ditutup

  const title = productToEdit ? 'Edit Barang' : 'Tambah Barang Baru';
  const baseUnitName = formData.units[0]?.name || 'Satuan';
  
  // --- Ini adalah INTI dari migrasi logika Anda ---

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUnitChange = (index, field, value) => {
     setFormData(prev => {
        const newUnits = [...prev.units];
        newUnits[index][field] = value;
        return { ...prev, units: newUnits };
     });
  };
  
  const handleAddUnit = () => {
    setFormData(prev => ({
        ...prev,
        units: [
            ...prev.units,
            { name: '', price: 0, conversion: 0, barcodes: [] }
        ]
    }));
  };
  
  const handleRemoveUnit = (index) => {
    setFormData(prev => ({
        ...prev,
        units: prev.units.filter((_, i) => i !== index) // Hapus unit di indeks
    }));
  };
  
  const handleAddBarcode = (unitIndex) => {
    const barcode = newBarcode.trim();
    if (!barcode) return;
    
    setFormData(prev => {
        const newUnits = [...prev.units];
        const unit = newUnits[unitIndex];
        if (!unit.barcodes.includes(barcode)) {
            unit.barcodes = [...unit.barcodes, barcode];
        }
        return { ...prev, units: newUnits };
    });
    setNewBarcode(''); // Kosongkan input
  };
  
  const handleRemoveBarcode = (unitIndex, barcodeToRemove) => {
    setFormData(prev => {
        const newUnits = [...prev.units];
        newUnits[unitIndex].barcodes = newUnits[unitIndex].barcodes.filter(b => b !== barcodeToRemove);
        return { ...prev, units: newUnits };
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // ... (Validasi Anda di sini: cek SKU, nama, dll) ...
    
    // Panggil fungsi dari Context untuk menyimpan
    saveProduct(formData);
    onClose(); // Tutup modal
  };

  // --- Render (JSX) ---
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Konten Modal */}
      <div className="modal-content !max-w-lg"> {/* Override max-width */}
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit}>
          <input type="hidden" value={formData.id || ''} />
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div>
                <label>Kode Barang (SKU):</label>
                <input 
                  type="text" 
                  name="sku"
                  value={formData.sku}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 border ... " 
                />
            </div>
            <div>
                <label>Nama Barang:</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 border ... " 
                />
            </div>
            <div>
                <label>Distributor:</label>
                <select 
                  name="distributorId"
                  value={formData.distributorId}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 border ... ">
                  <option value="">-- Pilih Distributor --</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
            </div>
            <div>
                <label>Stok Minimum ({baseUnitName}):</label>
                <input 
                  type="number" 
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 border ... " 
                />
            </div>

            {/* --- Bagian Unit (Logika Kompleks) --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan, Harga Jual, & Barcode:</label>
              <div id="master-barang-units-container" className="space-y-2 mt-2">
                
                {formData.units.map((unit, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                    {/* Baris 1: Nama & Konversi */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nama Satuan"
                        value={unit.name}
                        onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                        className={`w-1/2 p-2 border ... ${index === 0 ? 'font-bold' : ''}`}
                      />
                      <div className="w-1/2 flex items-center gap-1">
                        <label className="text-sm">Isi:</label>
                        <input 
                          type="number" 
                          placeholder="Isi"
                          readOnly={index === 0} // Unit dasar selalu 1
                          value={unit.conversion}
                          onChange={(e) => handleUnitChange(index, 'conversion', parseInt(e.target.value))}
                          className={`w-1/3 p-2 border ... ${index === 0 ? 'bg-gray-200' : ''}`}
                        />
                        <span className="text-sm">{baseUnitName}</span>
                        {index > 0 && (
                          <button type="button" onClick={() => handleRemoveUnit(index)} className="text-red-500">&times;</button>
                        )}
                      </div>
                    </div>
                    {/* Baris 2: Harga */}
                    <input 
                      type="number" 
                      placeholder="Harga Jual (Rp)"
                      value={unit.price}
                      onChange={(e) => handleUnitChange(index, 'price', parseInt(e.target.value))}
                      className="w-full p-2 border ..."
                    />
                    {/* Baris 3: Barcode */}
                    <div>
                      <label className="text-sm">Barcodes:</label>
                      <div className="flex flex-wrap gap-1 my-1 p-2 border rounded bg-white min-h-[30px]">
                        {unit.barcodes.map(b => (
                          <span key={b} className="bg-gray-200 text-xs px-2 py-0.5 rounded flex items-center">
                            {b}
                            <button type="button" onClick={() => handleRemoveBarcode(index, b)} className="ml-1 text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text" 
                          placeholder="Scan/Input barcode baru..." 
                          value={newBarcode}
                          onChange={(e) => setNewBarcode(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBarcode(index))}
                          className="w-2/3 p-2 border ..."
                        />
                        <button type="button" onClick={() => handleAddBarcode(index)} className="w-1/3 bg-blue-500 ...">
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
              </div>
              <button type="button" onClick={handleAddUnit} className="mt-2 text-sm text-blue-600 ...">
                + Tambah Satuan
              </button>
            </div>
          </div>
          
          {/* Tombol Aksi */}
          <div className="flex gap-2 mt-6">
              <button type="button" onClick={onClose} className="w-1/2 bg-gray-300 ...">Batal</button>
              <button type="submit" className="w-1/2 bg-green-600 ...">Simpan</button>
          </div>
        </form>
      </div>
    </>
  );
}