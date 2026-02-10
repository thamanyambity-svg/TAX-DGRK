import { Declaration, NoteDePerception, TaxpayerType, VehicleCategory } from '@/types';

// Constants for generation
const CATEGORIES: VehicleCategory[] = [
    'Motocycle', 'Véhicule utilitaire', 'Véhicule touristique',
    'Véhicule tracteur', 'Véhicule remorque', 'Transport public',
    'Immatriculé IT', 'Exonéré'
];

const TAXPAYER_TYPES: TaxpayerType[] = ['Personne Physique', 'Personne Morale'];

const CITIES = ['Kinshasa', 'Lubumbashi', 'Goma', 'Matadi', 'Kisangani'];
const COMMUNES = ['Gombe', 'Kintambo', 'Ngaliema', 'Limete', 'Makala', 'Bandalungwa'];

const CONGO_NAMES = [
    'MUKENDI', 'TSHIMANGA', 'LIKUTA', 'MBALA', 'KABAMBA', 'NGALULA', 'ILUNGA', 'MWAMBA',
    'MUTOMBO', 'NDAYA', 'KABEDI', 'KABONGO', 'TSHIBANGU', 'MUSAU', 'KALONJI', 'MULUMBA',
    'TSHISUAKA', 'MBUYI', 'KADIMA', 'KABEYA', 'TSHIBOLA', 'MPUTU', 'KANYINDA', 'MUTEBA',
    'LUKUSA', 'TSHILOMBO', 'KAYEMBE', 'BOKETSHU', 'YAMBA', 'MALU'
];

const PHONE_PREFIXES = ['81', '82', '85', '89', '97', '99'];

function generateRandomPhone(seed: number): string {
    if (seed % 7 === 0) return ''; // Randomly empty
    const prefix = getFromList(PHONE_PREFIXES, seed);
    // Generate 7 digits based on seed
    const digits = ((seed * 1234567) % 10000000).toString().padStart(7, '0');
    return `+243${prefix}${digits}`;
}

export { CONGO_NAMES, generateRandomPhone };

// Helper to generate a consistent logical ID from a sequence number
// User requested base: DECL-2026-B9ED76
export const DECL_BASE = 0xB9ED76;
export const NDP_BASE = 0x1579A471;

/**
 * Generates a high-entropy unique sequence number to prevent collisions.
 */
export function getSecureSequence(): number {
    // Use a large random range (100,000 to 9,999,999) to ensure uniqueness
    return Math.floor(Math.random() * 9000000) + 100000;
}

export function generateDeclarationId(sequence: number): string {
    const currentId = DECL_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `DECL-2026-${hexSuffix}`;
}

export function generateNoteId(sequence: number): string {
    const currentId = NDP_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `NDP-2026-${hexSuffix}`;
}

// Deterministic random helper (simple LCG or just modulo for demo)
function getFromList<T>(list: T[], seed: number): T {
    return list[seed % list.length];
}

// Helper for deterministic dates based on sequence
import { generateValidDate } from './business-calendar';

function getStableDate(sequence: number, offsetDays = 0): string {
    // Generate a valid date based on the sequence
    const date = generateValidDate(sequence + offsetDays);
    return date.toISOString();
}

export function generateDeclaration(sequence: number): Declaration {
    const id = generateDeclarationId(sequence);
    const type = getFromList(TAXPAYER_TYPES, sequence);
    const category = getFromList(CATEGORIES, sequence);

    // Algorithmic generation of vehicle data
    const plate = `${1000 + sequence}BA${sequence % 10}${Math.floor(sequence / 10) % 10}`;
    const chassis = `JNX${sequence}00${2026 + sequence}XYZ`; // Pseudo-VIN

    // Tax calculation logic (Updated sync with tax-rules.ts)
    const { calculateTax } = require('./tax-rules');
    const cvValue = 10 + (sequence % 20); // Generator range
    const taxInfo = calculateTax(cvValue, category);

    const baseRate = taxInfo.totalAmount;
    const EXCHANGE_RATE = 2271.1668;
    const totalAmount = baseRate * EXCHANGE_RATE;

    const declaration: Declaration = {
        id,
        createdAt: getStableDate(sequence), // Deterministic date
        updatedAt: getStableDate(sequence),
        status: sequence % 3 === 0 ? 'Payée' : 'Facturée', // Cycle statuses
        vehicle: {
            category,
            type,
            plate,
            chassis,
            fiscalPower: `${10 + (sequence % 20)} CV`,
            weight: `${1 + (sequence % 5)} tonnes`,
        },
        tax: {
            baseRate,
            currency: 'FC',
            totalAmountFC: totalAmount,
        },
        meta: {
            systemId: `SYS-${sequence.toString(16).toUpperCase()}`,
            reference: `REF-${20260000 + sequence}`
        }
    };

    return declaration;
}

export function generateNote(declaration: Declaration): NoteDePerception {
    // 1. CRITICAL: Always prioritize the uniquely stored reference from the DB
    if (declaration.meta?.ndpId) {
        const taxpayerName = declaration.meta?.manualTaxpayer?.name ||
            (declaration.taxpayer as any)?.name ||
            "CONTRIBUABLE";

        return {
            id: declaration.meta.ndpId,
            declarationId: declaration.id,
            taxpayer: {
                name: taxpayerName,
                nif: declaration.meta?.manualTaxpayer?.nif || "N/A",
                address: declaration.meta?.manualTaxpayer?.address || "KINSHASA",
            },
            vehicle: declaration.vehicle,
            bankDetails: { reservedBox: true },
            payment: {
                principalTaxUSD: declaration.tax.baseRate,
                totalAmountFC: declaration.tax.totalAmountFC,
            },
            generatedAt: declaration.createdAt,
        };
    }

    // 2. Fallback logic for legacy/mock data
    const sequenceStr = declaration.id.split('-').pop();
    const declarationVal = parseInt(sequenceStr || '0', 16);
    let sequence = !isNaN(declarationVal) ? declarationVal - DECL_BASE : 0;
    if (sequence < 0) sequence = 0;

    const taxpayerName = declaration.meta?.manualTaxpayer?.name ||
        (declaration.vehicle.type === 'Personne Morale' ? `ENTREPRISE ${sequence} SARL` : `CITOYEN ${sequence} KITONA`);

    const finalNote: NoteDePerception = {
        id: generateNoteId(sequence),
        declarationId: declaration.id,
        taxpayer: {
            name: taxpayerName,
            nif: declaration.meta?.manualTaxpayer?.nif || `A${900000 + sequence}K`,
            address: declaration.meta?.manualTaxpayer?.address || "ADRESSE GENEREE",
        },
        vehicle: {
            chassis: declaration.vehicle.chassis,
            plate: declaration.vehicle.plate,
            category: declaration.vehicle.category,
            fiscalPower: declaration.vehicle.fiscalPower,
            genre: declaration.vehicle.genre,
            marque: declaration.vehicle.marque,
            modele: declaration.vehicle.modele,
        },
        bankDetails: { reservedBox: true },
        payment: {
            principalTaxUSD: declaration.tax.baseRate,
            totalAmountFC: declaration.tax.totalAmountFC,
        },
        generatedAt: declaration.createdAt,
    };

    // Override with explicit stored data if it exists
    if (declaration.meta && (declaration.meta as any).taxpayerData) {
        finalNote.taxpayer = (declaration.meta as any).taxpayerData;
    }
    if (declaration.meta?.manualTaxpayer) {
        finalNote.taxpayer = {
            ...finalNote.taxpayer,
            ...declaration.meta.manualTaxpayer
        };
    }

    return finalNote;
}
