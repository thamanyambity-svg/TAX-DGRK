
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSpecificZombies() {
    const ids = ['DECL-2026-15807BED', 'DECL-2026-1587BEEF', 'DECL-2026-15887108'];

    for (const id of ids) {
        console.log(`🧹 Cleaning ${id}...`);

        // 1. Fix Declaration table
        const { data: decl, error: declError } = await supabase
            .from('declarations')
            .select('*')
            .eq('id', id)
            .single();

        if (decl) {
            const updatedVehicle = { ...decl.vehicle, genre: 'N/A', type: 'N/A' };
            await supabase.from('declarations').update({ vehicle: updatedVehicle }).eq('id', id);
            console.log(`✅ ${id} declaration cleaned.`);
        }

        // 2. Fix Receipt Logs table
        const { data: logs, error: logsError } = await supabase
            .from('receipt_logs')
            .select('*')
            .eq('declaration_id', id);

        if (logs && logs.length > 0) {
            for (const log of logs) {
                const rawData = JSON.stringify(log.full_receipt_data);
                if (rawData.includes('Personne Physique') || rawData.includes('Personne Morale')) {
                    const cleanedData = JSON.parse(rawData.replace(/Personne Physique/g, 'N/A').replace(/Personne Morale/g, 'N/A'));
                    await supabase
                        .from('receipt_logs')
                        .update({ full_receipt_data: cleanedData })
                        .eq('id', log.id);
                    console.log(`✅ Log ${log.id} for ${id} cleaned.`);
                }
            }
        }
    }
}

fixSpecificZombies();
