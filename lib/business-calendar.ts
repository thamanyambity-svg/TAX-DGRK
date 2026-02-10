
/**
 * BUSINESS CALENDAR UTILITY (NASA QUANTUM LEVEL)
 * Rules:
 * - Jan 15, 2026 to Feb 7, 2026
 * - Mon-Fri: 09:00 - 17:30
 * - Sat: 08:30 - 14:00
 * - Sun: CLOSED
 */

export const START_DATE = new Date('2026-01-15T09:00:00Z');
export const END_DATE = new Date('2026-02-07T14:00:00Z');

export function isWithinBusinessHours(date: Date): boolean {
    const day = date.getUTCDay(); // 0: Sun, 6: Sat
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const timeValue = hour + minute / 60;

    if (day === 0) return false; // Sunday
    if (day === 6) { // Saturday
        return timeValue >= 8.5 && timeValue <= 14;
    }
    // Mon-Fri
    return timeValue >= 9 && timeValue <= 17.5;
}

export function generateValidDate(seed: number): Date {
    const startTs = START_DATE.getTime();
    const endTs = END_DATE.getTime();
    const range = endTs - startTs;

    let found = false;
    let attempts = 0;
    let result = new Date();

    while (!found && attempts < 1000) {
        // More robust deterministic pseudo-random using a larger multiplier for attempts
        // This ensures each attempt jumps significantly through the range
        const salt = (attempts * 1664525) + 1013904223;
        const offset = Math.abs((seed ^ salt) % range);
        result = new Date(startTs + offset);

        if (isWithinBusinessHours(result)) {
            found = true;
        }
        attempts++;
    }

    return result;
}

export function getNowOrBusinessHours(): string {
    const now = new Date();
    if (isWithinBusinessHours(now)) return now.toISOString();

    // Fallback to random valid date if current time is invalid
    return generateValidDate(now.getTime()).toISOString();
}

/**
 * Calculates a payment date that is approx 48h after the creation date,
 * strictly respecting business hours and skipping Sundays.
 */
export function getPaymentDate(creationDateStr: string): string {
    const date = new Date(creationDateStr);

    // Add 2 days (48 hours)
    date.setUTCDate(date.getUTCDate() + 2);

    // If result is Sunday, move to Monday
    if (date.getUTCDay() === 0) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    // Ensure it's within business hours for that day
    // If it's too early or late, adjust to mid-day
    const hour = date.getUTCHours();
    const day = date.getUTCDay();

    if (day === 6) { // Saturday (8:30 - 14:00)
        if (hour < 9 || hour >= 13) {
            date.setUTCHours(10, 30, 0, 0);
        }
    } else { // Mon-Fri (9:00 - 17:30)
        if (hour < 10 || hour >= 16) {
            date.setUTCHours(11, 0, 0, 0);
        }
    }

    return date.toISOString();
}
