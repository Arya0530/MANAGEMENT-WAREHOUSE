<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangKeluar extends Model
{
    protected $table = 'BARANG_KELUAR';
    protected $primaryKey = 'ID_Keluar';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Keluar', 'ID_Barang', 'ID_Pegawai', 'Tgl_Keluar', 'Qty_Keluar', 'Tujuan'];

    // Relasi
    public function barang() { return $this->belongsTo(Barang::class, 'ID_Barang', 'ID_Barang'); }
    public function pegawai() { return $this->belongsTo(Pegawai::class, 'ID_Pegawai', 'ID_Pegawai'); }
}