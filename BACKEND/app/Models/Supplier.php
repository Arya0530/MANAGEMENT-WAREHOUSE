<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'SUPPLIER';
    protected $primaryKey = 'ID_Supplier';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Supplier', 'Nama_Supplier', 'Kontak'];
}