import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function EditBarang() {
  const { id } = useParams(); // Nangkep ID barang dari URL
  const [namaBarang, setNamaBarang] = useState('');
  const [stok, setStok] = useState('');
  const [satuan, setSatuan] = useState('Kg');
  
  // TAMBAHAN: State buat nangkep batas gudang dari Oracle
  const [batasMinimum, setBatasMinimum] = useState('');
  const [kapasitasMax, setKapasitasMax] = useState('');
  
  const [pesan, setPesan] = useState({ text: '', type: '' });
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Cuma Admin yang boleh edit barang master
  useEffect(() => {
    if (!user || user.Role_Akses !== 'Admin') {
      navigate('/dashboard');
    } else {
      // Narik data barang yang mau diedit
      axios.get('http://localhost:8000/api/barang')
        .then(res => {
          const barangLama = res.data.data.find(b => (b.id_barang || b.ID_BARANG) === id);
          if (barangLama) {
            setNamaBarang(barangLama.nama_barang || barangLama.NAMA_BARANG);
            setStok(barangLama.stok || barangLama.STOK);
            setSatuan(barangLama.satuan || barangLama.SATUAN);
            
            // TAMBAHAN: Nangkep data batas dari Oracle (Handle huruf besar/kecil)
            setBatasMinimum(barangLama.batas_minimum || barangLama.BATAS_MINIMUM || 5);
            setKapasitasMax(barangLama.kapasitas_max || barangLama.KAPASITAS_MAX || 50);
          }
        })
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });

    try {
      await axios.put(`http://localhost:8000/api/barang/${id}`, {
        Nama_Barang: namaBarang,
        Stok: stok,
        Satuan: satuan,
        Batas_Minimum: batasMinimum, // KIRIM KE LARAVEL
        Kapasitas_Max: kapasitasMax,  // KIRIM KE LARAVEL
        ID_Pegawai: user.ID_Pegawai || user.id_pegawai || 'P001'
      });

      setPesan({ text: '✅ Barang dan Kapasitas berhasil diupdate!', type: 'success' });
      // Otomatis balik ke dashboard setelah 1.5 detik
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorAsli = err.response?.data?.message || err.message;
      setPesan({ text: `🚨 Gagal: ${errorAsli}`, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-navy-main p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Data Barang ({id})</h2>
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-yellow-accent text-navy-main px-3 py-1 rounded font-bold">
            Batal
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
              <label className="block text-gray-700 font-medium mb-1">Nama Barang</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main" 
                value={namaBarang} 
                onChange={(e) => setNamaBarang(e.target.value)} 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Update Stok</label>
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
            
  {/* FITUR KAPASITAS (Cuma Max doang, Min diitung sistem) */}
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
                *Sistem akan memberikan peringatan "Menipis" jika stok &lt;= 5.
              </p>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded mt-6">
              Update Barang & Kapasitas
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}