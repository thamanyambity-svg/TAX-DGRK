
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function purgeAllZombies() {
    console.log("☣️ STARTING TOTAL PURGE...");

    // 1. Purge Declarations
    let { data: decls } = await supabase.from('declarations').select('id, vehicle, meta');
    if (decls) {
        for (const decl of decls) {
            const declStr = JSON.stringify(decl);
            if (/Personne (Physique|Morale)/gi.test(declStr)) {
                console.log(`🧹 Cleaning Declaration ${decl.id}...`);
                const cleanedDeclStr = declStr.replace(/Personne (Physique|Morale)/gi, 'N/A');
                const cleanedDecl = JSON.parse(cleanedDeclStr);
                await supabase.from('declarations').update({
                    vehicle: cleanedDecl.vehicle,
                    meta: cleanedDecl.meta
                }).eq('id', decl.id);
            }
        }
    }

    // 2. Purge Receipt Logs
    let { data: logs } = await supabase.from('receipt_logs').select('id, full_receipt_data');
    if (logs) {
        for (const log of logs) {
            const logStr = JSON.stringify(log.full_receipt_data);
            if (/Personne (Physique|Morale)/gi.test(logStr)) {
                console.log(`🧹 Cleaning Log ${log.id}...`);
                const cleanedLogData = JSON.parse(logStr.replace(/Personne (Physique|Morale)/gi, 'N/A'));
                await supabase.from('receipt_logs').update({
                    full_receipt_data: cleanedLogData
                }).eq('id', log.id);
            }
        }
    }
    console.log("✅ PURGE COMPLETE.");
}

purgeAllZombies();
