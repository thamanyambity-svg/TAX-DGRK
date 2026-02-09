
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

export const calculateTax = (fiscalPower: number, vehicleType: string): TaxCalculation => {
    // Normalisation
    const cv = fiscalPower || 0;
    const type = (vehicleType || '').toLowerCase();
    // Broad definition of heavy/utility for the check
    const isHeavy = type.includes('camion') || type.includes('bus') || type.includes('tracteur') || type.includes('remorque') || type.includes('utilitaire');

    // REGLE 1 : 1-10 CV -> 63 USD
    if (cv <= 10) {
        return {
            totalAmount: 63.00,
            creditAmount: 59.00,
            timbre: 3.45,
            taxe: 0.55,
            textAmount: "cinquante neuf",
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
            textAmount: "soixante cinq",
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
        textAmount: "soixante onze",
        billBreakdown: [
            { value: 50, count: 1, total: 50 },
            { value: 20, count: 1, total: 20 },
            { value: 5, count: 1, total: 5 }
        ]
    };
};
