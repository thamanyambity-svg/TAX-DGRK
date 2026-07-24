import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { calculer2026, Categorie2026 } from '../lib/tarif-2026';
import { mapCategoryToDisplayLabel } from '../lib/category-display';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAUX_FC = 2244.76;

async function updateExisting2026Declarations() {
    console.log('🔄 Updating all existing 2026 declarations with new Utility & Tourism tariff rules...');

    const { data: decls, error } = await supabase.from('declarations').select('*');

    if (error) {
        console.error('❌ Error fetching declarations:', error);
        return;
    }

    console.log(`📋 Found ${decls?.length || 0} declarations in database.`);

    let updatedCount = 0;

    for (const d of decls || []) {
        const catRaw = (d.vehicle?.category || d.meta?.tariffLabel || '').toLowerCase();
        const genreRaw = (d.vehicle?.genre || '').toLowerCase();
        const marqueRaw = (d.vehicle?.marque || '').toLowerCase();
        const modeleRaw = (d.vehicle?.modele || '').toLowerCase();
        const tariffLabelRaw = (d.meta?.tariffLabel || '').toLowerCase();

        // Determine 2026 category
        let cat2026: Categorie2026 | null = null;

        if (
            catRaw.includes('utilitaire') ||
            genreRaw.includes('camion') ||
            genreRaw.includes('truck') ||
            modeleRaw.includes('howo')
        ) {
            cat2026 = 'utilitaire';
        } else if (
            catRaw.includes('tourisme') ||
            catRaw.includes('vignette') ||
            genreRaw.includes('voiture') ||
            genreRaw.includes('jeep') ||
            genreRaw.includes('pick-up') ||
            modeleRaw.includes('prado') ||
            modeleRaw.includes('lexus') ||
            modeleRaw.includes('wingle')
        ) {
            cat2026 = 'tourisme';
        } else if (catRaw.includes('moto')) {
            cat2026 = 'moto';
        } else if (catRaw.includes('tracteur')) {
            cat2026 = 'tracteur';
        } else if (catRaw.includes('remorque')) {
            cat2026 = 'remorque';
        } else if (catRaw.includes('bateau') || catRaw.includes('balein')) {
            cat2026 = 'bateau';
        }

        if (!cat2026) continue;

        // Parse CV
        let cv = 0;
        if (d.vehicle?.fiscalPower) {
            const match = String(d.vehicle.fiscalPower).match(/\d+/);
            if (match) cv = parseInt(match[0], 10);
        }

        // Parse tonnage
        let tonnage = 0;
        if (d.vehicle?.weight) {
            const match = String(d.vehicle.weight).match(/(\d+(\.\d+)?)/);
            if (match) tonnage = parseFloat(match[1]);
        }

        // Calculate 2026 tariff breakdown
        const breakdown = calculer2026({
            categorie: cat2026,
            cv,
            tonnage,
            sousCategorie: d.meta?.tariffLabel
        });

        const newBaseUSD = breakdown.total;
        const newTotalFC = Math.round(newBaseUSD * TAUX_FC);
        const displayLabel = mapCategoryToDisplayLabel(breakdown.categorie);

        // Check if values changed or if manualMarqueType is missing
        const currentBase = d.tax?.baseRate;
        const currentMetaLabel = d.meta?.tariffLabel;
        const currentManualMarqueType = d.meta?.manualMarqueType;

        const needsUpdate =
            currentBase !== newBaseUSD ||
            currentMetaLabel !== breakdown.categorie ||
            currentManualMarqueType !== breakdown.categorie ||
            !d.vehicle?.manualMarqueType;

        if (needsUpdate) {
            const updatedTax = {
                ...d.tax,
                baseRate: newBaseUSD,
                currency: 'USD',
                totalAmountFC: newTotalFC,
            };

            const updatedVehicle = {
                ...d.vehicle,
                manualMarqueType: breakdown.categorie,
            };

            const updatedMeta = {
                ...d.meta,
                tariffMode: 'new2026',
                tariffLabel: breakdown.categorie,
                manualMarqueType: breakdown.categorie,
                manualBaseAmount: newBaseUSD,
            };

            const { error: updateErr } = await supabase
                .from('declarations')
                .update({
                    tax: updatedTax,
                    vehicle: updatedVehicle,
                    meta: updatedMeta,
                })
                .eq('id', d.id);

            if (updateErr) {
                console.error(`❌ Failed to update declaration ${d.id}:`, updateErr);
            } else {
                console.log(`   ✅ ${d.id}: Set manualMarqueType -> ${breakdown.categorie} (${newBaseUSD} USD)`);
                updatedCount++;
            }
        }
    }

    console.log(`🎉 Finished! Successfully updated ${updatedCount} declarations in the database.`);
}

updateExisting2026Declarations();
