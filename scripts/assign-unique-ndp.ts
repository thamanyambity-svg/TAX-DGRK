
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hash function to generate stable Hex suffix from string
function getHashSuffix(input: string, length = 8): string {
    return crypto.createHash('md5').update(input).digest('hex').substring(0, length).toUpperCase();
}

async function assignUniqueNDP() {
    console.log('🔄 Assigning unique NDP IDs to all declarations...');

    const { data: decls, error } = await supabase.from('declarations').select('*');
    if (error) {
        console.error(error);
        return;
    }

    let updated = 0;

    for (const d of decls) {
        let ndpId = d.meta?.ndpId;

        // If no NDP ID exists, generate one based on Declaration ID
        if (!ndpId) {
            // Logic for Custom Formats
            if (d.id.startsWith('DECL-2026-KP')) {
                // FLEET KIN PLUS: KP001 -> NDP-2026-KP8001 (offset to secure)
                const suffix = d.id.split('-KP')[1];
                ndpId = `NDP-2026-KP${suffix}`;
            } else if (d.id.startsWith('DECL-2026-NEW-')) {
                // NEW ADDS: NEW-01 -> NDP-2026-NW101
                const suffix = d.id.split('-NEW-')[1]; // '01'
                ndpId = `NDP-2026-NW${suffix}`;
            } else if (d.id === 'DECL-2026-001') {
                // HARRIER INITIAL
                ndpId = 'NDP-2026-1579A471'; // Keep original logic if wanted, or hash
            } else {
                // FALLBACK: Hashed Suffix
                const suffix = getHashSuffix(d.id);
                ndpId = `NDP-2026-${suffix}`;
            }

            // Save to DB
            const newMeta = { ...d.meta, ndpId };
            await supabase
                .from('declarations')
                .update({ meta: newMeta })
                .eq('id', d.id);

            console.log(`   ✨ Assigned ${ndpId} to ${d.id}`);
            updated++;
        }
    }

    console.log(`✅ Completed. Assigned unique NDPs to ${updated} records.`);
}

assignUniqueNDP();
