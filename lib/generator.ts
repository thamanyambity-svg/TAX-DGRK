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
 * Generates a unique sequence number based on time and randomness to avoid collisions
 */
export function getSecureSequence(): number {
    const now = new Date();
    const baseDate = new Date('2026-01-01');
    // Seconds since 2026-01-01
    const seconds = Math.floor((now.getTime() - baseDate.getTime()) / 1000);
    // Add 3 random digits for sub-second unique collisions
    return seconds * 1000 + Math.floor(Math.random() * 1000);
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
    // Legacy fallback parsing logic (shared)
    const sequenceStr = declaration.id.split('-').pop();
    const declarationVal = parseInt(sequenceStr || '0', 16);
    let sequence = !isNaN(declarationVal) ? declarationVal - DECL_BASE : 0;
    if (sequence < 0) sequence = 0;

    // Stable NIF generation based on name hash (if no manual NIF)
    const getStableNIF = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        const num = Math.abs(hash % 900000) + 100000;
        return `A${num}K`;
    };

    const taxpayerName = declaration.meta?.manualTaxpayer?.name ||
        (declaration.vehicle.type === 'Personne Morale' ? `ENTREPRISE ${sequence} SARL` : `CITOYEN ${sequence} KITONA`);

    const finalNote: NoteDePerception = {
        id: declaration.meta?.ndpId || generateNoteId(sequence), // Prioritize stored NDP ID
        declarationId: declaration.id,
        taxpayer: {
            name: taxpayerName,
            nif: declaration.meta?.manualTaxpayer?.nif || getStableNIF(taxpayerName),
            address: declaration.meta?.manualTaxpayer?.address || `${sequence * 12 + 1} Av. Des Poids Lourds, ${getFromList(COMMUNES, sequence)}, ${getFromList(CITIES, sequence)}`,
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
        bankDetails: {
            reservedBox: true,
        },
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
