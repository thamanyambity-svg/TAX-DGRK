
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadElementAsPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        // High quality canvas capture
        const canvas = await html2canvas(element, {
            scale: 2, // Retina resolution
            useCORS: true, // Allow loading remote images
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 dimensions in mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width
        const pageHeight = 297; // A4 height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // If content overflows, add new pages (rare for receipts but good to have)
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Auto-download
        pdf.save(`${fileName}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Erreur lors de la génération du PDF. Utilisez l\'impression navigateur si le problème persiste.');
    }
};
