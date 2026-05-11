import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../lib/api';

const formatDate = (value) => {
  if (!value) return '';
  const text = String(value).replace('T', ' ');
  return text.substring(0, 10);
};

const downloadPdf = async (path, filename, params = {}) => {
  const response = await api.get(path, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.Role_Akses !== 'Admin' && user.Role_Akses !== 'Spv') {
      navigate('/dashboard');
      return;
    }

    api
      .get('/analytics/summary', { params: { days: 30 } })
      .then((res) => {
        setSummary(res.data.data);
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Gagal memuat analytics');
      })
      .finally(() => setLoading(false));
  }, [navigate, user]);

  const trendData = useMemo(() => {
    if (!summary) return [];

    const masuk = summary.trend?.masuk || [];
    const keluar = summary.trend?.keluar || [];
    const map = new Map();

    masuk.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const total = row.total || row.TOTAL || 0;
      map.set(key, { tanggal: key, masuk: Number(total), keluar: 0 });
    });

    keluar.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const total = row.total || row.TOTAL || 0;
      const current = map.get(key) || { tanggal: key, masuk: 0, keluar: 0 };
      current.keluar = Number(total);
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [summary]);

  const fastMovingData = useMemo(() => {
    if (!summary) return [];
    return (summary.fast_moving || []).map((item) => ({
      id_barang: item.id_barang || item.ID_BARANG,
      nama_barang: item.nama_barang || item.NAMA_BARANG,
      total_keluar: Number(item.total_keluar || item.TOTAL_KELUAR || 0)
    }));
  }, [summary]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-navy-main p-6 text-white flex justify-between items-center rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Analytics Gudang</h1>
            <p className="text-sm text-gray-200">Ringkasan data 30 hari terakhir</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadPdf('/reports/analytics/pdf', 'laporan_analytics.pdf', { days: 30 })}
              className="bg-yellow-accent text-navy-main px-4 py-2 rounded font-bold hover:bg-yellow-500"
            >
              Export PDF Analytics
            </button>
            <button
              onClick={() => downloadPdf('/reports/restock/pdf', 'laporan_restock.pdf', { threshold: 5 })}
              className="bg-white text-navy-main px-4 py-2 rounded font-bold hover:bg-gray-100"
            >
              Export PDF Restock
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600"
            >
              Kembali
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-xl shadow">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total Barang</p>
                <p className="text-3xl font-bold text-navy-main">{summary?.totals?.barang ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total Kategori</p>
                <p className="text-3xl font-bold text-navy-main">{summary?.totals?.kategori ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total Supplier</p>
                <p className="text-3xl font-bold text-navy-main">{summary?.totals?.supplier ?? 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-navy-main mb-4">Trend Barang Masuk vs Keluar</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tanggal" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="masuk" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="keluar" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-navy-main mb-4">Fast-Moving Items</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fastMovingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nama_barang" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_keluar" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {fastMovingData.map((item) => (
                    <div key={item.id_barang} className="flex justify-between">
                      <span>{item.nama_barang}</span>
                      <span className="font-bold">{item.total_keluar}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-navy-main mb-4">Barang Menipis (&lt;= 5)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-2">ID</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Stok</th>
                        <th className="p-2">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary?.low_stock || []).length > 0 ? (
                        summary.low_stock.map((item) => (
                          <tr key={item.id_barang || item.ID_BARANG} className="border-b">
                            <td className="p-2 font-semibold">{item.id_barang || item.ID_BARANG}</td>
                            <td className="p-2">{item.nama_barang || item.NAMA_BARANG}</td>
                            <td className="p-2 text-red-600 font-bold">{item.stok || item.STOK}</td>
                            <td className="p-2">{item.satuan || item.SATUAN}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-gray-500">
                            Tidak ada barang menipis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
