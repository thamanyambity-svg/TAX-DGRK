'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { generateNote } from '@/lib/generator';
import { NoteDePerception } from '@/types';
import QRCode from 'react-qr-code';
import { ArrowLeft, Download, Scissors, CalendarClock, Save, X } from 'lucide-react';

// --- Sub-component for a single receipt ticket (Rebuilt strict design) ---
const ReceiptView = ({
    type,
    note,
    verifyUrl
}: {
    type: 'BANQUE' | 'CONTRIBUABLE',
    note: NoteDePerception,
    verifyUrl: string
}) => {

    const formatFC = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Dynamic Pricing Logic based on Fiscal Power
    const { calculateTax } = require('@/lib/tax-rules');
    const principalUSD = note.payment.principalTaxUSD;
    const totalFC = note.payment.totalAmountFC;

    const displayAmountUSD = principalUSD;
    const displayAmountFC = totalFC.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const creationDate = note.generatedAt ? new Date(note.generatedAt) : new Date();
    const dateStr = creationDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = creationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // --- ADMINISTRATIVE MODIFICATION (POUR TOUS) ---
    // User requested format: NDP-2026-1579A471 (No Name)
    const formattedRef = note.id;

    return (
        <div className="w-full bg-white text-[#333333] font-sans text-sm relative">
            {/* Main Container - ULTRA COMPACT MODE */}
            <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden bg-white">

                {/* Header Section - Minimal Margin (mb-1) */}
                <div className="flex items-center justify-between border-b-2 border-[#2C5EB5] pb-1 mb-1">
                    {/* Logo Area */}
                    <div className="w-[110px] -ml-2 flex justify-center items-center">
                        <img
                            src="/logo-dgrk-form.jpg"
                            alt="Logo DGRK"
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {/* Title Area */}
                    <div className="text-center flex-1 leading-tight">
                        <h1 className="text-lg font-bold uppercase text-[#333333] tracking-wide">RÉCÉPISSÉ</h1>
                        <p className="text-[9px] text-gray-500 mt-0 font-medium tracking-wide">Vignette Automobile | Exercice 2026</p>
                    </div>

                    {/* Copy Badge */}
                    <div className="w-auto min-w-[120px] flex justify-end">
                        <span className="border border-gray-400 text-gray-500 text-[8px] font-bold px-2 py-0.5 rounded uppercase bg-white tracking-tight whitespace-nowrap">
                            COPIE {type === 'BANQUE' ? 'BANQUE' : 'CONTRIBUABLE'}
                        </span>
                    </div>
                </div>

                {/* Reference Banner - Minimal Margin (mb-2) */}
                <div className="bg-[#F5F5F5] py-1 mb-2 text-center rounded-sm mx-auto w-full border border-gray-100">
                    <h2 className="text-base font-bold text-[#2C5EB5] tracking-widest leading-none">{formattedRef}</h2>
                    <p className="text-[7px] text-gray-500 uppercase font-bold mt-0 tracking-wider">N° DE RÉFÉRENCE (À MENTIONNER AU PAIEMENT)</p>
                </div>

                {/* Main Grid Layout - Ultra Compact Gap (gap-2) */}
                <div className="grid grid-cols-[1fr_160px] gap-2">

                    {/* LEFT COLUMN: Data Fields */}
                    <div className="space-y-2">

                        {/* CONTRIBUABLE - Styled exactly like the user image (Vertical List, Wide Label) */}
                        <div className="border border-[#E0E0E0] rounded-sm bg-white overflow-hidden">
                            <div className="px-2 py-0.5 bg-white border-b border-[#E0E0E0]">
                                <h3 className="font-bold text-[#333333] text-[8px] uppercase tracking-wide">CONTRIBUABLE</h3>
                            </div>
                            <div className="px-2 py-1 space-y-0.5 text-[9px]">
                                <div className="grid grid-cols-[180px_1fr] border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600">Noms/Raison Sociale:</span>
                                    <span className="uppercase font-bold text-gray-800 break-words leading-tight truncate">{note.taxpayer.name}</span>
                                </div>
                                <div className="grid grid-cols-[180px_1fr] border-b border-[#F0F0F0] pb-0.5 pt-0.5">
                                    <span className="font-bold text-gray-600">N° Impôt/NIF:</span>
                                    <span className="font-medium text-gray-800">{note.taxpayer.nif || '-'}</span>
                                </div>
                                <div className="grid grid-cols-[180px_1fr] pt-0.5">
                                    <span className="font-bold text-gray-600">Adresse:</span>
                                    <span className="font-medium text-gray-800 uppercase text-[9px] break-words leading-tight truncate">
                                        N/A, {(() => {
                                            if (!note.taxpayer.address) return 'KINSHASA';
                                            const parts = note.taxpayer.address.split(',');
                                            return parts.length > 1 ? parts[parts.length - 1].trim() : 'KINSHASA';
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* VÉHICULE & TAXATION - 2 Columns Grid */}
                        <div className="border border-[#E0E0E0] rounded-sm bg-white overflow-hidden">
                            <div className="px-2 py-0.5 bg-white border-b border-[#E0E0E0]">
                                <h3 className="font-bold text-[#333333] text-[8px] uppercase tracking-wide">VÉHICULE & TAXATION</h3>
                            </div>
                            <div className="px-2 py-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                {/* Ligne 1 */}
                                <div className="grid grid-cols-[90px_1fr] border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600">Chassis:</span>
                                    <span className="uppercase font-bold text-gray-800 tracking-tight truncate">{note.vehicle.chassis}</span>
                                </div>
                                <div className="grid grid-cols-[90px_1fr] border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600">Plaque:</span>
                                    <span className="uppercase font-bold text-gray-800">{note.vehicle.plate}</span>
                                </div>

                                {/* Ligne 2 */}
                                <div className="grid grid-cols-[90px_1fr] border-b border-[#F0F0F0] pb-0.5 pt-0.5">
                                    <span className="font-bold text-gray-600">Marque/Type:</span>
                                    <span className="uppercase text-[9px] font-medium text-gray-800 truncate">
                                        utilitaire_medium
                                    </span>
                                </div>
                                <div className="grid grid-cols-[90px_1fr] border-b border-[#F0F0F0] pb-0.5 pt-0.5">
                                    <span className="font-bold text-gray-600">Puissance:</span>
                                    <span className="font-medium text-gray-800">
                                        {note.vehicle.fiscalPower ? `${String(note.vehicle.fiscalPower).replace(/cv/i, '').trim()} CV` : '- CV'}
                                    </span>
                                </div>

                                {/* Ligne 3 */}
                                <div className="grid grid-cols-[90px_1fr] pt-0.5">
                                    <span className="font-bold text-gray-600">Usage:</span>
                                    <span className="font-medium text-gray-800">N/A</span>
                                </div>
                                <div className="grid grid-cols-[90px_1fr] pt-0.5">
                                    <span className="font-bold text-gray-600">Poids:</span>
                                    <span className="font-medium text-gray-800">1 T</span>
                                </div>
                            </div>
                        </div>

                        {/* DÉTAIL DU PAIEMENT */}
                        <div className="border border-[#E0E0E0] rounded-sm bg-white overflow-hidden">
                            <div className="px-2 py-0.5 bg-white border-b border-[#E0E0E0]">
                                <h3 className="font-bold text-[#333333] text-[8px] uppercase tracking-wide">DÉTAIL DU PAIEMENT</h3>
                            </div>
                            <div className="px-2 py-1.5 text-[9px]">
                                <div className="flex justify-between mb-1.5 border-b border-[#F0F0F0] pb-1">
                                    <span className="text-gray-600 font-bold">Taxe Principale (USD):</span>
                                    <span className="font-bold text-[#333333]">${displayAmountUSD.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-[#D32F2F] uppercase text-[9px] tracking-wide whitespace-nowrap">MONTANT TOTAL DÛ:</span>
                                        <span className="text-base font-extrabold text-[#D32F2F] tracking-tight whitespace-nowrap">FC {displayAmountFC}</span>
                                    </div>
                                    <p className="text-[7px] text-gray-500 italic font-medium leading-none">
                                        (Payable en Francs Congolais au taux du jour)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Bank & QR - Super Compacted */}
                    <div className="flex flex-col h-full justify-between gap-2">
                        {/* Bank Box - Reduced Height (h-20) */}
                        <div className="border border-[#E0E0E0] rounded-lg h-20 bg-[#FAFAFA] flex items-center justify-center mb-0 inner-shadow-sm">
                            <p className="text-[8px] text-gray-300 font-bold uppercase text-center leading-tight tracking-wider">
                                CADRE RÉSERVÉ <br /> À LA BANQUE
                            </p>
                        </div>

                        {/* QR Code Block */}
                        <div className="border border-[#E0E0E0] rounded-lg p-2 bg-white flex flex-col items-center flex-1 justify-center min-h-[120px]">
                            <div className="bg-white p-1 mb-1">
                                {verifyUrl ? (
                                    <QRCode value={verifyUrl} size={65} viewBox={`0 0 256 256`} />
                                ) : (
                                    <div className="w-[65px] h-[65px] bg-gray-100" />
                                )}
                            </div>
                            <p className="text-[7px] text-gray-500 italic mb-1 font-medium">Scan pour vérifier</p>
                        </div>

                        {/* Timestamp - Added below QR Box */}
                        <div className="text-center mt-1">
                            <p className="text-[8px] text-gray-400 font-medium">
                                Généré le: {dateStr} {timeStr}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};




export default function ReceiptPage() {
    const params = useParams();
    // Robust ID retrieval with fallback
    let rawId = params?.id as string;

    // EMERGENCY FALLBACK: If params.id is missing or 'undefined', parse from URL
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            // Path: /declarations/[id]/receipt -> index of 'declarations' + 1
            const declIdx = segments.indexOf('declarations');
            if (declIdx !== -1 && segments[declIdx + 1]) {
                const recoveredId = segments[declIdx + 1];
                if (recoveredId && recoveredId !== '[id]') {
                    rawId = recoveredId;
                    console.warn("⚠️ Params missing. ID recovered from window.location:", rawId);
                }
            }
        } catch (e) {
            console.error("Failed to parse window location", e);
        }
    }

    // Safely process ID
    const id = rawId && rawId !== 'undefined' ? decodeURIComponent(rawId).trim() : '';

    const router = useRouter();
    const [note, setNote] = useState<NoteDePerception | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // --- ADMIN DATE CONTROL STATE ---
    const [decl, setDecl] = useState<any>(null); // Store full declaration
    const [showAdminDates, setShowAdminDates] = useState(false);
    const [editReceiptDate, setEditReceiptDate] = useState('');
    const [editPaymentDate, setEditPaymentDate] = useState('');
    const [isSavingDates, setIsSavingDates] = useState(false);

    // --- Ajout du CSS d'impression ---
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/print.css';
        link.media = 'print';
        document.head.appendChild(link);
        return () => {
            // document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        async function fetchManualData() {
            if (!id || id === 'undefined') {
                if (isMounted) setError("Erreur: ID manquant.");
                return;
            }

            try {
                // console.log(`🔍 Fetching declaration ${id}...`);
                const { getDeclarationById } = await import('@/lib/store');
                const manualDecl = await getDeclarationById(id);

                if (isMounted) {
                    if (manualDecl) {
                        // console.log("✅ Declaration found:", manualDecl);
                        const { getPaymentDate } = await import('@/lib/business-calendar');

                        // Store full decl
                        setDecl(manualDecl);

                        const manualNote = generateNote(manualDecl);
                        if ((manualDecl.meta as any)?.manualTaxpayer) {
                            manualNote.taxpayer = (manualDecl.meta as any).manualTaxpayer;
                        }
                        setNote(manualNote);

                        // Initialize inputs
                        // 1. Receipt Date (created_at)
                        const rDate = manualDecl.createdAt ? new Date(manualDecl.createdAt) : new Date();
                        // Format for datetime-local: YYYY-MM-DDTHH:mm
                        const toLocalIso = (d: Date) => {
                            const offset = d.getTimezoneOffset() * 60000;
                            return new Date(d.getTime() - offset).toISOString().slice(0, 16);
                        };
                        setEditReceiptDate(toLocalIso(rDate));

                        // 2. Payment Date (meta.manualPaymentDate OR calculated)
                        let pDateStr = (manualDecl.meta as any)?.manualPaymentDate;
                        if (!pDateStr) {
                            pDateStr = getPaymentDate(manualDecl.createdAt);
                        }
                        setEditPaymentDate(toLocalIso(new Date(pDateStr)));
                        // CRITICAL FIX: Clear timeout immediately on success
                        if (timeoutId) clearTimeout(timeoutId);
                    } else {
                        setError(`Déclaration introuvable (${id}).`);
                    }
                }
            } catch (e: any) {
                console.error("Failed to fetch receipt data", e);
                if (isMounted) setError(e.message || "Erreur de chargement");
            }
        }

        fetchManualData();

        // Timeout safeguard
        timeoutId = setTimeout(() => {
            if (isMounted) {
                setError("Le chargement prend trop de temps. Veuillez réessayer.");
            }
        }, 12000);

        return () => { isMounted = false; clearTimeout(timeoutId); };
    }, [id, rawId]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!id || isGeneratingPDF) return;
        setIsGeneratingPDF(true);
        try {
            const { downloadElementAsPDF } = await import('@/lib/pdf-utils');
            await downloadElementAsPDF('printable-root', `recepisse-${id}`);
        } catch (error) {
            console.error('PDF error', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleSaveDates = async () => {
        if (!decl || !id) return;
        setIsSavingDates(true);
        try {
            const { updateDeclaration } = await import('@/lib/store');

            // Convert inputs back to ISO strings
            const newReceiptDate = new Date(editReceiptDate).toISOString();
            const newPaymentDate = new Date(editPaymentDate).toISOString();

            const updates = {
                createdAt: newReceiptDate,
                meta: {
                    ...decl.meta,
                    manualPaymentDate: newPaymentDate
                }
            };

            const result = await updateDeclaration(id, updates);
            if (result.success) {
                // Determine if we need to reload to reflect changes or just update state
                // Reloading is safer to re-run all generators
                window.location.reload();
            } else {
                alert("Erreur lors de la sauvegarde: " + result.error);
            }
        } catch (e) {
            console.error("Save failed", e);
            alert("Erreur interne lors de la sauvegarde.");
        } finally {
            setIsSavingDates(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col gap-4 items-center justify-center text-gray-500 bg-white">
                <p className="text-red-500 font-bold">Erreur: {error}</p>
                <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Réessayer
                    </button>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
                        Retour au Tableau de Bord
                    </button>
                </div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm animate-pulse">Chargement du récépissé...</p>
                <p className="text-xs text-gray-400 font-mono">{id}</p>
            </div>
        );
    }

    const verifyUrl = `https://tax-portal-two.vercel.app/verify/${id}`;

    return (
        <div className="min-h-screen bg-gray-50 pb-10 print:bg-white print:p-0 font-sans text-gray-900">
            {/* Toolbar */}
            <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 mb-6 print:hidden shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center text-gray-600 hover:text-black transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1.5" />
                            <span className="text-sm font-medium">Tableau de bord</span>
                        </button>

                        {/* ADMIN TOGGLE */}
                        <button
                            onClick={() => setShowAdminDates(!showAdminDates)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${showAdminDates ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <CalendarClock className="h-3.5 w-3.5" />
                            {showAdminDates ? 'Masquer Admin' : 'Admin Dates'}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {/* BOUTON BORDEREAU */}
                        <button
                            onClick={() => router.push(`/declarations/${id}/bordereau`)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded text-xs font-medium hover:bg-black transition-colors shadow-sm"
                        >
                            <img src="/logo-solidaire.png" className="h-3 w-auto object-contain bg-white rounded-sm px-0.5" alt="" />
                            Bordereau Banque
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            {isGeneratingPDF ? (
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full mr-1.5" />
                            ) : (
                                <Download className="h-3.5 w-3.5" />
                            )}
                            {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#2C5EB5] text-white rounded text-xs font-medium hover:bg-[#1e4483] transition-colors shadow-sm"
                        >
                            <Scissors className="h-3.5 w-3.5" />
                            Imprimer
                        </button>
                    </div>
                </div>
            </div>

            {/* ADMIN DATE PANEL */}
            {showAdminDates && (
                <div className="max-w-4xl mx-auto mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-inner mb-4 flex flex-wrap items-end gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date Création (Récépissé)</label>
                        <input
                            type="datetime-local"
                            className="px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            value={editReceiptDate}
                            onChange={(e) => setEditReceiptDate(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date Paiement (Banque 48h)</label>
                        <input
                            type="datetime-local"
                            className="px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            value={editPaymentDate}
                            onChange={(e) => setEditPaymentDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSaveDates}
                        disabled={isSavingDates}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        {isSavingDates ? (
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        Sauvegarder
                    </button>
                    <div className="text-[10px] text-blue-600/70 max-w-xs leading-tight ml-auto italic">
                        Les modifications mettent à jour la date enregistrée et forcent la date de paiement pour le bordereau.
                    </div>
                </div>
            )}
        </div>

            {/* Receipt Container - STRICT A4 FORMAT */ }

    {/* WRAPPER pour print.css: ID = printable-root */ }
    <div
        id="printable-root"
        className="mx-auto bg-white relative overflow-hidden"
        style={{ width: '210mm', minHeight: '297mm' }}
    >
        <div
            id="printable-receipt" // L'ID cible du CSS
            ref={receiptRef}
            className="bg-white shadow-xl print:shadow-none w-full h-full p-[10mm] relative flex flex-col justify-between box-border overflow-hidden"
            style={{
                width: '210mm',
                height: '297mm',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
            }}
        >

            {/* 1. TOP COPY (BANQUE) - Grows to fill available space */}
            <div className="flex-1 flex flex-col justify-center">
                <ReceiptView type="BANQUE" note={note} verifyUrl={verifyUrl} />
            </div>

            {/* CENTRE: LIGNE DE DÉCOUPE (Hauteur fixe réduite ULTRA) */}
            <div className="h-[10mm] flex items-center justify-center gap-4 text-gray-400 shrink-0">
                <div className="h-px w-full border-t border-dashed border-gray-400"></div>
                <Scissors className="h-3 w-3 text-gray-400 transform rotate-180" />
                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-gray-400 whitespace-nowrap">COUPER ICI</span>
                <Scissors className="h-3 w-3 text-gray-400" />
                <div className="h-px w-full border-t border-dashed border-gray-400"></div>
            </div>

            {/* 2. BOTTOM COPY (CONTRIBUABLE) - Grows to fill available space */}
            <div className="flex-1 flex flex-col justify-center">
                <ReceiptView type="CONTRIBUABLE" note={note} verifyUrl={verifyUrl} />
            </div>
        </div>

        <p className="no-print text-center text-[10px] text-gray-400 mt-6 mb-12 select-none">
            Format A4 Standard (210 x 297 mm). Ajustez l'échelle à 100% lors de l'impression.
        </p>
    </div>
        </div >
    );
}
