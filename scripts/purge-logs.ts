
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

// Recursive cleaner
function deepClean(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;
            if (forbiddenRegex.test(obj)) return 'N/A';
        }
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(deepClean);
    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cleaned[key] = deepClean(obj[key]);
        }
    }
    return cleaned;
}

async function run() {
    console.log("☣️  LOG PURGE INITIATED: Cleaning receipt_logs...");

    // Fetch all logs
    const { data: logs, error } = await supabase.from('receipt_logs').select('*');
    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    console.log(`Analyzing ${logs.length} log entries...`);
    let cleanedCount = 0;
    const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i;

    for (const log of logs) {
        const logStr = JSON.stringify(log);
        if (forbiddenRegex.test(logStr)) {
            // Clean the JSON data
            const cleanedData = deepClean(log.full_receipt_data);

            // Re-check if any string inside log itself needs cleaning (though it's usually just full_receipt_data)
            const { error: updateError } = await supabase
                .from('receipt_logs')
                .update({ full_receipt_data: cleanedData })
                .eq('id', log.id);

            if (updateError) {
                console.error(`Failed to clean log ${log.id}:`, updateError.message);
            } else {
                cleanedCount++;
            }
        }
    }

    console.log(`✅ Log Purge Finished. Cleaned ${cleanedCount} entries.`);
}
run();
