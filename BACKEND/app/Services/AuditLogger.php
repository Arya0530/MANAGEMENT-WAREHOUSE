<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public static function record(?string $pegawaiId, string $aktivitas): void
    {
        if (!$pegawaiId) {
            return;
        }

        try {
            $id = self::nextId();

            DB::table('AUDIT_LOG')->insert([
                'ID_Log' => $id,
                'ID_Pegawai' => $pegawaiId,
                'Aktivitas' => $aktivitas,
                'Waktu' => now(),
            ]);
        } catch (\Throwable $e) {
            // Avoid breaking the main flow if logging fails.
        }
    }

    private static function nextId(): int
    {
        $id = null;

        if (DB::getDriverName() === 'oracle') {
            try {
                $row = DB::selectOne('select AUDIT_LOG_SEQ.NEXTVAL as id from dual');
                if ($row && isset($row->id)) {
                    $id = (int) $row->id;
                }
            } catch (\Throwable $e) {
                $id = null;
            }
        }

        if (!$id) {
            $max = DB::table('AUDIT_LOG')->max('ID_Log');
            $id = ((int) $max) + 1;
        }

        return $id;
    }
}
