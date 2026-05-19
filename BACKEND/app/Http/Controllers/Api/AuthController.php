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

        // Cari pegawai (Oracle biasanya uppercase kolom, SQLite bisa lowercase)
        $user = Pegawai::where('username', $request->Username)->first()
            ?? Pegawai::where('Username', $request->Username)->first();

        $password = $user?->password ?? $user?->Password ?? null;

        if (!$user || $request->Password !== $password) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau Password salah!'
            ], 401);
        }

        // Bungkus ulang datanya biar React lu tetep bisa baca user.Nama dan user.Role_Akses
        $userData = [
            'ID_Pegawai' => $user->id_pegawai ?? $user->ID_Pegawai,
            'Nama'       => $user->nama ?? $user->Nama,
            'Role_Akses' => $user->role_akses ?? $user->Role_Akses,
            'Username'   => $user->username ?? $user->Username,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Login Berhasil',
            'data'    => $userData 
        ], 200);
    }
}