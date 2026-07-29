const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const TAUX_FC = 2244.76;
const DECL_BASE = 0x1579A000;

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

function parseAnnee(anneeRaw) {
    if (!anneeRaw || anneeRaw === '-') return { annee: '2026', anneeImmat: '2026' };
    const parts = String(anneeRaw).replace(/\s/g, '').split('-');
    const a1 = parts[0] || '2026';
    const a2 = parts[1] || a1;
    return { annee: a1.trim(), anneeImmat: a2.trim() };
}

function normalizeGenre(g) {
    const v = (g || '').toUpperCase().trim();
    if (/^CMN/.test(v)) return 'CAMIONNETTE';
    if (v === 'JEEP' || v === 'VOITURE' || v === 'PICK UP' || v === 'PICKUP' ||
        v === 'MINI BUS' || v === 'MINIBUS' || v === 'CAMION' || v === 'TRACTEUR')
        return v === 'PICKUP' ? 'PICK UP' : v === 'MINIBUS' ? 'MINI BUS' : v;
    return (g || '').toUpperCase().trim();
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

// ─── READ CSV ──────────────────────────────────────────────────────────
const csvRaw = fs.readFileSync(path.join(__dirname, '../public/STE SMART(Feuil1).csv'), 'utf-8');
const rows = csvRaw.split('\n').map(l => l.trim().split(';').map(c => c.trim()));

const get = (r, idx) => (r && r[idx] ? r[idx].trim() : '');

// ─── SRK (cols A-J, rows 2-5) ──────────────────────────────────────────
const srkVehicles = [];
for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const num = get(r, 0);
    if (!/^\d+$/.test(num)) break;
    const plaque = get(r, 1);
    const marque = get(r, 4);
    if (!plaque || !marque) continue;
    srkVehicles.push({
        num: parseInt(num), plaque, cv: get(r, 2), chassis: get(r, 3),
        marque, model: get(r, 5), type: get(r, 6), genre: get(r, 7),
        couleur: get(r, 8), annee: get(r, 9),
    });
}

// ─── SNS (cols A-J, after "SNS" header) ──────────────────────────────
let snsStart = -1;
for (let i = 0; i < rows.length; i++) {
    const joined = rows[i].join(' ');
    if (joined.includes('SNS IMMOBILIER')) { snsStart = i + 2; break; }
}
const snsVehicles = [];
for (let i = Math.max(0, snsStart); i < rows.length; i++) {
    const r = rows[i];
    const num = get(r, 0);
    if (!/^\d+$/.test(num)) continue;
    const plaque = get(r, 1);
    const marque = get(r, 4);
    if (!plaque || !marque) continue;
    snsVehicles.push({
        num: parseInt(num), plaque: get(r, 1), cv: get(r, 2), chassis: get(r, 3),
        marque: get(r, 4), model: get(r, 5), type: get(r, 6), genre: get(r, 7),
        couleur: get(r, 8), annee: get(r, 9),
    });
}

// ─── SMART (cols L-U, rows 2-55, stop at empty batch before PARTICULIER) ─
let smartEmptyCount = 0;
const smartVehicles = [];
for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    // Stop at PARTICULIER marker or 3 consecutive empty rows in SMART columns
    if (r.join(' ').includes('PARTICULIER')) break;
    const num = get(r, 11);
    if (!/^\d+$/.test(num)) {
        if (smartVehicles.length > 0 && !get(r, 12) && !get(r, 15)) {
            smartEmptyCount++;
            if (smartEmptyCount >= 3) break;
        }
        continue;
    }
    smartEmptyCount = 0;
    const plaque = get(r, 12);
    const marque = get(r, 15);
    if (!plaque || !marque) continue;
    smartVehicles.push({
        num: parseInt(num), plaque: get(r, 12), cv: get(r, 13), chassis: get(r, 14),
        marque: get(r, 15), model: get(r, 16), type: get(r, 17), genre: get(r, 18),
        couleur: get(r, 19), annee: get(r, 20),
    });
}

// ─── PARTICULIER (cols L-W, after PARTICULIER header) ────────────────
let partStart = -1;
for (let i = 0; i < rows.length; i++) {
    const joined = rows[i].join(' ');
    if (joined.includes('PARTICULIER')) { partStart = i + 2; break; }
}
const partVehicles = [];
// Find where PARTICULIER actually has data (with nom/nif in cols 21-22)
for (let i = Math.max(0, partStart); i < rows.length; i++) {
    const r = rows[i];
    const num = get(r, 11);
    if (!/^\d+$/.test(num)) continue;
    const plaque = get(r, 12);
    const marque = get(r, 15);
    if (!plaque || !marque) continue;
    partVehicles.push({
        num: parseInt(num), plaque: get(r, 12), cv: get(r, 13), chassis: get(r, 14),
        marque: get(r, 15), model: get(r, 16), type: get(r, 17), genre: get(r, 18),
        couleur: get(r, 19), annee: get(r, 20), nom: get(r, 21), nif: get(r, 22),
    });
}

