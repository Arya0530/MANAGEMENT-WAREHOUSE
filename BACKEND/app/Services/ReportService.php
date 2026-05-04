<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReportService
{
    public static function lowStock(int $threshold = 5): array
    {
        $items = DB::table('BARANG')
            ->select(
                'ID_Barang as id_barang',
                'Nama_Barang as nama_barang',
                'Stok as stok',
                'Satuan as satuan'
            )
            ->where('Stok', '<=', $threshold)
            ->orderBy('Stok', 'asc')
            ->get();

        return $items->all();
    }

    public static function analyticsSummary(int $days = 30): array
    {
        $since = now()->subDays($days);

        $totalBarang = DB::table('BARANG')->count();
        $totalKategori = DB::table('KATEGORI')->count();
        $totalSupplier = DB::table('SUPPLIER')->count();

        $masukTrend = self::trendByDate('BARANG_MASUK', 'Tgl_Masuk', 'Qty_Masuk', $since);
        $keluarTrend = self::trendByDate('BARANG_KELUAR', 'Tgl_Keluar', 'Qty_Keluar', $since);

        $fastMoving = DB::table('BARANG_KELUAR as bk')
            ->join('BARANG as b', 'bk.ID_Barang', '=', 'b.ID_Barang')
            ->select(
                'bk.ID_Barang as id_barang',
                'b.Nama_Barang as nama_barang',
                DB::raw('SUM(bk.Qty_Keluar) as total_keluar')
            )
            ->where('bk.Tgl_Keluar', '>=', $since)
            ->groupBy('bk.ID_Barang', 'b.Nama_Barang')
            ->orderByRaw('SUM(bk.Qty_Keluar) desc')
            ->limit(5)
            ->get();

        return [
            'range_days' => $days,
            'totals' => [
                'barang' => $totalBarang,
                'kategori' => $totalKategori,
                'supplier' => $totalSupplier,
            ],
            'trend' => [
                'masuk' => $masukTrend,
                'keluar' => $keluarTrend,
            ],
            'fast_moving' => $fastMoving->all(),
            'low_stock' => self::lowStock(5),
        ];
    }

    public static function riwayat(?string $role, ?string $pegawaiId): array
    {
        $role = $role ?: 'Staf';

        $masukQuery = DB::table('BARANG_MASUK as bm')
            ->join('PEGAWAI as p', 'bm.ID_Pegawai', '=', 'p.ID_Pegawai')
            ->select(
                'bm.ID_Masuk as id',
                'bm.Tgl_Masuk as tanggal',
                'bm.ID_Barang as id_barang',
                'bm.Qty_Masuk as qty',
                'bm.Status as status',
                'bm.ID_Pegawai as pembuat',
                'p.Nama as nama',
                'p.Role_Akses as role',
                DB::raw("'Barang Masuk' as jenis")
            );

        $keluarQuery = DB::table('BARANG_KELUAR as bk')
            ->join('PEGAWAI as p', 'bk.ID_Pegawai', '=', 'p.ID_Pegawai')
            ->select(
                'bk.ID_Keluar as id',
                'bk.Tgl_Keluar as tanggal',
                'bk.ID_Barang as id_barang',
                'bk.Qty_Keluar as qty',
                'bk.Status as status',
                'bk.ID_Pegawai as pembuat',
                'p.Nama as nama',
                'p.Role_Akses as role',
                DB::raw("'Barang Keluar' as jenis")
            );

        if ($role === 'Staf' && $pegawaiId) {
            $masukQuery->where('bm.ID_Pegawai', $pegawaiId);
            $keluarQuery->where('bk.ID_Pegawai', $pegawaiId);
        }

        $masuk = $masukQuery->get();
        $keluar = $keluarQuery->get();

        $riwayat = $masuk->merge($keluar);

        if ($role === 'Admin') {
            $auditLog = DB::table('AUDIT_LOG as al')
                ->join('PEGAWAI as p', 'al.ID_Pegawai', '=', 'p.ID_Pegawai')
                ->select(
                    'al.ID_Log as id',
                    'al.Waktu as tanggal',
                    DB::raw("'-' as id_barang"),
                    DB::raw("'-' as qty"),
                    'al.Aktivitas as status',
                    'al.ID_Pegawai as pembuat',
                    'p.Nama as nama',
                    'p.Role_Akses as role',
                    DB::raw("'Aktivitas' as jenis")
                )
                ->get();

            $riwayat = $riwayat->merge($auditLog);
        }

        return $riwayat->sortByDesc('tanggal')->values()->all();
    }

    private static function trendByDate(string $table, string $dateColumn, string $qtyColumn, $since): array
    {
        $dateExpr = self::dateExpression($dateColumn);

        $rows = DB::table($table)
            ->select(
                DB::raw($dateExpr . ' as tanggal'),
                DB::raw('SUM(' . $qtyColumn . ') as total')
            )
            ->where($dateColumn, '>=', $since)
            ->groupBy(DB::raw($dateExpr))
            ->orderBy(DB::raw($dateExpr))
            ->get();

        return $rows->all();
    }

    private static function dateExpression(string $column): string
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite' || $driver === 'pgsql' || $driver === 'mysql') {
            return 'date(' . $column . ')';
        }

        return 'TRUNC(' . $column . ')';
    }
}
