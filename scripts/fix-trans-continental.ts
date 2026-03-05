import { createClient } from '@supabase/supabase-js';

// Load directly from environment variables if not passed, but we'll use literal for reliability in script
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log("Fetching TRANS CONTINENTAL TRANSITAIRIOS declarations...");

    // Fetch all declarations first
    const { data: allDeclarations, error: fetchError } = await supabase
        .from('declarations')
        .select('*');

    if (fetchError) {
        console.error("Error fetching declarations:", fetchError);
        return;
    }

    // Filter down to the specific company
    const transDocs = allDeclarations.filter(d => {
        const name = d.meta?.taxpayerData?.name || d.taxpayer?.name || '';
        return typeof name === 'string' && name.toUpperCase().includes('TRANS CONTINENTAL');
    });

    console.log(`Found ${transDocs.length} total declarations for TRANS CONTINENTAL.`);

    let updatedCount = 0;

    for (const d of transDocs) {
        // Check if already corrected
        if (d.meta?.manualBaseAmount === 68.2) {
            console.log(`- Skipping ${d.id}: Already has correct manualBaseAmount.`);
            continue;
        }

        console.log(`- Processing ${d.id}...`);

        // Prepare updated meta
        const updatedMeta = {
            ...d.meta,
            manualBaseAmount: 68.2,
            manualMarqueType: 'utilitaire_heavy'
        };

        // Update in Supabase
        const { error: updateError } = await supabase
            .from('declarations')
            .update({ meta: updatedMeta })
            .eq('id', d.id);

        if (updateError) {
            console.error(`  ❌ Error updating ${d.id}:`, updateError);
        } else {
            console.log(`  ✅ Successfully updated ${d.id} with manualBaseAmount.`);
            updatedCount++;
        }
    }

    console.log(`\nOperation complete. Successfully updated ${updatedCount} declarations.`);
}

main().catch(console.error);
