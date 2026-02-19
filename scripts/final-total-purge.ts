
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("FINAL TOTAL LOG PURGE...");
    const { data: logs } = await supabase.from('receipt_logs').select('*');
    if (!logs) return;

    for (const log of logs) {
        let str = JSON.stringify(log.full_receipt_data);
        if (/Personne (Physique|Morale)/gi.test(str)) {
            const cleaned = JSON.parse(str.replace(/Personne (Physique|Morale)/gi, "N/A"));
            await supabase.from('receipt_logs').update({ full_receipt_data: cleaned }).eq('id', log.id);
            console.log(`Cleaned log ${log.id}`);
        }
    }
    console.log("DONE.");
}
run();
