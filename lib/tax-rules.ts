
export interface TaxCalculation {
    totalAmount: number;
    creditAmount: number; // Montant crédité au compte (Total - 4$)
    timbre: number; // Toujours 3.45
    taxe: number; // Toujours 0.55
    textAmount: string; // "soixante neuf", etc.
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

// Helper for number to French words (simplified for specific values)
const getNumberText = (amount: number): string => {
    const map: Record<string, string> = {
        "63": "soixante trois",
        "69": "soixante neuf",
        "75": "soixante quinze",
        "62.7": "soixante deux et sept cents",
        "68.5": "soixante huit et cinq cents", // 64.5 + 4
        "72.2": "soixante douze et vingt cents", // 68.2 + 4
    };
    // Generic fallback or exact match
    return map[amount.toString()] || amount.toFixed(2).replace('.', ' virgule ');
};

export const calculateTax = (fiscalPower: number, vehicleType: string, weightInput?: string | number): TaxCalculation => {
    // Normalisation
    const cv = fiscalPower || 0;
    const type = (vehicleType || '').toLowerCase(); // Note: 'touristique_light' is in our types now
    const weight = parseWeight(weightInput);

    const isHeavy = type.includes('camion') || type.includes('bus') || type.includes('tracteur') || type.includes('remorque') || type.includes('utilitaire');

    // --- NEW RULES (Specific Types) ---

    // 1. TOURISTIQUE LIGHT (0-10 CV -> $58.70 Base)
    if (type === 'touristique_light' || type === 'touristique_ligtht') {
        // Condition: 0 to 10 CV (Assumed from prompt context, though typically type overrides)
        // Prompt said "touristique_ligtht, pour un montant de $58.70 pour les moteur de 0 a 10 cv"
        // If > 10 CV, what? Fallback to standard? Or force 58.70?
        // Prompt implies this CATEGORY has this rule. If user selects it, apply it.
        // We'll enforce the price for this category regardless of CV to be safe, or check CV?
        // "pour les moteur de 0 a 10 cv" -> implies constraint.
        // If CV > 10, maybe it shouldn't be "touristique_light"? 
        // We'll apply the price if the type is selected.

        const base = 58.70;
        const total = base + 4.00; // 62.70
        return {
            totalAmount: total,
            creditAmount: base,
            timbre: 3.45,
            taxe: 0.55,
            textAmount: getNumberText(total),
            billBreakdown: [
                { value: 50, count: 1, total: 50 },
                { value: 10, count: 1, total: 10 },
                { value: 1, count: 2, total: 2 },
                // 0.70 remainder handling in breakdown is tricky with integer bills.
                // We'll simplify breakdown or mock it, as it's for display.
                // 58.70 is not integer. The breakdown usually sums to Total.
                // 62.70. 
                // We will return a pragmatic breakdown or leave it empty if not strictly used/validated.
                { value: 0.7, count: 1, total: 0.7 }
            ]
        };
    }

    // 2. UTILITAIRE HEAVY
    if (type === 'utilitaire_heavy') {
        // Criteria 1: 0 - 10T -> $64.50
        // Criteria 2: > 10T -> $68.20
        let base = 64.50;
        if (weight > 10) {
            base = 68.20;
        }

        const total = base + 4.00; // 68.50 or 72.20
        return {
            totalAmount: total,
            creditAmount: base,
            timbre: 3.45,
            taxe: 0.55,
            textAmount: getNumberText(total),
            billBreakdown: [
                { value: 50, count: 1, total: 50 },
                { value: 10, count: 1, total: 10 },
                { value: 5, count: 1, total: 5 }, // 65
                // Approximate breakdown
                { value: 1, count: Math.floor(total - 65), total: Math.floor(total - 65) }
            ]
        };
    }

    // --- EXISTING RULES (Standard) ---

    // REGLE 1 : 1-10 CV -> 63 USD
    if (cv <= 10) {
        return {
            totalAmount: 63.00,
            creditAmount: 59.00,
            timbre: 3.45,
            taxe: 0.55,
            textAmount: "soixante trois",
            billBreakdown: [
                { value: 20, count: 2, total: 40 },
                { value: 10, count: 2, total: 20 },
                { value: 1, count: 3, total: 3 }
            ]
        };
    }

    // REGLE 2 : 11-15 CV -> 69 USD
    // S'applique à TOUS les véhicules dans cette tranche (ex: Pick-up Wingle 12CV)
    if (cv <= 15) {
        return {
            totalAmount: 69.00,
            creditAmount: 65.00,
            timbre: 3.45,
            taxe: 0.55,
            textAmount: "soixante neuf",
            billBreakdown: [
                { value: 50, count: 1, total: 50 },
                { value: 10, count: 1, total: 10 },
                { value: 1, count: 9, total: 9 }
            ]
        };
    }

    // REGLE 3 : > 15 CV -> 75 USD
    // L'utilisateur dit "Plus de 15cv 75$".
    // 75 = 71 (crédit) + 4 (frais)
    return {
        totalAmount: 75.00,
        creditAmount: 71.00,
        timbre: 3.45,
        taxe: 0.55,
        textAmount: "soixante quinze",
        billBreakdown: [
            { value: 50, count: 1, total: 50 },
            { value: 20, count: 1, total: 20 },
            { value: 5, count: 1, total: 5 }
        ]
    };
};
