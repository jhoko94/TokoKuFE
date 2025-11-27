# Toko POS System - Frontend

Frontend aplikasi Point of Sale (POS) yang dibangun dengan React dan Vite. Aplikasi ini menyediakan antarmuka yang user-friendly dan responsive untuk mengelola toko.

## 🚀 Teknologi

- **React** v19.1.1 - UI library
- **Vite** v7.1.14 - Build tool
- **React Router DOM** v7.9.5 - Routing
- **Tailwind CSS** v3.4.18 - Styling
- **Heroicons** v2.2.0 - Icons
- **jsPDF** v3.0.3 - PDF generation
- **PapaParse** v5.4.1 - CSV parsing

## 📋 Fitur Utama

### 1. Authentication & Authorization
- Login page dengan "Remember me"
- Protected routes
- Role-based UI (menampilkan menu sesuai role)
- Auto logout saat token expired

### 2. Master Data
- **Master Barang**: 
  - CRUD produk dengan multi-unit
  - Filter by distributor
  - Bulk update distributor & satuan
  - Import dari Excel
  - (Hanya ADMIN/MANAGER)
- **Master Pelanggan**: 
  - CRUD pelanggan
  - Kirim email & WhatsApp (single & bulk)
  - (Hanya ADMIN/MANAGER)
- **Master Supplier**: 
  - CRUD supplier
  - (Hanya ADMIN/MANAGER)

### 3. Penjualan
- **Halaman Penjualan**:
  - Two-column layout (cart & payment)
  - Barcode scanning
  - Modal pencarian barang dengan pagination
  - Multi-payment (LUNAS, BON, Bayar Sebagian)
  - Validasi pembayaran
  - Print receipt (PDF)
- **History Penjualan**:
  - Daftar semua transaksi
  - Search & filter
  - Detail transaksi
  - Print receipt

### 4. Retur
- **Retur Penjualan**:
  - Retur sebagian (tidak harus semua item)
  - Validasi terhadap transaksi asli
  - Password admin untuk KASIR
  - Tracking retur sebelumnya
- **Retur Pembelian**:
  - Retur ke supplier
  - Validasi PO
  - (Hanya ADMIN/MANAGER)

### 5. Pembelian
- **Pesan Barang (PO)**:
  - Buat Purchase Order
  - Saran stok menipis dengan pagination
  - Generate PDF PO
  - (Hanya ADMIN/MANAGER)
- **Cek Pesanan**:
  - Lihat PO yang pending/completed
  - Terima PO dan update stok
  - Download PO PDF
  - (Hanya ADMIN/MANAGER)

### 6. Manajemen Stok
- **Cek Barang**:
  - Daftar semua barang dengan stok
  - Search & filter by distributor
  - Kartu stok
  - Tambah stok (Hanya ADMIN/MANAGER)
  - Transfer stok (Hanya ADMIN/MANAGER)
- **Stok Opname**:
  - Input stok fisik
  - Auto calculate selisih
  - Pagination untuk saran stok menipis
  - (Hanya ADMIN/MANAGER)
- **Kartu Stok**:
  - Riwayat perubahan stok
  - Filter by date range
  - Copy PO/Invoice number
  - Table layout yang informatif

### 7. Piutang & Hutang
- **Piutang Pelanggan**:
  - Daftar pelanggan dengan hutang
  - Search & pagination
  - Bayar hutang
  - Export ke Excel
- **Hutang Supplier**:
  - Daftar supplier dengan hutang
  - Bayar hutang
  - (Hanya ADMIN/MANAGER)

### 8. Laporan
- Dashboard dengan statistik
- Grafik penjualan harian
- Barang terlaris
- Stok menipis dengan pagination
- Riwayat opname
- (Hanya ADMIN/MANAGER)

### 9. Komunikasi
- **Email**:
  - Single & bulk send
  - Progress indicator
  - Quota tracking
  - (Hanya ADMIN/MANAGER)
- **WhatsApp**:
  - Single & bulk send
  - Progress indicator
  - Multiple provider support
  - (Hanya ADMIN/MANAGER)

### 10. User & Store Management
- **Profile**:
  - Edit profile user
  - Change password
  - Store profile (Hanya ADMIN/MANAGER)
