// File: src/utils/generateBarcodePDF.js
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

/**
 * Generate barcode image sebagai base64
 * @param {string} barcodeValue - Nilai barcode
 * @returns {Promise<string>} - Base64 image data
 */
function generateBarcodeImage(barcodeValue, paperSize = 'a4') {
  return new Promise((resolve, reject) => {
    try {
      // Buat canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Settings untuk thermal printer (lebih compact)
      const isThermal = paperSize === 'thermal';
      const barcodeHeight = isThermal ? 40 : 60;
      const barcodeWidth = isThermal ? 1.5 : 2;
      const fontSize = isThermal ? 10 : 14;
      const textMargin = isThermal ? 3 : 5;
      const margin = isThermal ? 5 : 10;
      
      // Generate barcode ke canvas menggunakan CODE128
      JsBarcode(canvas, barcodeValue, {
        format: "CODE128", // Format CODE128
        width: barcodeWidth,
        height: barcodeHeight,
        displayValue: true,
        fontSize: fontSize,
        textMargin: textMargin,
        margin: margin
      });
      
      // Convert canvas ke base64
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    } catch (error) {
      reject(new Error(`Gagal generate barcode: ${error.message}`));
    }
  });
}

/**
 * Generate PDF untuk barcode label
 * @param {Object} barcode - Data barcode { barcode, product, distributor, unit }
 * @param {string} paperSize - 'a4' atau 'thermal'
 */
