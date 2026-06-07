import { ImagePayload } from './scan-types';

// Charge un fichier image, le redimensionne (max maxDim px) et renvoie le base64 JPEG.
export async function resizeImageToBase64(
    file: File,
    maxDim = 1600,
    quality = 0.85
): Promise<ImagePayload> {
    const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image invalide'));
        image.src = dataUrl;
    });

    let width = img.width;
    let height = img.height;
    if (width > maxDim || height > maxDim) {
        if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
        } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
        }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non supporté par le navigateur');
    ctx.drawImage(img, 0, 0, width, height);

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = jpegDataUrl.split(',')[1];
    return { base64, mediaType: 'image/jpeg' };
}
