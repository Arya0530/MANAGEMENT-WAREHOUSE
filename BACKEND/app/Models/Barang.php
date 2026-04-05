<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    protected $table = 'BARANG';
    protected $primaryKey = 'ID_Barang';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Barang', 'ID_Kategori', 'Nama_Barang', 'Stok', 'Satuan'];

    // Relasi ke Kategori
    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'ID_Kategori', 'ID_Kategori');
    }
}