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
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import api from '../lib/api';

const formatDate = (value) => {
  if (!value) return '';
  const text = String(value).replace('T', ' ');
  return text.substring(0, 10);
};

const buildReportUrl = (path, params = {}) => {
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const url = new URL(baseUrl + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

const openPdf = (path, params = {}) => {
  const url = buildReportUrl(path, params);
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Warna-warna buat line chart per barang
const ITEM_COLORS = [
  '#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6',
];

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

  /**
   * Issue #1: Trend data sekarang per barang per tanggal.
   * Format: [{ tanggal: '2026-05-01', 'Barang A': 10, 'Barang B': 5, ... }]
   * Ini supaya setiap barang punya line sendiri di chart.
   */
  const { trendChartData: masukChartData, itemNames: masukItemNames } = useMemo(() => {
    if (!summary) return { trendChartData: [], itemNames: [] };

    const masuk = summary.trend?.masuk || [];
    const dateMap = new Map();
    const itemSet = new Set();

    masuk.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const namaBarang = row.nama_barang || row.NAMA_BARANG || row.id_barang || 'Unknown';
      const total = Number(row.total || row.TOTAL || 0);

      itemSet.add(namaBarang);

      if (!dateMap.has(key)) {
        dateMap.set(key, { tanggal: key });
      }
      const entry = dateMap.get(key);
      entry[namaBarang] = (entry[namaBarang] || 0) + total;
    });

    const trendChartData = Array.from(dateMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const itemNames = Array.from(itemSet);
    return { trendChartData, itemNames };
  }, [summary]);

  const { trendChartData: keluarChartData, itemNames: keluarItemNames } = useMemo(() => {
    if (!summary) return { trendChartData: [], itemNames: [] };

    const keluar = summary.trend?.keluar || [];
    const dateMap = new Map();
    const itemSet = new Set();

    keluar.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const namaBarang = row.nama_barang || row.NAMA_BARANG || row.id_barang || 'Unknown';
      const total = Number(row.total || row.TOTAL || 0);

      itemSet.add(namaBarang);

      if (!dateMap.has(key)) {
        dateMap.set(key, { tanggal: key });
      }
      const entry = dateMap.get(key);
      entry[namaBarang] = (entry[namaBarang] || 0) + total;
    });

    const trendChartData = Array.from(dateMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const itemNames = Array.from(itemSet);
    return { trendChartData, itemNames };
  }, [summary]);

  /**
   * Issue #2: Fast-moving sekarang punya total_masuk DAN total_keluar
   */
  const fastMovingData = useMemo(() => {
    if (!summary) return [];
    return (summary.fast_moving || []).map((item) => ({
      id_barang: item.id_barang || item.ID_BARANG,
      nama_barang: item.nama_barang || item.NAMA_BARANG,
      total_keluar: Number(item.total_keluar || item.TOTAL_KELUAR || 0),
      total_masuk: Number(item.total_masuk || item.TOTAL_MASUK || 0),
    }));
  }, [summary]);

    const flowTotals = useMemo(() => {
      if (!summary) {
        return { masuk: 0, keluar: 0, total: 0 };
      }

      const sumTotals = (rows = []) =>
        rows.reduce((sum, row) => sum + Number(row.total || row.TOTAL || 0), 0);

      const masukTotal = sumTotals(summary.trend?.masuk || []);
      const keluarTotal = sumTotals(summary.trend?.keluar || []);
      const total = masukTotal + keluarTotal;

      return { masuk: masukTotal, keluar: keluarTotal, total };
    }, [summary]);

    const flowPercentData = useMemo(() => {
      const total = flowTotals.total;
      if (!total) {
        return [
          { name: 'Masuk', value: 0 },
          { name: 'Keluar', value: 0 },
        ];
      }
      return [
        { name: 'Masuk', value: (flowTotals.masuk / total) * 100 },
        { name: 'Keluar', value: (flowTotals.keluar / total) * 100 },
      ];
    }, [flowTotals]);

    const flowColors = ['#2563eb', '#f97316'];

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
              onClick={() => openPdf('/reports/analytics/pdf', { days: 30 })}
              className="bg-yellow-accent text-navy-main px-4 py-2 rounded font-bold hover:bg-yellow-500"
            >
              Export PDF
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

            {/* Issue #1: Grafik Trend Barang MASUK — per barang (setiap barang punya line sendiri) */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-navy-main mb-4">Trend Barang Masuk (Per Barang)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={masukChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tanggal" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {masukItemNames.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={ITEM_COLORS[idx % ITEM_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Issue #1: Grafik Trend Barang KELUAR — per barang */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-navy-main mb-4">Trend Barang Keluar (Per Barang)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={keluarChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tanggal" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {keluarItemNames.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={ITEM_COLORS[idx % ITEM_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-navy-main mb-4">Persentase Barang Masuk vs Keluar</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={flowPercentData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {flowPercentData.map((entry, index) => (
                        <Cell key={entry.name} fill={flowColors[index % flowColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Total: {flowTotals.total} (Masuk {flowTotals.masuk}, Keluar {flowTotals.keluar})
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Issue #2: Fast-Moving sekarang ada info Masuk DAN Keluar */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-navy-main mb-4">Fast-Moving Items (Masuk & Keluar)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fastMovingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nama_barang" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_masuk" fill="#2563eb" name="Total Masuk" />
                      <Bar dataKey="total_keluar" fill="#f97316" name="Total Keluar" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {fastMovingData.map((item) => (
                    <div key={item.id_barang} className="flex justify-between">
                      <span>{item.nama_barang}</span>
                      <span>
                        <span className="font-bold text-blue-600">Masuk: {item.total_masuk}</span>
                        {' | '}
                        <span className="font-bold text-orange-600">Keluar: {item.total_keluar}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue #3: Barang Menipis sekarang <= 10% Kapasitas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-navy-main mb-4">Barang Menipis (&lt;= 10% Kapasitas)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-2">ID</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Stok</th>
                        <th className="p-2">Kapasitas</th>
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
                            <td className="p-2 font-semibold">{item.kapasitas_max || item.KAPASITAS_MAX || '-'}</td>
                            <td className="p-2">{item.satuan || item.SATUAN}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-gray-500">
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
