
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const ids = ['DECL-2026-15831C14', 'DECL-2026-157BC919'];
    for (const id of ids) {
        const { data: logs } = await supabase.from('receipt_logs').select('*').eq('reference_number', id);
        if (logs) {
            for (const log of logs) {
                const fd = log.full_receipt_data;
                if (fd && fd.vehicle) {
                    fd.vehicle.type = 'N/A';
                }
                const { error } = await supabase.from('receipt_logs').update({ full_receipt_data: fd }).eq('id', log.id);
                if (error) console.error(`Error ${log.id}:`, error.message);
                else console.log(`✅ Fixed log ${log.id} for ${id}`);
            }
        }
    }
}
run();