- **Store Info**:
  - Edit informasi toko
  - Logo, alamat, kontak, dll
  - (Hanya ADMIN/MANAGER)

### 11. Help & Documentation
- Panduan penggunaan lengkap
- Accordion sections
- Quick links
- Tips & tricks

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first, fully responsive
- **Modern UI**: Clean dan intuitive interface
- **Color Theme**: Purple/pink gradient theme
- **Typography**: Roboto font
- **Icons**: Heroicons untuk konsistensi
- **Loading States**: Loading indicators untuk async operations
- **Error Handling**: Toast notifications untuk feedback
- **Pagination**: Reusable pagination component
- **Modals**: Reusable modal components
- **Scroll to Top**: Auto scroll saat navigasi

## 🔐 Role-Based Access Control

### ADMIN & MANAGER
- Akses penuh ke semua fitur
- Semua menu terlihat
- Semua aksi tersedia

### KASIR
- Menu terbatas (tidak ada Master Data, Pembelian, Laporan, Hutang Supplier)
- Retur penjualan memerlukan password admin
- Tidak bisa tambah stok
- Tidak bisa edit store profile

## 📦 Instalasi

### Prerequisites
- Node.js v22 atau lebih tinggi
- npm atau yarn
- Backend API sudah berjalan

### Langkah Instalasi

1. **Clone repository dan masuk ke folder frontend**
```bash
cd proyek-toko-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
Buat file `.env` di root folder dengan isi:
```env
# URL backend API
VITE_API_URL=http://localhost:3001/api
```

4. **Jalankan development server**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (atau port yang tersedia)

5. **Build untuk production**
```bash
npm run build
```

File hasil build akan ada di folder `dist/`

## 📁 Struktur Project

```
proyek-toko-react/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Pagination.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleProtectedRoute.jsx
│   │   ├── ScrollToTop.jsx
│   │   └── modals/      # Modal components
│   ├── context/         # Context providers
│   │   └── StoreContext.jsx
│   ├── pages/           # Page components
│   │   ├── PageLogin.jsx
│   │   ├── PageJualan.jsx
│   │   ├── PageMasterBarang.jsx
│   │   ├── PageMasterPelanggan.jsx
│   │   ├── PageMasterSupplier.jsx
│   │   ├── PageReturPenjualan.jsx
│   │   ├── PageReturPembelian.jsx
│   │   ├── PageHistoryPenjualan.jsx
│   │   ├── PageBarang.jsx
│   │   ├── PageOpname.jsx
│   │   ├── PageKartuStok.jsx
│   │   ├── PagePesanan.jsx
│   │   ├── PageCekPesanan.jsx
│   │   ├── PageUtang.jsx
│   │   ├── PageHutangSupplier.jsx
│   │   ├── PageLaporan.jsx
│   │   ├── PageHelp.jsx
│   │   └── PageProfile.jsx
│   ├── utils/           # Utility functions
│   │   ├── formatters.js
│   │   └── generatePOPDF.js
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── .env                 # Environment variables
├── package.json
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── README.md
```

## 🛠️ Development

### Scripts
```bash
npm run dev      # Run development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables
- `VITE_API_URL`: URL backend API (default: `http://localhost:3001/api`)

## 🎯 Key Features Implementation

### State Management
- Menggunakan React Context API (`StoreContext`)
- Global state untuk: user, products, customers, suppliers, dll
- Centralized API calls

### Routing
- React Router DOM untuk navigation
- Protected routes dengan authentication check
- Role-based route protection
- Scroll to top on route change

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Horizontal scroll untuk tables di mobile
- Responsive modals
- Touch-friendly buttons

### Performance Optimizations
- Pagination untuk large datasets
- Debounce untuk search input
- Lazy loading untuk modals
- Optimized API calls
- Bootstrap endpoint untuk initial load

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security

- JWT token storage di localStorage
- Auto logout saat token expired
- Protected routes
- Role-based UI rendering
- Input validation
- XSS protection (React default)

## 📄 License

ISC

## 👥 Support

Untuk bantuan lebih lanjut, hubungi administrator sistem atau lihat halaman "Panduan Penggunaan" di aplikasi.
