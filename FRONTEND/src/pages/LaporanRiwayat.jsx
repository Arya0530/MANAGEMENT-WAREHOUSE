import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LaporanRiwayat() {
  const [riwayat, setRiwayat] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      axios.get('http://localhost:8000/api/riwayat-transaksi')
        .then(res => setRiwayat(res.data.data))
        .catch(err => console.error("Gagal narik riwayat:", err));
    }
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-navy-main p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Audit Trail (Riwayat Transaksi)</h2>
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-yellow-accent text-navy-main px-3 py-1 rounded font-bold">
            Kembali ke Dashboard
          </button>
        </div>

        <div className="p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 text-navy-main">
                <th className="p-4 border-b">ID Transaksi</th>
                <td className="p-4 font-bold text-blue-600">{item.jenis || item.JENIS}</td>
                <th className="p-4 border-b">Tanggal (Sistem)</th>
                <th className="p-4 border-b">ID Barang</th>
                <th className="p-4 border-b">Qty</th>
                <th className="p-4 border-b">ID Pegawai</th>
                <th className="p-4 border-b">Status</th>
                
              </tr>
            </thead>
            <tbody>
              {riwayat.length > 0 ? (
                riwayat.map((item) => (
                  <tr key={item.id_masuk} className="hover:bg-gray-50 border-b transition">
                    <td className="p-4 font-bold">{item.id_masuk}</td>
                    {/* Sesuaikan "tanggal" dengan nama kolom di database lu yang aslinya huruf kecil dari Oracle */}
                    <td className="p-4">{item.tanggal || item.created_at || '-'}</td>
                    <td className="p-4 text-blue-600 font-semibold">{item.id_barang}</td>
                    <td className="p-4">{item.qty_masuk}</td>
                    <td className="p-4">{item.id_pegawai}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                    Belum ada riwayat transaksi.
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