
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const ids = ['DECL-2026-15831C14', 'DECL-2026-157BC919'];
    for (const id of ids) {
        console.log(`Processing ${id}...`);
        const { data: logs } = await supabase.from('receipt_logs').select('*').eq('reference_number', id);

        for (const log of logs || []) {
            let fd = log.full_receipt_data;
            // Force deep string replacement on the entire blob
            let str = JSON.stringify(fd);
            str = str.replace(/Personne Physique/gi, "N/A");
            str = str.replace(/Personne Morale/gi, "N/A");
            fd = JSON.parse(str);

            console.log(`Updating log ${log.id} for ${id}...`);
            const { error, data } = await supabase.from('receipt_logs')
                .update({ full_receipt_data: fd })
                .eq('id', log.id)
                .select();

            if (error) console.error("Error:", error);
            else console.log("Updated result type:", data?.[0]?.full_receipt_data?.vehicle?.type);
        }
    }
}
run();
