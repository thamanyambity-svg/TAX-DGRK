/**
 * Converts a number to French words for the bordereau amounts.
 * Specifically handles Congolese/Belgian standard conventions (septante for 70, nonente for 90).
 */
export function numberToWords(n: number): string {
    if (n === 0) return "zéro";
    if (n < 0) return "moins " + numberToWords(Math.abs(n));

    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "septante", "quatre-vingt", "nonente"];

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
            words += "septante";
            if (unit === 1) words += " et un";
            else if (unit > 0) words += "-" + units[unit];
        } else if (ten === 9) {
            words += "nonente";
            if (unit === 1) words += " et un";
            else if (unit > 0) words += "-" + units[unit];
        } else if (ten === 8) {
            words += "quatre-vingt";
            if (unit === 0) words += "s";
            else if (unit === 1) words += "-un";
            else if (unit > 0) words += "-" + units[unit];
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

    return words.trim();
}
