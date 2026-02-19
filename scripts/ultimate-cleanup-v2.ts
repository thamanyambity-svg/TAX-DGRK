
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Starting CORRECTED ULTIMATE CLEANUP (Fixing lastIndex bug)...");
    const { data, error: fetchError } = await supabase.from('declarations').select('*');
    if (fetchError || !data) {
        console.error("Fetch error:", fetchError);
        return;
    }

    let count = 0;

    for (const row of rowData) {
        const str = JSON.stringify(row);
        // NO 'g' flag for test() in loop
        const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;

        if (forbiddenRegex.test(str)) {
            console.log(`ZOMBIE DETECTED in ID: ${row.id}`);

            // USE 'gi' for replace (this is fine as it's a one-shot on the string)
            const cleanedStr = str.replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, 'N/A');
            const cleanedRow = JSON.parse(cleanedStr);

            // Double force for critical fields
            if (cleanedRow.vehicle) cleanedRow.vehicle.type = 'N/A';
            if (cleanedRow.meta?.taxpayerData) cleanedRow.meta.taxpayerData.type = 'N/A';
            if (cleanedRow.taxpayer) cleanedRow.taxpayer.type = 'N/A';

            console.log(`Saving cleaned version for ${row.id}...`);
            const { error: updateError } = await supabase
                .from('declarations')
                .update(cleanedRow)
                .eq('id', row.id);

            if (updateError) {
                console.error(`Error saving ${row.id}:`, updateError);
            } else {
                count++;
            }
        }
    }

    console.log(`CORRECTED ULTIMATE CLEANUP FINISHED. Cleaned ${count} zombies.`);
}

// Fix: 'rowData' was 'data' in previous script
const rowData = [];
async function main() {
    const { data } = await supabase.from('declarations').select('*');
    if (data) {
        rowData.push(...data);
        await run();
    }
}
main();
