'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';

// ─── CONSTANTES DE COULEUR (comme sur l'image de référence) ──────────────────
const BLUE_MAIN  = '#1a5fa8';   // Bleu contour et textes
const BLUE_PILL  = '#1a5fa8';   // Bleu du badge année
const IRMS_GOLD  = '#f0b800';   // Or du cercle IRMS

// ─── COMPOSANT LOGO IRMS (SVG inline, fidèle à l'image) ─────────────────────
const IrmsLogo = ({ size = 60 }: { size?: number }) => (
    <svg viewBox="0 0 220 160" width={size * 1.4} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* Cercle ouvert en bas gauche */}
        <path
            d="M 170,80 A 68,68 0 1,0 120,145"
            fill="none"
            stroke={IRMS_GOLD}
            strokeWidth="11"
            strokeLinecap="round"
        />
        {/* IRMS */}
        <text
            x="108" y="98"
            textAnchor="middle"
            fontFamily="'Arial Black', Arial, sans-serif"
            fontWeight="900"
            fontSize="58"
            fill="#1a1a3a"
        >IRMS</text>
        {/* i-bank */}
        <text
            x="108" y="124"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="400"
            fontSize="19"
            fill="#666666"
        >i-bank</text>
    </svg>
);

// ─── COMPOSANT PRINCIPAL ÉTIQUETTE ───────────────────────────────────────────
const LabelView = ({ decl }: { decl: Declaration }) => {
    const currentYear = new Date().getFullYear();
    const yearLabel   = `${currentYear - 1}/${currentYear}`;     // ex: 2025/2026

    const plate       = decl.vehicle?.plate || '0000AB00';
    const rawCategory = (decl.meta as any)?.tariffLabel
        || (decl.meta as any)?.manualMarqueType
        || decl.vehicle?.category
        || 'Vignette Automobile';
    const category    = rawCategory.replace(/_/g, ' ');

    // Montant FC
    const totalFC     = decl.tax?.totalAmountFC ?? 0;
    const amountFC    = totalFC
        ? Math.round(totalFC).toLocaleString('fr-CD') + ' FC'
        : '— FC';

    const refId     = (decl.meta as any)?.ndpId || (decl.meta as any)?.reference || decl.id;
    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date(`${currentYear}-01-01`);
    const validTo   = new Date(`${currentYear}-12-31`);
    const fmtDate   = (d: Date) =>
        `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    return (
        /*
         * Format carte : ~105 × 105 mm (carré, comme la vignette de référence)
         * Double bordure bleue : extérieure fine + intérieure épaisse
         */
        <div style={{
            width:           '110mm',
            height:          '110mm',
            background:      '#ffffff',
            boxSizing:       'border-box',
            position:        'relative',
            // Bordure externe fine bleue (simulée par outline)
            border:          `1.5px solid ${BLUE_MAIN}`,
            borderRadius:    '6mm',
            padding:         '2.5mm',
        }}>
            {/* ── BORDURE INTERNE ÉPAISSE ── */}
            <div style={{
                width:           '100%',
                height:          '100%',
                border:          `3.5px solid ${BLUE_MAIN}`,
                borderRadius:    '4.5mm',
                background:      '#ffffff',
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                boxSizing:       'border-box',
                padding:         '3mm 4mm 2.5mm',
                position:        'relative',
                overflow:        'hidden',
                gap:             '0',
            }}>

                {/* ── LIGNE 1 : LOGOS ── */}
                <div style={{
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    gap:             '3mm',
                    width:           '100%',
                    marginBottom:    '1mm',
                }}>
                    {/* Logo DGRK (export.svg = logo complet avec blason + arc-en-ciel) */}
                    <img
                        src="/dgrk-logo-full.svg"
                        alt="DGRK"
                        style={{ height: '14mm', width: 'auto', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                    />
                    {/* Logo IRMS */}
                    <IrmsLogo size={42} />
                </div>

                {/* ── LIGNE 2 : TITRES ── */}
                <div style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: '1mm' }}>
                    <div style={{
                        fontSize:       '6.8px',
                        fontWeight:     800,
                        color:          BLUE_MAIN,
                        textTransform:  'uppercase',
                        letterSpacing:  '0.10em',
                        fontFamily:     'Arial, Helvetica, sans-serif',
                    }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div style={{
                        fontSize:       '6px',
                        fontWeight:     700,
                        color:          BLUE_MAIN,
                        textTransform:  'uppercase',
                        letterSpacing:  '0.06em',
                        fontFamily:     'Arial, Helvetica, sans-serif',
                    }}>
                        VILLE DE KINSHASA – PROVINCE
                    </div>
                </div>

                {/* ── SÉPARATEUR BLEU ── */}
                <div style={{
                    width:      '90%',
                    height:     '0.7px',
                    background: BLUE_MAIN,
                    marginBottom: '2mm',
                }} />

                {/* ── BADGE ANNÉE ── */}
                <div style={{
                    background:     BLUE_PILL,
                    color:          '#ffffff',
                    fontSize:       '17px',
                    fontWeight:     900,
                    letterSpacing:  '0.08em',
                    fontFamily:     'Arial, Helvetica, sans-serif',
                    borderRadius:   '999px',
                    padding:        '2mm 7mm',
                    lineHeight:     1,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust:       'exact',
                    marginBottom:   '2mm',
                }}>
                    {yearLabel}
                </div>

                {/* ── PLAQUE D'IMMATRICULATION ── */}
                <div style={{
                    width:           '86%',
                    border:          '3px solid #000000',
                    borderRadius:    '4px',
                    padding:         '2.5mm 2mm',
                    textAlign:       'center',
                    fontSize:        '28px',
                    fontWeight:      900,
                    letterSpacing:   '0.12em',
                    textTransform:   'uppercase',
                    background:      '#ffffff',
                    fontFamily:      '"Cousine", "OCR-B", "Courier New", monospace',
                    lineHeight:      1,
                    color:           '#000000',
                    marginBottom:    '1.5mm',
                }}>
                    {plate}
                </div>

                {/* ── CATÉGORIE + MONTANT FC ── */}
                <div style={{ textAlign: 'center', marginBottom: '1.5mm', lineHeight: 1.35 }}>
                    <div style={{
                        fontSize:   '8px',
                        fontWeight: 700,
                        color:      BLUE_MAIN,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    <div style={{
                        fontSize:   '8px',
                        fontWeight: 600,
                        color:      BLUE_MAIN,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    }}>
                        {amountFC}
                    </div>
                </div>

                {/* ── ZONE QR CODE + CACHET EMISSION IRMS ── */}
                <div style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          '100%',
                    position:       'relative',
                    marginBottom:   '1mm',
                }}>
                    {/* QR Code centré */}
                    <div style={{ padding: '1.5mm', background: '#fff' }}>
                        <QRCode value={verifyUrl} size={64} />
                    </div>

                    {/* Case "EMISSION IRMS" — en haut à droite dans cette zone */}
                    <div style={{
                        position:       'absolute',
                        right:          '0mm',
                        top:            '0mm',
                        width:          '14mm',
                        height:         '13mm',
                        border:         '1px dashed #b0b0b0',
                        borderRadius:   '1.5mm',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        textAlign:      'center',
                        color:          '#b0b0b0',
                        fontSize:       '5px',
                        fontWeight:     600,
                        textTransform:  'uppercase',
                        letterSpacing:  '0.04em',
                        lineHeight:     1.3,
                        fontFamily:     'Arial, Helvetica, sans-serif',
                    }}>
                        EMISSION<br />IRMS
                    </div>
                </div>

                {/* ── FOOTER : REF + DATES ── */}
                <div style={{
                    textAlign:  'center',
                    fontSize:   '6px',
                    fontWeight: 700,
                    color:      BLUE_MAIN,
                    lineHeight: 1.5,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    marginTop:  'auto',
                }}>
                    <div>REF: {refId}</div>
                    <div>{`Valide du ${fmtDate(createdAt)} au ${fmtDate(validTo)}`}</div>
                </div>

            </div>
        </div>
    );
};

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────
export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const [decl, setDecl]       = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    let rawId = params?.id as string;
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx      = segments.indexOf('declarations');
            if (idx !== -1 && segments[idx + 1]) {
                const recovered = segments[idx + 1];
                if (recovered && recovered !== '[id]') rawId = recovered;
            }
        } catch (e) {}
    }
    const id = rawId && rawId !== 'undefined' ? decodeURIComponent(rawId).trim() : '';

    useEffect(() => {
        if (!id) return;
        import('@/lib/store').then(({ getDeclarationById }) => {
            getDeclarationById(id).then(d => {
                if (d) setDecl(d);
                setLoading(false);
            });
        });
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

    if (loading) return <div className="p-10 text-center font-mono text-sm">Chargement...</div>;
    if (!decl)   return <div className="p-10 text-center text-red-600">Déclaration introuvable.</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&display=swap');
            `}</style>

            {/* Barre d'actions */}
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

            {/* Zone d'impression — centré sur A4 */}
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width:          '210mm',
                    height:         '297mm',
                    background:     '#ffffff',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    boxSizing:      'border-box',
                }}>
                    <LabelView decl={decl} />
                </div>
            </div>
        </div>
    );
}
