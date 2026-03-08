import { jsPDF } from 'jspdf';
import { Medicine, Patient, Consultation } from '@/types';

interface PDFPrescriptionData {
    consultation: Consultation;
    patient: Patient;
    doctorName: string;
    medicines: Medicine[];
    nodeName?: string;
}

export const generatePrescriptionPDF = async (data: PDFPrescriptionData) => {
    const { consultation, patient, doctorName, medicines, nodeName } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper for centered text
    const centerText = (text: string, y: number, size = 12, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // 1. Header & Letterhead
    // Dark header bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('NIVARO', 15, 25);
    doc.setTextColor(99, 102, 241); // indigo-500
    doc.text('HEALTH', 15 + doc.getTextWidth('NIVARO ') - 2, 25);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'ADVANCED TELEMEDICINE OPERATING SYSTEM';
    doc.text(subtitle, 15, 33);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Ref: #${consultation.id.slice(-8).toUpperCase()}`, pageWidth - 15, 25, { align: 'right' });
    doc.setFontSize(8);
    doc.text(new Date().toLocaleString(), pageWidth - 15, 33, { align: 'right' });

    // 2. Body Start
    doc.setTextColor(30, 41, 59); // slate-800
    let y = 55;

    // Patient & Doctor Info
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // Left Column: Patient
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('PATIENT INFO', 15, y);

    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(patient.name.toUpperCase(), 15, y);

    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Age: ${patient.age}  |  Gender: ${patient.gender}`, 15, y);
    doc.text(`Contact: ${patient.contact}`, 15, y + 5);

    // Right Column: Doctor (Reset Y for right column)
    const rightColY = y - 11;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('CONSULTING PHYSICIAN', pageWidth - 15, rightColY, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Dr. ${doctorName.toUpperCase()}`, pageWidth - 15, rightColY + 6, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Nivaro Certified Provider', pageWidth - 15, rightColY + 11, { align: 'right' });
    doc.text(`Node: ${nodeName || consultation.nodeId.toUpperCase()}`, pageWidth - 15, rightColY + 16, { align: 'right' });

    y += 20;
    doc.line(15, y, pageWidth - 15, y);
    y += 12;

    // 3. Vitals section
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'F');

    const vitalWidth = (pageWidth - 30) / 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);

    const vitalsY = y + 8;
    doc.text('TEMP', 15 + 5, vitalsY);
    doc.text('BP', 15 + vitalWidth + 5, vitalsY);
    doc.text('SUGAR', 15 + vitalWidth * 2 + 5, vitalsY);
    doc.text('SPO2', 15 + vitalWidth * 3 + 5, vitalsY);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const valY = vitalsY + 7;
    doc.text(`${consultation.vitals.temp} F`, 15 + 5, valY);
    doc.text(`${consultation.vitals.bp}`, 15 + vitalWidth + 5, valY);
    doc.text(`${consultation.vitals.sugar}`, 15 + vitalWidth * 2 + 5, valY);
    doc.text(`${consultation.vitals.spo2}%`, 15 + vitalWidth * 3 + 5, valY);

    y += 40;

    // 4. Diagnosis & Notes
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('PROVISIONAL DIAGNOSIS', 15, y);
    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(consultation.clinicalData?.diagnosis?.toUpperCase() || 'GENERAL CONSULTATION', 15, y);

    if (consultation.clinicalNotes) {
        y += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text('CLINICAL OBSERVATIONS', 15, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitNotes = doc.splitTextToSize(consultation.clinicalNotes, pageWidth - 30);
        doc.text(splitNotes, 15, y);
        y += (splitNotes.length * 5) + 5;
    } else {
        y += 15;
    }

    // 5. RX Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold italic');
    doc.setTextColor(79, 70, 229);
    doc.text('Rx', 15, y);
    y += 2;
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // Medicines Table
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    medicines.forEach((med, idx) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${med.name.toUpperCase()}`, 15, y);
        doc.text(med.dosage, pageWidth - 15, y, { align: 'right' });

        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        const timings = Object.entries(med.timing)
            .filter(([_, active]) => active)
            .map(([t, _]) => t.toUpperCase())
            .join(' - ');

        doc.text(`Duration: ${med.duration}  |  Timing: ${timings}`, 20, y);
        y += 10;
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y - 5, pageWidth - 15, y - 5);
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
    });

    // Lab Tests
    if (consultation.labTests && consultation.labTests.length > 0) {
        y += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('DIAGNOSTIC PROTOCOLS', 15, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        consultation.labTests.forEach(test => {
            doc.text(`• ${test.name}`, 20, y);
            y += 6;
        });
    }

    // 6. Footer & Signature
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY - 10, pageWidth - 15, footerY - 10);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('DIGITALLY SIGNED & VERIFIED BY NIVARO HEALTH OS', 15, footerY);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Dr. ${doctorName}`, pageWidth - 15, footerY, { align: 'right' });
    doc.setFontSize(7);
    doc.text('CONSULTING PHYSICIAN', pageWidth - 15, footerY + 4, { align: 'right' });

    return doc;
};
