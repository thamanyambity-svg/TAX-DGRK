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