export async function generateBarcodePDF(barcode, paperSize = 'a4') {
  try {
    // Generate barcode image
    const barcodeValue = barcode.barcode || 'N/A';
    const barcodeImageBase64 = await generateBarcodeImage(barcodeValue, paperSize);
    
    // Settings untuk thermal printer sticker (lebih compact)
    const margin = paperSize === 'thermal' ? 3 : 10;
    const marginBottom = paperSize === 'thermal' ? 3 : 10;
    const lineSpacing = paperSize === 'thermal' ? 1 : 2;
    
    // Font sizes - lebih kecil untuk thermal
    const titleFontSize = paperSize === 'thermal' ? 12 : 16; // Nama produk lebih besar
    const unitFontSize = paperSize === 'thermal' ? 10 : 14; // Satuan lebih besar
    const priceFontSize = paperSize === 'thermal' ? 10 : 14; // Harga lebih besar (sama dengan satuan)

    // Hitung tinggi konten terlebih dahulu
    let estimatedHeight = margin;
    
    // Product Name
    const productName = barcode.product?.name || 'N/A';
    const tempDoc = new jsPDF({ unit: 'mm', format: paperSize === 'thermal' ? [100, 78] : 'a4' });
    const maxWidth = (paperSize === 'thermal' ? 100 : 210) - (margin * 2);
    tempDoc.setFontSize(titleFontSize);
    const productNameLines = tempDoc.splitTextToSize(productName, maxWidth);
    estimatedHeight += productNameLines.length * (titleFontSize * 0.35) + (lineSpacing * 0.5); // Jarak lebih dekat
    
    // Satuan (di bawah nama produk)
    tempDoc.setFontSize(unitFontSize);
    if (barcode.unit?.name) estimatedHeight += unitFontSize * 0.35 + lineSpacing;
    
    // Price (di bawah satuan)
    tempDoc.setFontSize(priceFontSize);
    if (barcode.unit?.price) estimatedHeight += priceFontSize * 0.35 + (lineSpacing * 2);
    
    // Barcode Image - lebih kecil untuk thermal (100mm width landscape, jadi max 94mm untuk barcode)
    const barcodeImageWidth = Math.min(maxWidth, paperSize === 'thermal' ? 94 : 150);
    const barcodeImageHeight = paperSize === 'thermal' ? 25 : (barcodeImageWidth * 60) / 200;
    estimatedHeight += barcodeImageHeight + marginBottom;
    
    // Tentukan ukuran kertas dengan tinggi yang sesuai konten
    let doc;
    if (paperSize === 'thermal') {
      // Thermal printer sticker: 100x78mm landscape (fixed size)
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [100, 78]
      });
    } else {
      // A4: default jsPDF (tinggi akan otomatis sesuai)
      doc = new jsPDF();
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidthFinal = pageWidth - (margin * 2);
    const centerX = pageWidth / 2; // Center position

    // Start position lebih ke bawah untuk nama produk
    const topSpacing = paperSize === 'thermal' ? 8 : 15; // Spacing di atas nama produk
    let yPos = margin + topSpacing;

    // Title: Product Name (centered)
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    const productNameLinesFinal = doc.splitTextToSize(productName, maxWidthFinal);
    doc.text(productNameLinesFinal, centerX, yPos, { align: 'center' });
    yPos += productNameLinesFinal.length * (titleFontSize * 0.35) + (lineSpacing * 0.5); // Jarak lebih dekat

    // Satuan (di bawah nama produk) - centered
    if (barcode.unit?.name) {
      doc.setFontSize(unitFontSize);
      doc.setFont('helvetica', 'normal');
      doc.text(`Satuan: ${barcode.unit.name}`, centerX, yPos, { align: 'center' });
      yPos += unitFontSize * 0.35 + lineSpacing;
    }

    // Price (di bawah satuan) - centered
    if (barcode.unit?.price) {
      doc.setFontSize(priceFontSize);
      doc.setFont('helvetica', 'normal');
      // Format harga dengan formatRupiah
      const price = Number(barcode.unit.price) || 0;
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(price);
      doc.text(formattedPrice, centerX, yPos, { align: 'center' });
      yPos += priceFontSize * 0.35 + (lineSpacing * 2);
    }

    // Barcode Image - lebih kecil untuk thermal (100mm width landscape)
    const barcodeImageWidthFinal = Math.min(maxWidthFinal, paperSize === 'thermal' ? 94 : 150);
    const barcodeImageHeightFinal = paperSize === 'thermal' ? 25 : (barcodeImageWidthFinal * 60) / 200;
    
    // Center barcode image
    const barcodeX = margin + (maxWidthFinal - barcodeImageWidthFinal) / 2;
    
    // Add barcode image ke PDF
    doc.addImage(barcodeImageBase64, 'PNG', barcodeX, yPos, barcodeImageWidthFinal, barcodeImageHeightFinal);

    // Save PDF
    const fileName = `Barcode_${barcodeValue}_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Gagal generate PDF barcode:", error);
    throw error;
  }
}

/**
 * Generate PDF untuk multiple barcode labels (satu PDF dengan multiple pages)
 * @param {Array<Object>} barcodes - Array of barcode data { barcode, product, distributor, unit }
 * @param {string} paperSize - 'a4' atau 'thermal'
 */
export async function generateMultipleBarcodePDF(barcodes, paperSize = 'a4') {
  try {
    if (!barcodes || barcodes.length === 0) {
      throw new Error('Tidak ada barcode yang dipilih');
    }

    // Settings untuk thermal printer sticker (lebih compact)
    const margin = paperSize === 'thermal' ? 3 : 10;
    const marginBottom = paperSize === 'thermal' ? 3 : 10;
    const lineSpacing = paperSize === 'thermal' ? 1 : 2;
    
    // Font sizes - lebih kecil untuk thermal
    const titleFontSize = paperSize === 'thermal' ? 12 : 10; // Untuk A4 grid, lebih kecil
    const unitFontSize = paperSize === 'thermal' ? 10 : 8; // Untuk A4 grid, lebih kecil
    const priceFontSize = paperSize === 'thermal' ? 10 : 8; // Untuk A4 grid, lebih kecil

    // Tentukan ukuran kertas
    let doc;
    if (paperSize === 'thermal') {
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [100, 78]
      });
    } else {
      // A4: untuk grid layout 2 kolom x 5 baris = 10 barcode per halaman
      doc = new jsPDF();
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (paperSize === 'thermal') {
      // Thermal: satu barcode per halaman (existing logic)
      const maxWidth = pageWidth - (margin * 2);

      for (let i = 0; i < barcodes.length; i++) {
        const barcode = barcodes[i];
        
        if (i > 0) {
          doc.addPage([100, 78], 'landscape');
        }

        const barcodeValue = barcode.barcode || 'N/A';
        const barcodeImageBase64 = await generateBarcodeImage(barcodeValue, paperSize);

        const centerX = pageWidth / 2;
        const topSpacing = 8;
        let yPos = margin + topSpacing;

        // Title: Product Name (centered)
        doc.setFontSize(titleFontSize);
        doc.setFont('helvetica', 'bold');
        const productName = barcode.product?.name || 'N/A';
        const productNameLines = doc.splitTextToSize(productName, maxWidth);
        doc.text(productNameLines, centerX, yPos, { align: 'center' });
        yPos += productNameLines.length * (titleFontSize * 0.35) + (lineSpacing * 0.5);

        // Satuan (di bawah nama produk) - centered
        if (barcode.unit?.name) {
          doc.setFontSize(unitFontSize);
          doc.setFont('helvetica', 'normal');
          doc.text(`Satuan: ${barcode.unit.name}`, centerX, yPos, { align: 'center' });
          yPos += unitFontSize * 0.35 + lineSpacing;
        }

        // Price (di bawah satuan) - centered
        if (barcode.unit?.price) {
          doc.setFontSize(priceFontSize);
          doc.setFont('helvetica', 'normal');
          const price = Number(barcode.unit.price) || 0;
          const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(price);
          doc.text(formattedPrice, centerX, yPos, { align: 'center' });
          yPos += priceFontSize * 0.35 + (lineSpacing * 2);
        }

        // Barcode Image
        const barcodeImageWidth = Math.min(maxWidth, 94);
        const barcodeImageHeight = 25;
        const barcodeX = margin + (maxWidth - barcodeImageWidth) / 2;
        
        doc.addImage(barcodeImageBase64, 'PNG', barcodeX, yPos, barcodeImageWidth, barcodeImageHeight);
      }
    } else {
      // A4: Grid layout 2 kolom x 5 baris = 10 barcode per halaman
      const barcodesPerPage = 10;
      const cols = 2;
      const rows = 5;
      
      // Hitung ukuran setiap label barcode
      const labelMargin = 5; // Margin antar label
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      const labelWidth = (availableWidth - (labelMargin * (cols - 1))) / cols;
      const labelHeight = (availableHeight - (labelMargin * (rows - 1))) / rows;

      for (let i = 0; i < barcodes.length; i++) {
        const barcode = barcodes[i];
        
        // Add new page jika perlu (setiap 10 barcode)
        if (i > 0 && i % barcodesPerPage === 0) {
          doc.addPage();
        }

        // Hitung posisi dalam grid
        const pageIndex = Math.floor(i / barcodesPerPage);
        const indexInPage = i % barcodesPerPage;
        const col = indexInPage % cols;
        const row = Math.floor(indexInPage / cols);

        // Hitung posisi x dan y untuk label ini
        const labelX = margin + (col * (labelWidth + labelMargin));
        const labelY = margin + (row * (labelHeight + labelMargin));
        const labelCenterX = labelX + labelWidth / 2;
        const labelMaxWidth = labelWidth - (labelMargin * 2);

        // Generate barcode image
        const barcodeValue = barcode.barcode || 'N/A';
        const barcodeImageBase64 = await generateBarcodeImage(barcodeValue, paperSize);

        // Start position untuk label ini
        const topSpacing = 3;
        let yPos = labelY + topSpacing;

        // Title: Product Name (centered dalam label)
        doc.setFontSize(titleFontSize);
        doc.setFont('helvetica', 'bold');
        const productName = barcode.product?.name || 'N/A';
        const productNameLines = doc.splitTextToSize(productName, labelMaxWidth);
        doc.text(productNameLines, labelCenterX, yPos, { align: 'center' });
        yPos += productNameLines.length * (titleFontSize * 0.35) + (lineSpacing * 0.5);

        // Satuan (di bawah nama produk) - centered
        if (barcode.unit?.name) {
          doc.setFontSize(unitFontSize);
          doc.setFont('helvetica', 'normal');
          doc.text(`Satuan: ${barcode.unit.name}`, labelCenterX, yPos, { align: 'center' });
          yPos += unitFontSize * 0.35 + lineSpacing;
        }

        // Price (di bawah satuan) - centered
        if (barcode.unit?.price) {
          doc.setFontSize(priceFontSize);
          doc.setFont('helvetica', 'normal');
          const price = Number(barcode.unit.price) || 0;
          const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(price);
          doc.text(formattedPrice, labelCenterX, yPos, { align: 'center' });
          yPos += priceFontSize * 0.35 + (lineSpacing * 2);
        }

        // Barcode Image - disesuaikan dengan ukuran label
        const barcodeImageWidth = Math.min(labelMaxWidth, 60); // Lebih kecil untuk grid
        const barcodeImageHeight = (barcodeImageWidth * 60) / 200;
        const barcodeX = labelX + (labelWidth - barcodeImageWidth) / 2;
        
        doc.addImage(barcodeImageBase64, 'PNG', barcodeX, yPos, barcodeImageWidth, barcodeImageHeight);
      }
    }

    // Save PDF
    const fileName = `Barcode_Multiple_${barcodes.length}_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Gagal generate PDF multiple barcode:", error);
    throw error;
  }
}
