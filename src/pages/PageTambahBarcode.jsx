import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PageTambahBarcode() {
  const navigate = useNavigate();
  const { 
    products, 
    distributors, 
    createBarcode, 
    generateBarcode,
    getProductByName,
    fetchBarcodesPaginated,
    showToast
  } = useStore();
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [units, setUnits] = useState([]);
  const [unitBarcodes, setUnitBarcodes] = useState({}); // { unitId: [barcode1, barcode2, ...] }
  const [currentInputs, setCurrentInputs] = useState({}); // { unitId: 'input value' }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingBarcodes, setExistingBarcodes] = useState(new Set()); // Set of barcode strings yang sudah ada di database

  // Filter distributor berdasarkan produk yang dipilih
  // Jika produk memiliki distributors, tampilkan hanya distributor yang terhubung
  // Jika tidak, tampilkan semua distributor (backend akan otomatis membuat ProductDistributor)
  const availableDistributors = selectedProduct && selectedProduct.distributors && selectedProduct.distributors.length > 0
    ? distributors.filter(d => 
        selectedProduct.distributors.some(pd => 
          pd.distributorId === d.id || pd.distributor?.id === d.id
        )
      )
    : selectedProduct 
      ? distributors // Jika produk dipilih tapi belum punya distributor, tampilkan semua
      : [];

  // Load semua barcode yang sudah ada di database untuk validasi duplikat
  useEffect(() => {
    const loadExistingBarcodes = async () => {
      try {
        // Ambil banyak data sekaligus; jika nanti barcode sangat banyak, bisa diganti ke endpoint khusus cek barcode
        const response = await fetchBarcodesPaginated(1, 10000, '', '', '', '');
        if (response && response.data) {
          const barcodeSet = new Set(
            response.data
              .map(b => (b.barcode || '').trim().toLowerCase())
              .filter(Boolean)
          );
          setExistingBarcodes(barcodeSet);
        }
      } catch (error) {
        console.error('Gagal memuat daftar barcode untuk validasi:', error);
        // Kalau gagal, backend masih akan menolak duplikat, jadi lanjut saja
      }
    };

    loadExistingBarcodes();
  }, [fetchBarcodesPaginated]);

  // Load units saat produk dipilih
  useEffect(() => {
    if (selectedProduct && selectedProduct.units) {
      const sortedUnits = [...selectedProduct.units].sort((a, b) => {
        if (a.conversion === 1 && b.conversion !== 1) return -1;
        if (a.conversion !== 1 && b.conversion === 1) return 1;
        return a.conversion - b.conversion;
      });
      setUnits(sortedUnits);
      
      // Reset barcode untuk semua unit (array kosong untuk setiap unit)
      const initialBarcodes = {};
      const initialInputs = {};
      sortedUnits.forEach(unit => {
        initialBarcodes[unit.id] = [];
        initialInputs[unit.id] = '';
      });
      setUnitBarcodes(initialBarcodes);
      setCurrentInputs(initialInputs);
    } else {
      setUnits([]);
      setUnitBarcodes({});
      setCurrentInputs({});
    }
  }, [selectedProduct]);

  // Util: cek barcode sudah ada di state (lintas satuan) atau di database
  const isBarcodeExists = (value) => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return false;
    
    // Cek di form yang sedang diisi (lintas satuan)
    const existsInForm = Object.values(unitBarcodes).some(list =>
      (list || []).some(b => (b || '').trim().toLowerCase() === normalized)
    );
    
    // Cek di database
    const existsInDatabase = existingBarcodes.has(normalized);
    
    return existsInForm || existsInDatabase;
  };

  // Handler untuk hapus barcode dari satuan tertentu
  const handleRemoveBarcode = (unitId, index) => {
    setUnitBarcodes(prev => ({
      ...prev,
      [unitId]: prev[unitId].filter((_, i) => i !== index)
    }));
  };

  // Handler untuk update barcode di index tertentu
  const handleUpdateBarcode = (unitId, index, value) => {
    const normalized = value.trim();
    
    // Cek duplikat di form atau database
    if (normalized && isBarcodeExists(normalized)) {
      // Cek apakah ini barcode yang sama di posisi yang sama (edit tanpa mengubah nilai)
      const currentBarcode = (unitBarcodes[unitId] || [])[index];
      if (currentBarcode && currentBarcode.trim().toLowerCase() === normalized.toLowerCase()) {
        // Ini adalah barcode yang sama, tidak perlu error
      } else {
        showToast('Barcode sudah ada (duplikat atau sudah terdaftar di database).', 'error');
        return;
      }
    }

    setUnitBarcodes(prev => {
      const newBarcodes = [...(prev[unitId] || [])];
      newBarcodes[index] = value;
      return {
        ...prev,
        [unitId]: newBarcodes
      };
    });
  };

  // Search produk (hanya tampilkan suggestions jika produk belum dipilih atau search term berbeda dengan nama produk yang dipilih)
  useEffect(() => {
    // Jangan tampilkan suggestions jika produk sudah dipilih dan search term sama dengan nama produk
    if (selectedProduct && productSearchTerm === selectedProduct.name) {
      setProductSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (productSearchTerm.trim().length >= 2) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
      ).slice(0, 10);
      setProductSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setProductSuggestions([]);
      setShowSuggestions(false);
    }
  }, [productSearchTerm, products, selectedProduct]);

  // Handler untuk pilih produk
  const handleSelectProduct = async (product) => {
    // Tutup suggestions list terlebih dahulu
    setShowSuggestions(false);
    setProductSuggestions([]);
    
    // Jika produk dari suggestions tidak memiliki data lengkap (distributors), fetch dengan getProductByName
    let productWithDetails = product;
    if (!product.distributors || product.distributors.length === 0) {
      try {
        // Fetch dengan getProductByName untuk mendapatkan data lengkap termasuk distributors
        const fetchedProduct = await getProductByName(product.name);
        if (fetchedProduct && fetchedProduct.distributors && fetchedProduct.distributors.length > 0) {
          productWithDetails = fetchedProduct;
        }
      } catch (error) {
        // Error sudah ditangani di getProductByName (return null jika 404)
        // Gunakan produk yang ada jika fetch gagal
      }
    }
    
    setSelectedProduct(productWithDetails);
    setProductSearchTerm(productWithDetails.name);
    setSelectedDistributor('');
    setErrors({});
  };

  // Handler untuk submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi
    if (!selectedProduct) {
      setErrors({ product: 'Produk harus dipilih' });
      return;
    }

    if (!selectedDistributor) {
      setErrors({ distributor: 'Distributor harus dipilih' });
      return;
    }

    // Siapkan data barcode yang akan ditambahkan (multiple barcode per satuan)
    const barcodesToAdd = [];
    const duplicateBarcodes = [];
    
    units.forEach(unit => {
      const barcodes = unitBarcodes[unit.id] || [];
      barcodes.forEach(barcode => {
        if (barcode && barcode.trim()) {
          const normalized = barcode.trim().toLowerCase();
          // Cek apakah barcode sudah ada di database
          if (existingBarcodes.has(normalized)) {
            duplicateBarcodes.push(barcode.trim());
          } else {
            barcodesToAdd.push({
              productId: selectedProduct.id,
              distributorId: selectedDistributor,
              unitId: unit.id,
              barcode: barcode.trim()
            });
          }
        }
      });
    });

    if (barcodesToAdd.length === 0) {
      if (duplicateBarcodes.length > 0) {
        showToast(`Barcode berikut sudah terdaftar di database: ${duplicateBarcodes.join(', ')}`, 'error');
      } else {
        showToast('Minimal 1 barcode harus diisi', 'error');
      }
      return;
    }
    
    if (duplicateBarcodes.length > 0) {
      showToast(`Beberapa barcode sudah terdaftar di database: ${duplicateBarcodes.join(', ')}. Hanya barcode yang valid yang akan disimpan.`, 'warning');
      // Tetap lanjutkan submit untuk barcode yang valid
    }

    // Cek duplikasi barcode di form (lintas satuan)
    const seen = new Set();
    for (const item of barcodesToAdd) {
      const normalized = item.barcode.trim().toLowerCase();
      if (seen.has(normalized)) {
        showToast(`Barcode duplikat di form: ${item.barcode.trim()}`, 'error');
        return;
      }
      seen.add(normalized);
    }

    setIsSubmitting(true);
    try {
      await createBarcode(barcodesToAdd);
      // Redirect ke halaman kelola barcode setelah berhasil
      navigate('/kelola-barcode');
    } catch (error) {
      // Error sudah ditangani di createBarcode
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => navigate('/kelola-barcode')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 md:mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="text-sm md:text-base">Kembali</span>
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Tambah Barcode</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <form onSubmit={handleSubmit}>
          {/* Pilih Produk */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produk <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setProductSearchTerm(value);
                  if (!value) {
                    setSelectedProduct(null);
                    setShowSuggestions(false);
                    setProductSuggestions([]);
                  }
                }}
                onFocus={() => {
                  // Tampilkan suggestions saat focus jika ada search term
                  if (productSearchTerm.trim().length >= 2 && productSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={(e) => {
                  // Delay untuk allow click pada suggestions
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 200);
                }}
                placeholder="Cari produk..."
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                required
              />
              {showSuggestions && productSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {productSuggestions.map(product => (
                    <div
                      key={product.id}
                      onMouseDown={(e) => {
                        // Prevent blur event saat klik
                        e.preventDefault();
                      }}
                      onClick={() => handleSelectProduct(product)}
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.product && (
              <p className="mt-1 text-sm text-red-600">{errors.product}</p>
            )}
          </div>

          {/* Pilih Distributor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distributor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDistributor}
              onChange={(e) => {
                setSelectedDistributor(e.target.value);
                setErrors({ ...errors, distributor: '' });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
              required
              disabled={!selectedProduct || availableDistributors.length === 0}
            >
              <option value="">Pilih Distributor</option>
              {availableDistributors.length === 0 ? (
                <option value="" disabled>Belum ada distributor</option>
              ) : (
                availableDistributors.map(distributor => (
                  <option key={distributor.id} value={distributor.id}>
                    {distributor.name}
                  </option>
                ))
              )}
            </select>
            {errors.distributor && (
              <p className="mt-1 text-sm text-red-600">{errors.distributor}</p>
            )}
          </div>

          {/* Satuan & Barcode */}
          {selectedProduct && selectedDistributor && units.length > 0 && (
            <div className="mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Satuan & Barcode
                </label>
              </div>
              <div className="space-y-4 border border-gray-200 rounded-lg p-3 md:p-4">
                {units.map(unit => {
                  const barcodes = unitBarcodes[unit.id] || [];
                  const currentInput = currentInputs[unit.id] || '';
                  
                  // Handler untuk update input
                  const handleInputChange = (value) => {
                    setCurrentInputs(prev => ({
                      ...prev,
                      [unit.id]: value
                    }));
                  };
                  
                  // Handler untuk tambah barcode dari input (Enter atau blur)
                  const handleAddBarcodeFromInput = (e) => {
                    if (e.type === 'keydown' && e.key !== 'Enter') return;
                    e.preventDefault();
                    
                    const barcodeValue = currentInput.trim();
                    if (!barcodeValue) return;

                    // Cek duplikat di form atau database
                    if (isBarcodeExists(barcodeValue)) {
                      showToast('Barcode sudah ada (duplikat atau sudah terdaftar di database).', 'error');
                      return;
                    }

                    // Tambah barcode baru
                    setUnitBarcodes(prev => ({
                      ...prev,
                      [unit.id]: [...(prev[unit.id] || []), barcodeValue]
                    }));
                    // Clear input
                    handleInputChange('');
                  };

                  return (
                    <div key={unit.id} className="p-3 md:p-3 bg-gray-50 rounded-lg">
                      <div className="mb-3">
                        <div className="font-medium text-gray-900 text-sm md:text-base">{unit.name}</div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Conversion: {unit.conversion} {units.find(u => u.conversion === 1)?.name || 'Pcs'}
                        </div>
                      </div>
                      
                      {/* Input barcode baru */}
                      <div className="mb-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleAddBarcodeFromInput}
                            onBlur={handleAddBarcodeFromInput}
                            placeholder="Input barcode dan tekan Enter..."
                            className="flex-1 p-2.5 md:p-2 border border-gray-300 rounded-md text-sm md:text-sm font-mono"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await generateBarcode(1);
                                  if (response.barcodes && response.barcodes.length > 0) {
                                    const generated = response.barcodes[0];
                                    // Generate sudah otomatis cek duplikat di backend, tapi tetap cek di frontend juga
                                    if (isBarcodeExists(generated)) {
                                      showToast('Barcode hasil generate sudah ada (duplikat atau sudah terdaftar di database).', 'error');
                                      return;
                                    }
                                    // Tambah barcode yang di-generate
                                    setUnitBarcodes(prev => ({
                                      ...prev,
                                      [unit.id]: [...(prev[unit.id] || []), generated]
                                    }));
                                  }
                                } catch (error) {
                                  console.error("Gagal generate barcode:", error);
                                }
                              }}
                              className="flex-1 sm:flex-none px-3 py-2.5 md:py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap"
                              title="Generate Barcode"
                            >
                              Generate
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Clear input textbox saja
                                handleInputChange('');
                              }}
                              className="flex-1 sm:flex-none px-3 py-2.5 md:py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 whitespace-nowrap"
                              title="Clear Input"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tabel barcode yang sudah diinput */}
                      {barcodes.length > 0 && (
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">No</th>
                                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Barcode</th>
                                  <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {barcodes.map((barcode, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                                      <input
                                        type="text"
                                        value={barcode}
                                        onChange={(e) => handleUpdateBarcode(unit.id, index, e.target.value)}
                                        className="w-full p-1.5 md:p-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-mono"
                                      />
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBarcode(unit.id, index)}
                                        className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                                        title="Hapus Barcode"
                                      >
                                        Hapus
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-6">
            <button
              type="button"
              onClick={() => navigate('/kelola-barcode')}
              className="flex-1 bg-gray-300 text-gray-800 font-bold py-2.5 md:py-2 px-4 rounded-lg hover:bg-gray-400 transition text-sm md:text-base"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2.5 md:py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm md:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

