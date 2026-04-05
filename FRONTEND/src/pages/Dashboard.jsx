import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [barang, setBarang] = useState([]);
  const [pendingTrans, setPendingTrans] = useState([]);
  const navigate = useNavigate();
  const [pendingKeluarTrans, setPendingKeluarTrans] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDataBarang();
      // SPV sama Admin berhak ngelihat dua antrean ini
      if (user.Role_Akses === 'Spv' || user.Role_Akses === 'Admin') {
        fetchPending();
        fetchPendingKeluar(); // <--- INI YANG KETINGGALAN TADI!
      }
    }
  }, []); // Kosongin biar nggak infinite loop

  // --- FUNGSI MASTER BARANG ---
  const fetchDataBarang = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/barang');
      setBarang(response.data.data);
    } catch (error) { console.error("Gagal narik data barang:", error); }
  };

  const handleDelete = async (idBarang) => {
    if (window.confirm("Yakin mau hapus barang ini?")) {
      try {
        await axios.delete(`http://localhost:8000/api/barang/${idBarang}`);
        alert("Barang berhasil dihapus!");
        fetchDataBarang(); 
      } catch (error) {
        alert("Gagal menghapus barang.");
        console.error(error);
      }
    }
  };

  // --- FUNGSI ANTREAN BARANG MASUK ---
  const fetchPending = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/barang-masuk/pending');
      setPendingTrans(response.data.data);
    } catch (error) { console.error("Gagal narik data pending masuk:", error); }
  };

  const handleApprove = async (idMasuk) => {
    try {
      await axios.post(`http://localhost:8000/api/approve-masuk/${idMasuk}`);
      alert("Barang berhasil di-Approve! Stok bertambah otomatis.");
      fetchDataBarang(); 
      fetchPending();    
    } catch (error) {
      alert("Gagal approve data.");
    }
  };

  const handleReject = async (idMasuk) => {
    if (window.confirm("Yakin mau NOLAK barang masuk ini?")) {
      try {
        await axios.post(`http://localhost:8000/api/reject-masuk/${idMasuk}`);
        alert("Transaksi masuk berhasil ditolak!");
        fetchPending(); 
      } catch (error) {
        alert("Gagal reject data.");
      }
    }
  };

  // --- FUNGSI ANTREAN BARANG KELUAR ---
  const fetchPendingKeluar = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/pending-keluar');
      setPendingKeluarTrans(response.data.data);
    } catch (error) { console.error("Gagal narik antrean keluar:", error); }
  };

  const handleApproveKeluar = async (idKeluar) => {
    try {
      await axios.post(`http://localhost:8000/api/approve-keluar/${idKeluar}`);
      alert("Barang Keluar di-Approve! Stok otomatis terpotong.");
      fetchDataBarang();    // Refresh stok di tabel atas biar keliatan berkurangnya
      fetchPendingKeluar(); // Refresh antrean keluar
    } catch (error) {
      alert("Gagal approve barang keluar.");
    }
  };

  const handleRejectKeluar = async (idKeluar) => {
    if (window.confirm("Yakin mau NOLAK barang keluar ini?")) {
      try {
        await axios.post(`http://localhost:8000/api/reject-keluar/${idKeluar}`);
        alert("Barang Keluar berhasil ditolak!");
        fetchPendingKeluar(); 
      } catch (error) {
        alert("Gagal reject barang keluar.");
      }
    }
  };

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  // NAH INI BARU BENER, RETURN-NYA DI DALAM FUNGSI DASHBOARD!
  return (
    <div className="min-h-screen bg-gray-light">
      {/* Navbar Minimalis */}
      <nav className="bg-navy-main text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-accent">E-Gudang Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Halo, <strong>{user.Nama}</strong></span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Konten Utama */}
      <div className="p-8"> 
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy-main">Ketersediaan Stok Barang</h2>
          
          <div className="flex gap-2">
            {/* Tombol Khusus Admin buat Master Barang */}
            {user.Role_Akses === 'Admin' && (
              <button 
                onClick={() => navigate('/tambah-barang')}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition shadow"
              >
                + Tambah Barang Baru
              </button>
            )}
            
            {/* Tombol Biru Muda buat Kelola Supplier */}
         {user.Role_Akses === 'Admin' && (
           <button 
             onClick={() => navigate('/supplier')}
             className="bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 transition shadow"
           >
             Kelola Supplier
           </button>
         )}

            <button 
           onClick={() => navigate('/riwayat')}
           className="bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition shadow"
         >
           Lihat Audit Trail
         </button>

            {/* Tombol Khusus Staf / Admin buat Transaksi */}
            {(user.Role_Akses === 'Staf' || user.Role_Akses === 'Admin') && (
              <button 
                onClick={() => navigate('/barang-masuk')}
                className="bg-yellow-accent text-navy-main font-bold py-2 px-4 rounded hover:bg-yellow-500 transition shadow"
              >
                + Catat Barang Masuk
              </button>
            )}
            {/* Tombol Barang Keluar (Biar warnanya kontras, pakai warna merah) */}
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-main text-white">
                <th className="p-4 border-b">ID Barang</th>
                <th className="p-4 border-b">Kategori</th>
                <th className="p-4 border-b">Nama Barang</th>
                <th className="p-4 border-b">Stok</th>
                <th className="p-4 border-b">Satuan</th>
                <th className="p-4 border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {barang.length > 0 ? (
                barang.map((item) => (
                  <tr key={item.id_barang} className="hover:bg-gray-50 border-b transition">
                    <td className="p-4">{item.id_barang}</td>
                    <td className="p-4">{item.id_kategori}</td>
                    <td className="p-4 font-semibold text-navy-main">{item.nama_barang}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.stok < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.stok}
                      </span>
                    </td>
                    <td className="p-4">{item.satuan}</td>
                    <td className="p-4">
                      {user.Role_Akses === 'Admin' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/edit-barang/${item.id_barang}`)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                          >
                            Edit
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(item.id_barang)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    Belum ada data barang di gudang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABEL ANTREAN APPROVAL (Hanya untuk Supervisor & Admin) */}
        {(user.Role_Akses === 'Spv' || user.Role_Akses === 'Admin') && (
            <>
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-navy-main mb-6">Antrean Persetujuan Barang Masuk</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-yellow-accent text-navy-main">
                    <th className="p-4 border-b">ID Transaksi</th>
                    <th className="p-4 border-b">Tanggal</th>
                    <th className="p-4 border-b">ID Barang</th>
                    <th className="p-4 border-b">Qty</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrans.length > 0 ? (
                    pendingTrans.map((trx) => (
                      <tr key={trx.id_masuk} className="hover:bg-gray-50 border-b transition">
                        {/* 1. ID Transaksi */}
                        <td className="p-4 font-bold">{trx.id_masuk}</td>
                        
                        {/* 2. Tanggal (Di-substring biar jamnya ilang, sisa 10 karakter depan aja) */}
                        <td className="p-4 text-gray-600">
                          {(trx.tgl_masuk || trx.TGL_MASUK || '').substring(0, 10)}
                        </td>
                        
                        {/* 3. ID Barang */}
                        <td className="p-4">{trx.id_barang}</td>
                        
                        {/* 4. Qty */}
                        <td className="p-4">{trx.qty_masuk}</td>
                        
                        {/* 5. Status */}
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                            {trx.status}
                          </span>
                        </td>
                      
                        {/* 6. Aksi (Tombol Approve & Reject) */}
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprove(trx.id_masuk)}
                              className="bg-navy-main hover:bg-blue-900 text-white font-bold py-1 px-3 rounded shadow"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(trx.id_masuk)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded shadow"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                        Tidak ada antrean barang masuk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
           
<div className="mt-12">
  <h2 className="text-2xl font-bold text-orange-600 mb-6">
  Antrean Persetujuan Barang Keluar
</h2>

  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-200">
    <table className="w-full text-left border-collapse">
      
      <thead>
        <tr className="bg-orange-100 text-orange-800">
          <th className="p-4 border-b border-orange-200">ID Keluar</th>
          <th className="p-4 border-b border-orange-200">Tanggal</th>
          <th className="p-4 border-b border-orange-200">ID Barang</th>
          <th className="p-4 border-b border-orange-200">Qty Keluar</th>
          <th className="p-4 border-b border-orange-200">Status</th>
          <th className="p-4 border-b border-orange-200">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {pendingKeluarTrans.length > 0 ? (
          pendingKeluarTrans.map((trx) => (
            <tr key={trx.id_keluar} className="hover:bg-orange-50 border-b border-orange-100 transition">
              
              <td className="p-4 font-bold text-orange-700">{trx.id_keluar}</td>
              <td className="p-4 text-gray-600">
                {(trx.tgl_keluar || trx.TGL_KELUAR || '').substring(0, 10)}
              </td>
              <td className="p-4 font-semibold">{trx.id_barang}</td>
              <td className="p-4 font-bold">{trx.qty_keluar}</td>

              <td className="p-4">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                  {trx.status}
                </span>
              </td>

              <td className="p-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveKeluar(trx.id_keluar)} 
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-3 rounded shadow"
                  >
                    Approve
                  </button>

                  <button 
                    onClick={() => handleRejectKeluar(trx.id_keluar)} 
                    className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-1 px-3 rounded shadow"
                  >
                    Reject
                  </button>
                </div>
              </td>

            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="p-8 text-center text-gray-500 italic">
              Tidak ada antrean barang keluar.
            </td>
          </tr>
        )}
      </tbody>

    </table>
  </div>
</div>
</>
        )}
      </div>
    </div>
  );
}