'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';

const BLUE = '#1a5fa8';

export default function LabelPage() {
    const params  = useParams();
    const router  = useRouter();
    const [decl, setDecl]       = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    let rawId = params?.id as string;
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segs = window.location.pathname.split('/');
            const idx  = segs.indexOf('declarations');
            if (idx !== -1 && segs[idx + 1] && segs[idx + 1] !== '[id]') rawId = segs[idx + 1];
        } catch (e) {}
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
        link.rel = 'stylesheet'; link.href = '/print.css'; link.media = 'print';
        document.head.appendChild(link);
    }, []);

    const handlePrint = () => {
        document.body.classList.add('print-root');
        const cleanup = () => { document.body.classList.remove('print-root'); window.removeEventListener('afterprint', cleanup); };
        window.addEventListener('afterprint', cleanup);
        setTimeout(() => window.print(), 300);
    };

    if (loading) return <div className="p-10 text-center font-mono text-sm">Chargement...</div>;
    if (!decl)   return <div className="p-10 text-center text-red-600">Déclaration introuvable.</div>;

    // ── DONNÉES ────────────────────────────────────────────────────────────────
    const currentYear = new Date().getFullYear();
    const yearLabel   = `${currentYear - 1}/${currentYear}`;
    const plate       = decl.vehicle?.plate || '0000AB00';
    const rawCat      = (decl.meta as any)?.tariffLabel
        || (decl.meta as any)?.manualMarqueType
        || decl.vehicle?.category || 'Vignette Automobile';
    const category    = rawCat.replace(/_/g, ' ');
    const totalFC     = decl.tax?.totalAmountFC ?? 0;
    const amountFC    = totalFC ? Math.round(totalFC).toLocaleString('fr-CD') + ' FC' : '— FC';
    const refId       = (decl.meta as any)?.ndpId || (decl.meta as any)?.reference || decl.id;
    const createdAt   = decl.createdAt ? new Date(decl.createdAt) : new Date(`${currentYear}-01-01`);
    const validTo     = new Date(`${currentYear}-12-31`);
    const fmtDate     = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const verifyUrl   = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&display=swap');
            `}</style>

            {/* Barre actions */}
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Imprimer l&apos;étiquette
                </button>
            </div>

            {/* Zone A4 centrée */}
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width: '210mm', height: '297mm', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
                }}>

                    {/*
                     * ÉTIQUETTE — ~120×120mm, bordure UNIQUE épaisse bleue arrondie
                     * Disposition fidèle à l'image de référence
                     */}
                    <div style={{
                        width:        '120mm',
                        height:       '120mm',
                        border:       `5px solid ${BLUE}`,
                        borderRadius: '7mm',
                        background:   '#ffffff',
                        boxSizing:    'border-box',
                        display:      'flex',
                        flexDirection:'column',
                        alignItems:   'center',
                        padding:      '4mm 5mm 3mm',
                        gap:          '0',
                        overflow:     'hidden',
                        position:     'relative',
                    }}>

                        {/* ── 1. LOGOS ── */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '5mm', width: '100%', marginBottom: '1.5mm',
                        }}>
                            {/* DGRK — vrai logo jpg avec blason + arc-en-ciel + texte */}
                            <img
                                src="/dgrk-logo.jpg"
                                alt="DGRK"
                                style={{ height: '15mm', width: 'auto', objectFit: 'contain' }}
                                crossOrigin="anonymous"
                            />
                            {/* IRMS — SVG exact : cercle or + IRMS gros + DGRK */}
                            <img
                                src="/irms-logo.svg"
                                alt="IRMS DGRK"
                                style={{ height: '15mm', width: 'auto', objectFit: 'contain' }}
                            />
                        </div>

                        {/* ── 2. TITRES ── */}
                        <div style={{ textAlign: 'center', marginBottom: '1mm', lineHeight: 1.3 }}>
                            <div style={{
                                fontSize: '7px', fontWeight: 800, color: BLUE,
                                textTransform: 'uppercase', letterSpacing: '0.10em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</div>
                            <div style={{
                                fontSize: '6.5px', fontWeight: 700, color: BLUE,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                            }}>VILLE DE KINSHASA – PROVINCE</div>
                        </div>

                        {/* ── 3. SÉPARATEUR ── */}
                        <div style={{ width: '92%', height: '0.8px', background: BLUE, marginBottom: '2.5mm' }} />

                        {/* ── 4. BADGE ANNÉE ── */}
                        <div style={{
                            background: BLUE, color: '#fff',
                            fontSize: '19px', fontWeight: 900, letterSpacing: '0.06em',
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            borderRadius: '999px', padding: '2mm 8mm',
                            lineHeight: 1, marginBottom: '2.5mm',
                            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                        }}>
                            {yearLabel}
                        </div>

                        {/* ── 5. PLAQUE ── */}
                        <div style={{
                            width: '90%', border: '3.5px solid #000',
                            borderRadius: '4px', padding: '3mm 2mm',
                            textAlign: 'center',
                            fontSize: '30px', fontWeight: 900,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            background: '#fff',
                            fontFamily: '"Cousine", "OCR-B", "Courier New", monospace',
                            lineHeight: 1, color: '#000', marginBottom: '2mm',
                        }}>
                            {plate}
                        </div>

                        {/* ── 6. CATÉGORIE + MONTANT ── */}
                        <div style={{ textAlign: 'center', marginBottom: '2mm', lineHeight: 1.4 }}>
                            <div style={{ fontSize: '8.5px', fontWeight: 700, color: BLUE, fontFamily: 'Arial, sans-serif' }}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 600, color: BLUE, fontFamily: 'Arial, sans-serif' }}>
                                {amountFC}
                            </div>
                        </div>

                        {/* ── 7. QR CODE + CASE EMISSION IRMS ── */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%', gap: '3mm',
                            marginBottom: '1.5mm',
                        }}>
                            {/* QR Code — plus grand */}
                            <div style={{ background: '#fff', padding: '1mm' }}>
                                <QRCode value={verifyUrl} size={90} />
                            </div>

                            {/* Case EMISSION IRMS — à droite, taille correcte */}
                            <div style={{
                                width:          '22mm',
                                height:         '22mm',
                                border:         '1.2px dashed #aaaaaa',
                                borderRadius:   '2mm',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                flexDirection:  'column',
                                textAlign:      'center',
                                color:          '#aaaaaa',
                                fontSize:       '5.5px',
                                fontWeight:     600,
                                textTransform:  'uppercase',
                                letterSpacing:  '0.05em',
                                lineHeight:     1.4,
                                fontFamily:     'Arial, sans-serif',
                                flexShrink:     0,
                            }}>
                                EMISSION<br />IRMS
                            </div>
                        </div>

                        {/* ── 8. FOOTER ── */}
                        <div style={{
                            textAlign: 'center', fontSize: '6.5px', fontWeight: 700,
                            color: BLUE, lineHeight: 1.5,
                            fontFamily: 'Arial, Helvetica, sans-serif', marginTop: 'auto',
                        }}>
                            <div>REF: {refId}</div>
                            <div>{`Valide du ${fmtDate(createdAt)} au ${fmtDate(validTo)}`}</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
