<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Laporan Analytics</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #555; margin-bottom: 12px; }
        .section { margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; }
        th { background: #f2f2f2; text-align: left; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Analytics Gudang</h1>
    <div class="meta">Range: {{ $summary['range_days'] }} hari | Generated: {{ $generatedAt }}</div>

    <div class="section">
        <strong>Ringkasan</strong>
        <table>
            <thead>
                <tr>
                    <th>Total Barang</th>
                    <th>Total Kategori</th>
                    <th>Total Supplier</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="right">{{ $summary['totals']['barang'] }}</td>
                    <td class="right">{{ $summary['totals']['kategori'] }}</td>
                    <td class="right">{{ $summary['totals']['supplier'] }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <strong>Fast-Moving Items</strong>
        <table>
            <thead>
                <tr>
                    <th>ID Barang</th>
                    <th>Nama Barang</th>
                    <th class="right">Total Keluar</th>
                </tr>
            </thead>
            <tbody>
            @forelse ($summary['fast_moving'] as $item)
                <tr>
                    <td>{{ $item->id_barang ?? '-' }}</td>
                    <td>{{ $item->nama_barang ?? '-' }}</td>
                    <td class="right">{{ $item->total_keluar ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3">Tidak ada data.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <strong>Trend Barang Masuk</strong>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
            @forelse ($summary['trend']['masuk'] as $row)
                <tr>
                    <td>{{ $row->tanggal ?? '-' }}</td>
                    <td class="right">{{ $row->total ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="2">Tidak ada data.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <strong>Trend Barang Keluar</strong>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
            @forelse ($summary['trend']['keluar'] as $row)
                <tr>
                    <td>{{ $row->tanggal ?? '-' }}</td>
                    <td class="right">{{ $row->total ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="2">Tidak ada data.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    </div>
</body>
</html>
