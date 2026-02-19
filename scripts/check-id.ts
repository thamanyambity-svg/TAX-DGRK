
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkId() {
    const id = 'DECL-2026-1579CC17';
    console.log(`🔎 Checking ${id}...`);

    const { data: decl } = await supabase.from('declarations').select('*').eq('id', id).single();
    if (decl) {
        console.log("Declaration Vehicle:", JSON.stringify(decl.vehicle, null, 2));
    } else {
        console.log("Declaration not found.");
    }

    const { data: logs } = await supabase.from('receipt_logs').select('*').eq('declaration_id', id);
    if (logs && logs.length > 0) {
        console.log(`Found ${logs.length} logs.`);
        logs.forEach(log => {
            console.log(`Log ${log.id} Data:`, JSON.stringify(log.full_receipt_data.vehicle, null, 2));
        });
    } else {
        console.log("No logs found for this ID.");
    }
}

checkId();
