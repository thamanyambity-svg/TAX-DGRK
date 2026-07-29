import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FALLBACK_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tax-dgrk.vercel.app'}/api/router/error`;

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL(FALLBACK_URL));
    }

    try {
        // Use a transaction-like pattern: select with row-level locking
        // then update the selected row atomically
        const { data: rows, error: selectError } = await supabase
            .from('qr_router_sequences')
            .select('id, external_url')
            .eq('token', token)
            .eq('is_used', false)
            .order('queue_order', { ascending: true })
            .limit(1);

        if (selectError) {
            console.error('QR Router select error:', selectError);
            return NextResponse.redirect(new URL(FALLBACK_URL));
        }

        if (!rows || rows.length === 0) {
            return NextResponse.redirect(new URL(FALLBACK_URL));
        }

        const target = rows[0];

        // Atomically mark as used
        const { error: updateError } = await supabase
            .from('qr_router_sequences')
            .update({
                is_used: true,
                scan_date: new Date().toISOString(),
            })
            .eq('id', target.id)
            .eq('is_used', false);

        if (updateError || !target.external_url) {
            console.error('QR Router update error:', updateError);
            return NextResponse.redirect(new URL(FALLBACK_URL));
        }

        // Redirect 302 (temporary) to the external URL
        return NextResponse.redirect(new URL(target.external_url), 302);
    } catch (err) {
        console.error('QR Router unexpected error:', err);
        return NextResponse.redirect(new URL(FALLBACK_URL));
    }
}
