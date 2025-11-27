import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar"; // Komponen Sidebar (Desktop)
import Header from "./Header";   // Komponen Header (Mobile)
import Toast from "./Toast";     // Komponen Toast
import { useStore } from "../context/StoreContext";

function Layout() {
  const { toast, hideToast } = useStore();
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* 1. Sidebar Desktop (dari nav lama) */}
      <Sidebar />

      {/* 2. Konten Utama */}
      <main className="flex-1 overflow-hidden flex flex-col">
        
        {/* 2a. Header Mobile (dari header lama) */}
        <Header />

        {/* 2b. Area Konten Halaman (Tempat PageJualan, PageUtang, dll akan muncul) */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-4 min-h-0">
          <Outlet /> {/* <-- Ini adalah "placeholder" dari React Router */}
        </div>

      </main>

      {/* MODALS: Modal seringkali ditempatkan di sini (di level Layout) 
        dan dikontrol menggunakan state global (Context) atau portal.
      */}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration} // Durasi custom jika ada
        />
      )}

    </div>
  );
}
export default Layout;