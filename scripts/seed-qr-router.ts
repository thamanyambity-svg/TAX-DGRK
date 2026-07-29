// Script de seed pour initialiser une séquence QR routeur
// Usage: npx ts-node scripts/seed-qr-router.ts
//
// Ou exécutez directement dans Supabase SQL Editor :
//   INSERT INTO qr_router_sequences (token, queue_order, external_url) VALUES
//   ('VIGNETTE2026A', 1, 'https://irms-dgrk.com/verify/NDP-2026-A519D5D4'),
//   ('VIGNETTE2026A', 2, 'https://irms-dgrk.com/verify/NDP-2026-B72E1F3C'),
//   ('VIGNETTE2026A', 3, 'https://irms-dgrk.com/verify/NDP-2026-C83B2A1D');

import { supabase } from '../lib/supabase';

const TOKEN = 'VIGNETTE2026A';
const URLS = [
    'https://irms-dgrk.com/verify/NDP-2026-A519D5D4',
    'https://irms-dgrk.com/verify/NDP-2026-B72E1F3C',
    'https://irms-dgrk.com/verify/NDP-2026-C83B2A1D',
];

async function seed() {
    const rows = URLS.map((url, i) => ({
        token: TOKEN,
        queue_order: i + 1,
        external_url: url,
        is_used: false,
    }));

    const { data, error } = await supabase.from('qr_router_sequences').insert(rows).select();

    if (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }

    console.log(`✅ Seed completed: ${data.length} rows inserted for token "${TOKEN}"`);
    console.log(`📱 QR URL: https://tax-dgrk.vercel.app/api/router?token=${TOKEN}`);
}

seed();
