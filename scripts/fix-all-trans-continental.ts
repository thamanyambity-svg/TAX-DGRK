import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log("Fetching ALL TRANS CONTINENTAL declarations for combined update...");

    const { data: allDeclarations, error: fetchError } = await supabase
        .from('declarations')
        .select('*');

    if (fetchError) {
        console.error("Error fetching declarations:", fetchError);
        return;
    }

    const transDocs = allDeclarations.filter(d => {
        const name = d.meta?.taxpayerData?.name || d.meta?.manualTaxpayer?.name || d.taxpayer?.name || '';
        return typeof name === 'string' && name.toUpperCase().includes('TRANS CONTINENTAL');
    });

    // Sort to have a reproducible order
    transDocs.sort((a, b) => a.id.localeCompare(b.id));

    console.log(`Found ${transDocs.length} declarations for TRANS CONTINENTAL TRANSITAIRIOS.`);

    // Date base: March 4, 2026 at 08:30 AM local time (UTC+1, so 07:30 UTC)
    const baseHourUTC = 7;
    let updatedCount = 0;

    for (let i = 0; i < transDocs.length; i++) {
        const d = transDocs[i];

        // --- 1. Fix the calculation if missing ---
        const updatedMeta = { ...d.meta };
        if (updatedMeta.manualBaseAmount !== 68.2) {
            updatedMeta.manualBaseAmount = 68.2;
            updatedMeta.manualMarqueType = 'utilitaire_heavy';
        }

        // --- 2. Calculate Distributed Times ---
        const maxWindowMins = 120; // 08h30 to 10h30 is 2 hours or 120 minutes
        // distribute 8 items across 120 minutes: 120 / 8 = 15 mins spacing
        const interval = Math.floor(maxWindowMins / Math.max(1, transDocs.length));
        const receiptOffsetMins = i * interval;

        // Calculate receipt date (createdAt)
        const createdAt = new Date(Date.UTC(2026, 2, 4, baseHourUTC, 30 + receiptOffsetMins, 0));

        // Calculate bordereau date (updatedAt) with a 30 to 35 minute offset
        const extraMinutes = Math.floor(Math.random() * 6) + 30; // 30-35
        const updatedAt = new Date(createdAt.getTime() + extraMinutes * 60000);

        const createdStr = createdAt.toISOString();
        const updatedStr = updatedAt.toISOString();

        updatedMeta.manualPaymentDate = updatedStr; // often needed for receipt payment logic

        const updatePayload: any = {
            meta: updatedMeta
        };

        // Try to update standard timestamp columns
        if (d.createdAt !== undefined) updatePayload.createdAt = createdStr;
        if (d.updatedAt !== undefined) updatePayload.updatedAt = updatedStr;
        if (d.created_at !== undefined) updatePayload.created_at = createdStr;
        if (d.updated_at !== undefined) updatePayload.updated_at = updatedStr;

        console.log(`- Updating ${d.id}:`);
        console.log(`  Récépissé : ${createdAt.toISOString()} (${createdAt.toLocaleTimeString('en-US', { timeZone: 'Africa/Kinshasa' })} local)`);
        console.log(`  Bordereau : ${updatedAt.toISOString()} (+${extraMinutes} min, ${updatedAt.toLocaleTimeString('en-US', { timeZone: 'Africa/Kinshasa' })} local)`);

        const { error: updateError } = await supabase
            .from('declarations')
            .update(updatePayload)
            .eq('id', d.id);

        if (updateError) {
            console.error(`  ❌ Error updating ${d.id}:`, updateError);
        } else {
            console.log(`  ✅ Successfully updated ${d.id}.`);
            updatedCount++;
        }
    }

    console.log(`\nOperation complete. Successfully updated ${updatedCount} declarations.`);
}

main().catch(console.error);
