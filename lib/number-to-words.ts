/**
 * Converts a number to French words for the bordereau amounts.
 * Specifically handles Congolese/French standard conventions.
 */
export function numberToWords(n: number): string {
    if (n === 0) return "zéro";
    if (n < 0) return "moins " + numberToWords(Math.abs(n));

    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

    let words = "";

    if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        if (thousands === 1) words += "mille ";
        else words += numberToWords(thousands) + " mille ";
        n %= 1000;
    }

    if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        if (hundreds === 1) words += "cent ";
        else {
            words += units[hundreds] + " cent";
            // Plural 's' for round hundreds (e.g., deux cents) but not if followed by another number
            if (n % 100 === 0) words += "s";
            words += " ";
        }
        n %= 100;
    }

    if (n >= 20) {
        const ten = Math.floor(n / 10);
        const unit = n % 10;

        if (ten === 7) {
            words += "soixante";
            if (unit === 1) words += " et onze";
            else if (unit > 0) words += "-" + teens[unit];
            else words += "-dix";
        } else if (ten === 9) {
            words += "quatre-vingt";
            if (unit === 0) words += "s-dix"; // incorrect, usually quatre-vingt-dix
            else words += "-" + teens[unit];
        } else if (ten === 8) {
            words += "quatre-vingt";
            if (unit === 0) words += "s";
            else words += "-" + units[unit];
        } else {
            words += tens[ten];
            if (unit === 1) words += " et un";
            else if (unit > 0) words += "-" + units[unit];
        }
    } else if (n >= 10) {
        words += teens[n - 10];
    } else if (n > 0) {
        words += units[n];
    }

    // Clean up trailing spaces and specific 90 case
    let result = words.trim().replace("quatre-vingts-dix", "quatre-vingt-dix");

    // Fix for 91-99 which might have double hyphens or extra spaces
    if (result.includes("quatre-vingt-")) {
        // already handled by logic above
    }

    return result;
}
