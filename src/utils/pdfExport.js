import jsPDF from 'jspdf';

/**
 * Exports a Konva stage as an A4 PDF.
 * @param {string} dataUrl - The base64 data URL from the Konva stage (stage.toDataURL())
 */
export async function exportToPDF(dataUrl) {
  // jsPDF format 'a4' uses dimensions 210mm x 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Add the image to the PDF
  // We use 0, 0 for coordinates, and stretch to exact A4 size.
  // Because the canvas has an A4 aspect ratio, it will not look distorted.
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

  pdf.save('sticker-sheet.pdf');
}
