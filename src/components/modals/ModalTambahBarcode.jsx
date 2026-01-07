import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalTambahBarcode({ onClose, onSave }) {
  const { 
    products, 
    distributors, 
    createBarcode, 
    generateBarcode,
    getProductByName,
    apiFetch
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

  // Handler untuk tambah barcode baru untuk satuan tertentu
  const handleAddBarcode = (unitId) => {
    setUnitBarcodes(prev => ({
      ...prev,
      [unitId]: [...(prev[unitId] || []), '']
    }));
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

  // Handler untuk generate barcode per unit (untuk barcode kosong pertama atau tambah baru)
  const handleGenerateBarcode = async (unitId, index = null) => {
    try {
      const response = await generateBarcode(1);
      if (response.barcodes && response.barcodes.length > 0) {
        if (index !== null) {
          // Update barcode di index tertentu
          handleUpdateBarcode(unitId, index, response.barcodes[0]);
        } else {
          // Cari barcode kosong pertama, atau tambah baru
          const currentBarcodes = unitBarcodes[unitId] || [];
          const emptyIndex = currentBarcodes.findIndex(b => !b || b.trim() === '');
          if (emptyIndex >= 0) {
            handleUpdateBarcode(unitId, emptyIndex, response.barcodes[0]);
          } else {
            // Tambah barcode baru
            handleAddBarcode(unitId);
            setTimeout(() => {
              const newIndex = currentBarcodes.length;
              handleUpdateBarcode(unitId, newIndex, response.barcodes[0]);
            }, 0);
          }
        }
      }
    } catch (error) {
      console.error("Gagal generate barcode:", error);
    }
  };

  // Handler untuk generate semua barcode (generate untuk barcode kosong pertama di setiap satuan)
  const handleGenerateAll = async () => {
    try {
      const unitsToGenerate = units.filter(unit => {
        const barcodes = unitBarcodes[unit.id] || [];
        return barcodes.length === 0 || barcodes.some(b => !b || b.trim() === '');
      });
      
      if (unitsToGenerate.length === 0) {
        return; // Semua satuan sudah punya barcode
      }

      const response = await generateBarcode(unitsToGenerate.length);
      if (response.barcodes && response.barcodes.length > 0) {
        const newBarcodes = { ...unitBarcodes };
        unitsToGenerate.forEach((unit, index) => {
          const currentBarcodes = newBarcodes[unit.id] || [];
          const emptyIndex = currentBarcodes.findIndex(b => !b || b.trim() === '');
          if (emptyIndex >= 0) {
            // Update barcode kosong pertama
            currentBarcodes[emptyIndex] = response.barcodes[index];
          } else {
            // Tambah barcode baru
            currentBarcodes.push(response.barcodes[index]);
          }
          newBarcodes[unit.id] = currentBarcodes;
        });
        setUnitBarcodes(newBarcodes);
      }
    } catch (error) {
      console.error("Gagal generate barcode:", error);
    }
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
    units.forEach(unit => {
      const barcodes = unitBarcodes[unit.id] || [];
      barcodes.forEach(barcode => {
        if (barcode && barcode.trim()) {
          barcodesToAdd.push({
            productId: selectedProduct.id,
            distributorId: selectedDistributor,
            unitId: unit.id,
            barcode: barcode.trim()
          });
        }
      });
    });

    if (barcodesToAdd.length === 0) {
      setErrors({ barcode: 'Minimal 1 barcode harus diisi' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createBarcode(barcodesToAdd);
      onSave();
    } catch (error) {
      // Error sudah ditangani di createBarcode
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[101] p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Tambah Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

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
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
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
                    if (barcodeValue) {
                      // Tambah barcode baru
                      setUnitBarcodes(prev => ({
                        ...prev,
                        [unit.id]: [...(prev[unit.id] || []), barcodeValue]
                      }));
                      // Clear input
                      handleInputChange('');
                    }
                  };

                  return (
                    <div key={unit.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="mb-3">
                        <div className="font-medium text-gray-900">{unit.name}</div>
                        <div className="text-sm text-gray-500">
                          Conversion: {unit.conversion} {units.find(u => u.conversion === 1)?.name || 'Pcs'}
                        </div>
                      </div>
                      
                      {/* Input barcode baru */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleAddBarcodeFromInput}
                            onBlur={handleAddBarcodeFromInput}
                            placeholder="Input barcode dan tekan Enter..."
                            className="flex-1 p-2 border border-gray-300 rounded-md text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await generateBarcode(1);
                                if (response.barcodes && response.barcodes.length > 0) {
                                  // Tambah barcode yang di-generate
                                  setUnitBarcodes(prev => ({
                                    ...prev,
                                    [unit.id]: [...(prev[unit.id] || []), response.barcodes[0]]
                                  }));
                                }
                              } catch (error) {
                                console.error("Gagal generate barcode:", error);
                              }
                            }}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            title="Generate Barcode"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                      
                      {/* Tabel barcode yang sudah diinput */}
                      {barcodes.length > 0 && (
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">No</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Barcode</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {barcodes.map((barcode, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={barcode}
                                      onChange={(e) => handleUpdateBarcode(unit.id, index, e.target.value)}
                                      className="w-full p-1.5 border border-gray-300 rounded-md text-sm font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBarcode(unit.id, index)}
                                      className="text-red-600 hover:text-red-900"
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
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.barcode && (
                <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

