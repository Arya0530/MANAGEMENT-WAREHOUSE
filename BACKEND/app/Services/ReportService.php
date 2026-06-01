<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Issue #3: Barang menipis = stok <= 10% dari Kapasitas_Max
     * Tidak pakai threshold hardcoded lagi.
     */
    public static function lowStock(int $threshold = 5): array
    {
        $items = DB::table('BARANG')
            ->select(
                'ID_Barang as id_barang',
                'Nama_Barang as nama_barang',
                'Stok as stok',
                'Satuan as satuan',
                'Kapasitas_Max as kapasitas_max'
            )
            ->whereRaw('Stok <= Kapasitas_Max * 0.1')
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

        // Issue #1: Trend sekarang include nama_barang per item
        $masukTrend = self::trendByDateWithName('BARANG_MASUK', 'Tgl_Masuk', 'Qty_Masuk', $since);
        $keluarTrend = self::trendByDateWithName('BARANG_KELUAR', 'Tgl_Keluar', 'Qty_Keluar', $since);

        // Issue #2: Fast-moving sekarang include total_masuk juga
        $fastMoving = self::fastMovingWithFlow($since);

        return [
            'range_days' => $days,
            'date_from'  => $since->toDateString(),
            'date_to'    => now()->toDateString(),
            'totals' => [
                'barang' => $totalBarang,
                'kategori' => $totalKategori,
                'supplier' => $totalSupplier,
            ],
            'trend' => [
                'masuk' => $masukTrend,
                'keluar' => $keluarTrend,
            ],
            'fast_moving' => $fastMoving,
            'low_stock' => self::lowStock(5),
        ];
    }

    public static function riwayat(?string $role, ?string $pegawaiId): array
    {
        $role = $role ?: 'Staf';

        $masukQuery = DB::table('BARANG_MASUK as bm')
            ->join('PEGAWAI as p', 'bm.ID_Pegawai', '=', 'p.ID_Pegawai')
            ->join('BARANG as b', 'bm.ID_Barang', '=', 'b.ID_Barang')
            ->select(
                'bm.ID_Masuk as id',
                'bm.Tgl_Masuk as tanggal',
                'bm.ID_Barang as id_barang',
                'b.Nama_Barang as nama_barang',
                'bm.Qty_Masuk as qty',
                'bm.Status as status',
                'bm.ID_Pegawai as pembuat',
                'p.Nama as nama',
                'p.Role_Akses as role',
                DB::raw("'Barang Masuk' as jenis")
            );

        $keluarQuery = DB::table('BARANG_KELUAR as bk')
            ->join('PEGAWAI as p', 'bk.ID_Pegawai', '=', 'p.ID_Pegawai')
            ->join('BARANG as b', 'bk.ID_Barang', '=', 'b.ID_Barang')
            ->select(
                'bk.ID_Keluar as id',
                'bk.Tgl_Keluar as tanggal',
                'bk.ID_Barang as id_barang',
                'b.Nama_Barang as nama_barang',
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

    /**
     * Issue #1: Trend per tanggal dengan nama_barang di setiap row
     */
    private static function trendByDateWithName(string $table, string $dateColumn, string $qtyColumn, $since): array
    {
        $driver = DB::getDriverName();

        // Oracle: TRUNC tidak butuh prefix alias tabel
        // MySQL/SQLite: pakai DATE()
        if ($driver === 'oracle' || $driver === 'oci8') {
            $dateExpr    = 'TRUNC(t.' . $dateColumn . ')';
            $groupByExpr = 'TRUNC(t.' . $dateColumn . ')';
        } else {
            $dateExpr    = 'DATE(t.' . $dateColumn . ')';
            $groupByExpr = 'DATE(t.' . $dateColumn . ')';
        }

        $rows = DB::table($table . ' as t')
            ->join('BARANG as b', 't.ID_Barang', '=', 'b.ID_Barang')
            ->select(
                DB::raw($dateExpr . ' as tanggal'),
                'b.Nama_Barang as nama_barang',
                'b.ID_Barang as id_barang',
                DB::raw('SUM(t.' . $qtyColumn . ') as total')
            )
            ->where('t.' . $dateColumn, '>=', $since)
            ->groupBy(DB::raw($groupByExpr), 'b.Nama_Barang', 'b.ID_Barang')
            ->orderBy(DB::raw($groupByExpr))
            ->get();

        return $rows->all();
    }

    /**
     * Issue #2: Fast-moving items dengan info total_masuk DAN total_keluar
     */
    private static function fastMovingWithFlow($since): array
    {
        // Hitung total keluar per barang
        $keluarData = DB::table('BARANG_KELUAR as bk')
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
            ->get()
            ->keyBy('id_barang');

        // Hitung total masuk per barang (hanya barang yang sudah ada di keluarData)
        $barangIds = $keluarData->pluck('id_barang')->all();

        $masukData = collect();
        if (!empty($barangIds)) {
            $masukData = DB::table('BARANG_MASUK as bm')
                ->select(
                    'bm.ID_Barang as id_barang',
                    DB::raw('SUM(bm.Qty_Masuk) as total_masuk')
                )
                ->where('bm.Tgl_Masuk', '>=', $since)
                ->whereIn('bm.ID_Barang', $barangIds)
                ->groupBy('bm.ID_Barang')
                ->get()
                ->keyBy('id_barang');
        }

        // Gabungkan data keluar + masuk
        $result = [];
        foreach ($keluarData as $id => $item) {
            $totalMasuk = $masukData->has($id) ? $masukData[$id]->total_masuk : 0;
            $result[] = (object) [
                'id_barang' => $item->id_barang,
                'nama_barang' => $item->nama_barang,
                'total_keluar' => $item->total_keluar,
                'total_masuk' => $totalMasuk,
            ];
        }

        return $result;
    }

    private static function dateExpression(string $column): string
    {
        $driver = DB::getDriverName();

        if ($driver === 'oracle' || $driver === 'oci8') {
            return 'TRUNC(' . $column . ')';
        }

        return 'DATE(' . $column . ')';
    }
}
