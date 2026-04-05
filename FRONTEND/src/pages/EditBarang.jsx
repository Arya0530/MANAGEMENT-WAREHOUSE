import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function EditBarang() {
  const { id } = useParams(); // Nangkep ID barang dari URL
  const [namaBarang, setNamaBarang] = useState('');
  const [stok, setStok] = useState('');
  const [satuan, setSatuan] = useState('Kg');
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
          const barangLama = res.data.data.find(b => b.id_barang === id);
          if (barangLama) {
            setNamaBarang(barangLama.nama_barang);
            setStok(barangLama.stok);
            setSatuan(barangLama.satuan);
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
        Satuan: satuan
      });

      setPesan({ text: 'Barang berhasil diupdate!', type: 'success' });
      // Otomatis balik ke dashboard setelah 1.5 detik
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorAsli = err.response?.data?.message || err.message;
      setPesan({ text: `Gagal: ${errorAsli}`, type: 'error' });
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
              <label className="block text-gray-700 font-medium mb-1">Nama Barang Baru</label>
              <label className="block text-gray-700 font-medium mb-1">Nama Barang</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-navy-main" 
                placeholder="Contoh: Ayam Potong" 
                value={namaBarang} 
                onChange={(e) => setNamaBarang(e.target.value)} 
                required 
                pattern=".*[a-zA-Z]+.*" 
                title="Nama barang tidak boleh angka saja, harus ada hurufnya!"
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
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded mt-4">
              Update Barang
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}