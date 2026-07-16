'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Declaration } from '@/types';

const LabelView = ({ decl }: { decl: Declaration }) => {
    const year = new Date().getFullYear().toString();
    const plate = decl.vehicle?.plate || '0000AB00';
    const category = (decl.meta as any)?.manualMarqueType || decl.vehicle?.category || 'Utilitaire light';
    const fiscalPower = decl.vehicle?.fiscalPower ? String(decl.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim() : '0';
    const weight = decl.vehicle?.weight || '0';
    const refId = (decl.meta as any)?.reference || decl.id;
    const validFrom = decl.createdAt ? new Date(decl.createdAt) : new Date(`${year}-01-01`);
    const validTo = new Date(`${year}-12-31`);
    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    const W = '105mm';
    const H = '148.5mm';

    return (
        <div
            className="label-card"
            style={{
                width: W,
                height: H,
                background: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                position: 'relative',
            }}
        >
            {/* Outer card with blue border */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    border: '3.5mm solid #003a8c',
                    borderRadius: '6mm',
                    padding: '2.5mm 3mm',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#f0f2f5',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* TOP: Logos + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm' }}>
                    {/* DGRK Logo */}
                    <div style={{ width: '18mm', minWidth: '18mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/dgrk-logo.jpg" alt="DGRK" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                    {/* Vertical separator */}
                    <div style={{ width: '1px', height: '12mm', background: '#003a8c', opacity: 0.4 }} />
                    {/* IRMS Logo with gold circle */}
                    <div style={{
                        width: '20mm',
                        minWidth: '20mm',
                        height: '20mm',
                        borderRadius: '50%',
                        border: '1.2mm solid #c8a84e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <img src="/irms-logo-open.png" alt="IRMS DGRK" style={{ width: '75%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                </div>

                {/* Title block */}
                <div style={{ textAlign: 'center', marginBottom: '1mm' }}>
                    <div style={{
                        fontSize: '6.5px',
                        fontWeight: 800,
                        color: '#003a8c',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        lineHeight: 1.3,
                        fontFamily: 'Arial, sans-serif',
                    }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div style={{
                        fontSize: '5.5px',
                        fontWeight: 700,
                        color: '#111827',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        lineHeight: 1.3,
                        fontFamily: 'Arial, sans-serif',
                    }}>
                        VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES
                    </div>
                </div>

                {/* Blue separator */}
                <div style={{ height: '0.6mm', width: '100%', background: '#003a8c', marginBottom: '2mm' }} />

                {/* Year pill */}
                <div style={{
                    width: '52%',
                    margin: '0 auto',
                    borderRadius: '999px',
                    background: '#003a8c',
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: 900,
                    textAlign: 'center',
                    padding: '2.5mm 0',
                    letterSpacing: '0.12em',
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: 1,
                }}>
                    {year}
                </div>

                {/* License plate */}
                <div style={{
                    width: '82%',
                    margin: '3mm auto 0',
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    padding: '3mm 2mm',
                    textAlign: 'center',
                    fontSize: '30px',
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    background: '#ffffff',
                    fontFamily: '"Courier New", monospace',
                    lineHeight: 1,
                }}>
                    {plate}
                </div>

                {/* Category + specs */}
                <div style={{ textAlign: 'center', marginTop: '2.5mm' }}>
                    <div style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: '#003a8c',
                        textTransform: 'capitalize',
                        letterSpacing: '0.06em',
                        fontFamily: 'Arial, sans-serif',
                    }}>
                        {category}
                    </div>
                    <div style={{
                        fontSize: '8px',
                        color: '#003a8c',
                        fontWeight: 700,
                        fontFamily: 'Arial, sans-serif',
                        marginTop: '0.8mm',
                    }}>
                        {fiscalPower} CV • {weight} T
                    </div>
                </div>

                {/* QR Code - centered */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '3mm',
                    marginBottom: '2mm',
                }}>
                    <div style={{
                        width: '28mm',
                        height: '28mm',
                        background: '#ffffff',
                        borderRadius: '3px',
                        border: '0.5mm solid #d1d5db',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {verifyUrl ? <QRCode value={verifyUrl} size={95} /> : <div style={{ width: '86px', height: '86px' }} />}
                    </div>
                </div>

                {/* Hologram - absolute bottom right */}
                <div style={{
                    position: 'absolute',
                    bottom: '18mm',
                    right: '4mm',
                    width: '18mm',
                    height: '18mm',
                    border: '0.5mm dashed #9ca3af',
                    borderRadius: '2mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '6px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    lineHeight: 1.3,
                    fontFamily: 'Arial, sans-serif',
                }}>
                    HOLOGRAMME<br />// {year}
                </div>

                {/* Footer - centered */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '7px',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.4,
                    fontFamily: 'Arial, sans-serif',
                    marginTop: 'auto',
                }}>
                    <div>REF: {refId}</div>
                    <div>{`Valide du ${fmtDate(validFrom)} au ${fmtDate(validTo)}`}</div>
                </div>
            </div>
        </div>
    );
};

export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [loading, setLoading] = useState(true);

    let rawId = params?.id as string;
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx = segments.indexOf('declarations');
            if (idx !== -1 && segments[idx + 1]) {
                const recoveredId = segments[idx + 1];
                if (recoveredId && recoveredId !== '[id]') rawId = recoveredId;
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
    if (!decl) return <div className="p-10 text-center text-red-600">Déclaration introuvable.</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            {/* Toolbar - no-print */}
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Imprimer l&apos;étiquette
                </button>
            </div>

            {/* Label centered on A4 */}
            <div className="flex justify-center">
                <div
                    id="printable-root"
                    style={{
                        width: '210mm',
                        height: '297mm',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}
                >
                    <LabelView decl={decl} />
                </div>
            </div>
        </div>
    );
}
