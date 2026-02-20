
export interface TaxCalculation {
    totalAmount: number;     // Montant total bordereau = Math.ceil(base) + 4
    creditAmount: number;    // Montant brut de la taxe (affiché sur le récépissé, ex: 64.50)
    roundedBase: number;     // Montant arrondi par la banque (ex: 65)
    bankFee: number;         // Frais bancaires fixes = 4.00 USD
    timbre: number;          // Pour affichage bordereau = 3.45
    taxe: number;            // Pour affichage bordereau = 0.55 (3.45 + 0.55 = 4.00)
    textAmount: string;      // "soixante neuf USD", etc.
    billBreakdown: {
        value: number;
        count: number;
        total: number;
    }[];
}

// Helper to parse weight (e.g. "10 tonnes" -> 10)
const parseWeight = (weightStr: string | number | undefined): number => {
    if (typeof weightStr === 'number') return weightStr;
    if (!weightStr) return 0;
    const match = weightStr.toString().match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

// Règle banque : arrondi vers le haut à l'entier supérieur (ceiling)
// 64.50 -> 65, 68.20 -> 69, 58.70 -> 59, 70.10 -> 71
const bankRound = (amount: number): number => Math.ceil(amount);

// Frais bancaires fixes
const BANK_FEE = 4.00;
const TIMBRE = 3.45;
const TAXE = 0.55; // 3.45 + 0.55 = 4.00

// Helper for number to French words
const getNumberText = (totalInt: number): string => {
    const map: Record<number, string> = {
        63: "soixante-trois USD",
        69: "soixante-neuf USD",
        72: "soixante-douze USD",
        73: "soixante-treize USD",
        75: "soixante-quinze USD",
    };
    return map[totalInt] || `${totalInt} USD`;
};

export const calculateTax = (fiscalPower: number, vehicleType: string, weightInput?: string | number): TaxCalculation => {
    const cv = fiscalPower || 0;
    const type = (vehicleType || '').toLowerCase();
    const weight = parseWeight(weightInput);

    const buildResult = (base: number): TaxCalculation => {
        const rounded = bankRound(base);       // ex: 64.50 -> 65
        const total = rounded + BANK_FEE;      // ex: 65 + 4 = 69
        const totalInt = Math.round(total);

        // Génerer un breakdown réaliste en billets
        let breakdown: { value: number; count: number; total: number }[] = [];
        let remaining = rounded;

        for (const bill of [50, 20, 10, 5, 2, 1]) {
            if (remaining <= 0) break;
            const count = Math.floor(remaining / bill);
            if (count > 0) {
                breakdown.push({ value: bill, count, total: count * bill });
                remaining = Math.round((remaining - count * bill) * 100) / 100;
            }
        }
        // Ajouter le billet pour les frais bancaires
        breakdown.push({ value: BANK_FEE, count: 1, total: BANK_FEE });

        return {
            totalAmount: total,
            creditAmount: base,     // Valeur brute affichée sur le récépissé
            roundedBase: rounded,   // Valeur arrondie affichée sur le bordereau (crédit compte)
            bankFee: BANK_FEE,
            timbre: TIMBRE,
            taxe: TAXE,
            textAmount: getNumberText(totalInt),
            billBreakdown: breakdown,
        };
    };

    // --- 1. TOURISTIQUE LIGHT (0-10 CV) -> base 58.70 -> arrondi 59 -> total 63 ---
    if (type === 'touristique_light' || type === 'touristique_ligtht') {
        return buildResult(58.70);
    }

    // --- 2. UTILITAIRE HEAVY ---
    if (type === 'utilitaire_heavy') {
        // 0-10T -> 64.50 -> arrondi 65 -> total 69
        // >10T  -> 68.20 -> arrondi 69 -> total 73
        if (weight > 10) {
            return buildResult(68.20);
        }
        return buildResult(64.50);
    }

    // --- RÈGLES STANDARD PAR PUISSANCE FISCALE ---

    // 1-10 CV -> base 58.70 -> arrondi 59 -> total 63
    if (cv <= 10) {
        return buildResult(58.70);
    }

    // 11-15 CV -> base 64.50 -> arrondi 65 -> total 69
    if (cv <= 15) {
        return buildResult(64.50);
    }

    // > 15 CV -> base 70.10 -> arrondi 71 -> total 75
    return buildResult(70.10);
};
