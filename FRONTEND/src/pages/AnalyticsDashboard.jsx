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

// CustomTooltip untuk chart gabungan — tampil nama barang saat hover titik
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const masukEntry = payload.find((p) => p.dataKey === 'totalMasuk');
  const keluarEntry = payload.find((p) => p.dataKey === 'totalKeluar');
  const data = payload[0]?.payload;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        padding: '12px 16px',
        fontSize: '13px',
        maxWidth: '260px',
      }}
    >
      <p style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>📅 {label}</p>

      {masukEntry && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ color: '#2563eb', fontWeight: 600 }}>
            🔵 Masuk: <strong>{masukEntry.value}</strong>
          </p>
          {data?.namaBarangMasuk?.length > 0 && (
            <ul style={{ color: '#6b7280', fontSize: 11, paddingLeft: 8, marginTop: 4 }}>
              {data.namaBarangMasuk.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {keluarEntry && (
        <div>
          <p style={{ color: '#f97316', fontWeight: 600 }}>
            🟠 Keluar: <strong>{keluarEntry.value}</strong>
          </p>
          {data?.namaBarangKeluar?.length > 0 && (
            <ul style={{ color: '#6b7280', fontSize: 11, paddingLeft: 8, marginTop: 4 }}>
              {data.namaBarangKeluar.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const PERIOD_OPTIONS = [
  { label: '7 Hari Terakhir',   days: 7   },
  { label: '30 Hari Terakhir',  days: 30  },
  { label: '90 Hari Terakhir',  days: 90  },
  { label: '1 Tahun Terakhir',  days: 365 },
];

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchSummary = (days) => {
    setLoading(true);
    api
      .get('/analytics/summary', { params: { days } })
      .then((res) => {
        setSummary(res.data.data);
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Gagal memuat analytics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.Role_Akses !== 'Admin' && user.Role_Akses !== 'Spv') {
      navigate('/dashboard');
      return;
    }

    fetchSummary(trendDays);
  }, [trendDays, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (e) => {
    const days = Number(e.target.value);
    setTrendDays(days);
    // fetchSummary dipanggil otomatis oleh useEffect saat trendDays berubah
  };

  /**
   * Data gabungan: total masuk & total keluar per tanggal.
   * Gap-fill: semua 30 hari selalu muncul di grafik.
   * Hari tanpa transaksi diisi totalMasuk:0 & totalKeluar:0 agar garis tidak putus.
   */
  const combinedTrendData = useMemo(() => {
    if (!summary) return [];

    const masuk = summary.trend?.masuk || [];
    const keluar = summary.trend?.keluar || [];
    const dateMap = new Map();

    const ensureEntry = (key) => {
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          tanggal: key,
          totalMasuk: 0,
          totalKeluar: 0,
          namaBarangMasuk: [],
          namaBarangKeluar: [],
        });
      }
      return dateMap.get(key);
    };

    masuk.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const total = Number(row.total || row.TOTAL || 0);
      const nama = row.nama_barang || row.NAMA_BARANG || '';
      const entry = ensureEntry(key);
      entry.totalMasuk += total;
      if (nama) entry.namaBarangMasuk.push(`${nama} (${total})`);
    });

    keluar.forEach((row) => {
      const key = formatDate(row.tanggal || row.TANGGAL);
      const total = Number(row.total || row.TOTAL || 0);
      const nama = row.nama_barang || row.NAMA_BARANG || '';
      const entry = ensureEntry(key);
      entry.totalKeluar += total;
      if (nama) entry.namaBarangKeluar.push(`${nama} (${total})`);
    });

    // Gap-fill: iterasi seluruh rentang date_from s/d date_to dari backend
    // Hari tanpa transaksi tetap muncul dengan nilai 0
    const dateFrom = summary.date_from ? new Date(summary.date_from + 'T00:00:00') : null;
    const dateTo   = summary.date_to   ? new Date(summary.date_to   + 'T00:00:00') : null;

    if (dateFrom && dateTo) {
      const result = [];
      const cursor = new Date(dateFrom);
      while (cursor <= dateTo) {
        // Gunakan tanggal lokal (bukan UTC) agar cocok dengan key dari backend
        const yyyy = cursor.getFullYear();
        const mm   = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd   = String(cursor.getDate()).padStart(2, '0');
        const key  = `${yyyy}-${mm}-${dd}`;
        result.push(
          dateMap.get(key) ?? {
            tanggal: key,
            totalMasuk: 0,
            totalKeluar: 0,
            namaBarangMasuk: [],
            namaBarangKeluar: [],
          }
        );
        cursor.setDate(cursor.getDate() + 1);
      }
      return result;
    }

    // Fallback jika date_from/date_to belum ada di response
    return Array.from(dateMap.values()).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );
  }, [summary]);

  /**
   * Fast-moving: top-5 berdasarkan total_keluar tertinggi.
   * Hanya menampilkan total_keluar — total_masuk tidak digunakan.
   * Sort + slice di frontend sebagai safety net.
   */
  const fastMovingData = useMemo(() => {
    if (!summary) return [];
    return [...(summary.fast_moving || [])]
      .map((item) => ({
        id_barang: item.id_barang || item.ID_BARANG,
        nama_barang: item.nama_barang || item.NAMA_BARANG,
        total_keluar: Number(item.total_keluar || item.TOTAL_KELUAR || 0),
      }))
      .sort((a, b) => b.total_keluar - a.total_keluar)
      .slice(0, 5);
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

        {/* Header */}
        <div className="bg-navy-main p-6 text-white flex justify-between items-center rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Analytics Gudang</h1>
            <p className="text-sm text-gray-200">
              Ringkasan data {PERIOD_OPTIONS.find(opt => opt.days === trendDays)?.label || `${trendDays} hari terakhir`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPdf('/reports/analytics/pdf', { days: trendDays })}
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
            {/* Summary Cards */}
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

            {/* Grafik Trend Gabungan: Barang Masuk & Keluar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-bold text-navy-main">
                  Trend Aktivitas Gudang
                </h2>
                <select
                  value={trendDays}
                  onChange={handlePeriodChange}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.days} value={opt.days}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Hover pada titik grafik untuk melihat detail nama barang
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={combinedTrendData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(val) => {
                        if (!val) return '';
                        const parts = val.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                      }}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) =>
                        value === 'Barang Masuk'
                          ? <span style={{ color: '#2563eb', fontWeight: 600 }}>🔵 Barang Masuk</span>
                          : <span style={{ color: '#f97316', fontWeight: 600 }}>🟠 Barang Keluar</span>
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="totalMasuk"
                      name="Barang Masuk"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#2563eb', stroke: '#dbeafe', strokeWidth: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="totalKeluar"
                      name="Barang Keluar"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#f97316', stroke: '#ffedd5', strokeWidth: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Persentase Barang Masuk vs Keluar */}
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

            {/* Grid 2 kolom: Fast Moving (kiri) + Barang Menipis (kanan) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Fast-Moving: Top 5 barang keluar tertinggi */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-navy-main">Fast-Moving Items</h2>
                  <span className="bg-orange-50 border border-orange-200 text-orange-500 text-xs font-semibold px-3 py-1 rounded-full">
                    Top 5 Keluar Tertinggi
                  </span>
                </div>

                {fastMovingData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Belum ada data barang keluar.
                  </p>
                ) : (() => {
                  const maxKeluar = fastMovingData[0]?.total_keluar || 1;
                  return (
                    <div className="space-y-5">
                      {fastMovingData.map((item, idx) => (
                        <div key={item.id_barang}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                                style={{
                                  background:
                                    idx === 0 ? '#f97316'
                                    : idx === 1 ? '#fb923c'
                                    : '#fed7aa',
                                  color: idx <= 1 ? 'white' : '#9a3412',
                                }}
                              >
                                {idx + 1}
                              </span>
                              <span
                                className="text-sm font-medium text-gray-700 truncate"
                                title={item.nama_barang}
                              >
                                {item.nama_barang}
                              </span>
                            </div>
                            <span className="flex-shrink-0 ml-3 text-sm font-bold text-orange-600">
                              {item.total_keluar.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(item.total_keluar / maxKeluar) * 100}%`,
                                background:
                                  idx === 0
                                    ? 'linear-gradient(90deg, #f97316, #fb923c)'
                                    : idx === 1
                                    ? 'linear-gradient(90deg, #fb923c, #fed7aa)'
                                    : '#fed7aa',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Barang Menipis <= 10% Kapasitas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-navy-main mb-4">
                  Barang Menipis (&lt;= 10% Kapasitas)
                </h2>
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
