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
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || user.Role_Akses === 'Spv') {
      navigate('/dashboard');
      return;
    }
    
    // Tarik Data Barang (Langsung dimunculin di Alert kalau Oracle ngambek)
    axios.get('http://localhost:8000/api/barang')
      .then(res => {
        setListBarang(res.data.data);
        if(res.data.data.length > 0) setIdBarang(res.data.data[0].id_barang || res.data.data[0].ID_BARANG);
      }).catch(err => alert("🚨 Gagal Load Data Barang: " + err.message));

    // Tarik Data Supplier
    axios.get('http://localhost:8000/api/supplier')
      .then(res => {
        setListSupplier(res.data.data);
        if(res.data.data.length > 0) setIdSupplier(res.data.data[0].id_supplier || res.data.data[0].ID_SUPPLIER);
      }).catch(err => console.error("Supplier kosong/error", err));
  }, [navigate, user.Role_Akses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert(`🚨 ERROR AXIOS: ${err.response?.data?.message || err.message}`);
    }
  };

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
          
          {/* INPUT: PILIH BARANG (Udah dipasangin default opsi biar ga mendelep) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Pilih Barang</label>
            <select className="w-full p-3 border rounded focus:ring-2 focus:ring-navy-main" value={idBarang} onChange={(e) => setIdBarang(e.target.value)} required>
              {listBarang.length === 0 ? (
                <option value="">⏳ Loading / Data Kosong...</option>
              ) : (
                listBarang.map((brg) => (
                  <option key={brg.id_barang || brg.ID_BARANG} value={brg.id_barang || brg.ID_BARANG}>
                    {brg.nama_barang || brg.NAMA_BARANG} (Sisa Stok: {brg.stok || brg.STOK})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Kondisi Tab Masuk: SUPPLIER */}
          {activeTab === 'masuk' && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Supplier</label>
              <select className="w-full p-3 border rounded focus:ring-2 focus:ring-navy-main" value={idSupplier} onChange={(e) => setIdSupplier(e.target.value)} required>
                {listSupplier.length === 0 ? (
                  <option value="">⏳ Loading Supplier...</option>
                ) : (
                  listSupplier.map((sup) => (
                    <option key={sup.id_supplier || sup.ID_SUPPLIER} value={sup.id_supplier || sup.ID_SUPPLIER}>
                      {sup.nama_supplier || sup.NAMA_SUPPLIER}
                    </option>
                  ))
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
            <input type="number" min="1" className="w-full p-3 border rounded focus:ring-2 focus:ring-navy-main font-bold" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </div>

          <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg shadow-lg transition text-lg mt-4 ${activeTab === 'masuk' ? 'bg-navy-main hover:bg-blue-900' : 'bg-orange-600 hover:bg-orange-800'}`}>
            Simpan {activeTab === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
          </button>
        </form>

      </div>
    </div>
  );
}