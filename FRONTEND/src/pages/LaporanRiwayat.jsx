import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LaporanRiwayat() {
  const [riwayat, setRiwayat] = useState([]);
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [searchNama, setSearchNama] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const formatTimestamp = (value) => {
    if (!value) return '';
    const text = String(value).replace('T', ' ');
    return text.substring(0, 19);
  };

  const downloadPdf = () => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
    const url = new URL(baseUrl + '/reports/riwayat/pdf');
    url.searchParams.set('role', user.Role_Akses);
    url.searchParams.set('id_pegawai', user.ID_Pegawai || user.id_pegawai || 'P001');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    // Kalau belum login, tendang ke halaman login
    if (!user) {
      navigate('/login');
      return;
    }

    // Narik data riwayat dengan ngirim Role & ID Pegawai
    axios.get('http://localhost:8000/api/riwayat', {
      params: {
        role: user.Role_Akses,
        id_pegawai: user.ID_Pegawai || user.id_pegawai || 'P001'
      }
    })
      .then(res => {
        setRiwayat(res.data.data || []);
      })
      .catch(err => {
        const pesanAsli = err.response?.data?.message || err.message;
        alert("🚨 ORACLE LU NGAMUK BRO:\n" + pesanAsli);
      });
  }, [navigate]);

  // Filtered data
  const filteredRiwayat = riwayat.filter((item) => {
    const jenis = item.jenis || item.JENIS || '';
    const namaBarang = item.nama_barang || item.NAMA_BARANG || item.Nama_Barang || '';

    // Filter by Jenis Aktivitas
    if (filterJenis !== 'Semua' && jenis !== filterJenis) return false;

    // Filter by Nama Barang search
    if (searchNama.trim() !== '') {
      const search = searchNama.toLowerCase();
      if (!namaBarang.toLowerCase().includes(search)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        {/* Header Audit Trail */}
        <div className="bg-gray-800 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Audit Trail (Riwayat Transaksi)</h2>
          <div className="flex gap-2">
            <button 
              onClick={downloadPdf} 
              className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100 transition shadow"
            >
              Export PDF
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="bg-yellow-accent text-navy-main px-4 py-2 rounded font-bold hover:bg-yellow-500 transition shadow"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-6 pb-0 flex flex-wrap gap-4 items-end">
          {/* Filter Jenis Aktivitas */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Jenis Aktivitas</label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-main bg-white"
            >
              <option value="Semua">Semua</option>
              <option value="Barang Masuk">Barang Masuk</option>
              <option value="Barang Keluar">Barang Keluar</option>
              <option value="Aktivitas">Aktivitas</option>
            </select>
          </div>

          {/* Search Nama Barang */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Cari Nama Barang</label>
            <input
              type="text"
              value={searchNama}
              onChange={(e) => setSearchNama(e.target.value)}
              placeholder="Ketik nama barang..."
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-main bg-white"
            />
          </div>

          {/* Result count */}
          <div className="flex items-end pb-2">
            <span className="text-sm text-gray-500">
              Menampilkan <strong>{filteredRiwayat.length}</strong> dari <strong>{riwayat.length}</strong> data
            </span>
          </div>
        </div>

        {/* Tabel Riwayat */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-800 border-b-2 border-gray-300">
                <th className="p-4 font-bold">ID Transaksi</th>
                <th className="p-4 font-bold">Tanggal</th>
                <th className="p-4 font-bold">Jenis Aktivitas</th>
                <th className="p-4 font-bold">Nama</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">ID Barang</th>
                <th className="p-4 font-bold">Nama Barang</th>
                <th className="p-4 font-bold">Qty</th>
                <th className="p-4 font-bold">Aktivitas/Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiwayat.length > 0 ? (
                filteredRiwayat.map((item, index) => {
                  // Tameng Anti-Oracle: Ngecek huruf kecil & besar
                  const idTrx = item.id || item.ID;
                  const tgl = item.tanggal || item.TANGGAL || '';
                  const jenis = item.jenis || item.JENIS;
                  const idBrg = item.id_barang || item.ID_BARANG;
                  const namaBarang = item.nama_barang || item.NAMA_BARANG || item.Nama_Barang || '-';
                  const qty = item.qty || item.QTY;
                  const status = item.status || item.STATUS;
                  const nama = item.nama || item.NAMA || item.Nama || '-';
                  const role = item.role || item.ROLE_AKSES || item.ROLE || '-';

                  return (
                    <tr key={idTrx || index} className="hover:bg-gray-50 border-b border-gray-100 transition">
                      <td className="p-4 font-bold text-gray-700">{idTrx}</td>
                      <td className="p-4 text-gray-600">{formatTimestamp(tgl)}</td>
                      <td className="p-4 font-bold text-blue-600">{jenis}</td>
                      <td className="p-4 text-gray-700">{nama}</td>
                      <td className="p-4 text-gray-700">{role}</td>
                      <td className="p-4 font-semibold text-navy-main">{idBrg}</td>
                      <td className="p-4 font-semibold text-indigo-600">{namaBarang}</td>
                      <td className="p-4 font-bold">{qty}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500 italic">
                    Belum ada riwayat transaksi di gudang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}