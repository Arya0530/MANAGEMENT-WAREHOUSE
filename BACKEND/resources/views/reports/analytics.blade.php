<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Analytics Gudang</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            color: #111827;
            background: #f8fafc;
            padding: 24px;
        }

        /* ── HEADER ── */
        .header {
            background: #1e3a5f;
            color: white;
            padding: 20px 24px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .header .meta {
            font-size: 11px;
            color: #cbd5e1;
        }
        .header .badge {
            display: inline-block;
            background: #f5a623;
            color: #1e3a5f;
            font-size: 10px;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 20px;
            margin-top: 8px;
        }

        /* ── SUMMARY CARDS ── */
        .cards-row {
            width: 100%;
            margin-bottom: 20px;
        }
        .cards-row table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px;
        }
        .card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px 18px;
            width: 33%;
        }
        .card .card-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 6px;
        }
        .card .card-value {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a5f;
        }
        .card .card-icon {
            font-size: 22px;
            float: right;
            margin-top: -4px;
        }

        /* ── SECTION CARD ── */
        .section-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px 18px;
            margin-bottom: 16px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 4px;
        }
        .section-subtitle {
            font-size: 10px;
            color: #9ca3af;
            margin-bottom: 12px;
        }

        /* ── TABLE ── */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.data-table th {
            background: #f1f5f9;
            color: #374151;
            font-size: 11px;
            font-weight: bold;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
        }
        table.data-table td {
            padding: 7px 10px;
            font-size: 11px;
            color: #374151;
            border-bottom: 1px solid #f1f5f9;
        }
        table.data-table tr:last-child td {
            border-bottom: none;
        }
        table.data-table tr:nth-child(even) td {
            background: #fafafa;
        }
        .right { text-align: right; }
        .center { text-align: center; }

        /* ── TREND: gabungan per tanggal ── */
        .trend-masuk  { color: #2563eb; font-weight: bold; }
        .trend-keluar { color: #f97316; font-weight: bold; }

        /* ── FAST MOVING: rank badge ── */
        .rank-badge {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 10px;
            font-weight: bold;
            color: white;
        }
        .rank-1 { background: #f97316; }
        .rank-2 { background: #fb923c; }
        .rank-other { background: #fed7aa; color: #9a3412; }

        /* progress bar via table trick */
        .bar-wrap { background: #f3f4f6; border-radius: 4px; height: 6px; width: 100%; }
        .bar-fill  { border-radius: 4px; height: 6px; }

        /* ── LOW STOCK ── */
        .stok-red { color: #dc2626; font-weight: bold; }

        /* ── EMPTY ── */
        .empty-row td {
            text-align: center;
            color: #9ca3af;
            padding: 16px;
            font-style: italic;
        }

        /* ── TWO-COLUMN GRID ── */
        .two-col-table { width: 100%; border-collapse: separate; border-spacing: 10px; }
        .two-col-cell  { width: 50%; vertical-align: top; }

        /* ── FOOTER ── */
        .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
        }
    </style>
</head>
<body>

    {{-- HEADER --}}
    <div class="header">
        <h1>Dashboard Analytics Gudang</h1>
        <div class="meta">
            Periode: {{ $summary['range_days'] ?? '-' }} hari terakhir
            &nbsp;|&nbsp;
            Generated: {{ \Carbon\Carbon::parse($generatedAt)->format('d M Y, H:i') }}
        </div>
        <div class="badge">📊 Laporan Resmi</div>
    </div>

    {{-- SUMMARY CARDS --}}
    <div class="cards-row">
        <table>
            <tr>
                <td class="card">
                    <div class="card-label">Total Barang</div>
                    <div class="card-value">{{ number_format($summary['totals']['barang'] ?? 0) }}</div>
                </td>
                <td class="card">
                    <div class="card-label">Total Kategori</div>
                    <div class="card-value">{{ number_format($summary['totals']['kategori'] ?? 0) }}</div>
                </td>
                <td class="card">
                    <div class="card-label">Total Supplier</div>
                    <div class="card-value">{{ number_format($summary['totals']['supplier'] ?? 0) }}</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- TREND AKTIVITAS (gabungkan masuk & keluar per tanggal) --}}
    @php
        $masukRows  = collect($summary['trend']['masuk']  ?? []);
        $keluarRows = collect($summary['trend']['keluar'] ?? []);

        // Helper: ambil tanggal dari object/array, normalkan ke Y-m-d
        $getDate = function($r) {
            if (is_object($r)) {
                $raw = $r->tanggal ?? $r->TANGGAL ?? '';
            } else {
                $raw = $r['tanggal'] ?? $r['TANGGAL'] ?? '';
            }
            if ($raw instanceof \DateTime) return $raw->format('Y-m-d');
            return substr((string) $raw, 0, 10);
        };

        $getTotal = function($r) {
            if (is_object($r)) return (float)($r->total ?? $r->TOTAL ?? 0);
            return (float)($r['total'] ?? $r['TOTAL'] ?? 0);
        };

        $getNama = function($r) {
            if (is_object($r)) return $r->nama_barang ?? $r->NAMA_BARANG ?? '-';
            return $r['nama_barang'] ?? $r['NAMA_BARANG'] ?? '-';
        };

        $getId = function($r) {
            if (is_object($r)) return $r->id_barang ?? $r->ID_BARANG ?? '-';
            return $r['id_barang'] ?? $r['ID_BARANG'] ?? '-';
        };

        // Build map: "tanggal|id_barang" => [tanggal, id_barang, nama_barang, masuk, keluar]
        $combinedMap = [];

        foreach ($masukRows as $r) {
            $tgl  = $getDate($r);
            $id   = $getId($r);
            $nama = $getNama($r);
            $key  = $tgl . '|' . $id;
            if (!isset($combinedMap[$key])) {
                $combinedMap[$key] = ['tanggal' => $tgl, 'id_barang' => $id, 'nama_barang' => $nama, 'masuk' => 0, 'keluar' => 0];
            }
            $combinedMap[$key]['masuk'] += $getTotal($r);
        }

        foreach ($keluarRows as $r) {
            $tgl  = $getDate($r);
            $id   = $getId($r);
            $nama = $getNama($r);
            $key  = $tgl . '|' . $id;
            if (!isset($combinedMap[$key])) {
                $combinedMap[$key] = ['tanggal' => $tgl, 'id_barang' => $id, 'nama_barang' => $nama, 'masuk' => 0, 'keluar' => 0];
            }
            $combinedMap[$key]['keluar'] += $getTotal($r);
        }

        // Urutkan: per tanggal asc, lalu nama_barang asc
        usort($combinedMap, function($a, $b) {
            $tglCmp = strcmp($a['tanggal'], $b['tanggal']);
            return $tglCmp !== 0 ? $tglCmp : strcmp($a['nama_barang'], $b['nama_barang']);
        });

        $trendRows   = collect($combinedMap);
        $totalMasuk  = $trendRows->sum('masuk');
        $totalKeluar = $trendRows->sum('keluar');
        $grandTotal  = $totalMasuk + $totalKeluar;
    @endphp

    <div class="section-card">
        <div class="section-title">Trend Aktivitas Gudang</div>
        <div class="section-subtitle">Ringkasan pergerakan barang masuk &amp; keluar per hari</div>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>ID Barang</th>
                    <th>Nama Barang</th>
                    <th class="right" style="color:#2563eb;">🔵 Masuk</th>
                    <th class="right" style="color:#f97316;">🟠 Keluar</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
            @forelse ($trendRows as $row)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($row['tanggal'])->translatedFormat('d M Y') }}</td>
                    <td>{{ $row['id_barang'] }}</td>
                    <td>{{ $row['nama_barang'] }}</td>
                    <td class="right trend-masuk">{{ $row['masuk'] > 0 ? number_format($row['masuk']) : '-' }}</td>
                    <td class="right trend-keluar">{{ $row['keluar'] > 0 ? number_format($row['keluar']) : '-' }}</td>
                    <td class="right">{{ number_format($row['masuk'] + $row['keluar']) }}</td>
                </tr>
            @empty
                <tr class="empty-row"><td colspan="6">Tidak ada data trend.</td></tr>
            @endforelse
            </tbody>
            @if($trendRows->count() > 0)
            <tfoot>
                <tr style="background:#f1f5f9; font-weight:bold;">
                    <td colspan="3"><strong>Total Keseluruhan</strong></td>
                    <td class="right trend-masuk">{{ number_format($totalMasuk) }}</td>
                    <td class="right trend-keluar">{{ number_format($totalKeluar) }}</td>
                    <td class="right">{{ number_format($grandTotal) }}</td>
                </tr>
            </tfoot>
            @endif
        </table>
    </div>

    {{-- FAST MOVING + BARANG MENIPIS (2 kolom) --}}
    <table class="two-col-table">
        <tr>
            {{-- FAST MOVING --}}
            <td class="two-col-cell">
                <div class="section-card" style="margin-bottom:0;">
                    <div class="section-title">Fast-Moving Items</div>
                    <div class="section-subtitle">Top 5 barang dengan keluar tertinggi</div>

                    @php
                        $fastMoving = collect($summary['fast_moving'] ?? [])
                            ->map(fn($i) => (object)[
                                'id_barang'   => $i->id_barang   ?? $i->ID_BARANG   ?? '-',
                                'nama_barang' => $i->nama_barang ?? $i->NAMA_BARANG ?? '-',
                                'total_keluar'=> (int)($i->total_keluar ?? $i->TOTAL_KELUAR ?? 0),
                            ])
                            ->sortByDesc('total_keluar')
                            ->values()
                            ->take(5);

                        $maxKeluar = $fastMoving->max('total_keluar') ?: 1;
                    @endphp

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width:28px;">#</th>
                                <th>Nama Barang</th>
                                <th class="right">Keluar</th>
                            </tr>
                        </thead>
                        <tbody>
                        @forelse ($fastMoving as $idx => $item)
                            <tr>
                                <td class="center">
                                    <span class="rank-badge {{ $idx === 0 ? 'rank-1' : ($idx === 1 ? 'rank-2' : 'rank-other') }}">
                                        {{ $idx + 1 }}
                                    </span>
                                </td>
                                <td>
                                    {{ $item->nama_barang }}
                                    <br>
                                    {{-- mini progress bar --}}
                                    <div class="bar-wrap" style="margin-top:4px;">
                                        <div class="bar-fill" style="
                                            width: {{ round(($item->total_keluar / $maxKeluar) * 100) }}%;
                                            background: {{ $idx === 0 ? '#f97316' : ($idx === 1 ? '#fb923c' : '#fed7aa') }};
                                        "></div>
                                    </div>
                                </td>
                                <td class="right trend-keluar">{{ number_format($item->total_keluar) }}</td>
                            </tr>
                        @empty
                            <tr class="empty-row"><td colspan="3">Belum ada data.</td></tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </td>

            {{-- BARANG MENIPIS --}}
            <td class="two-col-cell">
                <div class="section-card" style="margin-bottom:0;">
                    <div class="section-title">Barang Menipis (&le; 10% Kapasitas)</div>
                    <div class="section-subtitle">Stok mendekati habis, perlu restock segera</div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nama</th>
                                <th class="right">Stok</th>
                                <th class="right">Kapasitas</th>
                                <th>Satuan</th>
                            </tr>
                        </thead>
                        <tbody>
                        @forelse ($summary['low_stock'] ?? [] as $item)
                            <tr>
                                <td>{{ $item->id_barang ?? $item->ID_BARANG ?? '-' }}</td>
                                <td>{{ $item->nama_barang ?? $item->NAMA_BARANG ?? '-' }}</td>
                                <td class="right stok-red">{{ $item->stok ?? $item->STOK ?? '-' }}</td>
                                <td class="right">{{ $item->kapasitas_max ?? $item->KAPASITAS_MAX ?? '-' }}</td>
                                <td>{{ $item->satuan ?? $item->SATUAN ?? '-' }}</td>
                            </tr>
                        @empty
                            <tr class="empty-row"><td colspan="5">Tidak ada barang menipis.</td></tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    {{-- FOOTER --}}
    <div class="footer">
        Laporan ini digenerate otomatis oleh sistem &mdash; {{ \Carbon\Carbon::parse($generatedAt)->format('d M Y H:i:s') }}
    </div>

</body>
</html>