'use client';

import { useState } from 'react';
import { FileArchive, Loader2, CheckCircle2 } from 'lucide-react';
import { Declaration } from '@/types';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateNote } from '@/lib/generator';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';

// ─────────────────────────────────────────────────────────────────
// Full inline receipt renderer – mirrors the real receipt page UI
// ─────────────────────────────────────────────────────────────────
function ReceiptTemplate({ decl, containerId }: { decl: Declaration; containerId: string }) {
    const note = generateNote(decl);
    if (decl.meta?.manualTaxpayer) {
        note.taxpayer = (decl.meta as any).manualTaxpayer;
    }
    if (decl.meta?.manualTaxpayer?.nif) note.taxpayer.nif = decl.meta.manualTaxpayer.nif;

    const RATE_FC = 2355;
    const principalUSD = note.payment.principalTaxUSD;
    const totalFC = principalUSD * RATE_FC;
    const fcFormatted = totalFC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const usdFormatted = principalUSD.toFixed(2);
    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Kinshasa' });
    const timeStr = createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' });
    const verifyUrl = `https://irms-dgrk-tax.vercel.app/verify/${decl.id}`;

    const address = (note.taxpayer.address || 'KINSHASA')
        .replace(/PERSONNE\s+(PHYSIQUE|MORALE)/gi, '')
        .replace(/^[\s,/-]+/, '').replace(/[\s,/-]+$/, '').trim() || 'KINSHASA';

    const cat = (decl.vehicle?.category || '');
    const marqueType = cat.includes('_') ? cat : `${decl.vehicle?.marque || ''} / ${cat}`;
    const fiscalPower = decl.vehicle?.fiscalPower ? `${String(decl.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim()} CV` : '- CV';

    const ticketStyle: React.CSSProperties = {
        width: '420px',
        padding: '12px',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        background: 'white',
        color: '#333',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        boxSizing: 'border-box',
    };

    const sectionStyle: React.CSSProperties = {
        border: '1px solid #e0e0e0',
        borderRadius: '3px',
        marginBottom: '6px',
        overflow: 'hidden',
    };

    const sectionHeader: React.CSSProperties = {
        padding: '2px 8px',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 'bold',
        fontSize: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#333',
    };

    const rowStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        padding: '2px 8px',
        borderBottom: '1px solid #f5f5f5',
        fontSize: '9px',
        gap: '4px',
    };

    const labelStyle: React.CSSProperties = { fontWeight: 'bold', color: '#555' };
    const valueStyle: React.CSSProperties = { fontWeight: '600', color: '#222', textTransform: 'uppercase' };

    const Ticket = ({ copyType }: { copyType: 'BANQUE' | 'CONTRIBUABLE' }) => (
        <div style={ticketStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #2C5EB5', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ width: '80px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-dgrk-form.jpg" alt="DGRK" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" />
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>RÉCÉPISSÉ</div>
                    <div style={{ fontSize: '7px', color: '#888', fontWeight: '500' }}>Vignette Automobile | Exercice 2026</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '7px', fontWeight: 'bold', color: '#666', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                    COPIE {copyType}
                </div>
            </div>

            {/* Reference */}
            <div style={{ background: '#f5f5f5', textAlign: 'center', padding: '4px', borderRadius: '3px', marginBottom: '6px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2C5EB5', letterSpacing: '2px' }}>{note.id}</div>
                <div style={{ fontSize: '7px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° DE RÉFÉRENCE (À MENTIONNER AU PAIEMENT)</div>
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '6px' }}>
                {/* Left column */}
                <div>
                    {/* Contribuable */}
                    <div style={sectionStyle}>
                        <div style={sectionHeader}>CONTRIBUABLE</div>
                        <div style={rowStyle}><span style={labelStyle}>Noms/Raison Sociale:</span><span style={valueStyle}>{note.taxpayer.name}</span></div>
                        <div style={rowStyle}><span style={labelStyle}>N° Impôt/NIF:</span><span style={{ ...valueStyle, textTransform: 'none' }}>{note.taxpayer.nif || '-'}</span></div>
                        <div style={{ ...rowStyle, borderBottom: 'none' }}><span style={labelStyle}>Adresse:</span><span style={{ ...valueStyle, fontSize: '8px' }}>{address}</span></div>
                    </div>

                    {/* Véhicule */}
                    <div style={sectionStyle}>
                        <div style={sectionHeader}>VÉHICULE &amp; TAXATION</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 8px', gap: '2px 8px', fontSize: '9px' }}>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={labelStyle}>Chassis:</span><span style={valueStyle}>{note.vehicle.chassis}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={labelStyle}>Plaque:</span><span style={valueStyle}>{note.vehicle.plate}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={labelStyle}>Marque/Type:</span><span style={{ ...valueStyle, textTransform: 'lowercase' }}>{marqueType}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={labelStyle}>Puissance:</span><span style={valueStyle}>{fiscalPower}</span></div>
                            <div style={{ display: 'flex', gap: '4px' }}><span style={labelStyle}>Usage:</span><span style={valueStyle}>N/A</span></div>
                            <div style={{ display: 'flex', gap: '4px' }}><span style={labelStyle}>Poids:</span><span style={valueStyle}>{decl.vehicle?.weight || '0 T'}</span></div>
                        </div>
                    </div>

                    {/* Paiement */}
                    <div style={sectionStyle}>
                        <div style={sectionHeader}>DÉTAIL DU PAIEMENT</div>
                        <div style={{ padding: '4px 8px', fontSize: '9px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '4px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#555' }}>Taxe Principale (USD):</span>
                                <span style={{ fontWeight: 'bold' }}>${usdFormatted}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#D32F2F', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>MONTANT TOTAL DÛ:</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#D32F2F' }}>FC {fcFormatted}</span>
                            </div>
                            <div style={{ fontSize: '7px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                                (Payable en Francs Congolais au taux de {RATE_FC} FC/USD)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Bank box */}
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', height: '70px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#ccc', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CADRE RÉSERVÉ<br />À LA BANQUE</span>
                    </div>
                    {/* QR */}
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '6px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <QRCode value={verifyUrl} size={60} />
                        <div style={{ fontSize: '7px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>Scan pour vérifier</div>
                    </div>
                    {/* Timestamp */}
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#aaa' }}>Généré le: {dateStr} {timeStr}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            id={containerId}
            style={{
                position: 'fixed', top: '-19999px', left: '-19999px',
                background: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
            }}
        >
            <Ticket copyType="BANQUE" />
            {/* Couper ici */}
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#aaa', letterSpacing: '1px', margin: '2px 0', borderTop: '1px dashed #ddd', borderBottom: '1px dashed #ddd', padding: '2px 0' }}>
                ✂ COUPER ICI
            </div>
            <Ticket copyType="CONTRIBUABLE" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────
export default function BulkDownloadButton({ declarations, companyName }: { declarations: Declaration[]; companyName: string }) {
    const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [currentDecl, setCurrentDecl] = useState<Declaration | null>(null);

    const handleDownloadZip = async () => {
        if (status !== 'idle') return;
        setStatus('generating');
        setProgress(0);

        const zip = new JSZip();
        const folder = zip.folder(`Dossier_${companyName.replace(/\s+/g, '_')}`);

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];
            const plate = decl.vehicle?.plate || decl.id;
            setCurrentDecl(decl);
            setProgress(Math.round(((i + 0.5) / declarations.length) * 100));
            setProgressLabel(`${i + 1}/${declarations.length} – ${plate}`);

            // Wait for DOM to render the hidden receipt
            await new Promise(r => setTimeout(r, 600));

            const containerId = `receipt-pdf-${decl.id}`;
            const el = document.getElementById(containerId);

            if (el) {
                try {
                    const canvas = await html2canvas(el, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#fff',
                        logging: false,
                    });
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pdfW = pdf.internal.pageSize.getWidth();
                    const pdfH = (canvas.height * pdfW) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
                    folder?.file(`recepisse_${plate}.pdf`, pdf.output('blob'));
                } catch (err) {
                    console.error('Capture error for', plate, err);
                }
            }
        }

        setCurrentDecl(null);
        setProgress(100);

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DOSSIER-${companyName.toUpperCase().replace(/\s+/g, '-')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('done');
        setTimeout(() => { setStatus('idle'); setProgressLabel(''); }, 3000);
    };

    return (
        <>
            <button
                onClick={handleDownloadZip}
                disabled={status !== 'idle'}
                className={`flex-1 ${status === 'done'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-gray-800 hover:bg-black text-white'
                    } py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm border`}
            >
                {status === 'idle' && <><FileArchive className="h-5 w-5" />Télécharger Dossier Complet (ZIP)</>}
                {status === 'generating' && <><Loader2 className="h-5 w-5 animate-spin" />Génération {progress}% – {progressLabel}</>}
                {status === 'done' && <><CheckCircle2 className="h-5 w-5" />Dossier téléchargé !</>}
            </button>

            {/* Hidden receipts rendered off-screen for pdf capture */}
            {currentDecl && typeof window !== 'undefined' && createPortal(
                <ReceiptTemplate decl={currentDecl} containerId={`receipt-pdf-${currentDecl.id}`} />,
                document.body
            )}
        </>
    );
}