// ─── REPORT ───────────────────────────────────────────────────────────

const groups = [
    { name: 'STE SRK SARL', nif: 'A2031784W', address: 'GOMBE', vehicles: srkVehicles },
    { name: 'STE SNS IMMOBILIER', nif: 'A1610520D', address: 'GOMBE', vehicles: snsVehicles },
    { name: 'STE SMART SARL', nif: 'A1300245G', address: 'GOMBE', vehicles: smartVehicles },
    { name: 'PARTICULIER', vehicles: partVehicles, isParticulier: true },
];

let totalGeneral = 0;
let grandTotal = 0;

for (const g of groups) {
    if (g.vehicles.length === 0) continue;
    grandTotal += g.vehicles.length;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🏢 ${g.name}`);
    if (!g.isParticulier) {
        console.log(`   NIF: ${g.nif}  |  Adresse: ${g.address}`);
    }
    console.log(`   ${'─'.repeat(50)}`);
    console.log(`   Véhicules: ${g.vehicles.length}`);
    console.log(`   ${'─'.repeat(50)}`);

    let groupTotal = 0;

    g.vehicles.forEach((v, idx) => {
        const a = parseAnnee(v.annee);
        const cat = getCategorie2026(v.genre);
        const cv = parseInt(v.cv) || 0;
        const tarif = getTarif(cat, cv);
        const fc = Math.round(tarif.total * TAUX_FC * 100) / 100;
        groupTotal += fc;
        totalGeneral += fc;

        const marqueClean = v.marque.toUpperCase().trim();
        const modelStr = v.model && v.model !== '-' ? ` / ${v.model}` : '';
        const typeStr = v.type && v.type !== '-' ? ` [${v.type}]` : '';
        const genre = normalizeGenre(v.genre);

        console.log(`\n  ${idx + 1}. ${v.plaque.padEnd(12)} ${marqueClean}${modelStr}${typeStr}`);
        console.log(`     ${genre.padEnd(14)} ${String(cv).padStart(2)} CV   Châssis: ${v.chassis}`);
        console.log(`     ${v.couleur.padEnd(14)} Fab: ${a.annee}  MEC: ${a.anneeImmat}`);
        if (g.isParticulier) {
            console.log(`     ${v.nom}  |  ${v.nif}`);
        }
        console.log(`     → ${normalizeCategorie(v.genre)} (${cat})  |  $${tarif.total.toFixed(2)} → ${fc.toLocaleString()} FC`);
    });

    console.log(`\n   ─── SOUS-TOTAL: ${groupTotal.toLocaleString()} FC ───`);
}

console.log(`\n\n${'═'.repeat(60)}`);
console.log('📊 RÉSUMÉ GÉNÉRAL');
console.log(`${'═'.repeat(60)}`);
for (const g of groups) {
    if (g.vehicles.length > 0) {
        console.log(`  ${g.name.padEnd(25)} ${String(g.vehicles.length).padStart(3)} véhicules`);
    }
}
console.log(`  ${'─'.repeat(40)}`);
console.log(`  ${'TOTAL'.padEnd(25)} ${String(grandTotal).padStart(3)} véhicules`);
console.log(`  ${'TOTAL GÉNÉRAL FC'.padEnd(25)} ${totalGeneral.toLocaleString()} FC`);

console.log(`\n${'═'.repeat(60)}`);
console.log('⚠️  PROBLÈMES DÉTECTÉS');
console.log(`${'═'.repeat(60)}`);
let issues = 0;
for (const g of groups) {
    for (const v of g.vehicles) {
        if (!v.chassis) { console.log(`  ⚠️  Châssis manquant: ${g.name} #${v.num} ${v.plaque}`); issues++; }
        if (!v.genre) { console.log(`  ⚠️  Genre manquant: ${g.name} #${v.num} ${v.plaque}`); issues++; }
        if (!v.cv || v.cv === '0' || v.cv === '') { console.log(`  ⚠️  CV manquant: ${g.name} #${v.num} ${v.plaque}`); issues++; }
        const a = parseAnnee(v.annee);
        if (a.annee.length !== 4 || a.anneeImmat.length !== 4) {
            console.log(`  ⚠️  Année suspecte: ${g.name} #${v.num} ${v.plaque} (${v.annee})`);
            issues++;
        }
    }
}
if (issues === 0) console.log('  ✅ Aucun problème détecté');

console.log(`\n${'═'.repeat(60)}`);
console.log('✅ RAPPORT TERMINÉ');
console.log('Dis-moi si c\'est bon pour lancer la création dans Supabase.');
