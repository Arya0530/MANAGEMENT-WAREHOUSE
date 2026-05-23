import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TambahBarang() {
  const [idKategori, setIdKategori] = useState(''); 
  const [namaBarang, setNamaBarang] = useState('');
  const [stok, setStok] = useState('');
  const [satuan, setSatuan] = useState('Kg');
  
  // TAMBAHAN: State buat Kapasitas Gudang (Min kita default aja 0)
  const [kapasitasMax, setKapasitasMax] = useState('50');
  
  // Issue #7: State buat Supplier
  const [idSupplier, setIdSupplier] = useState('');
  const [listSupplier, setListSupplier] = useState([]);

  const [pesan, setPesan] = useState({ text: '', type: '' });
  const [listKategori, setListKategori] = useState([]);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || user.Role_Akses !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    // Fetch Kategori
    axios.get('http://localhost:8000/api/kategori')
      .then(res => {
        const data = res.data.data || [];
        setListKategori(data);
        const first = data[0];
        if (first) {
          setIdKategori(first.id_kategori || first.ID_Kategori || '');
        }
      })
      .catch(err => console.error("Gagal narik kategori", err));
    
    // Issue #7: Fetch Supplier
    axios.get('http://localhost:8000/api/supplier')
      .then(res => {
        const data = res.data.data || [];
        setListSupplier(data);
        const first = data[0];
        if (first) {
          setIdSupplier(first.id_supplier || first.ID_SUPPLIER || first.ID_Supplier || '');
        }
      })
      .catch(err => console.error("Gagal narik supplier", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });

    try {
      const response = await axios.post('http://localhost:8000/api/barang', {
        ID_Kategori: idKategori,
        ID_Supplier: idSupplier,   // Issue #7: Kirim ID Supplier
        Nama_Barang: namaBarang,
        Stok: stok,
        Satuan: satuan,
        Batas_Minimum: 5,
        Kapasitas_Max: kapasitasMax,
        ID_Pegawai: user.ID_Pegawai || user.id_pegawai || 'P001'
      });

      setPesan({ text: '✅ Barang berhasil disimpan!', type: 'success' });
      setNamaBarang(''); setStok('');
    } catch (err) {
      const errorAsli = err.response?.data?.message || err.message;
      setPesan({ text: `Gagal: ${errorAsli}`, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-navy-main p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tambah Barang Master</h2>
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-yellow-accent text-navy-main px-3 py-1 rounded font-bold">
            Kembali
          </button>
        </div>

        <div className="p-8">
          {pesan.text && (
            <div className={`p-4 rounded mb-6 text-sm font-bold ${pesan.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {pesan.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Kategori</label>
                <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main"
                    value={idKategori}
                    onChange={(e) => setIdKategori(e.target.value)}
                >
                    {listKategori.map((k) => {
                      const id = k.id_kategori || k.ID_Kategori;
                      const name = k.nama_kategori || k.Nama_Kategori;
                      return (
                        <option key={id} value={id}>
                          {name} ({id})
                        </option>
                      );
                    })}
                </select>
            </div>

            {/* Issue #7: Dropdown Supplier */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Supplier</label>
              <select
                className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main"
                value={idSupplier}
                onChange={(e) => setIdSupplier(e.target.value)}
                required
              >
                {listSupplier.length === 0 ? (
                  <option value="">⏳ Loading Supplier...</option>
                ) : (
                  listSupplier.map((sup) => {
                    const id = sup.id_supplier || sup.ID_SUPPLIER || sup.ID_Supplier;
                    const nama = sup.nama_supplier || sup.NAMA_SUPPLIER || sup.Nama_Supplier;
                    return (
                      <option key={id} value={id}>
                        {nama} ({id})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Nama Barang</label>
              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main" placeholder="Contoh: Ayam Potong" value={namaBarang} onChange={(e) => setNamaBarang(e.target.value)} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Stok Awal</label>
                <input type="number" min="0" className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main" value={stok} onChange={(e) => setStok(e.target.value)} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Satuan</label>
                <select className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main" value={satuan} onChange={(e) => setSatuan(e.target.value)}>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Pcs">Pcs</option>
                </select>
              </div>
            </div>

            {/* Input Kapasitas Maksimum Gudang */}
            <div className="pt-2 border-t mt-4">
              <label className="block text-gray-700 font-medium mb-1 text-sm text-blue-600">
                Kapasitas Maksimum Gudang
              </label>
              <input 
                type="number" 
                min="1" 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 font-bold" 
                value={kapasitasMax} 
                onChange={(e) => setKapasitasMax(e.target.value)} 
                required 
              />
              <p className="text-xs text-gray-500 mt-1 italic">
                *Sistem akan memberikan peringatan "Menipis" jika stok &lt;= 10% dari kapasitas ini.
              </p>
            </div>

            <button type="submit" className="w-full bg-navy-main hover:bg-blue-900 text-white font-bold py-3 px-4 rounded mt-4">
              Simpan Barang
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}