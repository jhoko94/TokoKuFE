import { useState } from 'react';
import Papa from 'papaparse';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';

const REQUIRED_COLUMNS = ['KODE ITEM', 'NAMA ITEM'];

const COLUMN_KEYS = {
  sku: 'KODE ITEM',
  barcode: 'BARCODE',
  name: 'NAMA ITEM',
  unitName: 'SATUAN',
  price: 'HARGA JUAL',
  costPrice: 'HARGA POKOK',
  initialStock: 'STOK AWAL',
  minStock: 'STOK MINIMUM',
  supplierName: 'KODE SUPPLIER',
  brand: 'MEREK',
  category: 'JENIS',
  notes: 'KETERANGAN',
};

const parseNumber = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRowToItem = (row) => {
  const get = (key) => row[key] ?? row[key?.toLowerCase?.()] ?? '';

  return {
    sku: get(COLUMN_KEYS.sku)?.trim(),
    barcode: get(COLUMN_KEYS.barcode)?.trim(),
    name: get(COLUMN_KEYS.name)?.trim(),
    unitName: get(COLUMN_KEYS.unitName)?.trim() || 'PCS',
    price: parseNumber(get(COLUMN_KEYS.price)),
    initialStock: parseNumber(get(COLUMN_KEYS.initialStock)),
    minStock: parseNumber(get(COLUMN_KEYS.minStock)),
    supplierName: get(COLUMN_KEYS.supplierName)?.trim(),
    brand: get(COLUMN_KEYS.brand)?.trim(),
    category: get(COLUMN_KEYS.category)?.trim(),
    notes: get(COLUMN_KEYS.notes)?.trim(),
  };
};

export default function ModalImportProducts({ isOpen, onClose }) {
  const { importProducts, showToast } = useStore();
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const resetStates = () => {
    setRows([]);
    setErrors([]);
    setImportResult(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetStates();
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data;
        const missingColumns = REQUIRED_COLUMNS.filter(
          (col) => !results.meta.fields.includes(col),
        );

        if (missingColumns.length > 0) {
          setErrors([`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`]);
          setRows([]);
          setImportResult(null);
          return;
        }

        const mapped = parsedRows
          .map(mapRowToItem)
          .filter((item) => item.sku && item.name);

        if (mapped.length === 0) {
          setErrors(['Tidak ada baris valid setelah parsing.']);
          setRows([]);
          setImportResult(null);
          return;
        }

        setErrors([]);
        setRows(mapped);
        setImportResult(null);
      },
      error: (error) => {
        setErrors([`Gagal membaca file: ${error.message}`]);
        setRows([]);
        setImportResult(null);
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rows.length === 0) {
      setErrors(['Belum ada data yang siap diimport.']);
      return;
    }

    setIsSubmitting(true);
    setImportResult(null);
    try {
      const result = await importProducts(rows);
      setImportResult(result);
      if (result.failed > 0) {
        setErrors([
          `Import selesai dengan ${result.failed} baris gagal. Lihat detail di bawah.`,
        ]);
      } else {
        setErrors([]);
      }
    } catch (error) {
      setErrors([error.message || 'Gagal mengimport produk.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="modal-content !max-w-3xl">
        <h3 className="text-xl font-bold mb-4">Import Produk dari IPOS5</h3>
        <p className="text-sm text-gray-600 mb-4">
          Unggah file CSV/XLSX (disimpan sebagai CSV) dengan format kolom seperti IPOS5:
          KODE ITEM, BARCODE, NAMA ITEM, SATUAN, HARGA JUAL, STOK AWAL, STOK MINIMUM, dll.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

          {isSubmitting && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-blue-500 animate-progress"></div>
              </div>
              <p className="text-sm text-gray-600">
                Mengimport {rows.length.toLocaleString()} baris... Mohon tunggu, proses ini
                bisa memakan waktu beberapa menit untuk data besar.
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {errors.map((err) => (
                <p key={err} className="text-sm">
                  {err}
                </p>
              ))}
            </div>
          )}

          {importResult && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded space-y-2">
              <p className="text-sm font-semibold">
                Import selesai. Berhasil: {importResult.imported.toLocaleString()} baris, Gagal:{' '}
                {importResult.failed.toLocaleString()} baris.
              </p>
              {importResult.failures && importResult.failures.length > 0 && (
                <div className="bg-white border border-green-200 rounded p-2">
                  <p className="text-xs text-green-900 mb-1">
                    Daftar baris yang gagal (maks 10):
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-green-600 uppercase">
                        <th className="py-1 pr-2">SKU</th>
                        <th className="py-1 pr-2">Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.failures.slice(0, 10).map((fail, idx) => (
                        <tr key={`${fail.sku}-${idx}`} className="border-t border-green-100">
                          <td className="py-1 pr-2 font-medium">{fail.sku || '-'}</td>
                          <td className="py-1 pr-2">{fail.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.failures.length > 10 && (
                    <p className="text-[11px] text-green-700 mt-1">
                      Dan {importResult.failures.length - 10} baris lainnya.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div className="bg-white border rounded-lg p-3 max-h-64 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Total baris valid: {rows.length}
                </span>
                <span className="text-sm text-gray-600">
                  Contoh data (5 baris pertama)
                </span>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 uppercase text-xs">
                    <th className="py-1 pr-2">SKU</th>
                    <th className="py-1 pr-2">Nama</th>
                    <th className="py-1 pr-2">Barcode</th>
                    <th className="py-1 pr-2">Harga</th>
                    <th className="py-1 pr-2">Stok Awal</th>
                    <th className="py-1 pr-2">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.sku} className="border-t">
                      <td className="py-1 pr-2 font-medium">{row.sku}</td>
                      <td className="py-1 pr-2">{row.name}</td>
                      <td className="py-1 pr-2">{row.barcode || '-'}</td>
                      <td className="py-1 pr-2">{formatRupiah(row.price || 0)}</td>
                      <td className="py-1 pr-2">{row.initialStock}</td>
                      <td className="py-1 pr-2">{row.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {importResult ? 'Tutup' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={rows.length === 0 || isSubmitting}
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                rows.length === 0 || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Mengimport...' : 'Import Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

