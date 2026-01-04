import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ModalMasterSupplier from '../components/modals/ModalMasterSupplier';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import Pagination from '../components/Pagination';

function PageMasterSupplier() {
  const { distributors, deleteDistributor, bulkDeleteDistributors } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [distributorsList, setDistributorsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [distributorToDelete, setDistributorToDelete] = useState(null);
  const [selectedDistributors, setSelectedDistributors] = useState(new Set());
  const [distributorsToBulkDelete, setDistributorsToBulkDelete] = useState(null);

  // Fetch dari bootstrap untuk sekarang (belum ada pagination endpoint untuk distributor)
  useEffect(() => {
    const filtered = distributors.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    setDistributorsList(paginated);
    setPagination({
      page: currentPage,
      limit: itemsPerPage,
      total: filtered.length,
      totalPages,
    });
    setIsLoading(false);
  }, [distributors, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold">Master Supplier</h2>
        <button 
          onClick={() => setModalState('new')}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Supplier Baru</span>
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nama supplier..." 
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
      />

      {/* Bulk Action Bar */}
      {selectedDistributors.size > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-900">
              {selectedDistributors.size} supplier dipilih
            </span>
            <button
              onClick={() => setSelectedDistributors(new Set())}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Batal
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDistributorsToBulkDelete(Array.from(selectedDistributors))}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-700 flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Hapus {selectedDistributors.size} Supplier</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={distributorsList.length > 0 && selectedDistributors.size === distributorsList.length}
                  onChange={() => {
                    if (selectedDistributors.size === distributorsList.length) {
                      setSelectedDistributors(new Set());
                    } else {
                      setSelectedDistributors(new Set(distributorsList.map(d => d.id)));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Barang</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : distributorsList.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'Tidak ada supplier yang sesuai dengan pencarian' : 'Belum ada supplier'}
                </td>
              </tr>
            ) : (
              distributorsList.map(distributor => (
                <tr key={distributor.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDistributors.has(distributor.id)}
                      onChange={() => {
                        setSelectedDistributors(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(distributor.id)) {
                            newSet.delete(distributor.id);
                          } else {
                            newSet.add(distributor.id);
                          }
                          return newSet;
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{distributor.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{distributor.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{distributor.phone || '-'}</div>
                    {distributor.email && <div className="text-gray-500 text-xs">{distributor.email}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{distributor.contactPerson || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {distributor.productCount || distributor._count?.products || 0} barang
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => setModalState(distributor)} className="text-yellow-500 hover:text-yellow-700">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setDistributorToDelete(distributor)} className="text-red-500 hover:text-red-700">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {!isLoading && pagination.total > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
        />
        </div>
      )}

      {modalState && (
        <ModalMasterSupplier
          distributorToEdit={modalState === 'new' ? null : modalState}
          onClose={() => setModalState(null)}
        />
      )}

      {distributorToDelete && (
        <ModalKonfirmasi
          title="Hapus Supplier"
          message={`Apakah Anda yakin ingin menghapus ${distributorToDelete.name}?`}
          onConfirm={async () => {
            try {
              await deleteDistributor(distributorToDelete.id);
              setDistributorToDelete(null);
              setSelectedDistributors(new Set());
            } catch (error) {
              // Error sudah ditangani di deleteDistributor
            }
          }}
          onCancel={() => setDistributorToDelete(null)}
        />
      )}

      {distributorsToBulkDelete && (
        <ModalKonfirmasi
          title="Hapus Banyak Supplier"
          message={`Apakah Anda yakin ingin menghapus ${distributorsToBulkDelete.length} supplier yang dipilih?`}
          onConfirm={async () => {
            try {
              await bulkDeleteDistributors(distributorsToBulkDelete);
              setDistributorsToBulkDelete(null);
              setSelectedDistributors(new Set());
            } catch (error) {
              // Error sudah ditangani di bulkDeleteDistributors
            }
          }}
          onCancel={() => setDistributorsToBulkDelete(null)}
        />
      )}
    </div>
  );
}

export default PageMasterSupplier;

