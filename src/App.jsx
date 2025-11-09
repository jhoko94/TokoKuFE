import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PageJualan from "./pages/PageJualan";
import PageUtang from "./pages/PageUtang";
import PageBarang from "./pages/PageBarang";
import PageMasterBarang from "./pages/PageMasterBarang";
// Ini adalah file-file yang kita tambahkan belakangan:
import PageLaporan from "./pages/PageLaporan";
import PagePesanan from "./pages/PagePesanan";
import PageCekPesanan from "./pages/PageCekPesanan";
import PageOpname from "./pages/PageOpname";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PageJualan />} />
          <Route path="utang" element={<PageUtang />} />
          <Route path="barang" element={<PageBarang />} />
          <Route path="master-barang" element={<PageMasterBarang />} />
          
          {/* Rute-rute ini seharusnya sudah ada dari setup awal kita */}
          <Route path="laporan" element={<PageLaporan />} />
          <Route path="pesan-barang" element={<PagePesanan />} />
          <Route path="cek-pesanan" element={<PageCekPesanan />} />
          <Route path="opname" element={<PageOpname />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;