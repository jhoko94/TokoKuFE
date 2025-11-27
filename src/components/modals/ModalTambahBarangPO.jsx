import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatStockDisplay } from '../../utils/formatters';
import Pagination from '../Pagination';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalTambahBarangPO({ isOpen, onClose, distributorId, onProductSelect, onMultipleProductSelect, existingProductIds = [] }) {
  const { fetchProductsPaginated } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]); // Semua produk yang sudah difilter
  const [products, setProducts] = useState([]); // Produk untuk halaman saat ini
  const [selectedProducts, setSelectedProducts] = useState(new Set()); // Set of product IDs yang dipilih
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  // Debounce search term untuk mengurangi request API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset ke page 1 saat search berubah
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch semua products dengan limit besar, filter, lalu paginate di client
  useEffect(() => {
    if (!isOpen || !distributorId) return;

    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch dengan limit besar untuk mendapatkan semua produk yang sesuai filter
        const response = await fetchProductsPaginated(
          1, // Selalu fetch dari page 1
          1000, // Limit besar untuk mendapatkan semua data
          debouncedSearch,
          '', // unitSmall
          '', // unitLarge
          distributorId // Filter by distributor
        );
        
        // Filter out products that are already in the PO
        const filteredProducts = (response.data || []).filter(
          p => !existingProductIds.includes(p.id)
        );
        
        // Simpan semua produk yang sudah difilter
        setAllProducts(filteredProducts);
        
        // Hitung pagination berdasarkan filtered products
        const filteredTotal = filteredProducts.length;
        const filteredTotalPages = Math.ceil(filteredTotal / itemsPerPage);
        
        setPagination({
          page: currentPage,
          limit: itemsPerPage,
          total: filteredTotal,
          totalPages: filteredTotalPages
        });
      } catch (error) {
        console.error("Gagal memuat produk:", error);
        setAllProducts([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [isOpen, debouncedSearch, distributorId, fetchProductsPaginated, existingProductIds]);

  // Paginate di client-side berdasarkan allProducts
  useEffect(() => {
    if (allProducts.length === 0) {
      setProducts([]);
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    
    setProducts(paginatedProducts);
    
    // Update pagination
    const total = allProducts.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    setPagination({
      page: currentPage,
      limit: itemsPerPage,
      total,
      totalPages
    });
  }, [allProducts, currentPage, itemsPerPage]);

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
      setAllProducts([]);
      setProducts([]);
      setSelectedProducts(new Set());
    }
  }, [isOpen]);

  // Toggle select/deselect produk
  const handleToggleSelect = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Select all products on current page
  const handleSelectAll = () => {
    const allIdsOnPage = products.map(p => p.id);
    const allSelected = allIdsOnPage.every(id => selectedProducts.has(id));
    
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all on current page
        allIdsOnPage.forEach(id => newSet.delete(id));
      } else {
        // Select all on current page
        allIdsOnPage.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Tambahkan semua produk yang dipilih
  const handleAddSelected = () => {
    if (selectedProducts.size === 0) {
      alert('Pilih minimal 1 produk untuk ditambahkan.');
      return;
    }

    const selectedProductsData = allProducts.filter(p => selectedProducts.has(p.id));
    
    // Siapkan data produk untuk dikirim
    const productsToAdd = selectedProductsData.map(product => {
      const defaultUnit = product.units?.find(u => u.conversion === 1) || product.units?.[0];
      return {
        productId: product.id,
        product: product,
        qty: 1,
        unitName: defaultUnit?.name || 'Pcs'
      };
    }).filter(p => p.unitName); // Filter produk yang tidak punya unit

    if (productsToAdd.length === 0) {
      alert('Tidak ada produk yang valid untuk ditambahkan.');
      return;
    }

    // Jika ada onMultipleProductSelect, gunakan itu (lebih efisien)
    if (onMultipleProductSelect) {
      onMultipleProductSelect(productsToAdd);
    } else {
      // Fallback ke onProductSelect untuk backward compatibility
      productsToAdd.forEach(productData => {
        onProductSelect(productData);
      });
    }

    // Reset selection setelah ditambahkan
    setSelectedProducts(new Set());
  };

  // Handler untuk single product select (backward compatibility)
  const handleProductSelect = (product) => {
    const defaultUnit = product.units?.find(u => u.conversion === 1) || product.units?.[0];
    if (!defaultUnit) {
      alert('Produk ini tidak memiliki satuan. Silakan hubungi administrator.');
      return;
    }

    onProductSelect({
      productId: product.id,
      product: product,
      qty: 1,
      unitName: defaultUnit.name
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Tambah Barang ke PO</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search dan Select All */}
        <div className="p-4 border-b space-y-3">
          <input
            type="text"
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          {products.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={products.length > 0 && products.every(p => selectedProducts.has(p.id))}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Pilih Semua di Halaman Ini ({selectedProducts.size} dipilih)
                </span>
              </label>
              {selectedProducts.size > 0 && (
                <button
                  onClick={handleAddSelected}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                  Tambah {selectedProducts.size} Barang
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loader mx-auto mb-2"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {debouncedSearch ? 'Tidak ada produk yang ditemukan' : 'Tidak ada produk tersedia'}
            </p>
          ) : (
            <div className="space-y-2">
              {products.map(product => {
                const defaultUnit = product.units?.find(u => u.conversion === 1) || product.units?.[0];
                const isSelected = selectedProducts.has(product.id);
                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 hover:bg-gray-50 ${
                      isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Stok: {formatStockDisplay(product, product.stock)} (Min: {product.minStock})
                        </p>
                        {product.sku && (
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        )}
                      </div>
                      
                      {/* Single Select Button (backward compatibility) */}
                      <button
                        className="ml-4 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={pagination.limit}
              totalItems={pagination.total}
              onItemsPerPageChange={(newItemsPerPage) => {
                // Note: itemsPerPage is fixed at 10 for this modal
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

