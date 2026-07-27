'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';
import { mapCategoryToDisplayLabel } from '@/lib/category-display';

const BLUE = '#1a3a6b';
const BLACK = '#111111';

export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    let rawId = params?.id as string;
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segs = window.location.pathname.split('/');
            const idx = segs.indexOf('declarations');
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
        link.rel = 'stylesheet';
        link.href = '/print.css';
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
    if (!decl) return <div className="p-10 text-center text-red-600">Déclaration introuvable.</div>;

    const validYear = (decl.meta as any)?.annee_fiscale || (decl.createdAt ? new Date(decl.createdAt).getFullYear() : new Date().getFullYear());
    const yearLabel = `${validYear}`;
    const plate = decl.vehicle?.plate || '0000AB00';

    const rawCat = (decl.meta as any)?.tariffLabel
        || (decl.meta as any)?.manualMarqueType
        || decl.vehicle?.category
        || 'Vignette Automobile';
    const category = mapCategoryToDisplayLabel(rawCat);

    const rawPower = decl.vehicle?.fiscalPower || '';
    const powerDigits = rawPower.replace(/(cv|vc)/gi, '').trim();
    const powerLabel = powerDigits ? `${powerDigits} CV` : '— CV';

    const rawWeight = decl.vehicle?.weight || '';
    const weightNum = parseFloat(rawWeight);
    const weightLabel =
        rawWeight && rawWeight !== '0' && rawWeight !== 'N/A' && rawWeight !== 'n/a' && !isNaN(weightNum)
            ? `${rawWeight} T`
            : '0 T';

    const refId = (decl.meta as any)?.ndpId || (decl.meta as any)?.reference || decl.id;
    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date(`${validYear}-01-01`);
    const validTo = new Date(`${validYear}-12-31`);
    const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const verifyUrl = `https://tax-dgrk.vercel.app/verify/${decl.id}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&display=swap');
            `}</style>

            {/* ── BARRE DE CONTRÔLE (pas imprimée) ─── */}
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

            {/* ── PAGE A4 ─────────────────────────── */}
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width: '210mm', height: '297mm',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxSizing: 'border-box',
                }}>

                    {/* ── CARTE ÉTIQUETTE (Largeur 90mm x Hauteur 78mm) ─────────────────── */}
                    <div style={{
                        width: '90mm',
                        height: '78mm',
                        border: `6px solid ${BLUE}`,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #eef3f9 0%, #e2eaf5 100%)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: '2.5mm 2.5mm 1.5mm',
                        overflow: 'hidden',
                    }}>

                        {/* ── WATERMARK & FOND DE SÉCURITÉ ─────────────────────────────────── */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: 'none',
                            zIndex: 0,
                            overflow: 'hidden',
                            background: 'repeating-linear-gradient(35deg, rgba(255,255,255,0.92) 0px, rgba(255,255,255,0.92) 6px, rgba(210,225,248,0.18) 6px, rgba(210,225,248,0.18) 12px)',
                        }}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: `${-15 + i * 26}%`,
                                    left: '-30%',
                                    width: '160%',
                                    transform: 'rotate(35deg)',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    color: 'rgba(26, 58, 107, 0.025)',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    letterSpacing: '0.35em',
                                    whiteSpace: 'nowrap',
                                    textTransform: 'uppercase',
                                }}>
                                    • DGRK • DGRK • DGRK • DGRK • DGRK • DGRK • DGRK
                                </div>
                            ))}
                        </div>

                        {/* ── CONTENU ─────────────────────────────────── */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>

                            {/* ── LOGOS ─────────────────────────────────── */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4mm',
                                width: '100%',
                                marginBottom: '0.8mm',
                                flexShrink: 0,
                            }}>
                                {/* Logo DGRK */}
                                <img
                                    src="/dgrk-logo.jpg"
                                    alt="DGRK"
                                    style={{ height: '9mm', width: 'auto', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                />

                                {/* Logo IRMS */}
                                <img
                                    src="/irms-logo-new.svg"
                                    alt="IRMS DGRK"
                                    style={{ height: '11.5mm', width: 'auto', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                />
                            </div>

                            {/* ── TITRES ────────────────────────────────── */}
                            <div style={{ textAlign: 'center', lineHeight: 1.15, marginBottom: '0.8mm', flexShrink: 0 }}>
                                <div style={{
                                    fontSize: '6.5px', fontWeight: 900, color: BLUE,
                                    textTransform: 'uppercase', letterSpacing: '0.02em',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    whiteSpace: 'nowrap',
                                }}>
                                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                                </div>
                                <div style={{
                                    fontSize: '5px', fontWeight: 700, color: BLUE,
                                    textTransform: 'uppercase', letterSpacing: '0.01em',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    whiteSpace: 'nowrap',
                                }}>
                                    VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES
                                </div>
                            </div>

                            {/* ── LIGNE SÉPARATRICE ──────────────────────── */}
                            <div style={{
                                width: '96%', height: '1px',
                                background: BLUE,
                                marginBottom: '1mm',
                                flexShrink: 0,
                            }} />

                            {/* ── ZONE CENTRALE ────────────────── */}
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%',
                                flexGrow: 1,
                            }}>

                                {/* CONTENU CENTRAL */}
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                    
                                    {/* ── BADGE ANNÉE ───────────────────────────── */}
                                    <div style={{
                                        background: BLUE, color: '#fff',
                                        fontSize: '15px', fontWeight: 900,
                                        letterSpacing: '0.05em',
                                        fontFamily: 'Arial, Helvetica, sans-serif',
                                        borderRadius: '999px',
                                        padding: '0.8mm 8mm',
                                        lineHeight: 1,
                                        marginBottom: '1mm',
                                        flexShrink: 0,
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact',
                                    }}>
                                        {yearLabel}
                                    </div>

                                    {/* ── PLAQUE ────────────────────────────────── */}
                                    <div style={{
                                        width: '48mm',
                                        border: `1.8px solid ${BLACK}`,
                                        borderRadius: '4px',
                                        padding: '1.2mm 1mm',
                                        textAlign: 'center',
                                        fontSize: '20px', fontWeight: 900,
                                        fontFamily: '"Cousine", "Courier New", monospace',
                                        letterSpacing: '0.09em',
                                        textTransform: 'uppercase',
                                        color: BLACK, lineHeight: 1,
                                        background: 'white',
                                        marginBottom: '1mm',
                                        flexShrink: 0,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    }}>
                                        {plate}
                                    </div>

                                    {/* ── CATÉGORIE + PUISSANCE + POIDS ─────────── */}
                                    <div style={{ textAlign: 'center', marginBottom: '1mm', lineHeight: 1.15, flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: '8px', fontWeight: 700, color: '#111827',
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                        }}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </div>
                                        <div style={{
                                            fontSize: '7px', fontWeight: 500, color: '#334155',
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                        }}>
                                            {powerLabel} • {weightLabel}
                                        </div>
                                    </div>

                                    {/* ── QR CODE (centré) ────────────── */}
                                    <div style={{
                                        background: 'white',
                                        padding: '3px',
                                        border: '1.5px solid #cbd5e1',
                                        borderRadius: '6px',
                                        lineHeight: 0,
                                        marginBottom: '0.5mm',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    }}>
                                        <QRCode value={verifyUrl} size={64} />
                                    </div>

                                </div>

                                {/* ── HOLOGRAM ZONE (Réajustée en bas à droite) ── */}
                                <div style={{
                                    position: 'absolute',
                                    right: '1mm',
                                    bottom: '5mm',
                                    width: '13.5mm',
                                    height: '13.5mm',
                                    background: 'white',
                                    border: '1.2px dashed #94a3b8',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2,
                                }}>
                                    <span style={{
                                        fontSize: '4.5px', color: '#64748b',
                                        fontFamily: 'Arial, Helvetica, sans-serif',
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em',
                                        lineHeight: 1.1,
                                        fontWeight: 700,
                                    }}>
                                        HOLOGRAM<br />ZONE
                                    </span>
                                </div>

                                {/* ── FOOTER ── */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0mm',
                                    textAlign: 'center',
                                    fontSize: '7px', fontWeight: 800,
                                    color: '#0f172a', lineHeight: 1.25,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    zIndex: 2,
                                }}>
                                    <div>REF: {refId}</div>
                                    <div style={{ fontWeight: 700, color: '#334155' }}>Valide du {fmt(createdAt)} au {fmt(validTo)}</div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
