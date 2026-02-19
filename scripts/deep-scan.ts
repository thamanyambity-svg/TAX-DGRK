
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const afterTime = '2026-02-18T13:40:00Z'; // Check after the user message
    console.log(`Scanning for changes after ${afterTime}...`);
    const { data } = await supabase.from('declarations').select('*').gte('updatedAt', afterTime);

    if (!data || data.length === 0) {
        console.log('No recent changes found.');
    } else {
        console.log(`Evaluating ${data.length} recent records...`);
        data.forEach(d => {
            const str = JSON.stringify(d);
            const isZombie = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i.test(str);
            if (isZombie) {
                console.log(`🔴 ZOMBIE IN: ${d.id} (${d.updatedAt})`);
                console.log(str);
            } else {
                console.log(`🟢 CLEAN: ${d.id}`);
            }
        });
    }

    console.log('--- GLOBAL SCAN STARTING ---');
    const { data: all } = await supabase.from('declarations').select('id, vehicle, meta');
    let zombies = 0;
    all?.forEach(d => {
        if (/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i.test(JSON.stringify(d))) {
            console.log(`ALERT: ZOMBIE DETECTED IN OLD RECORD: ${d.id}`);
            zombies++;
        }
    });
    console.log(`Global Scan finished. Total Zombies: ${zombies}`);
}
run();
