const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mpzyucmgmobglotflrdi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4MfXaSvhj6DudFWrqoUyJQ_p4ZZuejk';
const TAUX_FC = 2244.76;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Grille tarifaire 2026 (copie inline pour le script) ----------
const TOURISME_1_10 = { impot: 35.60, tsc: 30.40, redevance: 6.00, imprime: 5.00, total: 77.00, categorie: 'Véhicule de Tourisme Light (1–10 CV)' };
const TOURISME_11_15 = { impot: 39.20, tsc: 34.90, redevance: 6.00, imprime: 5.00, total: 85.10, categorie: 'Véhicule de Tourisme Medium (11–15 CV)' };
const TOURISME_PLUS15 = { impot: 44.00, tsc: 39.40, redevance: 6.00, imprime: 5.00, total: 94.40, categorie: 'Véhicule de Tourisme Heavy (> 15 CV)' };

const UTIL_M2K5 = { impot: 28.00, tsc: 31.60, redevance: 6.00, imprime: 5.00, total: 70.60, categorie: 'Véhicule Utilitaire Light (≤ 2.500 kg, 1–10 CV)' };
const UTIL_2K5_10K = { impot: 32.00, tsc: 30.40, redevance: 6.00, imprime: 5.00, total: 73.40, categorie: 'Véhicule Utilitaire Medium (2.500–10.000 kg, 11–15 CV)' };
const UTIL_P10K = { impot: 35.10, tsc: 34.90, redevance: 6.00, imprime: 5.00, total: 81.00, categorie: 'Véhicule Utilitaire Heavy (> 10.000 kg, > 15 CV)' };

const TRACTEUR_1_10 = { impot: 26.80, tsc: 23.60, redevance: 6.00, imprime: 5.00, total: 61.40, categorie: 'Tracteur — 1 à 10 CV' };
const TRACTEUR_11_15 = { impot: 31.60, tsc: 28.40, redevance: 6.00, imprime: 5.00, total: 71.00, categorie: 'Tracteur — 11 à 15 CV' };
const TRACTEUR_PLUS15 = { impot: 35.20, tsc: 34.40, redevance: 6.00, imprime: 5.00, total: 80.60, categorie: 'Tracteur — Plus de 15 CV' };

const REMORQUE_M2K5 = { impot: 31.60, tsc: 28.40, redevance: 6.00, imprime: 5.00, total: 71.00, categorie: 'Remorque — Moins de 2.500 kg' };
const REMORQUE_2K5_10K = { impot: 35.20, tsc: 34.40, redevance: 6.00, imprime: 5.00, total: 80.60, categorie: 'Remorque — 2.500 à 10.000 kg' };
const REMORQUE_P10K = { impot: 40.00, tsc: 39.20, redevance: 6.00, imprime: 5.00, total: 90.20, categorie: 'Remorque — Plus de 10.000 kg' };

const BICYCLE = { impot: 9.50, tsc: 2.50, redevance: 0.00, imprime: 5.00, total: 17.00, categorie: 'Bicycle — Toutes cylindrées' };
const TRICYCLE = { impot: 11.00, tsc: 4.00, redevance: 0.00, imprime: 5.00, total: 20.00, categorie: 'Tricycle' };

