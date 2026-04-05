<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'KATEGORI';
    protected $primaryKey = 'ID_Kategori';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Kategori', 'Nama_Kategori'];
}