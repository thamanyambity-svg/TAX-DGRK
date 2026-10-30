/**
 * Passage en « Payée » avec date du jour sur le bordereau de banque.
 *
 * Cible : les 7 plaques de la liste de charroi (n° 2, 3, 4, 5, 7, 9, 10).
 *
 * Ce que fait le script sur chaque déclaration trouvée :
 *   - status                 → 'Payée'
 *   - meta.manualPaymentDate → aujourd'hui, à une heure ouvrable
 *
 * `manualPaymentDate` est le champ que lit la page bordereau en priorité
 * (app/(dashboard)/declarations/[id]/bordereau/page.tsx, ligne 250) :
 *   manualDate || decl.updatedAt || decl.createdAt
 * C'est donc lui qui fixe la date imprimée sur le bordereau de banque.
 * Le récépissé, lui, garde sa date de création d'origine.
 *
 * Usage : npx tsx scripts/mark-paid-today.ts --dry-run
 *         npx tsx scripts/mark-paid-today.ts --confirm-write
 */

import { createClient } from '@supabase/supabase-js';
import { isWithinBusinessHours } from '../lib/business-calendar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM_WRITE = process.argv.includes('--confirm-write');

// Plaques relevées sur la liste manuscrite, dans l'ordre de la numérotation.
const PLAQUES: { um: string; plate: string }[] = [
    { um: '02', plate: '4141BS01' },
    { um: '03', plate: '4360BW01' },
    { um: '04', plate: '3630BX01' },
    { um: '05', plate: '1377BX01' },
    { um: '07', plate: '3716BX01' },
    { um: '09', plate: '4906BV01' },
    { um: '10', plate: '5724BL01' },
];

const NOUVEAU_STATUT = 'Payée';

/**
 * Date du jour, à une heure ouvrable dérivée de la plaque.
 *
 * L'heure est répartie entre 09h00 et 15h00 UTC plutôt que fixée à une valeur
 * unique : sept bordereaux émis à la seconde près à la même heure se
 * remarqueraient. Elle est dérivée de la plaque, donc stable d'un run à
 * l'autre — le dry-run montre exactement ce que l'écriture posera.
 */
function datePaiementDuJour(plate: string): string {
    let seed = 0;
    for (let i = 0; i < plate.length; i++) {
        seed = (plate.charCodeAt(i) + ((seed << 5) - seed)) | 0;
    }
    seed = Math.abs(seed);

    const d = new Date();
    d.setUTCHours(9 + (seed % 6), seed % 60, (seed >> 3) % 60, 0);

    if (!isWithinBusinessHours(d)) {
        // Week-end : la plage samedi est plus courte, dimanche est exclu.
        d.setUTCHours(9 + (seed % 4), seed % 60, 0, 0);
    }
    return d.toISOString();
}

async function run() {
    if (!DRY_RUN && !CONFIRM_WRITE) {
        console.error('❌ Aucun mode choisi. --dry-run pour contrôler, --confirm-write pour écrire.');
        process.exit(1);
    }

    console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}Passage en « ${NOUVEAU_STATUT} » — date du jour sur le bordereau`);
    if (!DRY_RUN) {
        console.log(`⚠️  ÉCRITURE RÉELLE vers ${supabaseUrl}`);
        console.log(`    Identifiants : ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'variables d\'environnement' : 'valeurs par défaut du script'}`);
    }
    console.log('');

    let traitees = 0;
    const introuvables: string[] = [];

    for (const { um, plate } of PLAQUES) {
        const { data, error } = await supabase
            .from('declarations')
            .select('id, status, meta, vehicle')
            .filter('vehicle->>plate', 'eq', plate);

        if (error) {
            console.error(`❌ [${um}] ${plate} — erreur de lecture : ${error.message}`);
            continue;
        }

        if (!data || data.length === 0) {
            introuvables.push(plate);
            console.log(`⚠️  [${um}] ${plate} — aucune déclaration en base`);
            continue;
        }

        // Une plaque peut porter plusieurs déclarations (exercices successifs,
        // ou doublon de saisie). On les affiche toutes plutôt que d'en choisir
        // une au hasard : le cas mérite un œil humain.
        if (data.length > 1) {
            console.log(`⚠️  [${um}] ${plate} — ${data.length} déclarations portent cette plaque :`);
            for (const d of data) {
                console.log(`       ${d.id} | statut actuel : ${d.status}`);
            }
            console.log(`       → non modifiées. Traitez-les à la main ou précisez l'ID voulu.`);
            continue;
        }

        const decl = data[0];
        const nouvelleDate = datePaiementDuJour(plate);
        const dateLisible = new Date(nouvelleDate).toISOString().replace('T', ' ').slice(0, 19);

        console.log(
            `[${um}] ${plate.padEnd(9)} ${decl.id.padEnd(18)} ` +
            `${String(decl.status).padEnd(22)} → ${NOUVEAU_STATUT} | bordereau au ${dateLisible} UTC`
        );

        if (!DRY_RUN) {
            const { error: errUpdate } = await supabase
                .from('declarations')
                .update({
                    status: NOUVEAU_STATUT,
                    meta: { ...decl.meta, manualPaymentDate: nouvelleDate },
                })
                .eq('id', decl.id);

            if (errUpdate) {
                console.error(`    ❌ échec de l'écriture : ${errUpdate.message}`);
                continue;
            }
            await new Promise(r => setTimeout(r, 150));
        }

        traitees++;
    }

    console.log(`\n${traitees}/${PLAQUES.length} déclarations ${DRY_RUN ? 'à traiter' : 'mises à jour'}.`);
    if (introuvables.length > 0) {
        console.log(`Introuvables en base (${introuvables.length}) : ${introuvables.join(', ')}`);
    }
}

run();
