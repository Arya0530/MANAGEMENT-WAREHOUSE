<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'AUDIT_LOG';
    protected $primaryKey = 'ID_Log';
    public $incrementing = false; // Dimatikan karena kita pakai Sequence & Trigger Oracle
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = ['ID_Log', 'ID_Pegawai', 'Aktivitas', 'Waktu'];

    public function pegawai() { return $this->belongsTo(Pegawai::class, 'ID_Pegawai', 'ID_Pegawai'); }
}