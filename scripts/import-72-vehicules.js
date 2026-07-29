const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://mpzyucmgmobglotflrdi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4MfXaSvhj6DudFWrqoUyJQ_p4ZZuejk';
const TAUX_FC = 2244.76;
const DECL_BASE = 0x1579A000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOURISME_1_10 = { total: 77.00, label: 'Tourisme Light (1-10 CV)' };
const TOURISME_11_15 = { total: 85.10, label: 'Tourisme Medium (11-15 CV)' };
const TOURISME_PLUS15 = { total: 94.40, label: 'Tourisme Heavy (>15 CV)' };
const UTIL_M2K5 = { total: 70.60, label: 'Utilitaire Light (≤2.5T, 1-10 CV)' };
const UTIL_2K5_10K = { total: 73.40, label: 'Utilitaire Medium (2.5-10T, 11-15 CV)' };
const UTIL_P10K = { total: 81.00, label: 'Utilitaire Heavy (>10T, >15 CV)' };
const TRACTEUR_1_10 = { total: 61.40, label: 'Tracteur (1-10 CV)' };
const TRACTEUR_11_15 = { total: 71.00, label: 'Tracteur (11-15 CV)' };
const TRACTEUR_PLUS15 = { total: 80.60, label: 'Tracteur (>15 CV)' };

function getTarif(categorie, cv) {
    cv = Number(cv) || 0;
    if (categorie === 'tracteur') {
        if (cv <= 10) return TRACTEUR_1_10;
        if (cv <= 15) return TRACTEUR_11_15;
        return TRACTEUR_PLUS15;
    }
    if (categorie === 'utilitaire') {
        if (cv > 15) return UTIL_P10K;
        if (cv >= 11) return UTIL_2K5_10K;
        return UTIL_M2K5;
    }
    if (cv > 15) return TOURISME_PLUS15;
    if (cv >= 11) return TOURISME_11_15;
    return TOURISME_1_10;
}

function parseAnnee(v) {
    if (!v) return { annee: '2026', anneeImmat: '2026' };
    const parts = String(v).split('-');
    return { annee: (parts[0] || '2026').trim(), anneeImmat: (parts[1] || parts[0] || '2026').trim() };
}

function normalizeGenre(g) {
    const v = (g || '').toUpperCase().trim();
    if (/^CMN/.test(v)) return 'CAMIONNETTE';
    return v;
}

function getCategorie2026(genre) {
    const g = normalizeGenre(genre);
    if (g === 'TRACTEUR') return 'tracteur';
    if (g === 'JEEP' || g === 'VOITURE') return 'tourisme';
    return 'utilitaire';
}

function normalizeCategorie(genre) {
    const g = normalizeGenre(genre);
    if (g === 'JEEP') return 'Véhicule touristique';
    if (g === 'VOITURE') return 'Vignette Automobile';
    if (g === 'PICK UP' || g === 'CAMIONNETTE') return 'Véhicule utilitaire';
    if (g === 'CAMION') return 'Véhicule utilitaire';
    if (g === 'MINI BUS') return 'Transport public';
    if (g === 'TRACTEUR') return 'Véhicule tracteur';
    return 'Véhicule touristique';
}

// ─── READ CSV ────────────────────────────────────────────────────────
const csvRaw = fs.readFileSync(path.join(__dirname, '../public/STE SMART(Feuil1).csv'), 'utf-8');
const rows = csvRaw.split('\n').map(l => l.trim().split(';').map(c => c.trim()));
const get = (r, idx) => (r && r[idx] ? r[idx].trim() : '');

// ─── PARSE ALL SECTIONS ─────────────────────────────────────────────
function parseVehicles(dataRows, colOffset, stopMarker, hasNomNif, nomCol, nifCol) {
    const result = [];
    let emptyCount = 0;
    for (const r of dataRows) {
        if (stopMarker && r.join(' ').includes(stopMarker)) break;
        const num = get(r, colOffset);
        if (!/^\d+$/.test(num)) {
            if (result.length > 0 && !get(r, colOffset + 1) && !get(r, colOffset + 4)) {
                emptyCount++;
                if (emptyCount >= 3) break;
            }
            continue;
        }
        emptyCount = 0;
        const plaque = get(r, colOffset + 1);
        const marque = get(r, colOffset + 4);
        if (!plaque || !marque) continue;

        const v = {
            num: parseInt(num), plaque, cv: get(r, colOffset + 2),
            chassis: get(r, colOffset + 3), marque, model: get(r, colOffset + 5),
            type: get(r, colOffset + 6), genre: get(r, colOffset + 7),
            couleur: get(r, colOffset + 8), annee: get(r, colOffset + 9),
        };
        if (hasNomNif) {
            v.nom = get(r, nomCol);
            v.nif = get(r, nifCol);
        }
        result.push(v);
    }
    return result;
}

