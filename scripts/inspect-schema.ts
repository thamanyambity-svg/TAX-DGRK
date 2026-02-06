
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspectSchema() {
    const { data, error } = await supabase.from('declarations').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Full Record:', JSON.stringify(data?.[0], null, 2));
}

inspectSchema();
