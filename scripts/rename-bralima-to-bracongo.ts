import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aekmxhcfdqsvlpkycpsn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
);

const OLD_NIF = 'A04965';
const NEW = {
    name: 'BRACONGO SA',
    nif: 'A04797P',
    address: 'Avenue des Brasseries, Limete',
};

async function run() {
    // Fetch all declarations for old company
    const { data, error } = await supabase
        .from('declarations')
        .select('id, meta')
        .or(`meta->>manualTaxpayer.like.%${OLD_NIF}%,meta->>taxpayerData.like.%${OLD_NIF}%`);

    if (error || !data) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Found ${data.length} declarations to rename (BRALIMA → BRACONGO)\n`);

    let success = 0;
    for (const d of data) {
        const meta = d.meta || {};
        const updatedMeta = {
            ...meta,
            manualTaxpayer: {
                ...(meta.manualTaxpayer || {}),
                name: NEW.name,
                nif: NEW.nif,
                address: NEW.address,
                type: 'PERSONNE MORALE',
            },
            taxpayerData: {
                ...(meta.taxpayerData || {}),
                name: NEW.name,
                nif: NEW.nif,
                address: NEW.address,
                type: 'PERSONNE MORALE',
            },
        };

        const { error: updateErr } = await supabase
            .from('declarations')
            .update({ meta: updatedMeta })
            .eq('id', d.id);

        if (updateErr) {
            console.error(`❌ ${d.id}: ${updateErr.message}`);
        } else {
            console.log(`✅ ${d.id}`);
            success++;
        }
    }

    console.log(`\nDone: ${success}/${data.length} updated to BRACONGO SA / ${NEW.nif}`);
}

run();
