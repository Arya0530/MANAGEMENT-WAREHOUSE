import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [barang, setBarang] = useState([]);
  const [pendingTrans, setPendingTrans] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showRestockAlert, setShowRestockAlert] = useState(false);
  const navigate = useNavigate();
  const [pendingKeluarTrans, setPendingKeluarTrans] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDataBarang();
      fetchLowStock();
      // SPV sama Admin berhak ngelihat dua antrean ini
      if (user.Role_Akses === 'Spv' || user.Role_Akses === 'Admin') {
        fetchPending();
        fetchPendingKeluar();
      }
    }
  }, []);

  // --- FUNGSI MASTER BARANG ---
  const fetchDataBarang = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/barang');
      setBarang(response.data.data);
    } catch (error) { console.error("Gagal narik data barang:", error); }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/alerts/low-stock');
      const items = Array.isArray(response.data.data) ? response.data.data : [];
      setLowStockItems(items);
      setShowRestockAlert(items.length > 0);
    } catch (error) {
      console.error('Gagal narik data restock alert:', error);
    }
  };

  const handleDelete = async (idBarang) => {
    if (window.confirm("Yakin mau hapus barang ini?")) {
      try {
        await axios.delete(`http://localhost:8000/api/barang/${idBarang}`, {
          params: { id_pegawai: user?.ID_Pegawai || user?.id_pegawai }
        });
        alert("Barang berhasil dihapus!");
        fetchDataBarang(); 
        fetchLowStock();
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
      await axios.post(`http://localhost:8000/api/approve-masuk/${idMasuk}`, null, {
        params: { id_pegawai: user?.ID_Pegawai || user?.id_pegawai }
      });
      alert("✅ Barang berhasil di-Approve! Stok bertambah otomatis.");
      fetchDataBarang(); 
      fetchLowStock();
      fetchPending();    
    } catch (error) {
      alert(`🚨 GAGAL APPROVE: ${error.response?.data?.message || error.message}`);
    }
  };
  const handleReject = async (idMasuk) => {
    if (window.confirm("Yakin mau NOLAK barang masuk ini?")) {
      try {
        await axios.post(`http://localhost:8000/api/reject-masuk/${idMasuk}`, null, {
          params: { id_pegawai: user?.ID_Pegawai || user?.id_pegawai }
        });
        alert("✅ Transaksi masuk berhasil ditolak!");
        fetchPending(); 
      } catch (error) {
        alert(`🚨 GAGAL REJECT: ${error.response?.data?.message || error.message}`);
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
      await axios.post(`http://localhost:8000/api/approve-keluar/${idKeluar}`, null, {
        params: { id_pegawai: user?.ID_Pegawai || user?.id_pegawai }
      });
      alert("Barang Keluar di-Approve! Stok otomatis terpotong.");
      fetchDataBarang();
      fetchLowStock();
      fetchPendingKeluar();
    } catch (error) {
      alert(`🚨 GAGAL APPROVE: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRejectKeluar = async (idKeluar) => {
    if (window.confirm("Yakin mau NOLAK barang keluar ini?")) {
      try {
        await axios.post(`http://localhost:8000/api/reject-keluar/${idKeluar}`, null, {
          params: { id_pegawai: user?.ID_Pegawai || user?.id_pegawai }
        });
        alert("Barang Keluar berhasil ditolak!");
        fetchPendingKeluar(); 
      } catch (error) {
        alert(`🚨 GAGAL REJECT: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Navbar Minimalis */}
      <nav className="bg-navy-main text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">E-Gudang Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>
          Halo, <strong>{user.Nama}</strong> 
        </span>
          <button 
            onClick={handleLogout}
             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-bold transition"
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
            
            {/* 👑 ADMIN ONLY: Boleh ngurus "Dapur" (Master Data) */}
            {user.Role_Akses === 'Admin' && (
              <>
                <button onClick={() => navigate('/tambah-barang')} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition shadow">
                  + Tambah Barang Baru
                </button>
                <button onClick={() => navigate('/supplier')} className="bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 transition shadow">
                  Kelola Supplier
                </button>
              </>
            )}

            {/* 🌐 SEMUA ROLE (Admin, Spv, Staf): Boleh liat log riwayat */}
            <button onClick={() => navigate('/riwayat')} className="bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition shadow">
              Lihat Audit Trail
            </button>

            {/* 📊 ANALYTICS */}
            {(user.Role_Akses === 'Admin' || user.Role_Akses === 'Spv') && (
              <button onClick={() => navigate('/analytics')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition shadow">
                Dashboard Analytics
              </button>
            )}

            {/* 👷‍♂️ STAF & ADMIN ONLY: Boleh input transaksi */}
            {(user.Role_Akses === 'Staf' || user.Role_Akses === 'Admin') && (
              <button onClick={() => navigate('/barang-masuk')} className="bg-yellow-accent text-navy-main font-bold py-2 px-4 rounded hover:bg-yellow-500 transition shadow">
                + Input Transaksi (Masuk/Keluar)
              </button>
            )}
          </div>
        </div>

        {/* Issue #3: Alert sekarang pakai 10% Kapasitas */}
        {showRestockAlert && (user.Role_Akses === 'Staf' || user.Role_Akses === 'Admin') && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-red-700 font-bold text-lg">🚨 Smart Restock Alert</h3>
                <p className="text-sm text-red-600">
                  Stok menipis (&lt;= 10% dari Kapasitas Gudang). Segera lakukan transaksi Barang Masuk.
                </p>
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                  {lowStockItems.map((item) => (
                    <li key={item.id_barang || item.ID_BARANG}>
                      {item.nama_barang || item.NAMA_BARANG} (Stok: {item.stok || item.STOK} / Kapasitas: {item.kapasitas_max || item.KAPASITAS_MAX || '-'})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate('/barang-masuk')}
                  className="bg-yellow-accent text-navy-main font-bold px-4 py-2 rounded hover:bg-yellow-500"
                >
                  Buat Transaksi Masuk
                </button>
                <button
                  onClick={() => setShowRestockAlert(false)}
                  className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded hover:bg-gray-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-main text-white">
                <th className="p-4">ID</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Stok / Kapasitas</th>
                <th className="p-4">Status Gudang</th>
                <th className="p-4">Satuan</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
          {/* TABEL MASTER BARANG */}
          <tbody>
            {barang.length > 0 ? (
              barang.map((item) => {
                const id = item.id_barang || item.ID_BARANG || item.ID_Barang;
                const nama = item.nama_barang || item.NAMA_BARANG || item.Nama_Barang;
                const stok = Number(item.stok ?? item.STOK ?? item.Stok ?? 0);
                const kMax = Number(item.kapasitas_max ?? item.KAPASITAS_MAX ?? item.Kapasitas_Max ?? 50);
                const satuan = item.satuan || item.SATUAN || item.Satuan;
                
                // Issue #3: Batas menipis sekarang 10% dari kapasitas max
                const batasMenipis = Math.floor(kMax * 0.1);

                // LOGIKA 5 STATUS GUDANG (Issue #3: pakai 10% kapasitas)
                let statusLabel = <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✅ Aman</span>;
                
                if (stok > kMax) {
                  statusLabel = <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">🛑 Overload</span>;
                } else if (stok === kMax) {
                  statusLabel = <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">⚠️ Maksimum</span>;
                } else if (stok === 0) {
                  statusLabel = <span className="px-3 py-1 rounded-full text-xs font-bold bg-black text-white">❌ Stok Habis</span>;
                } else if (stok <= batasMenipis) {
                  statusLabel = <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">🚨 Menipis (&le;10%)</span>;
                }

          
                return (
                  <tr key={id} className="hover:bg-gray-50 border-b transition">
                    <td className="p-4">{id}</td>
                    <td className="p-4 font-bold">{nama}</td>
                    
                    {/* Tampilkan Stok vs Kapasitas Max */}
                    <td className="p-4 font-semibold">{stok} / {kMax}</td>
                    
                    {/*  variabel statusLabel*/}
                    <td className="p-4">{statusLabel}</td>
                    
                    <td className="p-4">{satuan}</td>

          <td className="p-4">
            {user.Role_Akses === 'Admin' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/edit-barang/${id}`)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                >
                  Edit
                </button>

                <button 
                  onClick={() => handleDelete(id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                >
                  Hapus
                </button>
              </div>
            )}
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="6" className="p-8 text-center text-gray-500 italic">
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
                    {/* Issue #5: Tambah kolom Nama Barang */}
                    <th className="p-4 border-b">Nama Barang</th>
                    <th className="p-4 border-b">Qty</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrans.length > 0 ? (
                    pendingTrans.map((trx) => {
                      const idMasuk = trx.id_masuk || trx.ID_MASUK || trx.ID_Masuk;
                      const tglMasuk = trx.tgl_masuk || trx.TGL_MASUK || trx.Tgl_Masuk || '';
                      const idBarang = trx.id_barang || trx.ID_BARANG || trx.ID_Barang;
                      const namaBarang = trx.nama_barang || trx.NAMA_BARANG || trx.Nama_Barang || '-';
                      const qtyMasuk = trx.qty_masuk || trx.QTY_MASUK || trx.Qty_Masuk;
                      const status = trx.status || trx.STATUS || trx.Status;

                      return (
                        <tr key={idMasuk} className="hover:bg-gray-50 border-b transition">
                          <td className="p-4 font-bold">{idMasuk}</td>
                          <td className="p-4 text-gray-600">
                            {tglMasuk.substring(0, 10)}
                          </td>
                          <td className="p-4">{idBarang}</td>
                          {/* Issue #5: Tampilkan Nama Barang */}
                          <td className="p-4 font-semibold text-blue-700">{namaBarang}</td>
                          <td className="p-4">{qtyMasuk}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                              {status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApprove(idMasuk)}
                                className="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-3 rounded shadow"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(idMasuk)}
                                className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-1 px-3 rounded shadow"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500 italic">
                        Tidak ada antrean barang masuk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
           
{/* Issue #5: Antrean Barang Keluar juga ada Nama Barang */}
<div className="mt-12">
  <h2 className="text-2xl font-bold text-navy-main mb-6">
  Antrean Persetujuan Barang Keluar
</h2>

  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-200">
    <table className="w-full text-left border-collapse">
      
      <thead>
        <tr className="bg-yellow-accent text-navy-main">
          <th className="p-4 border-b border-orange-200">ID Keluar</th>
          <th className="p-4 border-b border-orange-200">Tanggal</th>
          <th className="p-4 border-b border-orange-200">ID Barang</th>
          <th className="p-4 border-b border-orange-200">Nama Barang</th>
          <th className="p-4 border-b border-orange-200">Qty Keluar</th>
          <th className="p-4 border-b border-orange-200">Status</th>
          <th className="p-4 border-b border-orange-200">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {pendingKeluarTrans.length > 0 ? (
          pendingKeluarTrans.map((trx) => {
            const idKeluar = trx.id_keluar || trx.ID_KELUAR || trx.ID_Keluar;
            const tglKeluar = trx.tgl_keluar || trx.TGL_KELUAR || trx.Tgl_Keluar || '';
            const idBarang = trx.id_barang || trx.ID_BARANG || trx.ID_Barang;
            const namaBarang = trx.nama_barang || trx.NAMA_BARANG || trx.Nama_Barang || '-';
            const qtyKeluar = trx.qty_keluar || trx.QTY_KELUAR || trx.Qty_Keluar;
            const status = trx.status || trx.STATUS || trx.Status;

            return (
            <tr key={idKeluar} className="hover:bg-orange-50 border-b border-orange-100 transition">
              
              <td className="p-4 font-bold text-orange-700">{idKeluar}</td>
              <td className="p-4 text-gray-600">
                {tglKeluar.substring(0, 10)}
              </td>
              <td className="p-4 font-semibold">{idBarang}</td>
              {/* Issue #5: Tampilkan Nama Barang */}
              <td className="p-4 font-semibold text-orange-700">{namaBarang}</td>
              <td className="p-4 font-bold">{qtyKeluar}</td>

              <td className="p-4">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                  {status}
                </span>
              </td>

              <td className="p-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveKeluar(idKeluar)} 
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-3 rounded shadow"
                  >
                    Approve
                  </button>

                  <button 
                    onClick={() => handleRejectKeluar(idKeluar)} 
                    className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-1 px-3 rounded shadow"
                  >
                    Reject
                  </button>
                </div>
              </td>

            </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="7" className="p-8 text-center text-gray-500 italic">
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