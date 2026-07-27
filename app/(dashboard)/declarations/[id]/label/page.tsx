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

                    {/* ── CARTE ÉTIQUETTE ─────────────────── */}
                    <div style={{
                        width: '132mm',
                        height: '142mm',
                        border: `10px solid ${BLUE}`,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #d6e4f7 0%, #c2d4ee 50%, #d0dff5 100%)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        padding: '6mm 6mm 5mm',
                        overflow: 'hidden',
                    }}>

                        {/* ── WATERMARK ─────────────────────────────────── */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: 'none',
                            zIndex: 0,
                            overflow: 'hidden',
                        }}>
                            {[...Array(10)].map((_, i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: `${-10 + i * 22}%`,
                                    left: '-10%',
                                    width: '130%',
                                    transform: 'rotate(-35deg)',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    color: 'rgba(26, 58, 107, 0.14)',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    letterSpacing: '0.4em',
                                    whiteSpace: 'nowrap',
                                    textTransform: 'uppercase',
                                }}>
                                    DGRK • TAX • DGRK • TAX • DGRK • TAX • DGRK • TAX • DGRK • TAX
                                </div>
                            ))}
                        </div>

                        {/* ── CONTENU ─────────────────────────────────── */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

                            {/* ── LOGOS ─────────────────────────────────── */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8mm',
                                width: '100%',
                                marginBottom: '2.5mm',
                                flexShrink: 0,
                            }}>
                                {/* Logo DGRK : arc-en-ciel + DGRK + sous-titre */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '0.5mm',
                                }}>
                                    <img
                                        src="/dgrk-logo.jpg"
                                        alt="DGRK"
                                        style={{ height: '16mm', width: 'auto', objectFit: 'contain' }}
                                        crossOrigin="anonymous"
                                    />
                                    <div style={{
                                        fontSize: '5px', color: '#555',
                                        fontFamily: 'Arial, Helvetica, sans-serif',
                                        textAlign: 'center',
                                    }}>
                                        Direction Générale des Recettes de Kinshasa
                                    </div>
                                </div>

                                {/* Logo IRMS : cercle */}
                                <img
                                    src="/irms-logo-new.svg"
                                    alt="IRMS DGRK"
                                    style={{ height: '22mm', width: 'auto', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                />
                            </div>

                            {/* ── TITRES ────────────────────────────────── */}
                            <div style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: '2.5mm', flexShrink: 0 }}>
                                <div style={{
                                    fontSize: '9.5px', fontWeight: 900, color: BLUE,
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    whiteSpace: 'nowrap',
                                }}>
                                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                                </div>
                                <div style={{
                                    fontSize: '7.5px', fontWeight: 700, color: BLUE,
                                    textTransform: 'uppercase', letterSpacing: '0.03em',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    whiteSpace: 'nowrap',
                                }}>
                                    VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES
                                </div>
                            </div>

                            {/* ── LIGNE SÉPARATRICE ──────────────────────── */}
                            <div style={{
                                width: '95%', height: '1.5px',
                                background: BLUE,
                                marginBottom: '4mm',
                                flexShrink: 0,
                            }} />

                            {/* ── BADGE ANNÉE ───────────────────────────── */}
                            <div style={{
                                background: BLUE, color: '#fff',
                                fontSize: '28px', fontWeight: 900,
                                letterSpacing: '0.06em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                borderRadius: '999px',
                                padding: '3mm 18mm',
                                lineHeight: 1,
                                marginBottom: '4mm',
                                flexShrink: 0,
                                WebkitPrintColorAdjust: 'exact',
                                printColorAdjust: 'exact',
                            }}>
                                {yearLabel}
                            </div>

                            {/* ── PLAQUE ────────────────────────────────── */}
                            <div style={{
                                width: '80mm',
                                border: `4px solid ${BLACK}`,
                                borderRadius: '8px',
                                padding: '3.5mm 2mm',
                                textAlign: 'center',
                                fontSize: '36px', fontWeight: 900,
                                fontFamily: '"Cousine", "Courier New", monospace',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: BLACK, lineHeight: 1,
                                background: 'white',
                                marginBottom: '4mm',
                                flexShrink: 0,
                            }}>
                                {plate}
                            </div>

                            {/* ── CATÉGORIE + PUISSANCE + POIDS ─────────── */}
                            <div style={{ textAlign: 'center', marginBottom: '3mm', lineHeight: 1.5, flexShrink: 0 }}>
                                {/* Catégorie : noir gras */}
                                <div style={{
                                    fontSize: '11px', fontWeight: 700, color: BLACK,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                }}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </div>
                                {/* CV • T : texte normal, couleur neutre */}
                                <div style={{
                                    fontSize: '10px', fontWeight: 400, color: '#333',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                }}>
                                    {powerLabel} • {weightLabel}
                                </div>
                            </div>

                            {/* ── QR CODE (centré) ────────────── */}
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2mm',
                                flexShrink: 0,
                                position: 'relative',
                            }}>
                                {/* QR Code centré */}
                                <div style={{
                                    background: 'white',
                                    padding: '5px',
                                    border: '2px solid #ccc',
                                    borderRadius: '8px',
                                    lineHeight: 0,
                                }}>
                                    <QRCode value={verifyUrl} size={100} />
                                </div>

                                {/* HOLOGRAM ZONE : décalé +30mm à droite en absolu */}
                                <div style={{
                                    position: 'absolute',
                                    right: '-30mm',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '22mm',
                                    height: '22mm',
                                    border: '2px dashed #aaa',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <span style={{
                                        fontSize: '7px', color: '#888',
                                        fontFamily: 'Arial, Helvetica, sans-serif',
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        lineHeight: 1.4,
                                    }}>
                                        HOLOGRAM<br />ZONE
                                    </span>
                                </div>
                            </div>

                            {/* ── FOOTER ─────────────────── */}
                            <div style={{
                                textAlign: 'center',
                                fontSize: '10px', fontWeight: 800,
                                color: BLUE, lineHeight: 1.6,
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                flexShrink: 0,
                                marginTop: '1mm',
                                background: 'rgba(255,255,255,0.6)',
                                borderRadius: '4px',
                                padding: '1.5mm 4mm',
                            }}>
                                <div>REF: {refId}</div>
                                <div>Valide du {fmt(createdAt)} au {fmt(validTo)}</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
