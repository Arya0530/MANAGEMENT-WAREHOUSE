import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BarangMasuk from "./pages/BarangMasuk";
import TambahBarang from "./pages/TambahBarang";
import EditBarang from "./pages/EditBarang";
import LaporanRiwayat from "./pages/LaporanRiwayat";
import KelolaSupplier from "./pages/KelolaSupplier";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rambu lalu lintas: Kalau URL kosong, lempar ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Daftar rute halaman lu */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/barang-masuk" element={<BarangMasuk />} />
        <Route path="/tambah-barang" element={<TambahBarang />} />
        <Route path="/edit-barang/:id" element={<EditBarang />} />
        <Route path="/riwayat" element={<LaporanRiwayat />} />
        <Route path="/supplier" element={<KelolaSupplier />} />

      </Routes>
    </BrowserRouter>
  );
}