function parseCv(v) {
    const m = String(v || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function calculer2026(categorie, cv, tonnage) {
    switch (categorie) {
        case 'tourisme':
            if (cv <= 10) return TOURISME_1_10;
            if (cv <= 15) return TOURISME_11_15;
            return TOURISME_PLUS15;
        case 'utilitaire':
            if (tonnage > 10 || cv > 15) return UTIL_P10K;
            if (tonnage > 2.5 || cv >= 11) return UTIL_2K5_10K;
            return UTIL_M2K5;
        case 'tracteur':
            if (cv <= 10) return TRACTEUR_1_10;
            if (cv <= 15) return TRACTEUR_11_15;
            return TRACTEUR_PLUS15;
        case 'remorque':
            if (tonnage <= 2.5) return REMORQUE_M2K5;
            if (tonnage <= 10) return REMORQUE_2K5_10K;
            return REMORQUE_P10K;
        case 'moto':
            return cv >= 1 ? TRICYCLE : BICYCLE;
        default:
            return TOURISME_1_10;
    }
}

function mapCategorie(genre, usage, cv) {
    const g = (genre || '').toUpperCase();
    const u = (usage || '').toUpperCase();

    if (/MOTO|CYCLO|BICYCLE|TRICYCLE/i.test(g)) return 'moto';
    if (/TRACTEUR|TRACTOR/i.test(g)) return 'tracteur';
    if (/REMORQUE/i.test(g)) return 'remorque';
    if (/BATEAU|B.B.A|BALEINIERE|PLAISANCE|FLOTTANT|TDM|T\.D\.M/i.test(g)) return 'bateau';

    if (/VOITURE|JEEP/i.test(g)) return 'tourisme';
    if (/PICK.?UP|CAMIONNETTE/i.test(g)) {
        if (/PERSONNEL/i.test(u)) return 'tourisme';
        return 'utilitaire';
    }
    if (/CAMION/i.test(g)) return 'utilitaire';
    if (/MINI.?BUS|BUS/i.test(g)) return 'utilitaire';
    if (/VEHICULE.?SPECIAL/i.test(g)) return 'utilitaire';

    // Fallback par usage
    if (/PERSONNEL/i.test(u)) return 'tourisme';
    if (/MARCHANDISES|TRANSPORT|COMMERCIAL/i.test(u)) return 'utilitaire';

    return 'tourisme';
}

function estimerTonnage(genre) {
    const g = (genre || '').toUpperCase();
    if (/VOITURE|JEEP/i.test(g)) return 1;
    if (/PICK.?UP/i.test(g)) return 1.5;
    if (/CAMIONNETTE/i.test(g)) return 2;
    if (/MINI.?BUS/i.test(g)) return 3;
    if (/VEHICULE.?SPECIAL/i.test(g)) return 3;
    if (/CAMION/i.test(g)) return 8;
    if (/TRACTEUR/i.test(g)) return 5;
    if (/REMORQUE/i.test(g)) return 2;
    return 2;
}

function getTariffLabel(tarif) {
    return tarif.categorie;
}

// ---------- Main ----------
async function main() {
    console.log('Récupération des déclarations...');
    const { data: declarations, error } = await supabase
        .from('declarations')
        .select('*')
        .order('id');

    if (error || !declarations) {
        console.error('Erreur:', error);
        return;
    }

    console.log(declarations.length + ' déclarations trouvées.\n');

    let ok = 0;
    let errors = [];

    for (const d of declarations) {
        const vehicle = d.vehicle || {};
        const genre = vehicle.genre || d.meta?.manualGenre || '';
        const usage = d.meta?.manualUsage || '';
        const cv = parseCv(vehicle.fiscalPower || d.meta?.manualFiscalPower || '0');
        const tonnage = estimerTonnage(genre);

        const categorie = mapCategorie(genre, usage, cv);
        const tarif = calculer2026(categorie, cv, tonnage);
        const baseRate = tarif.total;
        const totalFC = Math.round(baseRate * TAUX_FC * 100) / 100;

        const update = {
            tax: { baseRate, currency: 'USD', totalAmountFC: totalFC },
            meta: {
                ...d.meta,
                tariffMode: 'new2026',
                tariffLabel: tarif.categorie,
                tariffBreakdown: {
                    impot: tarif.impot,
                    tsc: tarif.tsc,
                    redevance: tarif.redevance,
                    imprime: tarif.imprime,
                    total: tarif.total,
                },
                manualBaseAmount: baseRate,
                manualFiscalPower: cv + ' CV',
                manualUsage: usage || 'PERSONNEL',
                manualGenre: genre || 'VOITURE',
            },
        };

        const { error: updErr } = await supabase
            .from('declarations')
            .update(update)
            .eq('id', d.id);

        if (updErr) {
            errors.push(d.id + ': ' + updErr.message);
            console.error('  ✗ ' + d.id + ' — ' + updErr.message);
        } else {
            ok++;
            console.log('  ✓ ' + d.id + ' | ' + tarif.categorie + ' | $' + baseRate.toFixed(2) + ' → FC ' + totalFC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }));
        }
    }

    console.log('\n═══════════════════════════════════');
    console.log(ok + '/' + declarations.length + ' mises à jour');
    if (errors.length) {
        console.log('Erreurs:');
        errors.forEach(e => console.log('  - ' + e));
    }

    // Résumé des tarifs
    console.log('\nRépartition par tarif :');
    const { data: updated } = await supabase.from('declarations').select('meta->tariffLabel');
    const counts = {};
    for (const d of updated || []) {
        const l = d.tariffLabel || 'Indéfini';
        counts[l] = (counts[l] || 0) + 1;
    }
    for (const [label, count] of Object.entries(counts).sort()) {
        console.log('  ' + label + ' → ' + count);
    }
}

main().catch(console.error);
