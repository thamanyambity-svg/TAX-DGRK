
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("FINAL FULL SCAN STARTING...");
    const { data } = await supabase.from('declarations').select('*');
    if (!data) return;

    let zombies = 0;
    data.forEach(d => {
        const s = JSON.stringify(d).toLowerCase();
        // SEARCH FOR ANY VARIATION WITHOUT "PERSONNE" PREFIX TO BE SAFE
        if (s.includes('physique') || s.includes('morale') || s.includes('physou') || s.includes('moral')) {
            console.log(`🔴 ZOMBIE FOUND in ID: ${d.id}`);
            console.log(JSON.stringify(d, null, 2));
            zombies++;
        }
    });
    console.log(`FINAL FULL SCAN FINISHED. Total Zombies: ${zombies}`);
}
run();
