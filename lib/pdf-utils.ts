
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export const downloadElementAsPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        alert(`Erreur: Élément ${elementId} non trouvé.`);
        return;
    }

    try {
        // Wait longer for all images and fonts to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Ensure element is visible and properly positioned for capture
        const originalDisplay = element.style.display;
        const originalVisibility = element.style.visibility;
        element.style.display = 'block';
        element.style.visibility = 'visible';

        // Get accurate dimensions
        const rect = element.getBoundingClientRect();
        const width = element.scrollWidth || rect.width || 210 * 3.78;
        const height = element.scrollHeight || rect.height || 297 * 3.78;

        console.log(`Capturing element ${elementId}: ${width}x${height}`);

        // High quality canvas capture with improved settings
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: Math.max(Math.ceil(width * 3), 1200),
            windowHeight: Math.max(Math.ceil(height * 3), 1600),
            allowTaint: true,
            removeContainer: false,
            ignoreElements: (el) => {
                return typeof el.className === 'string' && el.className.includes('no-print');
            }
        });

        element.style.display = originalDisplay;
        element.style.visibility = originalVisibility;

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas capture resulted in empty image');
        }

        console.log(`Canvas created: ${canvas.width}x${canvas.height}`);

        const imgData = canvas.toDataURL('image/png', 0.95);

        // A4 dimensions in mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content overflows
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Auto-download
        pdf.save(`${fileName}.pdf`);
        console.log(`✅ PDF téléchargé: ${fileName}.pdf`);

    } catch (error) {
        console.error('❌ Erreur lors de la génération du PDF:', error);
        const errorMsg = error instanceof Error ? error.message : 'Problème inconnu lors de la capture';
        alert(`Erreur: ${errorMsg}\n\nUtilisez l\'impression navigateur (Ctrl+P) et sélectionnez "Enregistrer en PDF".`);
    }
};

export const getElementAsPDFBlob = async (elementId: string): Promise<Blob | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth || 800,
            windowHeight: element.scrollHeight || 1000,
            allowTaint: true,
            removeContainer: false
        });

        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        return pdf.output('blob');
    } catch (error) {
        console.error('Error generating PDF Blob:', error);
        return null;
    }
};
