// File: src/utils/generatePOPDF.js
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export async function generatePOPDF(po) {
    try {
        const doc = new jsPDF();
        
        // ... (Salin-tempel SEMUA logika dari fungsi generatePOPDF Anda di script.js) ...
        // Ganti 'window.jspdf' hanya dengan 'jsPDF' jika ada.
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text("PURCHASE ORDER", 105, 20, { align: 'center' });
        // ... sisanya sama ...

        doc.save(`PO-${po.id}.pdf`);

    } catch (err) {
        console.error("Gagal membuat PDF:", err);
        // Di React, kita tidak menggunakan showConfirmation().
        // Kita 'throw' error agar komponen bisa menanganinya.
        throw new Error("Gagal membuat file PDF.");
    }
}