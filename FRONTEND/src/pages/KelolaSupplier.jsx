import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function KelolaSupplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [alamat, setAlamat] = useState('');
  const navigate = useNavigate();

  const fetchSuppliers = () => {
    axios.get('http://localhost:8000/api/supplier')
      .then(res => setSuppliers(res.data.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/supplier', {
        Nama_Supplier: nama,
        Kontak: kontak,
        Alamat: alamat
      });
      alert('Supplier Berhasil Ditambahkan!');
      setNama(''); setKontak(''); setAlamat('');
      fetchSuppliers(); // Refresh tabel otomatis
    } catch (err) {
      alert('Gagal menambah supplier, pastikan semua kolom terisi.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Yakin mau hapus supplier ini?')) {
      try {
        await axios.delete(`http://localhost:8000/api/supplier/${id}`);
        fetchSuppliers();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus supplier!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-light p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-navy-main p-6 text-white flex justify-between items-center rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold">Kelola Data Supplier</h2>
          <button onClick={() => navigate('/dashboard')} className="bg-yellow-accent text-navy-main px-4 py-2 rounded font-bold hover:bg-yellow-500">
            Kembali ke Dashboard
          </button>
        </div>

        {/* Form Tambah Supplier */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-navy-main mb-4">Tambah Supplier Baru</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Nama Supplier</label>
              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" value={nama} onChange={(e) => setNama(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">No. Kontak / HP</label>
              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" value={kontak} onChange={(e) => setKontak(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Alamat Lengkap</label>
              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" value={alamat} onChange={(e) => setAlamat(e.target.value)} required />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 rounded transition">
                Simpan Supplier
              </button>
            </div>
          </form>
        </div>

        {/* Tabel Data Supplier */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 text-navy-main">
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">Nama Supplier</th>
                <th className="p-4 border-b">Kontak</th>
                <th className="p-4 border-b">Alamat</th>
                <th className="p-4 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup.id_supplier || sup.ID_SUPPLIER} className="hover:bg-gray-50 border-b">
                  <td className="p-4 font-bold">{sup.id_supplier || sup.ID_SUPPLIER}</td>
                  <td className="p-4">{sup.nama_supplier || sup.NAMA_SUPPLIER}</td>
                  <td className="p-4">{sup.kontak || sup.KONTAK}</td>
                  <td className="p-4">{sup.alamat || sup.ALAMAT}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(sup.id_supplier || sup.ID_SUPPLIER)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded shadow text-sm">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}