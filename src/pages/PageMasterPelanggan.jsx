import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { PlusIcon, PencilIcon, TrashIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ModalMasterPelanggan from '../components/modals/ModalMasterPelanggan';
import ModalKonfirmasi from '../components/modals/ModalKonfirmasi';
import ModalKirimEmail from '../components/modals/ModalKirimEmail';
import ModalKirimWhatsApp from '../components/modals/ModalKirimWhatsApp';
import Pagination from '../components/Pagination';

function PageMasterPelanggan() {
  const { customers, deleteCustomer, fetchCustomersPaginated, sendEmailToCustomer, bulkSendEmail, sendWhatsAppToCustomer, bulkSendWhatsApp } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [customersList, setCustomersList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerToEmail, setCustomerToEmail] = useState(null);
  const [customerToWhatsApp, setCustomerToWhatsApp] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await fetchCustomersPaginated(currentPage, itemsPerPage, searchTerm);
        setCustomersList(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Gagal memuat pelanggan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [currentPage, itemsPerPage, searchTerm, fetchCustomersPaginated]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle checkbox selection
  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === customersList.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customersList.map(c => c.id)));
    }
  };

  // Handle bulk send email
  const handleBulkSendEmail = async (subject, message) => {
    try {
      await bulkSendEmail(Array.from(selectedCustomers), subject, message);
      setSelectedCustomers(new Set());
    } catch (error) {
      // Error sudah ditangani di bulkSendEmail
    }
  };

  // Handle bulk send WhatsApp
  const handleBulkSendWhatsApp = async (message) => {
    try {
      await bulkSendWhatsApp(Array.from(selectedCustomers), message);
      setSelectedCustomers(new Set());
    } catch (error) {
      // Error sudah ditangani di bulkSendWhatsApp
    }
  };

  return (
    <div className="page-content p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold">Master Pelanggan</h2>
        <button 
          onClick={() => setModalState('new')}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Pelanggan Baru</span>
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Cari nama pelanggan..." 
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm"
      />

      {/* Bulk Action Bar */}
      {selectedCustomers.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedCustomers.size} pelanggan dipilih
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const selectedCustomersList = customersList.filter(c => selectedCustomers.has(c.id));
                const customersWithEmail = selectedCustomersList.filter(c => c.email);
                if (customersWithEmail.length === 0) {
                  alert('Tidak ada pelanggan yang dipilih memiliki alamat email');
                  return;
                }
                setCustomerToEmail({ 
                  id: 'bulk', 
                  name: `${selectedCustomers.size} pelanggan`,
                  email: `${customersWithEmail.length} pelanggan dengan email`,
                  isBulk: true,
                  customerIds: Array.from(selectedCustomers),
                  customers: selectedCustomersList
                });
              }}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2"
            >
              <EnvelopeIcon className="w-5 h-5" />
              <span>Kirim Email</span>
            </button>
            <button
              onClick={() => {
                const selectedCustomersList = customersList.filter(c => selectedCustomers.has(c.id));
                const customersWithPhone = selectedCustomersList.filter(c => c.phone);
                if (customersWithPhone.length === 0) {
                  alert('Tidak ada pelanggan yang dipilih memiliki nomor telepon');
                  return;
                }
                setCustomerToWhatsApp({ 
                  id: 'bulk', 
                  name: `${selectedCustomers.size} pelanggan`,
                  phone: `${customersWithPhone.length} pelanggan dengan nomor telepon`,
                  isBulk: true,
                  customerIds: Array.from(selectedCustomers),
                  customers: selectedCustomersList
                });
              }}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 flex items-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Kirim WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={customersList.length > 0 && selectedCustomers.size === customersList.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utang</th>
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
            ) : customersList.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'Tidak ada pelanggan yang sesuai dengan pencarian' : 'Belum ada pelanggan'}
                </td>
              </tr>
            ) : (
              customersList.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(customer.debt || 0).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {customer.email && (
                      <button 
                        onClick={() => setCustomerToEmail(customer)} 
                        className="text-blue-500 hover:text-blue-700"
                        title="Kirim Email"
                      >
                        <EnvelopeIcon className="w-5 h-5" />
                      </button>
                    )}
                    {customer.phone && (
                      <button 
                        onClick={() => setCustomerToWhatsApp(customer)} 
                        className="text-green-500 hover:text-green-700"
                        title="Kirim WhatsApp"
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => setModalState(customer)} 
                      className="text-yellow-500 hover:text-yellow-700"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setCustomerToDelete(customer)} 
                      className="text-red-500 hover:text-red-700"
                      title="Hapus"
                    >
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
        <ModalMasterPelanggan
          customerToEdit={modalState === 'new' ? null : modalState}
          onClose={async () => {
            setModalState(null);
            // Reload data setelah save/edit customer
            try {
              const response = await fetchCustomersPaginated(currentPage, itemsPerPage, searchTerm);
              setCustomersList(response.data);
              setPagination(response.pagination);
            } catch (error) {
              console.error("Gagal reload data:", error);
            }
          }}
        />
      )}

      {customerToDelete && (
        <ModalKonfirmasi
          title="Hapus Pelanggan"
          message={`Apakah Anda yakin ingin menghapus ${customerToDelete.name}?`}
          onConfirm={async () => {
            try {
              await deleteCustomer(customerToDelete.id);
              setCustomerToDelete(null);
              // Reload data
              const response = await fetchCustomersPaginated(currentPage, itemsPerPage, searchTerm);
              setCustomersList(response.data);
              setPagination(response.pagination);
            } catch (error) {
              // Error sudah ditangani di deleteCustomer
            }
          }}
          onCancel={() => setCustomerToDelete(null)}
        />
      )}

      {customerToEmail && (
        <ModalKirimEmail
          isOpen={!!customerToEmail}
          onClose={() => setCustomerToEmail(null)}
          customer={customerToEmail}
          onConfirm={async (subject, message) => {
            if (customerToEmail.isBulk) {
              await handleBulkSendEmail(subject, message);
            } else {
              await sendEmailToCustomer(customerToEmail.id, subject, message);
            }
            setCustomerToEmail(null);
          }}
        />
      )}

      {customerToWhatsApp && (
        <ModalKirimWhatsApp
          isOpen={!!customerToWhatsApp}
          onClose={() => setCustomerToWhatsApp(null)}
          customer={customerToWhatsApp}
          onConfirm={async (message) => {
            if (customerToWhatsApp.isBulk) {
              await handleBulkSendWhatsApp(message);
            } else {
              await sendWhatsAppToCustomer(customerToWhatsApp.id, message);
            }
            setCustomerToWhatsApp(null);
          }}
        />
      )}
    </div>
  );
}

export default PageMasterPelanggan;

