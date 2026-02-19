
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const tables = ['payment_proofs', 'receipt_logs', 'declarations'];
    const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;

    for (const table of tables) {
        console.log(`Scanning table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error scanning ${table}:`, error.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`Table ${table} is empty.`);
            continue;
        }

        let zombies = 0;
        data.forEach(row => {
            if (forbiddenRegex.test(JSON.stringify(row))) {
                console.log(`🔴 ZOMBIE FOUND in ${table} ID: ${row.id || row.declaration_id || 'unknown'}`);
                zombies++;
            }
        });
        console.log(`Finished scanning ${table}. Total Zombies found: ${zombies}`);
    }
}
run();
