import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- GLOBAL TIMEZONE CONFIGURATION (KINSHASA UTC+1) ---
const KINSHASA_TZ = 'Africa/Kinshasa';

export function formatKinshasaDate(dateInput: Date | string | number): string {
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: KINSHASA_TZ
    });
}

export function formatKinshasaDateLong(dateInput: Date | string | number): string {
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: KINSHASA_TZ
    });
}

export function formatKinshasaTime(dateInput: Date | string | number): string {
    const date = new Date(dateInput);
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: KINSHASA_TZ
    });
}

/**
 * Clamp bordereau date to be within 1-40 minutes after receipt date.
 * Both inputs are in datetime-local format (YYYY-MM-DDTHH:mm).
 * Returns the clamped bordereau date in the same format.
 */
export function clampBordereauDate(receiptLocal: string, bordereauLocal: string): string {
    if (!receiptLocal || !bordereauLocal) return bordereauLocal;

    const receipt = new Date(receiptLocal);
    const bordereau = new Date(bordereauLocal);

    const diffMs = bordereau.getTime() - receipt.getTime();
    const diffMin = diffMs / 60000;

    // Same day check
    const sameDay = receipt.toDateString() === bordereau.toDateString();

    if (!sameDay || diffMin < 1) {
        // Before receipt or different day → receipt + 5 min
        receipt.setMinutes(receipt.getMinutes() + 5);
        return `${receipt.getFullYear()}-${String(receipt.getMonth() + 1).padStart(2, '0')}-${String(receipt.getDate()).padStart(2, '0')}T${String(receipt.getHours()).padStart(2, '0')}:${String(receipt.getMinutes()).padStart(2, '0')}`;
    }

    if (diffMin > 40) {
        // More than 40 min → receipt + 40 min
        receipt.setMinutes(receipt.getMinutes() + 40);
        return `${receipt.getFullYear()}-${String(receipt.getMonth() + 1).padStart(2, '0')}-${String(receipt.getDate()).padStart(2, '0')}T${String(receipt.getHours()).padStart(2, '0')}:${String(receipt.getMinutes()).padStart(2, '0')}`;
    }

    return bordereauLocal;
}
