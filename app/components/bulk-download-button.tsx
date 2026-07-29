'use client';

import { useState } from 'react';
import { FileText, Loader2, CheckCircle2, Landmark } from 'lucide-react';
import { Declaration } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { generateNote, DECL_BASE, CONGO_NAMES, generateRandomPhone } from '@/lib/generator';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { numberToWords } from '@/lib/number-to-words';
import { calculateAccountingBilletage } from '@/lib/tax-rules';

function ReceiptTemplate({ decl, containerId }: { decl: Declaration; containerId: string }) {
    if (typeof document !== 'undefined') {
        const link1 = document.createElement('link');
        link1.rel = 'stylesheet';
        link1.href = 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600;700&display=swap';
        document.head.appendChild(link1);
    }
    const note = generateNote(decl);
    if (decl.meta?.manualTaxpayer) note.taxpayer = (decl.meta as any).manualTaxpayer;
    if (decl.meta?.manualTaxpayer?.nif) note.taxpayer.nif = decl.meta.manualTaxpayer.nif;

    const RATE_FC = 2244.76;
    const principalUSD = note.payment.principalTaxUSD;
    const totalFC = principalUSD * RATE_FC;
    const fcFormatted = totalFC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const usdFormatted = principalUSD.toFixed(2);
    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Kinshasa' });
    const timeStr = createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' });
    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${decl.id}`;

    const address = (note.taxpayer.address || 'KINSHASA')
        .replace(/PERSONNE\s+(PHYSIQUE|MORALE)/gi, '').replace(/^[\s,/-]+/, '').replace(/[\s,/-]+$/, '').trim() || 'KINSHASA';

    const cat = (decl.vehicle?.category || '');
    const fiscalPower = decl.vehicle?.fiscalPower ? `${String(decl.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim()} CV` : '- CV';
    const formattedRef = note.id ? note.id.replace(/^NDP\s*-\s*(\d{4})\s*-?\s*/, 'NDP - $1 - ') : note.id;

    const s: React.CSSProperties = { width: '420px', padding: '12px', border: '2px dashed #d1d5db', borderRadius: '8px', background: 'white', color: '#333', fontFamily: 'Arial, sans-serif', fontSize: '9px', boxSizing: 'border-box' };
    const sec: React.CSSProperties = { border: '1px solid #e0e0e0', borderRadius: '3px', marginBottom: '6px', overflow: 'hidden' };
    const sh: React.CSSProperties = { padding: '2px 8px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333' };
    const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px 1fr', padding: '2px 8px', borderBottom: '1px solid #f5f5f5', fontSize: '9px', gap: '4px' };
    const lb: React.CSSProperties = { fontWeight: 'bold', color: '#555' };
    const vl: React.CSSProperties = { fontWeight: '400', color: '#222', textTransform: 'uppercase' };

    const Ticket = ({ copyType }: { copyType: 'BANQUE' | 'CONTRIBUABLE' }) => (
        <div style={s}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #2C5EB5', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ width: '80px' }}><img src="/logo-dgrk-form.jpg" alt="DGRK" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" /></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>RÉCÉPISSÉ</div>
                    <div style={{ fontSize: '7px', color: '#888', fontWeight: '500' }}>Vignette Automobile | Exercice 2026</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '7px', fontWeight: 'bold', color: '#666', borderRadius: '3px', whiteSpace: 'nowrap' }}>COPIE {copyType}</div>
            </div>
            <div style={{ background: '#f5f5f5', textAlign: 'center', padding: '4px', borderRadius: '3px', marginBottom: '6px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2C5EB5', letterSpacing: '2px', fontFamily: '"Source Code Pro", monospace' }}>{formattedRef}</div>
                <div style={{ fontSize: '7px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° DE RÉFÉRENCE (À MENTIONNER AU PAIEMENT)</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: '6px' }}>
                <div>
                    <div style={sec}>
                        <div style={sh}>CONTRIBUABLE</div>
                        <div style={row}><span style={lb}>Noms/Raison Sociale:</span><span style={vl}>{note.taxpayer.name}</span></div>
                        <div style={row}><span style={lb}>N° Impôt/NIF:</span><span style={{ ...vl, textTransform: 'none' }}>{note.taxpayer.nif || '-'}</span></div>
                        <div style={{ ...row, borderBottom: 'none' }}><span style={lb}>Adresse:</span><span style={{ ...vl, fontSize: '8px' }}>{address}</span></div>
                    </div>
                    <div style={sec}>
                        <div style={sh}>VÉHICULE & TAXATION</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 8px', gap: '2px 12px', fontSize: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={lb}>Chassis:</span><span style={vl}>{note.vehicle.chassis || '-'}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={lb}>Plaque:</span><span style={vl}>{note.vehicle.plate || '-'}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={lb}>Marque/Type:</span><span style={vl}>{cat}</span></div>
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f5f5f5', paddingBottom: '2px' }}><span style={lb}>Puissance:</span><span style={{ ...vl, textTransform: 'none' }}>{fiscalPower}</span></div>
                            <div style={{ display: 'flex', gap: '4px' }}><span style={lb}>Usage:</span><span style={{ ...vl, textTransform: 'none' }}>N/A</span></div>
                            <div style={{ display: 'flex', gap: '4px' }}><span style={lb}>Poids:</span><span style={{ ...vl, textTransform: 'none' }}>{decl.vehicle?.weight || '0 T'}</span></div>
                        </div>
                    </div>
                    <div style={sec}>
                        <div style={sh}>DÉTAIL DU PAIEMENT</div>
                        <div style={{ padding: '4px 8px', fontSize: '9px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '4px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#555' }}>Taxe Principale (USD):</span>
                                <span>${usdFormatted}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#D32F2F', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>MONTANT TOTAL DÛ:</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#D32F2F' }}>FC {fcFormatted}</span>
                            </div>
                            <div style={{ fontSize: '7px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>(Payable en Francs Congolais au taux du jour)</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', height: '80px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#ccc', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CADRE RÉSERVÉ<br />À LA BANQUE</span>
                    </div>
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '6px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <QRCode value={verifyUrl} size={65} />
                        <div style={{ fontSize: '7px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>Scan pour vérifier</div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '-8px' }}>
                        <span style={{ fontSize: '7px', color: '#aaa' }}>Généré le: {dateStr} {timeStr}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div id={containerId} style={{ position: 'fixed', top: '-19999px', left: '-19999px', background: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Ticket copyType="BANQUE" />
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#aaa', letterSpacing: '1px', margin: '2px 0', borderTop: '1px dashed #ddd', borderBottom: '1px dashed #ddd', padding: '2px 0' }}>✂ COUPER ICI</div>
            <Ticket copyType="CONTRIBUABLE" />
        </div>
    );
}

function BordereauTemplate({ decl, containerId }: { decl: Declaration; containerId: string }) {
    const note = generateNote(decl);
    if (decl.meta?.manualTaxpayer) note.taxpayer = (decl.meta as any).manualTaxpayer;

    const idSuffix = (note.id || '').split('-').pop() || '';
    const declarationVal = parseInt(idSuffix, 16);
    const sequence = !isNaN(declarationVal) ? declarationVal - DECL_BASE : 0;
    const bordereauNo = 39383 + (Math.abs(sequence) % 100000);

    const rawBase = decl.meta?.manualBaseAmount || decl.tax?.baseRate || 0;
    const roundedBase = Math.ceil(rawBase);
    const displayTotal = roundedBase + 4.00;
    const displayCredit = roundedBase;
    const timbre = 3.45;
    const taxes = 0.55;

    const createdAt = decl.createdAt ? new Date(decl.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Kinshasa' });
    const timeStr = createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' });
    const padNum = (n: number) => String(n).padStart(2, '0');
    const dateNumericStr = `${padNum(createdAt.getDate())}/${padNum(createdAt.getMonth() + 1)}/${createdAt.getFullYear()}`;

    const nif = decl.meta?.manualTaxpayer?.nif || decl.taxpayer?.nif || 'DEFAULT_NIF';
    let nifSeed = 0;
    for (let i = 0; i < nif.length; i++) nifSeed = nif.charCodeAt(i) + ((nifSeed << 5) - nifSeed);
    const safeSequence = Math.abs(nifSeed);
    const facilitatorName = CONGO_NAMES[safeSequence % CONGO_NAMES.length] || 'MUKENDI';
    let lastNameIndex = (safeSequence * 7) % CONGO_NAMES.length;
    if (CONGO_NAMES[lastNameIndex] === facilitatorName) lastNameIndex = (lastNameIndex + 1) % CONGO_NAMES.length;
    const facilitatorLastName = CONGO_NAMES[lastNameIndex] || 'TSHIMANGA';
    const facilitatorPhone = generateRandomPhone(safeSequence);
    const remettantDisplay = `Mr ${facilitatorName}/${facilitatorPhone}`;
    const ownerFullName = (note.taxpayer.name || 'CLIENT').trim().toUpperCase();
    const motifDisplay = `${ownerFullName}/${idSuffix}`;
    const billBreakdown = calculateAccountingBilletage(displayTotal);

    const f = '"Courier New", Courier, monospace';
    return (
        <div id={containerId} style={{ position: 'fixed', top: '-19999px', left: '-19999px', background: 'white', padding: '0' }}>
            <div style={{ width: '210mm', minHeight: '296.5mm', background: 'white', padding: '20px 30px', fontFamily: f, fontSize: '10pt', lineHeight: '1.2', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 10, color: '#333' }}>
                    <div style={{ height: '120px' }} />
                    <div style={{ textAlign: 'center', marginBottom: '16px', whiteSpace: 'pre' }}>BORDEREAU DE VERSEMENT DEVISE No  {bordereauNo}</div>
                    <div style={{ whiteSpace: 'pre', marginBottom: '32px', paddingLeft: '40px' }}>33000061711-79             {dateStr} a {timeStr}</div>
                    <div style={{ marginBottom: '24px', fontSize: '10pt', lineHeight: '1.3', whiteSpace: 'pre', position: 'relative' }}>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}>Agence  ....: 00010 AGENCE GOMBE</div><div></div></div>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}>Devise  ....: USD   DOLLAR USA</div><div>VILLE DE KINSHASA</div></div>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}>Caisse  ....: 140   CAISSE SEC. GOMBE USD - 140</div><div>COLONEL EBEYA</div></div>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}>Guichetier.: VNGOMBA</div><div>GOMBE</div></div>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}></div><div>KINSHASA</div></div>
                        <div style={{ display: 'flex' }}><div style={{ width: '500px' }}>Gestionnaire: DIRECTEUR GENERAL</div><div>KINSHASA</div></div>
                        <div style={{ position: 'absolute', right: '20px', bottom: '20px' }}>
                            <svg width="35" height="35" viewBox="0 0 100 100"><path d="M100,0 L100,100 L0,85 C40,75 70,45 100,0 Z" fill="#C40000" /></svg>
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px', marginTop: '32px', fontSize: '10pt', lineHeight: '1.4', whiteSpace: 'pre' }}>
                        <div style={{ display: 'flex' }}><span>Nom du remettant. : {remettantDisplay.toUpperCase()}</span></div>
                        <div style={{ display: 'flex' }}><span>Adresse ..........: {motifDisplay.toUpperCase()}</span></div>
                        <div style={{ display: 'flex' }}><span>                     310 - REP DEM CONGO</span></div>
                        <div style={{ display: 'flex', marginTop: '4px' }}><span>Motif ............: {motifDisplay.toUpperCase()}</span></div>
                    </div>
                    <div style={{ marginBottom: '16px', marginTop: '24px', whiteSpace: 'pre' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Montant versement :</span><span style={{ textAlign: 'right', width: '120px' }}>{displayTotal.toFixed(2)} USD</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Timbre ...........:</span><span style={{ textAlign: 'right', width: '120px' }}>{timbre.toFixed(2)} USD</span><span style={{ marginLeft: '48px' }}>Taxe ......:</span><span style={{ marginLeft: '16px' }}>{taxes.toFixed(2).replace('.', ',')} USD</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Frais ............:</span><span style={{ textAlign: 'right', width: '120px' }}>0.00 USD</span></div>
                    </div>
                    <div style={{ marginBottom: '24px', marginTop: '24px', whiteSpace: 'pre' }}>
                        <div style={{ display: 'flex', fontSize: '9pt' }}>
                            <span style={{ width: '70px' }}> Valeur</span>
                            <span style={{ width: '70px', textAlign: 'center' }}>Nombre</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>Montant</span>
                            <span style={{ width: '100px' }}></span>
                            <span style={{ width: '70px', textAlign: 'center' }}>Nombre</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>Montant</span>
                        </div>
                        <div style={{ display: 'flex', fontSize: '9pt', color: '#333333' }}>
                            <span style={{ width: '70px' }}></span>
                            <span style={{ width: '70px', textAlign: 'center' }}>recu</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>recu</span>
                            <span style={{ width: '100px' }}></span>
                            <span style={{ width: '70px', textAlign: 'center' }}>rendu</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>rendu</span>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                            {billBreakdown.map((row: any, i: number) => (
                                <div key={i} style={{ display: 'flex', fontSize: '9pt' }}>
                                    <span style={{ width: '70px', textAlign: 'right', paddingRight: '8px' }}>{row.value.toFixed(2).replace('.', ',')}</span>
                                    <span style={{ width: '70px', textAlign: 'center' }}>{row.count}</span>
                                    <span style={{ width: '100px', textAlign: 'right' }}>{row.total.toFixed(2)}</span>
                                    <span style={{ width: '100px' }}></span>
                                    <span style={{ width: '70px', textAlign: 'center' }}>0</span>
                                    <span style={{ width: '100px', textAlign: 'right' }}>0.00</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', fontSize: '9pt', marginTop: '8px' }}>
                            <span style={{ width: '70px' }}></span>
                            <span style={{ width: '170px' }}>------------------</span>
                            <span style={{ width: '100px' }}></span>
                            <span style={{ width: '170px' }}>------------------</span>
                        </div>
                        <div style={{ display: 'flex', fontSize: '9pt' }}>
                            <span style={{ width: '70px' }}>Total</span>
                            <span style={{ width: '70px' }}>recu</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>{displayTotal.toFixed(2)}</span>
                            <span style={{ width: '20px' }}></span>
                            <span style={{ width: '80px' }}>Rendu</span>
                            <span style={{ width: '70px' }}></span>
                            <span style={{ width: '100px', textAlign: 'right' }}>0.00</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '40px', fontSize: '10pt', lineHeight: '1.4', color: '#333', fontFamily: f }}>
                        <div style={{ whiteSpace: 'pre' }}><span>Nous portons au credit du compte no 33000061711-79     USD :               {displayCredit.toFixed(2)}</span></div>
                        <div style={{ whiteSpace: 'pre' }}><span>                                                   Valeur :          {dateNumericStr}</span></div>
                        <div style={{ marginTop: '8px' }}><span>Soit {numberToWords(Math.round(displayCredit)).toLowerCase()} USD</span></div>
                        <div style={{ marginTop: '8px', whiteSpace: 'pre', lineHeight: '1.3', position: 'relative' }}>
                            <div>------------------------------------</div>
                            <div>      CLIENT       !    GUICHETIER    !</div>
                            <div>                   !                  !</div>
                            <div>                   !                  !</div>
                            <div>                   !                  !        OPERATION EFFECTUEE</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BulkDownloadButton({ declarations, companyName }: { declarations: Declaration[]; companyName: string }) {
    const [recStatus, setRecStatus] = useState<'idle' | 'generating' | 'done'>('idle');
    const [borStatus, setBorStatus] = useState<'idle' | 'generating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [currentDecl, setCurrentDecl] = useState<Declaration | null>(null);

    const capturePage = async (elementId: string, pdf: jsPDF, scale = 3): Promise<jsPDF> => {
        const el = document.getElementById(elementId);
        if (!el) return pdf;
        const canvas = await html2canvas(el, { scale, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        const pageH = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfH;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH);
        heightLeft -= pageH;
        while (heightLeft > 0) {
            position = heightLeft - pdfH;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH);
            heightLeft -= pageH;
        }
        return pdf;
    };

    const handleDownloadReceipts = async () => {
        if (recStatus !== 'idle') return;
        setRecStatus('generating');
        setProgress(0);

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        let first = true;

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];
            const plate = decl.vehicle?.plate || decl.id;
            setCurrentDecl(decl);
            setProgress(Math.round(((i + 0.5) / declarations.length) * 100));
            setProgressLabel(`Récépissé ${i + 1}/${declarations.length} – ${plate}`);
            await new Promise(r => setTimeout(r, 800));
            if (!first) pdf.addPage();
            first = false;
            await capturePage(`receipt-pdf-${decl.id}`, pdf, 3);
        }

        setCurrentDecl(null);
        setProgress(100);
        const name = `RECEPISSES-${companyName.toUpperCase().replace(/\s+/g, '-')}.pdf`;
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setRecStatus('done');
        setTimeout(() => { setRecStatus('idle'); setProgressLabel(''); }, 3000);
    };

    const handleDownloadBordereaux = async () => {
        if (borStatus !== 'idle') return;
        setBorStatus('generating');
        setProgress(0);

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        let first = true;

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];
            const plate = decl.vehicle?.plate || decl.id;
            setCurrentDecl(decl);
            setProgress(Math.round(((i + 0.5) / declarations.length) * 100));
            setProgressLabel(`Bordereau ${i + 1}/${declarations.length} – ${plate}`);
            await new Promise(r => setTimeout(r, 800));
            if (!first) pdf.addPage();
            first = false;
            await capturePage(`bordereau-pdf-${decl.id}`, pdf, 3);
        }

        setCurrentDecl(null);
        setProgress(100);
        const name = `BORDEREAUX-${companyName.toUpperCase().replace(/\s+/g, '-')}.pdf`;
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setBorStatus('done');
        setTimeout(() => { setBorStatus('idle'); setProgressLabel(''); }, 3000);
    };

    return (
        <>
            <div className="flex gap-3 w-full">
                <button
                    onClick={handleDownloadReceipts}
                    disabled={recStatus !== 'idle'}
                    className={`flex-1 ${recStatus === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm border`}
                >
                    {recStatus === 'idle' && <><FileText className="h-5 w-5" />Télécharger Récépissés (PDF)</>}
                    {recStatus === 'generating' && <><Loader2 className="h-5 w-5 animate-spin" />Génération {progress}% – {progressLabel}</>}
                    {recStatus === 'done' && <><CheckCircle2 className="h-5 w-5" />Récépissés téléchargés !</>}
                </button>
                <button
                    onClick={handleDownloadBordereaux}
                    disabled={borStatus !== 'idle'}
                    className={`flex-1 ${borStatus === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-800 hover:bg-black text-white'} py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm border`}
                >
                    {borStatus === 'idle' && <><Landmark className="h-5 w-5" />Télécharger Bordereaux (PDF)</>}
                    {borStatus === 'generating' && <><Loader2 className="h-5 w-5 animate-spin" />Génération {progress}% – {progressLabel}</>}
                    {borStatus === 'done' && <><CheckCircle2 className="h-5 w-5" />Bordereaux téléchargés !</>}
                </button>
            </div>

            {currentDecl && typeof window !== 'undefined' && createPortal(
                <>
                    <ReceiptTemplate decl={currentDecl} containerId={`receipt-pdf-${currentDecl.id}`} />
                    <BordereauTemplate decl={currentDecl} containerId={`bordereau-pdf-${currentDecl.id}`} />
                </>,
                document.body
            )}
        </>
    );
}