'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';

const BLUE  = '#2472b6';
const BLACK = '#111111';

export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const [decl, setDecl]       = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    /* ── ID recovery ─────────────────────────────────────────────────── */
    let rawId = params?.id as string;
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segs = window.location.pathname.split('/');
            const idx  = segs.indexOf('declarations');
            if (idx !== -1 && segs[idx + 1] && segs[idx + 1] !== '[id]') rawId = segs[idx + 1];
        } catch (_) {}
    }
    const id = rawId && rawId !== 'undefined' ? decodeURIComponent(rawId).trim() : '';

    useEffect(() => {
        if (!id) return;
        import('@/lib/store').then(({ getDeclarationById }) =>
            getDeclarationById(id).then(d => { if (d) setDecl(d); setLoading(false); })
        );
    }, [id]);

    useEffect(() => {
        const link = document.createElement('link');
        link.rel   = 'stylesheet';
        link.href  = '/print.css';
        link.media = 'print';
        document.head.appendChild(link);
    }, []);

    const handlePrint = () => {
        document.body.classList.add('print-root');
        const cleanup = () => {
            document.body.classList.remove('print-root');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(() => window.print(), 300);
    };

    if (loading) return <div className="p-10 text-center font-mono text-sm">Chargement…</div>;
    if (!decl)   return <div className="p-10 text-center text-red-600">Déclaration introuvable.</div>;

    /* ── DONNÉES ─────────────────────────────────────────────────────── */
    const year      = new Date().getFullYear();
    const yearLabel = `${year - 1}/${year}`;
    const plate     = decl.vehicle?.plate || '0000AB00';

    // Catégorie — supprimer les parenthèses ex: "(11–15 CV)", "(basé sur...)"
    const rawCat  = (decl.meta as any)?.tariffLabel
        || (decl.meta as any)?.manualMarqueType
        || decl.vehicle?.category
        || 'Vignette Automobile';
    const category = rawCat
        .replace(/_/g, ' ')
        .replace(/\s*\(.*?\)\s*/g, ' ')   // supprime tout ce qui est entre parenthèses
        .trim();

    // Puissance fiscale — ex: "11 CV" → "11 CV" ; si vide → "— CV"
    const rawPower    = decl.vehicle?.fiscalPower || '';
    const powerDigits = rawPower.replace(/(cv|vc)/gi, '').trim();
    const powerLabel  = powerDigits ? `${powerDigits} CV` : '— CV';

    // Poids — si non renseigné ou "0" / "N/A" → "0 T"
    const rawWeight  = decl.vehicle?.weight || '';
    const weightNum  = parseFloat(rawWeight);
    const weightLabel =
        rawWeight && rawWeight !== '0' && rawWeight !== 'N/A' && rawWeight !== 'n/a' && !isNaN(weightNum)
            ? `${rawWeight} T`
            : '0 T';

    const refId     = (decl.meta as any)?.ndpId || (decl.meta as any)?.reference || decl.id;
    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date(`${year}-01-01`);
    const validTo   = new Date(`${year}-12-31`);
    const fmt       = (d: Date) =>
        `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&display=swap');
            `}</style>

            {/* ── Action bar ──────────────────────────────────────────── */}
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                    <Printer className="h-4 w-4" /> Imprimer l&apos;étiquette
                </button>
            </div>

            {/* ── Feuille A4 ──────────────────────────────────────────── */}
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width: '210mm', height: '297mm',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxSizing: 'border-box',
                }}>

                    {/*
                     * ═══════════════════════════════════════════════════
                     *  ÉTIQUETTE — UNE SEULE BORDURE épaisse + arrondie
                     * ═══════════════════════════════════════════════════
                     */}
                    <div style={{
                        width:        '124mm',
                        height:       '124mm',
                        border:       `6px solid ${BLUE}`,   /* épaisse, unique */
                        borderRadius: '12mm',
                        background:   'white',
                        position:     'relative',
                        display:      'flex',
                        flexDirection:'column',
                        alignItems:   'center',
                        boxSizing:    'border-box',
                        padding:      '5mm 6mm 10mm',
                        overflow:     'hidden',
                    }}>

                        {/* ── LOGOS ─────────────────────────────────── */}
                        <div style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            gap:            '5mm',
                            width:          '100%',
                            marginBottom:   '1.5mm',
                            flexShrink:     0,
                        }}>
                            {/* DGRK */}
                            <img
                                src="/dgrk-logo.jpg"
                                alt="DGRK"
                                style={{ height: '16mm', width: 'auto', objectFit: 'contain' }}
                                crossOrigin="anonymous"
                            />
                            {/* IRMS — cercle jaune ouvert + IRMS DGRK */}
                            <img
                                src="/irms-logo-open.png"
                                alt="IRMS DGRK"
                                style={{ height: '16mm', width: 'auto', objectFit: 'contain' }}
                                crossOrigin="anonymous"
                            />
                        </div>

                        {/* ── TITRES ────────────────────────────────── */}
                        <div style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: '1.5mm', flexShrink: 0 }}>
                            <div style={{
                                fontSize: '7.5px', fontWeight: 800, color: BLUE,
                                textTransform: 'uppercase', letterSpacing: '0.09em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>
                                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                            </div>
                            <div style={{
                                fontSize: '6.8px', fontWeight: 700, color: BLUE,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>
                                VILLE DE KINSHASA – PROVINCE
                            </div>
                        </div>

                        {/* ── SÉPARATEUR ────────────────────────────── */}
                        <div style={{
                            width: '90%', height: '0.8px',
                            background: BLUE, marginBottom: '3mm', flexShrink: 0,
                        }} />

                        {/* ── BADGE ANNÉE ───────────────────────────── */}
                        <div style={{
                            background: BLUE, color: '#fff',
                            fontSize: '22px', fontWeight: 900,
                            letterSpacing: '0.05em',
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            borderRadius: '999px',
                            padding: '2.5mm 10mm',
                            lineHeight: 1, marginBottom: '3mm', flexShrink: 0,
                            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                        }}>
                            {yearLabel}
                        </div>

                        {/* ── PLAQUE ────────────────────────────────── */}
                        <div style={{
                            width: '88%',
                            border: `3.5px solid ${BLACK}`,
                            borderRadius: '5px',
                            padding: '3mm 2mm',
                            textAlign: 'center',
                            fontSize: '30px', fontWeight: 900,
                            fontFamily: '"Cousine", "Courier New", monospace',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: BLACK, lineHeight: 1,
                            background: 'white',
                            marginBottom: '2mm', flexShrink: 0,
                        }}>
                            {plate}
                        </div>

                        {/* ── CATÉGORIE + PUISSANCE + POIDS ─────────── */}
                        <div style={{ textAlign: 'center', marginBottom: '2mm', lineHeight: 1.4, flexShrink: 0 }}>
                            {/* Catégorie sans parenthèses */}
                            <div style={{
                                fontSize: '8.5px', fontWeight: 600, color: '#222',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </div>
                            {/* Puissance fiscale + poids (remplace le montant FC) */}
                            <div style={{
                                fontSize: '8.5px', fontWeight: 700, color: BLUE,
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>
                                {powerLabel} &nbsp;•&nbsp; {weightLabel}
                            </div>
                        </div>

                        {/* ── QR CODE — centré, grand ───────────────── */}
                        <div style={{
                            display: 'flex', justifyContent: 'center',
                            alignItems: 'center', width: '100%', flexShrink: 0,
                        }}>
                            <QRCode value={verifyUrl} size={108} />
                        </div>

                        {/* ── CASE EMISSION IRMS — absolue, bas-droit ─ */}
                        <div style={{
                            position: 'absolute',
                            right: '5mm', bottom: '14mm',
                            width: '18mm', height: '18mm',
                            border: '1px dashed #c0c0c0',
                            borderRadius: '2mm',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexDirection: 'column',
                            textAlign: 'center',
                            color: '#c0c0c0',
                            fontSize: '5.5px', fontWeight: 500,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            lineHeight: 1.5,
                            fontFamily: 'Arial, sans-serif',
                        }}>
                            EMISSION<br />IRMS
                        </div>

                        {/* ── FOOTER — absolue, bas-centre ─────────── */}
                        <div style={{
                            position: 'absolute',
                            bottom: '4mm', left: 0, right: 0,
                            textAlign: 'center',
                            fontSize: '7px', fontWeight: 700,
                            color: BLUE, lineHeight: 1.55,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                        }}>
                            <div>REF: {refId}</div>
                            <div>Valide du {fmt(createdAt)} au {fmt(validTo)}</div>
                        </div>

                    </div>{/* fin étiquette */}
                </div>
            </div>
        </div>
    );
}
