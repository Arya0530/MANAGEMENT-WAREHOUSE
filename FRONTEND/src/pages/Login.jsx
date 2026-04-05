import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Nembak API Laravel
      const response = await axios.post('http://localhost:8000/api/login', {
        Username: username,
        Password: password
      });

      if (response.data.success) {
        // Simpan data user ke LocalStorage biar halaman lain tau siapa yang login
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        // Pindah ke halaman Dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      // Tangkap pesan error dari backend kalau password/username salah
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center p-4">
      {/* Container utama dengan warna Navy Blue */}
      <div className="bg-navy-main rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">E-Gudang</h1>
          <p className="text-gray-300 mb-8">Sistem Manajemen Logistik Terpusat</p>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded bg-white text-gray-900 border focus:border-yellow-accent focus:ring-2 focus:ring-yellow-accent outline-none transition"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded bg-white text-gray-900 border focus:border-yellow-accent focus:ring-2 focus:ring-yellow-accent outline-none transition"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-yellow-accent hover:bg-yellow-500 text-navy-main font-bold py-3 px-4 rounded transition duration-200 mt-4"
            >
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}