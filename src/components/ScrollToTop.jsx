import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Komponen untuk scroll ke atas setiap kali route berubah
 * Ini memastikan bahwa ketika user pindah halaman, scroll position kembali ke atas
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window ke atas
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant untuk performa lebih baik
    });
    
    // Untuk mobile, scroll container utama (main element) yang memiliki overflow-y-auto
    const mainContent = document.querySelector('main');
    if (mainContent) {
      // Cari div dengan overflow-y-auto di dalam main
      const scrollableDiv = mainContent.querySelector('div[class*="overflow-y-auto"]');
      if (scrollableDiv) {
        scrollableDiv.scrollTop = 0;
      } else {
        // Jika tidak ada, scroll main langsung
        mainContent.scrollTop = 0;
      }
    }
    
    // Scroll area konten halaman jika ada (untuk memastikan semua container di-scroll)
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.scrollTop = 0;
    }
    
    // Scroll body dan document element jika ada
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default ScrollToTop;
