// File: src/utils/generatePOPDF.js
import { jsPDF } from "jspdf";
// Import autotable - untuk versi 5.x perlu import default
import autoTable from "jspdf-autotable";

export async function generatePOPDF(po) {
    try {
        const doc = new jsPDF();
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text("PURCHASE ORDER", 105, 20, { align: 'center' });
        
        // PO Number
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`No. PO: ${po.id}`, 20, 35);
        
        // Tanggal
        const date = po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : new Date().toLocaleDateString('id-ID');
        doc.text(`Tanggal: ${date}`, 20, 42);
        
        // Distributor Info
        let yPos = 55;
        if (po.distributor) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text("Kepada:", 20, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            yPos += 7;
            doc.text(po.distributor.name || 'N/A', 20, yPos);
            
            if (po.distributor.address) {
                yPos += 6;
                doc.text(po.distributor.address, 20, yPos);
            }
            
            if (po.distributor.phone) {
                yPos += 6;
                doc.text(`Telp: ${po.distributor.phone}`, 20, yPos);
            }
            
            if (po.distributor.contactPerson) {
                yPos += 6;
                doc.text(`Contact Person: ${po.distributor.contactPerson}`, 20, yPos);
            }
        }
        
        // Items Table
        yPos += 15;
        if (po.items && po.items.length > 0) {
            // Prepare table data
            const tableData = po.items.map((item, index) => {
                const productName = item.product?.name || item.productName || 'N/A';
                const qty = item.qty || 0;
                const unitName = item.unitName || 'Pcs';
                
                return [
                    index + 1,
                    productName,
                    `${qty} ${unitName}`
                ];
            });
            
            // Add table - gunakan autoTable sebagai fungsi terpisah
            autoTable(doc, {
                startY: yPos,
                head: [['No', 'Nama Barang', 'Jumlah']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 50, halign: 'center' }
                },
                margin: { left: 20, right: 20 }
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
        doc.setFontSize(11);
        doc.text("Catatan:", 20, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPos += 6;
        doc.text("Mohon siapkan barang sesuai dengan daftar di atas.", 20, yPos);
        yPos += 6;
        doc.text("Terima kasih atas kerjasamanya.", 20, yPos);
        
        // Status
        if (po.status) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(200, 0, 0);
            doc.text(`Status: ${po.status}`, 20, yPos + 10);
            doc.setTextColor(0, 0, 0); // Reset color
        }
        
        // Save PDF
        doc.save(`PO-${po.id}.pdf`);

    } catch (err) {
        console.error("Gagal membuat PDF:", err);
        throw new Error("Gagal membuat file PDF: " + err.message);
    }
}
