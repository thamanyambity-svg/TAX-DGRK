
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceUpdateAll() {
    console.log('🚀 Forcing exchange rate 2355 on ALL database records...');

    const { data: declarations, error: fetchError } = await supabase
        .from('declarations')
        .select('*');

    if (fetchError) {
        console.error('❌ Error fetching declarations:', fetchError);
        return;
    }

    console.log(`📡 Found ${declarations?.length} records. Updating...`);

    for (const decl of declarations || []) {
        const baseRate = decl.tax?.baseRate || 0;
        const newTotalFC = Math.round(baseRate * 2355);

        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                tax: {
                    ...decl.tax,
                    totalAmountFC: newTotalFC,
                    exchangeRate: 2355
                }
            })
            .eq('id', decl.id);

        if (updateError) {
            console.error(`❌ Error updating ${decl.id}:`, updateError);
        }
    }

    console.log('✅ FORCE UPDATE COMPLETED. All records now use 2355 FC/USD.');
}

forceUpdateAll();
