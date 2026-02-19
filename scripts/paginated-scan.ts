
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("PAGINATED SCAN STARTING...");
    let offset = 0;
    const limit = 100;
    let totalZombies = 0;
    const broadRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;

    while (true) {
        console.log(`Fetching range ${offset} to ${offset + limit - 1}...`);
        const { data, error } = await supabase
            .from('declarations')
            .select('id, vehicle, meta, createdAt, updatedAt')
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error:", error);
            break;
        }

        if (!data || data.length === 0) break;

        data.forEach(d => {
            const str = JSON.stringify(d);
            if (broadRegex.test(str)) {
                console.log(`🔴 ZOMBIE FOUND: ${d.id} (Updated: ${d.updatedAt})`);
                totalZombies++;
            }
        });

        offset += limit;
    }

    console.log(`PAGINATED SCAN FINISHED. Total Zombies: ${totalZombies}`);
}
run();
