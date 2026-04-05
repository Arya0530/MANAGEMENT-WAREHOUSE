<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pegawai;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'Username' => 'required',
            'Password' => 'required'
        ]);

        // Cari pegawai (Laravel OCI8 bakal baca nama kolom dari form secara otomatis)
        $user = Pegawai::where('username', $request->Username)->first();

        // PENTING: Panggil password dengan huruf kecil ($user->password) karena efek OCI8
        if (!$user || $request->Password !== $user->password) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau Password salah!'
            ], 401);
        }

        // Bungkus ulang datanya biar React lu tetep bisa baca user.Nama dan user.Role_Akses
        $userData = [
            'ID_Pegawai' => $user->id_pegawai,
            'Nama'       => $user->nama,
            'Role_Akses' => $user->role_akses,
            'Username'   => $user->username
        ];

        return response()->json([
            'success' => true,
            'message' => 'Login Berhasil',
            'data'    => $userData 
        ], 200);
    }
}