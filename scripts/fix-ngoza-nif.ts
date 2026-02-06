
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixNgozaData() {
    console.log('🔧 Fixing Ngoza Ramazani Declaration...');

    const targetId = 'DECL-2026-NEW-06';

    // 1. Fetch current meta
    const { data: current, error: fetchError } = await supabase
        .from('declarations')
        .select('meta')
        .eq('id', targetId)
        .single();

    if (fetchError) {
        console.error('❌ Error finding record:', fetchError);
        return;
    }

    if (!current) {
        console.warn('⚠️ Record not found.');
        return;
    }

    // 2. Update Taxpayer NIF via Meta
    // Cloning object to avoid mutation issues
    const newMeta = JSON.parse(JSON.stringify(current.meta));
    if (newMeta.manualTaxpayer) {
        newMeta.manualTaxpayer.nif = 'A2410992K'; // Realistic generated NIF
        console.log(`   -> Updating NIF to: ${newMeta.manualTaxpayer.nif}`);
    }

    // 3. Push Update
    const { error: updateError } = await supabase
        .from('declarations')
        .update({ meta: newMeta })
        .eq('id', targetId);

    if (updateError) {
        console.error('❌ Update failed:', updateError);
    } else {
        console.log('✅ NGOZA RAMAZANI NIF corrected successfully.');
    }
}

fixNgozaData();
