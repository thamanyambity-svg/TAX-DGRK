'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';

// ── COULEURS EXACTES DE LA RÉFÉRENCE ──────────────────────────────────────────
const BLUE = '#2472b6';   // Bleu bordure + textes
const BLACK = '#111111';  // Noir plaque

export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const [decl, setDecl]       = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    /* ── Récupération ID ─────────────────────────────────────────────────── */
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
        const link  = document.createElement('link');
        link.rel    = 'stylesheet';
        link.href   = '/print.css';
        link.media  = 'print';
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

    /* ── DONNÉES ─────────────────────────────────────────────────────────── */
    const year      = new Date().getFullYear();
    const yearLabel = `${year - 1}/${year}`;
    const plate     = decl.vehicle?.plate || '0000AB00';
    const rawCat    = (decl.meta as any)?.tariffLabel
        || (decl.meta as any)?.manualMarqueType
        || decl.vehicle?.category
        || 'Vignette Automobile';
    const category  = rawCat.replace(/_/g, ' ');
    const totalFC   = decl.tax?.totalAmountFC ?? 0;
    const amountFC  = totalFC ? Math.round(totalFC).toLocaleString('fr-CD') + ' FC' : '— FC';
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

            {/* ── Barre d'actions ─────────────────────────────────────────── */}
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

            {/* ── Zone A4 centrée ─────────────────────────────────────────── */}
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width:          '210mm',
                    height:         '297mm',
                    background:     '#fff',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    boxSizing:      'border-box',
                }}>

                    {/*
                     * ══════════════════════════════════════════════════════
                     * ÉTIQUETTE — reproduction exacte de la référence
                     *
                     * Structure (de l'extérieur vers l'intérieur) :
                     * 1. Fine bordure rectangulaire bleue  (trait de coupe)
                     * 2. Marges blanc 3.5mm
                     * 3. Bordure épaisse bleue arrondie (carte principale)
                     * ══════════════════════════════════════════════════════
                     */}

                    {/* ── 1. TRAIT DE COUPE EXTERNE (fin, rectangulaire) ── */}
                    <div style={{
                        border:       `1.5px solid ${BLUE}`,
                        borderRadius: '3mm',
                        padding:      '3.5mm',
                        background:   'white',
                        lineHeight:   0,
                    }}>

                        {/* ── 2. CARTE PRINCIPALE (bordure épaisse arrondie) ── */}
                        <div style={{
                            width:        '116mm',
                            height:       '116mm',
                            border:       `5px solid ${BLUE}`,
                            borderRadius: '11mm',
                            background:   'white',
                            position:     'relative',
                            display:      'flex',
                            flexDirection:'column',
                            alignItems:   'center',
                            boxSizing:    'border-box',
                            padding:      '5mm 6mm 10mm',
                            overflow:     'hidden',
                        }}>

                            {/* ── LOGOS ── */}
                            <div style={{
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                gap:            '5mm',
                                width:          '100%',
                                marginBottom:   '1.5mm',
                                flexShrink:     0,
                            }}>
                                {/* DGRK : blason + arc-en-ciel + "DGRK" */}
                                <img
                                    src="/dgrk-logo.jpg"
                                    alt="DGRK"
                                    style={{ height: '15mm', width: 'auto', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                />
                                {/* IRMS : cercle jaune ouvert + "IRMS DGRK" */}
                                <img
                                    src="/irms-logo-open.png"
                                    alt="IRMS"
                                    style={{ height: '15mm', width: 'auto', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                />
                            </div>

                            {/* ── TITRES ── */}
                            <div style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: '1.5mm', flexShrink: 0 }}>
                                <div style={{
                                    fontSize:      '7.5px',
                                    fontWeight:    800,
                                    color:         BLUE,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.09em',
                                    fontFamily:    'Arial, Helvetica, sans-serif',
                                }}>
                                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                                </div>
                                <div style={{
                                    fontSize:      '6.8px',
                                    fontWeight:    700,
                                    color:         BLUE,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.07em',
                                    fontFamily:    'Arial, Helvetica, sans-serif',
                                }}>
                                    VILLE DE KINSHASA – PROVINCE
                                </div>
                            </div>

                            {/* ── SÉPARATEUR ── */}
                            <div style={{
                                width:         '90%',
                                height:        '0.8px',
                                background:    BLUE,
                                marginBottom:  '3mm',
                                flexShrink:    0,
                            }} />

                            {/* ── BADGE ANNÉE ── */}
                            <div style={{
                                background:             BLUE,
                                color:                  '#ffffff',
                                fontSize:               '22px',
                                fontWeight:             900,
                                letterSpacing:          '0.05em',
                                fontFamily:             'Arial, Helvetica, sans-serif',
                                borderRadius:           '999px',
                                padding:                '2.5mm 10mm',
                                lineHeight:             1,
                                marginBottom:           '3mm',
                                flexShrink:             0,
                                WebkitPrintColorAdjust: 'exact',
                                printColorAdjust:       'exact',
                            }}>
                                {yearLabel}
                            </div>

                            {/* ── PLAQUE ── */}
                            <div style={{
                                width:         '88%',
                                border:        `3.5px solid ${BLACK}`,
                                borderRadius:  '5px',
                                padding:       '3mm 2mm',
                                textAlign:     'center',
                                fontSize:      '30px',
                                fontWeight:    900,
                                fontFamily:    '"Cousine", "Courier New", monospace',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color:         BLACK,
                                lineHeight:    1,
                                background:    'white',
                                marginBottom:  '2mm',
                                flexShrink:    0,
                            }}>
                                {plate}
                            </div>

                            {/* ── CATÉGORIE + MONTANT ── */}
                            <div style={{ textAlign: 'center', marginBottom: '2mm', lineHeight: 1.4, flexShrink: 0 }}>
                                <div style={{
                                    fontSize:   '8.5px',
                                    fontWeight: 600,
                                    color:      '#222',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                }}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </div>
                                <div style={{
                                    fontSize:   '8.5px',
                                    fontWeight: 700,
                                    color:      BLUE,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                }}>
                                    {amountFC}
                                </div>
                            </div>

                            {/* ── QR CODE — centré, grand ── */}
                            <div style={{
                                display:        'flex',
                                justifyContent: 'center',
                                alignItems:     'center',
                                width:          '100%',
                                flexShrink:     0,
                            }}>
                                <QRCode value={verifyUrl} size={100} />
                            </div>

                            {/* ── CASE "EMISSION IRMS" — absolue, bas-droit ── */}
                            <div style={{
                                position:       'absolute',
                                right:          '5mm',
                                bottom:         '14mm',
                                width:          '18mm',
                                height:         '18mm',
                                border:         '1px dashed #c0c0c0',
                                borderRadius:   '2mm',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                flexDirection:  'column',
                                textAlign:      'center',
                                color:          '#c0c0c0',
                                fontSize:       '5.5px',
                                fontWeight:     500,
                                textTransform:  'uppercase',
                                letterSpacing:  '0.06em',
                                lineHeight:     1.5,
                                fontFamily:     'Arial, sans-serif',
                            }}>
                                EMISSION<br />IRMS
                            </div>

                            {/* ── FOOTER — absolue, bas-centre ── */}
                            <div style={{
                                position:   'absolute',
                                bottom:     '4mm',
                                left:       0,
                                right:      0,
                                textAlign:  'center',
                                fontSize:   '7px',
                                fontWeight: 700,
                                color:      BLUE,
                                lineHeight: 1.55,
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>
                                <div>REF: {refId}</div>
                                <div>Valide du {fmt(createdAt)} au {fmt(validTo)}</div>
                            </div>

                        </div>{/* fin carte principale */}
                    </div>{/* fin trait de coupe */}

                </div>
            </div>
        </div>
    );
}
