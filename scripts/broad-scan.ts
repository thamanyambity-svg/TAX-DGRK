
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("BROAD SCAN STARTING...");
    const { data } = await supabase.from('declarations').select('*');
    if (!data) return;

    data.forEach(d => {
        const s = JSON.stringify(d).toUpperCase();
        // SEARCH FOR ANY VARIATION
        if (s.includes('PHYSIQUE') || s.includes('MORALE') || s.includes('MORAL') || s.includes('PHYSOU')) {
            console.log(`🔴 ZOMBIE FOUND in ID: ${d.id}`);
            console.log(JSON.stringify(d, null, 2));
        }
    });
    console.log("BROAD SCAN FINISHED.");
}
run();
