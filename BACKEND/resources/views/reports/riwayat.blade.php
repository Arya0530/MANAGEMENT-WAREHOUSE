<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Laporan Riwayat</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #555; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; }
        th { background: #f2f2f2; text-align: left; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Riwayat Aktivitas</h1>
    <div class="meta">Generated: {{ $generatedAt }}</div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Aktivitas/Status</th>
                <th>ID Barang</th>
                <th class="right">Qty</th>
                <th>Nama</th>
                <th>Role</th>
            </tr>
        </thead>
        <tbody>
        @forelse ($rows as $row)
            <tr>
                <td>{{ $row->id ?? '-' }}</td>
                <td>{{ $row->tanggal ?? '-' }}</td>
                <td>{{ $row->jenis ?? '-' }}</td>
                <td>{{ $row->status ?? '-' }}</td>
                <td>{{ $row->id_barang ?? '-' }}</td>
                <td class="right">{{ $row->qty ?? '-' }}</td>
                <td>{{ $row->nama ?? '-' }}</td>
                <td>{{ $row->role ?? '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8">Tidak ada data.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
