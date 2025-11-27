import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

function PageHelp() {
  const [openSectionId, setOpenSectionId] = useState(null);

  const toggleSection = (sectionId) => {
    // Jika section yang diklik sudah terbuka, tutup. Jika belum, buka (dan tutup yang lain)
    setOpenSectionId(prev => prev === sectionId ? null : sectionId);
  };

  const helpSections = [
    {
      id: 'overview',
      title: 'Gambaran Umum Aplikasi',
      icon: QuestionMarkCircleIcon,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Aplikasi Point of Sale (POS) ini dirancang untuk membantu mengelola toko Anda dengan efisien. 
            Aplikasi ini mencakup fitur-fitur lengkap untuk penjualan, manajemen stok, pembelian, dan laporan.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Gunakan menu di sidebar kiri untuk navigasi ke berbagai fitur aplikasi.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'penjualan',
      title: 'Penjualan',
      icon: ShoppingCartIcon,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Cara Melakukan Penjualan:</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Pilih pelanggan dari dropdown "Pilih Pelanggan" (opsional, bisa pilih "UMUM")</li>
            <li>Tambahkan barang ke keranjang dengan cara:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Scan barcode menggunakan scanner</li>
                <li>Klik tombol "Cari Barang" dan pilih dari daftar</li>
              </ul>
            </li>
            <li>Atur jumlah barang yang akan dibeli (gunakan tombol + atau -)</li>
            <li>Jika ada diskon, masukkan jumlah diskon</li>
            <li>Masukkan uang yang dibayarkan</li>
            <li>Pilih jenis transaksi:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>LUNAS:</strong> Pembayaran penuh (uang cukup)</li>
                <li><strong>MASUK BON:</strong> Pembayaran sebagian atau tidak dibayar (hutang)</li>
                <li><strong>BAYAR SEBAGIAN:</strong> Pembayaran sebagian dengan sisa hutang</li>
              </ul>
            </li>
            <li>Klik tombol "Proses Transaksi"</li>
            <li>Cetak struk jika diperlukan</li>
          </ol>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Tombol "MASUK BON" akan otomatis dinonaktifkan jika uang yang dibayarkan sudah cukup.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'master-data',
      title: 'Master Data',
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Fitur Master Data hanya tersedia untuk ADMIN dan MANAGER. 
              KASIR tidak dapat mengakses menu Master Data.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Master Barang</h4>
            <p className="text-gray-700 mb-2">Kelola data produk/barang yang dijual:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Tambah Barang:</strong> Klik tombol "+ Barang Baru"</li>
              <li><strong>Edit Barang:</strong> Klik icon pensil pada baris barang</li>
              <li><strong>Hapus Barang:</strong> Klik icon trash pada baris barang</li>
              <li><strong>Filter:</strong> Gunakan dropdown untuk filter by distributor atau satuan</li>
              <li><strong>Bulk Update:</strong> Pilih beberapa barang dengan checkbox, lalu klik "Ubah Distributor" atau "Ubah Satuan"</li>
              <li><strong>Import:</strong> Gunakan tombol "Import" untuk import data dari Excel</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Master Pelanggan</h4>
            <p className="text-gray-700 mb-2">Kelola data pelanggan:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Tambah/Edit/Hapus:</strong> Sama seperti Master Barang</li>
              <li><strong>Kirim Email:</strong> Klik icon email untuk mengirim email ke pelanggan</li>
              <li><strong>Kirim WhatsApp:</strong> Klik icon WhatsApp untuk mengirim pesan</li>
              <li><strong>Bulk Email/WhatsApp:</strong> Pilih beberapa pelanggan, lalu klik tombol bulk action</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Master Supplier</h4>
            <p className="text-gray-700 mb-2">Kelola data supplier/distributor:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Tambahkan informasi supplier seperti nama, alamat, kontak</li>
              <li>Gunakan untuk membuat Purchase Order (PO)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'stok',
      title: 'Manajemen Stok',
      icon: CubeIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Cek Barang</h4>
            <p className="text-gray-700 mb-2">Lihat daftar semua barang dan stoknya:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Gunakan search bar untuk mencari barang</li>
              <li>Filter by distributor untuk melihat barang dari supplier tertentu</li>
              <li>Klik "Kartu" untuk melihat riwayat stok</li>
              <li><strong>Hanya ADMIN/MANAGER:</strong> Klik "Transfer" untuk transfer stok antar gudang</li>
              <li><strong>Hanya ADMIN/MANAGER:</strong> Klik "+ Stok" untuk menambah stok manual</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-700">
                <strong>Catatan:</strong> Fitur tambah stok dan transfer stok hanya tersedia untuk ADMIN dan MANAGER. 
                KASIR hanya dapat melihat informasi stok.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Stok Opname</h4>
            <p className="text-gray-700 mb-2">Lakukan penghitungan fisik stok:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Masukkan stok fisik untuk setiap barang</li>
              <li>Sistem akan otomatis menghitung selisih dengan stok sistem</li>
              <li>Klik "Simpan Hasil" untuk menyimpan hasil opname</li>
              <li>Stok akan otomatis disesuaikan sesuai hasil opname</li>
            </ol>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-700">
                <strong>Catatan:</strong> Fitur Stok Opname hanya tersedia untuk ADMIN dan MANAGER.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Kartu Stok</h4>
            <p className="text-gray-700 mb-2">Lihat riwayat perubahan stok untuk setiap barang:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Pilih barang dari daftar</li>
              <li>Klik "Lihat Kartu Stok"</li>
              <li>Lihat semua transaksi masuk/keluar stok</li>
              <li>Klik No PO/Invoice untuk copy ke clipboard</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'pembelian',
      title: 'Pembelian & Purchase Order',
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Fitur Pembelian & Purchase Order hanya tersedia untuk ADMIN dan MANAGER. 
              KASIR tidak dapat mengakses menu ini.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Pesan Barang (PO)</h4>
            <p className="text-gray-700 mb-2">Buat Purchase Order untuk memesan barang ke supplier:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Pilih distributor/supplier</li>
              <li>Lihat saran barang stok menipis (opsional)</li>
              <li>Tambahkan barang ke PO dengan klik "Tambah"</li>
              <li>Atur jumlah dan satuan untuk setiap barang</li>
              <li>Klik "Buat PO" untuk menyimpan</li>
              <li>PO akan otomatis ter-generate sebagai PDF</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Cek Pesanan</h4>
            <p className="text-gray-700 mb-2">Lihat dan terima pesanan yang sudah datang:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Pilih PO yang sudah datang</li>
              <li>Klik "CEK" untuk melihat detail</li>
              <li>Masukkan barcode baru jika ada (opsional)</li>
              <li>Klik "Konfirmasi Datang" untuk menerima barang</li>
              <li>Stok akan otomatis bertambah</li>
              <li>Gunakan tombol "Download" untuk download PDF PO</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'retur',
      title: 'Retur Penjualan & Pembelian',
      icon: ArrowPathIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Retur Penjualan</h4>
            <p className="text-gray-700 mb-2">Proses retur barang dari pelanggan:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Klik "Retur Baru"</li>
              <li>Pilih pelanggan dan masukkan nomor invoice</li>
              <li>Pilih barang yang akan diretur</li>
              <li>Atur jumlah retur (tidak boleh melebihi jumlah yang dibeli)</li>
              <li>Sistem akan menampilkan jumlah yang sudah diretur sebelumnya</li>
              <li><strong>Jika Anda adalah KASIR:</strong> Masukkan password admin untuk konfirmasi</li>
              <li>Klik "Simpan Retur"</li>
              <li>Stok akan otomatis bertambah dan hutang pelanggan berkurang</li>
            </ol>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <p className="text-sm text-blue-700">
                <strong>Fitur:</strong> Retur penjualan mendukung retur sebagian (tidak harus semua barang dalam 1 struk).
              </p>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-700">
                <strong>Catatan Penting:</strong> Untuk KASIR, retur penjualan memerlukan password admin sebagai konfirmasi. 
                Silakan minta admin/pemilik toko untuk memasukkan password saat melakukan retur. 
                ADMIN dan MANAGER dapat melakukan retur tanpa password.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Retur Pembelian</h4>
            <p className="text-gray-700 mb-2">Proses retur barang ke supplier:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Klik "Retur Baru"</li>
              <li>Pilih supplier dan masukkan nomor PO</li>
              <li>Pilih PO yang sudah diterima (COMPLETED)</li>
              <li>Pilih barang yang akan diretur</li>
              <li>Masukkan harga retur untuk setiap barang</li>
              <li>Klik "Simpan Retur"</li>
              <li>Stok akan otomatis berkurang dan hutang supplier bertambah</li>
            </ol>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-700">
                <strong>Catatan:</strong> Fitur Retur Pembelian hanya tersedia untuk ADMIN dan MANAGER.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'piutang-hutang',
      title: 'Piutang & Hutang',
      icon: CurrencyDollarIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Piutang Pelanggan</h4>
            <p className="text-gray-700 mb-2">Kelola hutang pelanggan:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Lihat daftar pelanggan yang memiliki hutang</li>
              <li>Gunakan search untuk mencari pelanggan tertentu</li>
              <li>Klik "Bayar Utang" untuk membayar hutang pelanggan</li>
              <li>Gunakan tombol "Export" untuk export data ke Excel</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Hutang Supplier</h4>
            <p className="text-gray-700 mb-2">Kelola hutang ke supplier:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Lihat daftar supplier yang memiliki hutang</li>
              <li>Klik "Bayar Hutang" untuk membayar hutang supplier</li>
              <li>Hutang akan bertambah saat retur pembelian</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-700">
                <strong>Catatan:</strong> Fitur Hutang Supplier hanya tersedia untuk ADMIN dan MANAGER. 
                KASIR tidak dapat mengakses menu ini.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'laporan',
      title: 'Laporan',
      icon: ChartBarIcon,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Fitur Laporan hanya tersedia untuk ADMIN dan MANAGER. 
              KASIR tidak dapat mengakses menu ini.
            </p>
          </div>
          <h4 className="font-semibold text-gray-900">Ringkasan Laporan</h4>
          <p className="text-gray-700 mb-4">
            Halaman laporan menampilkan ringkasan lengkap aktivitas toko Anda:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Statistik Keuangan:</strong> Total penjualan, jumlah transaksi, piutang, dan hutang</li>
            <li><strong>Grafik Penjualan Harian:</strong> Visualisasi penjualan per hari</li>
            <li><strong>Barang Terlaris:</strong> Daftar produk yang paling banyak terjual</li>
            <li><strong>Stok Menipis:</strong> Daftar barang yang stoknya menipis (dengan pagination)</li>
            <li><strong>Riwayat Opname:</strong> Riwayat penyesuaian stok</li>
          </ul>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
            <p className="text-sm text-green-700">
              <strong>Tip:</strong> Gunakan dropdown periode untuk melihat laporan harian, mingguan, bulanan, atau semua waktu.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Tips & Trik',
      icon: QuestionMarkCircleIcon,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Gunakan barcode scanner untuk input cepat di halaman Penjualan</li>
              <li>Gunakan search bar untuk mencari barang/pelanggan dengan cepat</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Lakukan stok opname secara berkala untuk menjaga akurasi stok</li>
              <li>Update stok minimum untuk setiap barang agar mendapat notifikasi saat stok menipis</li>
              <li>Gunakan filter distributor untuk memudahkan pencarian barang</li>
              <li>Cetak struk setelah setiap transaksi untuk dokumentasi</li>
              <li>Gunakan fitur export untuk backup data secara berkala</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Troubleshooting</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Stok tidak sesuai:</strong> Lakukan stok opname untuk menyesuaikan</li>
              <li><strong>Data tidak muncul:</strong> Refresh halaman atau cek koneksi internet</li>
              <li><strong>Error saat transaksi:</strong> Pastikan stok barang mencukupi</li>
              <li><strong>Email/WhatsApp tidak terkirim:</strong> Cek konfigurasi di backend</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="page-content p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center mb-4">
            <QuestionMarkCircleIcon className="w-12 h-12 mr-4" />
            <div>
              <h1 className="text-3xl font-bold">Panduan Penggunaan Aplikasi</h1>
              <p className="text-blue-100 mt-2">Pelajari cara menggunakan semua fitur aplikasi dengan mudah</p>
            </div>
          </div>
        </div>

        {/* Help Sections */}
        <div className="space-y-4">
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSectionId === section.id;
            
            return (
              <div key={section.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Icon className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  {isOpen ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="pt-4">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <ShoppingCartIcon className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Penjualan</span>
            </Link>
            <Link to="/master-barang" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
              <CubeIcon className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Master Barang</span>
            </Link>
            <Link to="/laporan" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <ChartBarIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Laporan</span>
            </Link>
            <Link to="/barang" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
              <BookOpenIcon className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Cek Barang</span>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Butuh bantuan lebih lanjut? Hubungi administrator sistem.</p>
        </div>
      </div>
    </div>
  );
}

export default PageHelp;

