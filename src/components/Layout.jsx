import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar"; // Komponen Sidebar (Desktop)
import Header from "./Header";   // Komponen Header (Mobile)

function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* 1. Sidebar Desktop (dari nav lama) */}
      <Sidebar />

      {/* 2. Konten Utama */}
      <main className="flex-1 overflow-hidden">
        
        {/* 2a. Header Mobile (dari header lama) */}
        <Header />

        {/* 2b. Area Konten Halaman (Tempat PageJualan, PageUtang, dll akan muncul) */}
        <div className="h-full overflow-y-auto no-scrollbar md:pb-0">
          <Outlet /> {/* <-- Ini adalah "placeholder" dari React Router */}
        </div>

      </main>

      {/* MODALS: Modal seringkali ditempatkan di sini (di level Layout) 
        dan dikontrol menggunakan state global (Context) atau portal.
      */}

    </div>
  );
}
export default Layout;