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
    const rawCategory = (decl.meta as any)?.manualMarqueType || decl.vehicle?.category || 'Utilitaire light';
    const category = rawCategory.replace(/_/g, ' ');
    const fiscalPower = decl.vehicle?.fiscalPower ? String(decl.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim() : '0';
    const weight = decl.vehicle?.weight || '0';
    const refId = (decl.meta as any)?.reference || decl.id;
    const validFrom = decl.createdAt ? new Date(decl.createdAt) : new Date(`${year}-01-01`);
    const validTo = new Date(`${year}-12-31`);
    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    const BLUE = '#1a3c7a';
    const GOLD = '#c8a84e';

    return (
        <div
            className="label-card"
            style={{
                width: '105mm',
                height: '148.5mm',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                position: 'relative',
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    border: '3mm solid ' + BLUE,
                    borderRadius: '5mm',
                    padding: '2mm 3mm',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Logos - closer together, centered */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3mm', marginBottom: '0.5mm' }}>
                    <div style={{ width: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/dgrk-logo.jpg" alt="DGRK" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                    <div style={{
                        width: '20mm',
                        height: '20mm',
                        borderRadius: '50%',
                        border: `1mm solid ${GOLD}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        <img src="/irms-logo-open.png" alt="IRMS DGRK" style={{ width: '65%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                </div>

                {/* Title - centered */}
                <div style={{ textAlign: 'center', marginBottom: '0.5mm' }}>
                    <div style={{
                        fontSize: '7.5px',
                        fontWeight: 800,
                        color: BLUE,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        lineHeight: 1.4,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div style={{
                        fontSize: '6.5px',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1.4,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    }}>
                        VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES
                    </div>
                </div>

                {/* Separator */}
                <div style={{ height: '0.5mm', width: '100%', background: BLUE, marginBottom: '2mm' }} />

                {/* Year pill */}
                <div style={{
                    width: '50%',
                    margin: '0 auto',
                    borderRadius: '999px',
                    background: BLUE,
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: 900,
                    textAlign: 'center',
                    padding: '2.5mm 0',
                    letterSpacing: '0.1em',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    lineHeight: 1,
                }}>
                    {year}
                </div>

                {/* Plate */}
                <div style={{
                    width: '82%',
                    margin: '3mm auto 0',
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    padding: '3.5mm 2mm',
                    textAlign: 'center',
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    background: '#ffffff',
                    fontFamily: '"Courier New", Courier, monospace',
                    lineHeight: 1,
                    color: '#000000',
                }}>
                    {plate}
                </div>

                {/* Category + specs */}
                <div style={{ textAlign: 'center', marginTop: '2.5mm' }}>
                    <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: BLUE,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    <div style={{
                        fontSize: '8.5px',
                        color: BLUE,
                        fontWeight: 600,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        marginTop: '0.5mm',
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
                    marginBottom: '1mm',
                }}>
                    <div style={{
                        padding: '2mm',
                        background: '#ffffff',
                        border: '0.3mm solid #e5e7eb',
                        borderRadius: '2px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {verifyUrl ? (
                            <QRCode value={verifyUrl} size={80} />
                        ) : (
                            <div style={{ width: '25mm', height: '25mm' }} />
                        )}
                    </div>
                </div>

                {/* Hologram - small, bottom right */}
                <div style={{
                    position: 'absolute',
                    bottom: '14mm',
                    right: '3.5mm',
                    width: '16mm',
                    height: '16mm',
                    border: '0.4mm dashed #b0b0b0',
                    borderRadius: '1.5mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#b0b0b0',
                    fontSize: '5.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                }}>
                    HOLOGRAMME<br />// {year}
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '7px',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    lineHeight: 1.5,
                    fontFamily: 'Arial, Helvetica, sans-serif',
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
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Imprimer l&apos;étiquette
                </button>
            </div>
            <div className="flex justify-center">
                <div id="printable-root" style={{
                    width: '210mm',
                    height: '297mm',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                }}>
                    <LabelView decl={decl} />
                </div>
            </div>
        </div>
    );
}
