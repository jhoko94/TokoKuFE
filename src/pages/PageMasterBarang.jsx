import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Impor modal yang akan kita buat
import ModalMasterBarang from '../components/modals/ModalMasterBarang';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi'; // Modal generic

function PageMasterBarang() {
  // 1. Ambil data global dan fungsi
  const { products, deleteProduct } = useStore();
  
  // 2. State Lokal
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk mengontrol modal:
  // 'null' = modal tertutup
  // 'new' = modal terbuka untuk "Tambah Baru"
  // {product} = modal terbuka untuk "Edit"
  const [modalState, setModalState] = useState(null);
  
  // State untuk modal konfirmasi hapus
  const [productToDelete, setProductToDelete] = useState(null);

  // 3. Logika Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  // 4. Event Handlers
  const handleOpenModal = (product = null) => {
    // Jika tidak ada produk, set 'new'. Jika ada, set ke produk itu.
    setModalState(product ? product : 'new');
  };
  
  const handleCloseModal = () => {
    setModalState(null);
  };
  
  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null); // Tutup modal konfirmasi
    }
  };

  // 5. Render JSX
  return (
    <>
      <div className="page-content p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Master Barang</h2>
          <button 
            onClick={() => handleOpenModal()} // Buka modal mode 'new'
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Barang Baru</span>
          </button>
        </div>

        {/* Search Bar */}
        <input 
          type="text" 
          id="master-inventory-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama atau kode barang..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
        />
        
        {/* Tabel Master Barang */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow-md overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satuan Kecil</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satuan Besar</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody id="master-inventory-list" className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => {
                      const satuanKecil = product.units.find(u => u.conversion === 1) || { name: 'N/A' };
                      const satuanBesar = product.units.find(u => u.conversion > 1) || null;
                      const satuanBesarString = satuanBesar 
                          ? `${satuanBesar.name} (${satuanBesar.conversion}x)` 
                          : 'N/A';
                          
                      return (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{satuanKecil.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{satuanBesarString}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button 
                              onClick={() => handleOpenModal(product)} // Buka modal mode 'edit'
                              className="text-yellow-500 hover:text-yellow-700" 
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setProductToDelete(product)} // Buka modal konfirmasi
                              className="text-red-500 hover:text-red-700" 
                              title="Hapus"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Render Modal (Secara Kondisional) */}
      
      {/* Modal Tambah/Edit Barang */}
      {modalState && (
        <ModalMasterBarang
          // Jika modalState adalah 'new', kirim null. Jika objek, kirim objek itu.
          productToEdit={modalState === 'new' ? null : modalState}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Modal Konfirmasi Hapus */}
      {productToDelete && (
        <ModalKonfirmasi
          title="Hapus Barang"
          message={`Apakah Anda yakin ingin menghapus <strong>${productToDelete.name}</strong> (${productToDelete.sku})? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setProductToDelete(null)}
        />
      )}
    </>
  );
}

export default PageMasterBarang;