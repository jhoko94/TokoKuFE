// File: src/utils/generatePOPDF.js
import { jsPDF } from "jspdf";
// Import autotable - untuk versi 5.x perlu import default
import autoTable from "jspdf-autotable";

// Helper function untuk fetch store data
async function fetchStoreData() {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/store`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("Gagal memuat data toko:", error);
        return null;
    }
}

export async function generatePOPDF(po, storeData = null, paperSize = 'a4') {
    try {
        // Fetch store data jika tidak diberikan
        let store = storeData;
        if (!store) {
            store = await fetchStoreData();
        }
        
        // Tentukan ukuran kertas
        let doc;
        if (paperSize === 'thermal') {
            // Thermal printer: 80mm width (sekitar 226.77 points)
            // Format: [width, height] dalam mm, height akan auto-extend
            doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200] // 80mm width, height akan auto-extend
            });
        } else {
            // A4: default jsPDF
            doc = new jsPDF();
        }
        
        // Adjust font sizes dan margins untuk thermal (lebih kecil)
        const titleFontSize = paperSize === 'thermal' ? 14 : 20;
        const normalFontSize = paperSize === 'thermal' ? 8 : 10;
        const headerFontSize = paperSize === 'thermal' ? 9 : 11;
        
        // Adjust margins untuk thermal
        const leftMargin = paperSize === 'thermal' ? 5 : 20;
        const rightMargin = paperSize === 'thermal' ? 5 : 20;
        const topMargin = paperSize === 'thermal' ? 10 : 20;
        const pageWidth = paperSize === 'thermal' ? 80 : 210;
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFontSize);
        const centerX = paperSize === 'thermal' ? pageWidth / 2 : 105;
        doc.text("ORDER", centerX, topMargin, { align: 'center' });
        
        // Store Info (Dari) - Kiri
        let yPos = topMargin + 10;
        if (store) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(headerFontSize);
            doc.text("Dari:", leftMargin, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(normalFontSize);
            yPos += 5;
            doc.text(store.name || 'N/A', leftMargin, yPos);
            
            if (store.address) {
                yPos += 4;
                // Wrap text untuk thermal
                if (paperSize === 'thermal') {
                    const splitAddress = doc.splitTextToSize(store.address, pageWidth - (leftMargin * 2));
                    doc.text(splitAddress, leftMargin, yPos);
                    yPos += splitAddress.length * 4;
                } else {
                    doc.text(store.address, leftMargin, yPos);
                    yPos += 5;
                }
            }
            
            if (store.phone) {
                yPos += 4;
                doc.text(`Telp: ${store.phone}`, leftMargin, yPos);
                yPos += 4;
            }
            
            if (store.email) {
                yPos += 4;
                doc.text(`Email: ${store.email}`, leftMargin, yPos);
                yPos += 4;
            }
        }
        
        // PO Number dan Tanggal
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(normalFontSize);
        const date = po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : new Date().toLocaleDateString('id-ID');
        
        if (paperSize === 'thermal') {
            // Untuk thermal, letakkan di bawah store info
            yPos += 5;
            doc.text(`No. PO: ${po.id}`, leftMargin, yPos);
            yPos += 4;
            doc.text(`Tanggal: ${date}`, leftMargin, yPos);
        } else {
            // Untuk A4, letakkan di kanan
            const rightX = 150;
            let rightY = 30;
            doc.text(`No. PO: ${po.id}`, rightX, rightY);
            rightY += 6;
            doc.text(`Tanggal: ${date}`, rightX, rightY);
        }
        
        // Distributor Info (Kepada) - Setelah store info
        yPos = paperSize === 'thermal' ? yPos + 8 : Math.max(yPos + 12, 60);
        if (po.distributor) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(headerFontSize);
            doc.text("Kepada:", leftMargin, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(normalFontSize);
            yPos += 5;
            doc.text(po.distributor.name || 'N/A', leftMargin, yPos);
            
            if (po.distributor.address) {
                yPos += 4;
                if (paperSize === 'thermal') {
                    const splitAddress = doc.splitTextToSize(po.distributor.address, pageWidth - (leftMargin * 2));
                    doc.text(splitAddress, leftMargin, yPos);
                    yPos += splitAddress.length * 4;
                } else {
                    doc.text(po.distributor.address, leftMargin, yPos);
                    yPos += 5;
                }
            }
            
            if (po.distributor.phone) {
                yPos += 4;
                doc.text(`Telp: ${po.distributor.phone}`, leftMargin, yPos);
                yPos += 4;
            }
            
            if (po.distributor.contactPerson) {
                yPos += 4;
                doc.text(`Contact Person: ${po.distributor.contactPerson}`, leftMargin, yPos);
                yPos += 4;
            }
        }
        
        // Items Table
        yPos += 8;
        if (po.items && po.items.length > 0) {
            // Prepare table data - pisahkan jumlah dan satuan
            const tableData = po.items.map((item, index) => {
                const productName = item.product?.name || item.productName || 'N/A';
                const qty = item.qty || 0;
                const unitName = item.unitName || 'Pcs';
                
                return [
                    index + 1,
                    productName,
                    qty,
                    unitName
                ];
            });
            
            // Add table - gunakan autoTable sebagai fungsi terpisah
            autoTable(doc, {
                startY: yPos,
                head: [['No', 'Nama Barang', 'Jumlah', 'Satuan']],
                body: tableData,
                theme: 'striped',
                headStyles: { 
                    fillColor: [66, 139, 202], 
                    textColor: 255, 
                    fontStyle: 'bold',
                    fontSize: paperSize === 'thermal' ? 7 : 10
                },
                styles: { 
                    fontSize: paperSize === 'thermal' ? 7 : 10, 
                    cellPadding: paperSize === 'thermal' ? 1.5 : 3 
                },
                columnStyles: {
                    0: { cellWidth: paperSize === 'thermal' ? 10 : 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: paperSize === 'thermal' ? 15 : 25, halign: 'center' },
                    3: { cellWidth: paperSize === 'thermal' ? 20 : 30, halign: 'center' }
                },
                margin: { left: leftMargin, right: rightMargin }
            });
            
            // Get final Y position after table
            yPos = doc.lastAutoTable?.finalY || yPos + 30;
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text("Tidak ada item dalam PO ini.", 20, yPos);
            yPos += 10;
        }
        
        // Footer - Catatan
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(headerFontSize);
        doc.text("Catatan:", leftMargin, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(normalFontSize);
        yPos += 5;
        const note1 = "Mohon siapkan barang sesuai dengan daftar di atas.";
        if (paperSize === 'thermal') {
            const splitNote1 = doc.splitTextToSize(note1, pageWidth - (leftMargin * 2));
            doc.text(splitNote1, leftMargin, yPos);
            yPos += splitNote1.length * 4;
        } else {
            doc.text(note1, leftMargin, yPos);
            yPos += 5;
        }
        
        const note2 = "Terima kasih atas kerjasamanya.";
        if (paperSize === 'thermal') {
            const splitNote2 = doc.splitTextToSize(note2, pageWidth - (leftMargin * 2));
            doc.text(splitNote2, leftMargin, yPos);
        } else {
            doc.text(note2, leftMargin, yPos);
        }
        
        // Status
        if (po.status) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(normalFontSize);
            doc.setTextColor(200, 0, 0);
            doc.text(`Status: ${po.status}`, leftMargin, yPos + 8);
            doc.setTextColor(0, 0, 0); // Reset color
        }
        
        // Save PDF
        const filename = paperSize === 'thermal' ? `PO-${po.id}-thermal.pdf` : `PO-${po.id}.pdf`;
        doc.save(filename);

    } catch (err) {
        console.error("Gagal membuat PDF:", err);
        throw new Error("Gagal membuat file PDF: " + err.message);
    }
}
