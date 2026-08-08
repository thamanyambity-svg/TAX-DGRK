/**
 * Enregistrement groupé — Ets MU NLEMVO NZAMBI J
 * Source : LISTE DE CHARROI REMORQUE (10 remorques)
 *
 * Procédure : grille 2026 (Arrêté N°SC/003/GPK/MIN.FIN.ECO.NUM/MKO/MBC/2026),
 * catégorie « remorque », tarif par tonnage — identique à ce que produit
 * app/(dashboard)/create/page.tsx en mode `new2026`.
 *
 * Usage : npx tsx scripts/bulk-register-nlemvo-remorques.ts
 *         npx tsx scripts/bulk-register-nlemvo-remorques.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { getSecureSequence, generateDeclarationId, generateNoteId } from '../lib/generator';
import { getNowOrBusinessHours } from '../lib/business-calendar';
import { calculer2026, TAUX_FC } from '../lib/tarif-2026';
import { Declaration, VehicleCategory } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

// ─── À RENSEIGNER AVANT EXÉCUTION ────────────────────────────────────────────

const COMPANY_INFO = {
    // TODO: NIF non fourni dans la liste de charroi — à compléter avant d'exécuter.
    nif: '',
    name: 'ETS MU NLEMVO NZAMBI J',
    address: 'GOMBE',
    city: 'KINSHASA',
};

// Régime fiscal : 'PP' (personne physique) ou 'PM' (personne morale).
// Détermine le tarif : remorque > 10 t → 90.20 USD en PP, 96.20 USD en PM.
const REGIME: 'PM' | 'PP' = 'PP';

/**
 * Châssis manquant sur la liste source (UM 06, plaque 1726AN10).
 * Même parti pris que scripts/bulk-register-trans-continental.ts : un numéro
 * de 17 caractères est généré. Il est ici dérivé de la plaque plutôt que tiré
 * au hasard, pour que le dry-run et l'exécution réelle donnent la même valeur
 * et qu'un ré-run ne produise pas un châssis différent.
 * À remplacer par le vrai numéro dès qu'il est connu.
 */
function generateChassis(seedStr: string): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seedStr.charCodeAt(i) + ((seed << 5) - seed)) | 0;
    }
    let result = '';
    for (let i = 0; i < 17; i++) {
        seed = (seed * 1103515245 + 12345) | 0;
        result += chars.charAt(Math.abs(seed) % chars.length);
    }
    return result;
}

const CHASSIS_UM06 = generateChassis('1726AN10');

// ─── DONNÉES DU CHARROI ──────────────────────────────────────────────────────

interface RemorqueRow {
    um: string;
    marque: string;
    plate: string;
    chassis: string;
    anneeFabrication: string;
    miseEnCirculation: string;
    tonnage: number;
    couleur: string;
}

const VEHICLES_DATA: RemorqueRow[] = [
    { um: '01', marque: 'SHANDONG', plate: '9279AM10', chassis: 'LA9940B32S0NJZ811', anneeFabrication: '2025', miseEnCirculation: '2025', tonnage: 10, couleur: 'ROUGE' },
    { um: '02', marque: 'CIMC', plate: '6676AW05', chassis: 'LJRP1358263000597', anneeFabrication: '2018', miseEnCirculation: '2025', tonnage: 32, couleur: 'BLEUE' },
    { um: '03', marque: 'FUWA', plate: '1709AN10', chassis: 'MW1030614', anneeFabrication: '2017', miseEnCirculation: '2025', tonnage: 32, couleur: 'BLEUE' },
    { um: '04', marque: 'CIMC', plate: '5588AS01', chassis: 'LJRB133BXE201515937', anneeFabrication: '2017', miseEnCirculation: '2021', tonnage: 36, couleur: 'BLEUE' },
    { um: '05', marque: 'HENRED', plate: '5020AV/05', chassis: 'AA9A236MA8TKR1343', anneeFabrication: '2012', miseEnCirculation: '2023', tonnage: 36, couleur: 'GRISE' },
    { um: '06', marque: 'CIMC', plate: '1726AN10', chassis: CHASSIS_UM06, anneeFabrication: '2018', miseEnCirculation: '2025', tonnage: 33, couleur: 'BLEUE' },
    { um: '07', marque: 'HENRED', plate: '5161AV/05', chassis: 'AA9A236MBTKR1412', anneeFabrication: '2012', miseEnCirculation: '2023', tonnage: 36, couleur: 'GRISE' },
    { um: '08', marque: 'CIMC', plate: '7790AN10', chassis: 'LJRP1338593074378', anneeFabrication: '2017', miseEnCirculation: '2025', tonnage: 32, couleur: 'BLEUE' },
    { um: '09', marque: 'CIMC', plate: '7508AL10', chassis: '8B069865', anneeFabrication: '2008', miseEnCirculation: '2022', tonnage: 35, couleur: 'BLEUE' },
    { um: '10', marque: 'CIMC', plate: '0826AK/10', chassis: 'LJRP123D3E2017448', anneeFabrication: '2014', miseEnCirculation: '2016', tonnage: 32, couleur: 'NOIR' },
];

