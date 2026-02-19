
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const ids = ['DECL-2026-15831C14', 'DECL-2026-157BC919'];
    console.log("Cleaning specific IDs:", ids);

    for (const id of ids) {
        // 1. Clean Declaration Table
        const { data: decl } = await supabase.from('declarations').select('*').eq('id', id).single();
        if (decl) {
            const v = decl.vehicle || {};
            v.type = 'N/A';
            const { error } = await supabase.from('declarations').update({ vehicle: v }).eq('id', id);
            if (error) console.error(`Error updating decl ${id}:`, error.message);
            else console.log(`✅ Fixed declaration ${id}`);
        }

        // 2. Clean Receipt Logs
        const { data: logs } = await supabase.from('receipt_logs').select('*').eq('reference_number', id);
        if (logs) {
            for (const log of logs) {
                const cleanedFD = JSON.parse(JSON.stringify(log.full_receipt_data).replace(/Personne Physique/g, 'N/A').replace(/Personne Morale/g, 'N/A'));
                const { error } = await supabase.from('receipt_logs').update({ full_receipt_data: cleanedFD }).eq('id', log.id);
                if (error) console.error(`Error updating log ${log.id}:`, error.message);
                else console.log(`✅ Fixed log entry for ${id}`);
            }
        }
    }
}
run();
