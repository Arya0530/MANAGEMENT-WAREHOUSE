<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Laporan Restock Alert</title>
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
    <h1>Laporan Restock Alert</h1>
    <div class="meta">Threshold: <= {{ $threshold }} | Generated: {{ $generatedAt }}</div>

    <table>
        <thead>
            <tr>
                <th>ID Barang</th>
                <th>Nama Barang</th>
                <th class="right">Stok</th>
                <th>Satuan</th>
            </tr>
        </thead>
        <tbody>
        @forelse ($items as $item)
            <tr>
                <td>{{ $item->id_barang ?? '-' }}</td>
                <td>{{ $item->nama_barang ?? '-' }}</td>
                <td class="right">{{ $item->stok ?? '-' }}</td>
                <td>{{ $item->satuan ?? '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4">Tidak ada barang menipis.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
