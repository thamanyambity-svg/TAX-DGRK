
import { createClient } from '@supabase/supabase-js';
import { generateValidDate } from '../lib/business-calendar';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixExistingDates() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('🔍 Fetching all declarations to fix dates...');
    const { data: declarations, error } = await supabase.from('declarations').select('id');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`🚀 Fixing ${declarations.length} records...`);

    let count = 0;
    for (const decl of declarations) {
        // Deterministic seed based on existing ID to stay stable
        const seedValue = parseInt(decl.id.replace(/\D/g, '') || '0') || count;
        const validDate = generateValidDate(seedValue).toISOString();

        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                createdAt: validDate,
                updatedAt: validDate
            })
            .eq('id', decl.id);

        if (updateError) {
            console.error(`❌ Error updating ${decl.id}:`, updateError);
        } else {
            count++;
        }
    }

    console.log(`✅ Finished! ${count} records updated to valid business hours.`);
}

fixExistingDates();
