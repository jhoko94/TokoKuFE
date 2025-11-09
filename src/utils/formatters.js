// File: src/utils/formatters.js

export function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

export function formatStockDisplay(product, stockInBaseUnit) {
    // ... (salin-tempel fungsi Anda dari script.js) ...
    const sortedUnits = [...product.units].sort((a, b) => b.conversion - a.conversion);
    // ... sisanya sama ...
}