// SRK: cols 0-9, rows 2-5
const srkVehicles = parseVehicles(rows.slice(2, 6), 0);
// SNS
let snsStart = 0;
for (let i = 0; i < rows.length; i++) {
    if (rows[i].join(' ').includes('SNS IMMOBILIER')) { snsStart = i + 2; break; }
}
const snsVehicles = parseVehicles(rows.slice(snsStart), 0, null);
// SMART: cols 11-20, stop at PARTICULIER
const smartDataRows = [];
for (const r of rows) {
    if (r.join(' ').includes('PARTICULIER')) break;
    smartDataRows.push(r);
}
const smartVehicles = parseVehicles(smartDataRows.slice(2), 11, null);
// PARTICULIER: cols 11-22
let partStart = 0;
for (let i = 0; i < rows.length; i++) {
    if (rows[i].join(' ').includes('PARTICULIER')) { partStart = i + 2; break; }
}
const partVehicles = parseVehicles(rows.slice(partStart), 11, null, true, 21, 22);

// ─── BUILD DECLARATIONS ──────────────────────────────────────────────
const groups = [
    { name: 'STE SRK SARL', nif: 'A2031784W', address: 'GOMBE', vehicles: srkVehicles },
    { name: 'STE SNS IMMOBILIER', nif: 'A1610520D', address: 'GOMBE', vehicles: snsVehicles },
    { name: 'STE SMART SARL', nif: 'A1300245G', address: 'GOMBE', vehicles: smartVehicles },
    { name: 'PARTICULIER', isParticulier: true, vehicles: partVehicles },
];

const usedSeqs = new Set();
function getSecureSequence() {
    let s;
    do { s = Math.floor(Math.random() * 0xFFFFF); } while (usedSeqs.has(s));
    usedSeqs.add(s);
    return s;
}

// ─── TIME DISTRIBUTION ───────────────────────────────────────────────
// 29 July 2026, 08:30-10:45 WAT (UTC+1) = 07:30-09:45 UTC
const START_UTC = new Date('2026-07-29T07:30:00Z');
const END_UTC = new Date('2026-07-29T09:45:00Z');
const RANGE_MS = END_UTC.getTime() - START_UTC.getTime();

let allDeclarations = [];
let globalIdx = 0;
const totalVehicles = groups.reduce((s, g) => s + g.vehicles.length, 0);

