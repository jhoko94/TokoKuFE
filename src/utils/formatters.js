// File: src/utils/formatters.js

export function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

export function formatStockDisplay(product, stockInBaseUnit) {
    // Handle jika product atau units tidak ada
    if (!product) {
        return `${stockInBaseUnit || 0} unit`;
    }
    
    // Jika tidak ada units, tampilkan dalam unit dasar
    if (!product.units || product.units.length === 0) {
        return `${stockInBaseUnit || 0} unit`;
    }
    
    // Sort units dari conversion terbesar ke terkecil
    const sortedUnits = [...product.units].sort((a, b) => (b.conversion || 0) - (a.conversion || 0));
    
    let remaining = Number(stockInBaseUnit) || 0;
    const parts = [];
    
    // Hitung untuk setiap unit dari yang terbesar
    for (const unit of sortedUnits) {
        const conversion = Number(unit.conversion) || 1;
        if (remaining >= conversion && conversion > 0) {
            const count = Math.floor(remaining / conversion);
            if (count > 0) {
                parts.push(`${count} ${unit.name || 'unit'}`);
                remaining = remaining % conversion;
            }
        }
    }
    
    // Jika masih ada sisa, tampilkan dalam unit terkecil
    if (remaining > 0 && sortedUnits.length > 0) {
        const smallestUnit = sortedUnits[sortedUnits.length - 1];
        parts.push(`${remaining} ${smallestUnit.name || 'unit'}`);
    }
    
    // Jika tidak ada stok sama sekali atau tidak ada parts
    if (parts.length === 0) {
        if (sortedUnits.length > 0) {
            // Ambil unit terkecil (conversion = 1) atau unit pertama
            const smallestUnit = sortedUnits.find(u => Number(u.conversion) === 1) || sortedUnits[sortedUnits.length - 1];
            return `0 ${smallestUnit?.name || 'unit'}`;
        }
        return '0 unit';
    }
    
    const result = parts.join(', ');
    return result || '0 unit'; // Fallback jika result kosong
}

// Fungsi untuk mencari produk berdasarkan barcode
export function findProductByBarcode(barcode, products) {
    if (!barcode || !products) return null;
    
    // Cari di semua produk dan semua unit-nya
    for (const product of products) {
        if (!product.units || product.units.length === 0) continue;
        
        for (const unit of product.units) {
            if (unit.barcodes && unit.barcodes.includes(barcode)) {
                return { product, unit };
            }
        }
    }
    
    return null;
}