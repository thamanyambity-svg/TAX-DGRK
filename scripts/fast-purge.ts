
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fastPurge() {
    console.log("⚡ PURGE ÉCLAIR DES LOGS...");
    const { data: logs } = await supabase.from('receipt_logs').select('id, full_receipt_data');
    if (!logs) return;

    const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;
    const updates = logs.filter(l => forbiddenRegex.test(JSON.stringify(l.full_receipt_data)))
        .map(l => {
            const cleaned = JSON.parse(JSON.stringify(l.full_receipt_data).replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, 'N/A'));
            return supabase.from('receipt_logs').update({ full_receipt_data: cleaned }).eq('id', l.id);
        });

    if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`✅ ${updates.length} logs d'audit nettoyés.`);
    } else {
        console.log("🟢 Aucun zombie dans les logs.");
    }
}
fastPurge();