for (const g of groups) {
    for (const v of g.vehicles) {
        const seq = getSecureSequence();
        const idHex = (DECL_BASE + seq).toString(16).toUpperCase();
        const declId = `DECL-2026-${idHex}`;
        const noteId = `NDP - 2026 - ${idHex}`;

        // Distribute timestamp evenly across the range
        const fraction = globalIdx / (totalVehicles - 1 || 1);
        const ts = new Date(START_UTC.getTime() + Math.round(fraction * RANGE_MS));
        const createdAt = ts.toISOString();

        // updated_at = createdAt + 60min (bordereau)
        const updatedAt = new Date(ts.getTime() + 60 * 60 * 1000).toISOString();

        const cv = parseInt(v.cv) || 0;
        const cat2026 = getCategorie2026(v.genre);
        const tarif = getTarif(cat2026, cv);
        const fc = Math.round(tarif.total * TAUX_FC * 100) / 100;

        const marque = v.marque.toUpperCase().trim();
        const modele = v.model && v.model !== '-' ? v.model.toUpperCase().trim() : '';
        const typeVal = v.type && v.type !== '-' ? v.type.toUpperCase().trim() : '';

        const genre = normalizeGenre(v.genre);
        const cat = normalizeCategorie(v.genre);
        const annee = parseAnnee(v.annee);

        let nom, nif, adresse;
        if (g.isParticulier) {
            nom = v.nom.toUpperCase().trim();
            nif = v.nif.toUpperCase().trim();
            adresse = 'KINSHASA';
        } else {
            nom = g.name.toUpperCase().trim();
            nif = g.nif;
            adresse = g.address;
        }

        const decl = {
            id: declId,
            status: 'En attente de paiement',
            created_at: createdAt,
            updated_at: updatedAt,
            vehicle: {
                plate: v.plaque.toUpperCase(),
                chassis: v.chassis.toUpperCase(),
                marque,
                modele,
                fiscalPower: cv + ' CV',
                category: cat,
                genre,
                couleur: v.couleur.toUpperCase(),
                annee: annee.annee,
                anneeImmat: annee.anneeImmat,
                type: typeVal,
                weight: '-',
            },
            tax: {
                baseRate: tarif.total,
                currency: 'USD',
                totalAmountFC: fc,
            },
            meta: {
                systemId: declId,
                reference: idHex,
                ndpId: noteId,
                manualBaseAmount: tarif.total,
                taxpayerData: { name: nom, nif, address: adresse, type: 'N/A' },
                manualTaxpayer: { name: nom, nif, address: adresse, type: 'N/A' },
                manualPlate: v.plaque.toUpperCase(),
                manualNIF: nif,
                manualTaxpayerName: nom,
                manualTaxpayerAddress: adresse,
                source: 'import-csv-72',
                annee_fiscale: 2026,
            },
        };

        allDeclarations.push(decl);
        globalIdx++;
    }
}

// ─── INSERT ──────────────────────────────────────────────────────────
async function main() {
    console.log(`Début insertion de ${allDeclarations.length} déclarations...\n`);

    let success = 0;
    let errors = [];
    let skipped = 0;

    // Check duplicates
    const allPlates = allDeclarations.map(d => d.vehicle.plate);
    const { data: existing } = await supabase.from('declarations')
        .select('id, vehicle->>plate as plate')
        .in('vehicle->>plate', allPlates);

    const existingPlates = new Set((existing || []).map(d => d.plate));
    if (existingPlates.size > 0) {
        console.log(`Doublons trouvés (${existingPlates.size} plaques):`);
        for (const p of existingPlates) {
            console.log(`  Suppression de ${p}...`);
            await supabase.from('declarations').delete().eq('vehicle->>plate', p);
        }
        console.log('Doublons supprimés.\n');
    } else {
        console.log('Aucun doublon détecté.\n');
    }

    for (let i = 0; i < allDeclarations.length; i++) {
        const d = allDeclarations[i];
        // Check if this plate was just deleted
        const { data: stillThere } = await supabase.from('declarations')
            .select('id').eq('vehicle->>plate', d.vehicle.plate).maybeSingle();
        if (stillThere) {
            console.log(`  ⚠️  #${i+1} ${d.vehicle.plate} — existe encore, ignoré`);
            skipped++;
            continue;
        }

        const { error } = await supabase.from('declarations').insert(d);
        if (error) {
            errors.push({ plate: d.vehicle.plate, error: error.message });
            console.error(`  ✗ #${i+1} ${d.vehicle.plate} — ${error.message}`);
        } else {
            success++;
            const t = new Date(d.created_at);
            const timeStr = t.toLocaleTimeString('fr-FR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (i % 5 === 0 || i === allDeclarations.length - 1) {
                console.log(`  ✓ #${i+1} ${d.vehicle.plate} — ${d.id} — ${d.vehicle.marque} — ${timeStr} UTC`);
            }
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('RÉSULTAT');
    console.log(`${'='.repeat(50)}`);
    console.log(`  ✅ Créées:   ${success}`);
    console.log(`  ⚠️  Ignorées: ${skipped}`);
    console.log(`  ❌ Erreurs:  ${errors.length}`);
    if (errors.length > 0) {
        console.log('Détail des erreurs:');
        errors.forEach(e => console.log(`  - ${e.plate}: ${e.error}`));
    }
    console.log(`\nPériode: 29/07/2026 08:30 - 10:45 (WAT)`);
    console.log(`  Premier: ${new Date(allDeclarations[0].created_at).toISOString()}`);
    console.log(`  Dernier: ${new Date(allDeclarations[allDeclarations.length-1].created_at).toISOString()}`);
}

main().catch(console.error);
