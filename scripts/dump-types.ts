
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("DUMPING LATEST TYPES...");
    const { data } = await supabase.from('declarations').select('*').order('updatedAt', { ascending: false }).limit(50);
    if (!data) return;

    data.forEach(d => {
        const vType = d.vehicle?.type;
        const mType = d.meta?.taxpayerData?.type;
        const tType = d.taxpayer?.type;
        console.log(`${d.id} | V:${vType} | M:${mType} | T:${tType} | UP:${d.updatedAt}`);
    });
}
run();