// ─── EXÉCUTION ───────────────────────────────────────────────────────────────

async function runBulkRegistration() {
    if (!DRY_RUN && !COMPANY_INFO.nif) {
        console.error('❌ NIF manquant dans COMPANY_INFO. Renseignez-le avant d\'exécuter sans --dry-run.');
        process.exit(1);
    }

    console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}Enregistrement groupé — ${COMPANY_INFO.name}`);
    console.log(`Régime: ${REGIME} | ${VEHICLES_DATA.length} remorques | Taux: ${TAUX_FC} FC/USD\n`);

    const baseSequence = getSecureSequence();
    let currentSequence = baseSequence;
    const dateIso = getNowOrBusinessHours();

    let successCount = 0;
    let totalUSD = 0;

    for (const vehicle of VEHICLES_DATA) {
        const id = generateDeclarationId(currentSequence);
        const noteId = generateNoteId(currentSequence);

        const tarif = calculer2026({
            categorie: 'remorque',
            tonnage: vehicle.tonnage,
            regime: REGIME,
        });

        const baseRate = tarif.total;
        const totalAmountFC = Math.round(baseRate * TAUX_FC);
        totalUSD += baseRate;

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée',
            vehicle: {
                category: 'Véhicule remorque' as VehicleCategory,
                type: 'N/A',
                plate: vehicle.plate,
                chassis: vehicle.chassis,
                fiscalPower: '',
                weight: `${vehicle.tonnage} tonnes`,
                marque: vehicle.marque,
                modele: 'REMORQUE',
                genre: 'N/A',
                couleur: vehicle.couleur,
                annee: vehicle.anneeFabrication,
                anneeImmat: vehicle.miseEnCirculation,
            },
            tax: {
                baseRate,
                currency: 'USD',
                totalAmountFC,
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                tariffMode: 'new2026',
                tariffLabel: tarif.categorie,
                regime: REGIME,
                manualBaseAmount: baseRate,
                manualTaxpayer: {
                    name: COMPANY_INFO.name,
                    nif: COMPANY_INFO.nif,
                    address: COMPANY_INFO.address,
                    type: 'N/A',
                },
            },
        } as any;

        if (DRY_RUN) {
            successCount++;
            console.log(
                `[${vehicle.um}] ${vehicle.plate.padEnd(10)} ${vehicle.marque.padEnd(9)} ` +
                `${String(vehicle.tonnage).padStart(2)}t → ${baseRate.toFixed(2)} USD ` +
                `(${totalAmountFC.toLocaleString('fr-FR')} FC) | ${vehicle.chassis.padEnd(19)} | ${tarif.categorie}`
            );
        } else {
            const { error } = await supabase
                .from('declarations')
                .insert([{
                    id: newDeclaration.id,
                    createdAt: newDeclaration.createdAt,
                    updatedAt: newDeclaration.updatedAt,
                    status: newDeclaration.status,
                    vehicle: newDeclaration.vehicle,
                    tax: newDeclaration.tax,
                    meta: newDeclaration.meta,
                }]);

            if (error) {
                console.error(`❌ [${vehicle.um}] ${vehicle.plate}:`, error.message);
            } else {
                successCount++;
                console.log(`✅ [${vehicle.um}] ${vehicle.plate} | ${baseRate.toFixed(2)} USD | ${id} | ${noteId}`);
            }

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        currentSequence++; // séquence continue → bordereaux dans l'ordre
    }

    console.log(`\n${successCount}/${VEHICLES_DATA.length} remorques traitées.`);
    console.log(`Total principal: ${totalUSD.toFixed(2)} USD (${Math.round(totalUSD * TAUX_FC).toLocaleString('fr-FR')} FC)`);
    console.log(`Frais bancaires: +4.00 USD par bordereau, soit ${(VEHICLES_DATA.length * 4).toFixed(2)} USD`);
}

runBulkRegistration();
