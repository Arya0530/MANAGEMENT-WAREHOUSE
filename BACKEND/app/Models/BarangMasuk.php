<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangMasuk extends Model
{
    protected $table = 'BARANG_MASUK';
    protected $primaryKey = 'ID_Masuk';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Masuk', 'ID_Barang', 'ID_Supplier', 'ID_Pegawai', 'Tgl_Masuk', 'Qty_Masuk', 'Status'];

    // Relasi
    public function barang() { return $this->belongsTo(Barang::class, 'ID_Barang', 'ID_Barang'); }
    public function supplier() { return $this->belongsTo(Supplier::class, 'ID_Supplier', 'ID_Supplier'); }
    public function pegawai() { return $this->belongsTo(Pegawai::class, 'ID_Pegawai', 'ID_Pegawai'); }
}