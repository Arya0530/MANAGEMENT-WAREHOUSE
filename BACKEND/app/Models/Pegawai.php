<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    protected $table = 'PEGAWAI';
    protected $primaryKey = 'ID_Pegawai';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ID_Pegawai', 'Nama', 'Role_Akses', 'Username', 'Password'];
}