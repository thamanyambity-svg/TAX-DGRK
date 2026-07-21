/**
 * Script de vérification et correction des 8 déclarations existantes
 * - Lit les déclarations depuis Supabase
 * - Compare les prix actuels (legacy) avec la grille 2026
 * - Met à jour si demandé
 */

import { supabase } from '../lib/supabase';
import { generateDeclaration } from '../lib/generator';
import { calculer2026, Categorie2026 } from '../lib/tarif-2026';
import { Declaration } from '../types';

const TARGET_IDS = [
    'DECL-2026-157A1D2E',
    'DECL-2026-157EBA0E',
    'DECL-2026-1584C51D',
    'DECL-2026-157C87ED',
    'DECL-2026-157B602D',
    'DECL-2026-15891D25',
    'DECL-2026-157E861F',
    'DECL-2026-1579E552',
];

function decodeSequence(id: string): number {
    const hexSuffix = id.split('-').pop() || '0';
    return parseInt(hexSuffix, 16) - 0x1579A000;
}

function mapTo2026Category(legacyCategory: string, cv: number): { categorie: Categorie2026; cv?: number; tonnage?: number } {
    const cat = legacyCategory.toLowerCase();

    if (cat === 'motocycle') return { categorie: 'moto', cv: 0 };

    if (cat.includes('utilitaire') || cat.includes('utilitaire_heavy') || cat.includes('véhicule utilitaire')) {
        return { categorie: 'utilitaire', tonnage: 3 };
    }

    if (cat.includes('tracteur') || cat.includes('véhicule tracteur')) {
        return { categorie: 'tracteur', cv };
    }

    if (cat.includes('remorque') || cat.includes('véhicule remorque')) {
        return { categorie: 'remorque', tonnage: 3 };
    }

    if (cat.includes('bateau') || cat.includes('bateau')) {
        return { categorie: 'bateau', cv: 40 };
    }

    // Default: tourisme
    return { categorie: 'tourisme', cv };
}

async function main() {
    console.log('=== VÉRIFICATION DES 8 DÉCLARATIONS ===\n');

    for (const id of TARGET_IDS) {
        const seq = decodeSequence(id);
        const decl = generateDeclaration(seq);

        const cv = parseInt((decl.vehicle?.fiscalPower || '0').replace(/[^0-9]/g, '')) || 0;
        const legacyCat = decl.vehicle?.category || 'N/A';
        const legacyPrice = decl.tax?.baseRate || 0;
        const legacyTotalFC = decl.tax?.totalAmountFC || 0;

        const mapping = mapTo2026Category(legacyCat, cv);
        const newTax = calculer2026(mapping);
        const newPrice = newTax.total;
        const EXCHANGE_RATE = 2244.76;
        const newTotalFC = Math.round(newPrice * EXCHANGE_RATE);

        const diff = newPrice - legacyPrice;

        console.log(`ID: ${id}`);
        console.log(`   Sequence: ${seq}`);
        console.log(`   Catégorie (legacy): ${legacyCat}`);
        console.log(`   CV: ${cv}`);
        console.log(`   2026 mapping: ${mapping.categorie} (cv=${mapping.cv ?? '-'}, tonnage=${mapping.tonnage ?? '-'})`);
        console.log(`   Prix legacy: $${legacyPrice.toFixed(2)} (FC ${legacyTotalFC.toLocaleString()})`);
        console.log(`   Prix 2026: $${newPrice.toFixed(2)} (FC ${newTotalFC.toLocaleString()})`);
        console.log(`   Différence: ${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}`);
        console.log();

        // Check if already in DB
        const { data: existing } = await supabase
            .from('declarations')
            .select('id, tax')
            .eq('id', id)
            .maybeSingle();

        if (existing) {
            const currentPrice = (existing.tax as any)?.baseRate || 0;
            console.log(`   ⚡ Existe en DB — prix actuel: $${currentPrice.toFixed(2)}`);
        } else {
            console.log(`   ⚡ Existe uniquement en fallback (généré à la volée)`);
        }
        console.log();
    }
}

main().catch(console.error);
