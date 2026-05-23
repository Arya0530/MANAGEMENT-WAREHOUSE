import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BarangMasuk() {
  const [activeTab, setActiveTab] = useState('masuk');

  // State Data (Buat ngisi Dropdown)
  const [listBarang, setListBarang] = useState([]);
  const [listSupplier, setListSupplier] = useState([]);
  
  // State Input Form Asli
  const [idBarang, setIdBarang] = useState('');
  const [idSupplier, setIdSupplier] = useState('');
  const [qty, setQty] = useState('');
  const [tujuan, setTujuan] = useState('');

  // Issue #6: State buat nyimpen stok barang yang dipilih
  const [selectedStok, setSelectedStok] = useState(0);
  const [selectedKapasitas, setSelectedKapasitas] = useState(0);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || user.Role_Akses === 'Spv') {
      navigate('/dashboard');
      return;
    }
    
    // Tarik Data Barang
    axios.get('http://localhost:8000/api/barang')
      .then(res => {
        setListBarang(res.data.data);
        if (res.data.data.length > 0) {
          const first = res.data.data[0];
          const firstId = first.id_barang || first.ID_BARANG || first.ID_Barang || '';
          setIdBarang(firstId);
          setSelectedStok(Number(first.stok ?? first.STOK ?? first.Stok ?? 0));
          setSelectedKapasitas(Number(first.kapasitas_max ?? first.KAPASITAS_MAX ?? first.Kapasitas_Max ?? 0));
        }
      }).catch(err => alert("🚨 Gagal Load Data Barang: " + err.message));

    // Tarik Data Supplier
    axios.get('http://localhost:8000/api/supplier')
      .then(res => {
        setListSupplier(res.data.data);
        if (res.data.data.length > 0) {
          const first = res.data.data[0];
          setIdSupplier(first.id_supplier || first.ID_SUPPLIER || first.ID_Supplier || '');
        }
      }).catch(err => console.error("Supplier kosong/error", err));
  }, [navigate, user.Role_Akses]);

  // Issue #6: Update stok saat user ganti pilihan barang
  const handleBarangChange = (newIdBarang) => {
    setIdBarang(newIdBarang);
    const found = listBarang.find(brg => {
      const id = brg.id_barang || brg.ID_BARANG || brg.ID_Barang;
      return id === newIdBarang;
    });
    if (found) {
      setSelectedStok(Number(found.stok ?? found.STOK ?? found.Stok ?? 0));
      setSelectedKapasitas(Number(found.kapasitas_max ?? found.KAPASITAS_MAX ?? found.Kapasitas_Max ?? 0));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Issue #6: Validasi client-side - qty keluar tidak boleh melebihi stok
    if (activeTab === 'keluar') {
      const qtyNum = Number(qty);
      if (qtyNum > selectedStok) {
        alert(`🚨 GAGAL! Qty keluar (${qtyNum}) melebihi stok tersedia (${selectedStok}).\nKurangi jumlah yang diinputkan.`);
        return;
      }
    }

    try {
      let response;
      if (activeTab === 'masuk') {
        response = await axios.post('http://localhost:8000/api/barang-masuk', {
          ID_Barang: idBarang, 
          ID_Supplier: idSupplier, 
          Qty_Masuk: qty,
          ID_Pegawai: user.ID_Pegawai || user.id_pegawai || 'P001'
        });
      } else {
        response = await axios.post('http://localhost:8000/api/barang-keluar', {
          ID_Barang: idBarang, 
          Tujuan: tujuan, 
          Qty_Keluar: qty,
          ID_Pegawai: user.ID_Pegawai || user.id_pegawai || 'P001'
        });
      }

      if (response.data.success === false) {
        alert(`🚨 ERROR BACKEND:\n${response.data.message}`);
        return; 
      }

      alert(`✅ Transaksi Barang ${activeTab === 'masuk' ? 'Masuk' : 'Keluar'} dicatat! Menunggu Approve SPV.`);
      navigate('/dashboard');
      
    } catch (err) {
      alert(`🚨 ERROR: ${err.response?.data?.message || err.message}`);
    }
  };

  // Issue #6: Cek apakah qty melebihi stok (untuk peringatan real-time)
  const isOverStock = activeTab === 'keluar' && qty && Number(qty) > selectedStok;

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        <div className="bg-navy-main p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Form Transaksi Gudang</h2>
          <button onClick={() => navigate('/dashboard')} className="bg-yellow-accent text-navy-main px-4 py-2 rounded font-bold">
            Kembali
          </button>
        </div>

        <div className="flex border-b border-gray-300">
          <button 
            className={`flex-1 py-4 text-center font-bold text-lg transition ${activeTab === 'masuk' ? 'bg-white text-blue-600 border-b-4 border-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('masuk')}
          >
            📥 Barang Masuk
          </button>
          <button 
            className={`flex-1 py-4 text-center font-bold text-lg transition ${activeTab === 'keluar' ? 'bg-white text-orange-600 border-b-4 border-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('keluar')}
          >
            📤 Barang Keluar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* INPUT: PILIH BARANG */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Pilih Barang</label>
            <select 
              className="w-full p-3 border rounded focus:ring-2 focus:ring-navy-main" 
              value={idBarang} 
              onChange={(e) => handleBarangChange(e.target.value)} 
              required
            >
              {listBarang.length === 0 ? (
                <option value="">⏳ Loading / Data Kosong...</option>
              ) : (
                listBarang.map((brg) => {
                  const id = brg.id_barang || brg.ID_BARANG || brg.ID_Barang;
                  const nama = brg.nama_barang || brg.NAMA_BARANG || brg.Nama_Barang;
                  const stok = brg.stok ?? brg.STOK ?? brg.Stok;
                  return (
                    <option key={id} value={id}>
                      {nama} (Sisa Stok: {stok})
                    </option>
                  );
                })
              )}
            </select>
            {/* Issue #6: Tampilkan info stok & kapasitas barang yang dipilih */}
            {activeTab === 'keluar' && (
              <p className="text-xs text-gray-500 mt-1">
                Stok tersedia: <strong className="text-blue-600">{selectedStok}</strong> | Kapasitas Max: <strong>{selectedKapasitas}</strong>
              </p>
            )}
          </div>

          {/* Kondisi Tab Masuk: SUPPLIER */}
          {activeTab === 'masuk' && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Supplier</label>
              <select className="w-full p-3 border rounded focus:ring-2 focus:ring-navy-main" value={idSupplier} onChange={(e) => setIdSupplier(e.target.value)} required>
                {listSupplier.length === 0 ? (
                  <option value="">⏳ Loading Supplier...</option>
                ) : (
                  listSupplier.map((sup) => {
                    const id = sup.id_supplier || sup.ID_SUPPLIER || sup.ID_Supplier;
                    const nama = sup.nama_supplier || sup.NAMA_SUPPLIER || sup.Nama_Supplier;
                    return (
                      <option key={id} value={id}>
                        {nama}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          )}

          {/* Kondisi Tab Keluar: TUJUAN */}
          {activeTab === 'keluar' && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Tujuan Pengiriman</label>
              <textarea className="w-full p-3 border rounded focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Dikirim ke Toko Cabang..." value={tujuan} onChange={(e) => setTujuan(e.target.value)} required rows="2"></textarea>
            </div>
          )}

          {/* INPUT: QUANTITY */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Kuantitas (Qty)</label>
            <input 
              type="number" 
              min="1" 
              max={activeTab === 'keluar' ? selectedStok : undefined}
              className={`w-full p-3 border rounded focus:ring-2 font-bold ${
                isOverStock 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'focus:ring-navy-main'
              }`} 
              value={qty} 
              onChange={(e) => setQty(e.target.value)} 
              required 
            />
            {/* Issue #6: Peringatan real-time kalau qty melebihi stok */}
            {isOverStock && (
              <p className="text-sm text-red-600 font-bold mt-1">
                🚨 Qty melebihi stok tersedia ({selectedStok})! Tidak bisa diproses.
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isOverStock}
            className={`w-full text-white font-bold py-3 rounded-lg shadow-lg transition text-lg mt-4 ${
              isOverStock
                ? 'bg-gray-400 cursor-not-allowed'
                : activeTab === 'masuk' 
                  ? 'bg-navy-main hover:bg-blue-900' 
                  : 'bg-orange-600 hover:bg-orange-800'
            }`}
          >
            {isOverStock 
              ? '⛔ Qty Melebihi Stok!' 
              : `Simpan ${activeTab === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}`
            }
          </button>
        </form>

      </div>
    </div>
  );
}