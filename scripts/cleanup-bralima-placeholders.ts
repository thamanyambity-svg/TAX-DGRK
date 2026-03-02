
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPlaceholders() {
    const placeholders = ['0001BA01', '0002BA01', '0003BA01', '0004BA01', '0005BA01'];
    console.log(`🧹 Cleaning up placeholders: ${placeholders.join(', ')}`);

    for (const plate of placeholders) {
        // Use ->> for text extraction from JSONB
        const { error } = await supabase
            .from('declarations')
            .delete()
            .filter('vehicle->>plate', 'eq', plate);

        if (error) {
            console.error(`Failed to delete ${plate}:`, error);
        } else {
            console.log(`Deleted ${plate}`);
        }
    }
}

cleanupPlaceholders();
