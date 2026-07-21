'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { generateNote } from '@/lib/generator';
import { NoteDePerception } from '@/types';
import QRCode from 'react-qr-code';
import { ArrowLeft, Download, Scissors, CalendarClock, Save, X, Printer, Edit3 } from 'lucide-react';
import { updateDeclaration } from '@/lib/store';
import { GRILLE_2026 } from '@/lib/tarif-2026';

import { numberToWords } from '@/lib/number-to-words';
import SPECIMEN_LABEL from '@/lib/label-specimen';
import { clampBordereauDate } from '@/lib/utils';

// --- Label data shape (user-provided JSON) ---
type LabelData = {
    document_type?: string;
    emetteur?: string;
    statut?: string;
    reference?: string;
    plaque_immatriculation?: string;
    annee_fiscale?: string;
    categorie_vehicule?: string;
    date_emission?: string;
    date_expiration?: string;
    qr_code?: string | null;
    couleurs?: { principale?: string; secondaire?: string; texte?: string };
    mentions?: string[];
    // convenience fields
    logoLeft?: string;
    logoRight?: string;
};

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
    // Force rate to 2355 as per user requirement
    const principalUSD = note.payment.principalTaxUSD;
    const RATE_FC = 2414.93;
    const displayAmountFC_Num = principalUSD * RATE_FC;

    const displayAmountUSD = principalUSD;
    const displayAmountFC = displayAmountFC_Num.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const textAmountFC = numberToWords(Math.round(displayAmountFC_Num)).toUpperCase();

    const { formatKinshasaDate, formatKinshasaTime } = require('@/lib/utils');
    const creationDate = note.generatedAt ? new Date(note.generatedAt) : new Date();
    const dateStr = formatKinshasaDate(creationDate);
    const timeStr = formatKinshasaTime(creationDate);

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
                        <p className="text-[9px] text-gray-500 mt-0 font-medium tracking-wide">
                            {note.vehicle.category === 'Bateau' ? 'Vignette Bateaux' : 'Vignette Automobile'} | Exercice 2026
                        </p>
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
                                    <span className="font-medium text-gray-800">
                                        {note.taxpayer.name.includes('SOCIMEX') ? 'N/A' : (note.taxpayer.nif || '-')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[180px_1fr] pt-0.5">
                                    <span className="font-bold text-gray-600">Adresse:</span>
                                    <span className="font-medium text-gray-800 text-[9px] break-words leading-tight truncate">
                                        {(note.taxpayer.address || 'KINSHASA')
                                            .replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, '')
                                            .replace(/^[,/\s-]+/, '')
                                            .replace(/[,/\s-]+$/, '')
                                            .trim() || 'KINSHASA'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* VÉHICULE & TAXATION - 3 Columns Grid (complet, identique au document officiel) */}
                        <div className="border border-[#E0E0E0] rounded-sm bg-white overflow-hidden">
                            <div className="px-2 py-0.5 bg-white border-b border-[#E0E0E0]">
                                <h3 className="font-bold text-[#333333] text-[8px] uppercase tracking-wide">
                                    {note.vehicle.category === 'Bateau' ? 'BATEAUX & TAXATION' : 'VÉHICULE & TAXATION'}
                                </h3>
                            </div>
                            <div className="px-2 py-1 grid grid-cols-3 gap-x-2 gap-y-0.5 text-[8px]">
                                {/* Ligne 1 : Chassis | Plaque | Usage */}
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">{note.vehicle.category === 'Bateau' ? 'Embarcation:' : 'Chassis:'}</span>
                                    <span className="uppercase font-bold text-gray-800 truncate">{note.vehicle.chassis || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Plaque:</span>
                                    <span className="uppercase font-bold text-gray-800 truncate">{note.vehicle.plate || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Usage:</span>
                                    <span className="font-medium text-gray-800 truncate">N/A</span>
                                </div>

                                {/* Ligne 2 : Marque | Modèle | Couleur */}
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Marque:</span>
                                    <span className="uppercase font-medium text-gray-800 truncate">{note.vehicle.marque || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Modèle:</span>
                                    <span className="uppercase font-medium text-gray-800 truncate">{note.vehicle.modele || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Couleur:</span>
                                    <span className="uppercase font-medium text-gray-800 truncate">{note.vehicle.couleur || '-'}</span>
                                </div>

                                {/* Ligne 3 : N° Moteur | Année Fab. | Année Immat. */}
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">N° Moteur:</span>
                                    <span className="uppercase font-medium text-gray-800 truncate">{(note.vehicle as any).moteur || '0000'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Année Fab.:</span>
                                    <span className="font-medium text-gray-800 truncate">{note.vehicle.annee || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Année Immat.:</span>
                                    <span className="font-medium text-gray-800 truncate">{(note.vehicle as any).anneeImmat || (note.vehicle as any).manualAnneeImmat || '-'}</span>
                                </div>

                                {/* Ligne 4 : Puissance | Poids | Catégorie */}
                                <div className="flex gap-1 min-w-0 pt-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Puissance:</span>
                                    <span className="font-medium text-gray-800 truncate">{note.vehicle.fiscalPower ? `${String(note.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim()} CV` : '- CV'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 pt-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Poids:</span>
                                    <span className="font-medium text-gray-800 truncate">{note.vehicle.weight || '-'}</span>
                                </div>
                                <div className="flex gap-1 min-w-0 pt-0.5">
                                    <span className="font-bold text-gray-600 whitespace-nowrap">Catégorie:</span>
                                    <span className="font-medium text-gray-800 truncate">
                                        {(() => {
                                            const rawLabel = String((note.meta as any)?.tariffLabel || (note.vehicle as any).manualMarqueType || note.vehicle.category || '-');
                                            // Supprimer les chiffres, tirets, "CV", caractères spéciaux – garder uniquement les mots alphabétiques principaux
                                            const clean = rawLabel
                                                .replace(/_/g, ' ')
                                                .replace(/\d+\s*[–\-–—]\s*\d+\s*(cv|vc)?/gi, '') // ex: "11–15 CV"
                                                .replace(/\b\d+\s*(cv|vc|t|kg|to?n?n?e?s?)\b/gi, '') // ex: "15 CV", "3.5 T"
                                                .replace(/[–—\-\/\\|()\[\]{}#@!?*+<>]/g, ' ')
                                                .replace(/\s{2,}/g, ' ')
                                                .trim();
                                            return clean || rawLabel;
                                        })()}
                                    </span>
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
        </div >
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
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // --- ADMIN DATE CONTROL STATE ---
    const [decl, setDecl] = useState<any>(null); // Store full declaration
    const [showAdminDates, setShowAdminDates] = useState(false);
    const [editReceiptDate, setEditReceiptDate] = useState('');
    const [editPaymentDate, setEditPaymentDate] = useState('');
    const [editBaseAmount, setEditBaseAmount] = useState('');
    const [editMarqueType, setEditMarqueType] = useState(''); // NEW: Marque Override
    const [editPlate, setEditPlate] = useState('');
    const [editNIF, setEditNIF] = useState('');
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCouleur, setEditCouleur] = useState('');
    const [editAnneeFab, setEditAnneeFab] = useState('');
    const [editAnneeImmat, setEditAnneeImmat] = useState('');
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
                        // Format commune-only addresses as "N/A, Commune"
                        const COMMUNES = ['GOMBE', 'KINTAMBO', 'NGALIEMA', 'LIMETE', 'MAKALA', 'BANDALUNGWA'];
                        const addr = (manualNote.taxpayer.address || '').trim().toUpperCase();
                        if (COMMUNES.includes(addr)) {
                            const raw = (manualNote.taxpayer.address || '').trim();
                            manualNote.taxpayer.address = `N/A, ${raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()}`;
                        }
                        // Manual Marque Override
                        if ((manualDecl.meta as any)?.manualMarqueType) {
                            (manualNote.vehicle as any).manualMarqueType = (manualDecl.meta as any).manualMarqueType;
                        }

                        setNote(manualNote);

                        // Initialize inputs
                        // 1. Receipt Date (meta.manualReceiptDate OR createdAt)
                        const rDateStr = (manualDecl.meta as any)?.manualReceiptDate || manualDecl.createdAt;
                        const rDate = rDateStr ? new Date(rDateStr) : new Date();
                        // Format for datetime-local: YYYY-MM-DDTHH:mm
                        // Format for datetime-local: YYYY-MM-DDTHH:mm (Strictly Kinshasa Time)
                        const toKinshasaLocal = (dateInput: Date | string) => {
                            const d = new Date(dateInput);
                            // Shift to UTC then add 1 hour for Kinshasa
                            const kinshasaDate = new Date(d.toLocaleString('en-US', { timeZone: 'Africa/Kinshasa' }));
                            const pad = (n: number) => String(n).padStart(2, '0');
                            return `${kinshasaDate.getFullYear()}-${pad(kinshasaDate.getMonth() + 1)}-${pad(kinshasaDate.getDate())}T${pad(kinshasaDate.getHours())}:${pad(kinshasaDate.getMinutes())}`;
                        };
                        setEditReceiptDate(toKinshasaLocal(rDate));

                        // 2. Payment Date (meta.manualPaymentDate OR calculated)
                        let pDateStr = (manualDecl.meta as any)?.manualPaymentDate;
                        if (!pDateStr) {
                            pDateStr = getPaymentDate(manualDecl.createdAt);
                        }
                        setEditPaymentDate(toKinshasaLocal(new Date(pDateStr)));

                        // 3. Base Amount (Manual or Existing)
                        const currentBase = (manualDecl.meta as any)?.manualBaseAmount || manualDecl.tax?.baseRate || 0;
                        setEditBaseAmount(currentBase.toString());

                        // 4. Marque/Type Override
                        const currentMarque = (manualDecl.meta as any)?.manualMarqueType || '';
                        setEditMarqueType(currentMarque);

                        // 5. Plate, NIF, Name, Address
                        const currentPlate = (manualDecl.meta as any)?.manualPlate || manualDecl.vehicle?.plate || '';
                        const currentNIF = (manualDecl.meta as any)?.manualNIF || manualDecl.taxpayer?.nif || '';
                        const currentName = (manualDecl.meta as any)?.manualTaxpayerName || manualDecl.taxpayer?.name || '';
                        const currentAddress = (manualDecl.meta as any)?.manualTaxpayerAddress || manualDecl.taxpayer?.address || '';
                        setEditPlate(currentPlate);
                        setEditNIF(currentNIF);
                        setEditName(currentName);
                        setEditAddress(currentAddress);
                        setEditCouleur(manualDecl.vehicle?.couleur || '');
                        setEditAnneeFab(manualDecl.vehicle?.annee || '');
                        setEditAnneeImmat((manualDecl.vehicle as any)?.anneeImmat || (manualDecl.meta as any)?.manualAnneeImmat || '');

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

    const setupPrintMode = (cssClass: string) => {
        document.body.classList.add(cssClass);
        const cleanup = () => {
            document.body.classList.remove(cssClass);
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
    };

    const handlePrint = () => {
        setupPrintMode('print-root');
        window.print();
    };

    const handlePrintLabelPreview = () => {
        const el = document.getElementById('printable-label-page');
        if (!el) return alert('Étiquette introuvable pour impression.');
        setupPrintMode('print-label');
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!id || isGeneratingPDF || isBulkDownloading) return;
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

    const handleDownloadLabelSheetPDF = async () => {
        if (!id || isGeneratingPDF || isBulkDownloading) return;
        setIsBulkDownloading(true);
        try {
            const { downloadElementAsPDF } = await import('@/lib/pdf-utils');
            await downloadElementAsPDF('printable-label-page', `etiquettes-${id}`);
        } catch (error) {
            console.error('Label PDF error', error);
        } finally {
            setIsBulkDownloading(false);
        }
    };

    const handleSaveDates = async () => {
        if (!decl || !id) return;
        setIsSavingDates(true);
        try {
            const { updateDeclaration } = await import('@/lib/store');

            const parseKinshasa = (localStr: string) => {
                if (!localStr) return new Date().toISOString();
                return new Date(`${localStr}:00+01:00`).toISOString();
            };

            const newReceiptDate = parseKinshasa(editReceiptDate);
            const newPaymentDate = parseKinshasa(editPaymentDate);
            const newBaseAmount = parseFloat(editBaseAmount);

            // Get original values for comparison
            const origReceipt = (decl.meta as any)?.manualReceiptDate || decl.createdAt;
            const origPayment = (decl.meta as any)?.manualPaymentDate;
            const origBase = (decl.meta as any)?.manualBaseAmount || decl.tax?.baseRate || 0;
            const origPlate = (decl.meta as any)?.manualPlate || decl.vehicle?.plate || '';
            const origCouleur = decl.vehicle?.couleur || '';
            const origAnnee = decl.vehicle?.annee || '';
            const origAnneeImmat = (decl.vehicle as any)?.anneeImmat || (decl.meta as any)?.manualAnneeImmat || '';
            const origMarque = (decl.meta as any)?.manualMarqueType || '';
            const origNIF = (decl.meta as any)?.manualNIF || decl.taxpayer?.nif || '';
            const origName = (decl.meta as any)?.manualTaxpayerName || decl.taxpayer?.name || '';
            const origAddress = (decl.meta as any)?.manualTaxpayerAddress || decl.taxpayer?.address || '';

            // Only build updates with changed fields
            const updates: any = { meta: { ...decl.meta } };

            // Dates
            if (newReceiptDate !== origReceipt) updates.meta.manualReceiptDate = newReceiptDate;
            if (newPaymentDate !== origPayment) updates.meta.manualPaymentDate = newPaymentDate;

            // Tax
            if (newBaseAmount !== origBase) {
                const exchangeRate = 2414.93;
                updates.tax = { ...decl.tax, baseRate: newBaseAmount, totalAmountFC: newBaseAmount * exchangeRate };
                updates.meta.manualBaseAmount = newBaseAmount;
            }

            // Vehicle
            const vehicleChanged = editPlate !== origPlate || editCouleur !== origCouleur || editAnneeFab !== origAnnee || editAnneeImmat !== origAnneeImmat;
            if (vehicleChanged) {
                updates.vehicle = { ...decl.vehicle, plate: editPlate, couleur: editCouleur, annee: editAnneeFab, anneeImmat: editAnneeImmat };
                if (editPlate !== origPlate) updates.meta.manualPlate = editPlate;
                if (editCouleur !== origCouleur) updates.meta.manualCouleur = editCouleur;
                if (editAnneeFab !== origAnnee) updates.meta.manualAnneeFab = editAnneeFab;
                if (editAnneeImmat !== origAnneeImmat) updates.meta.manualAnneeImmat = editAnneeImmat;
            }

            // Marque
            if (editMarqueType !== origMarque) updates.meta.manualMarqueType = editMarqueType;

            // Taxpayer
            const taxpayerChanged = editNIF !== origNIF || editName !== origName || editAddress !== origAddress;
            if (taxpayerChanged) {
                updates.taxpayer = { ...decl.taxpayer, nif: editNIF, name: editName, address: editAddress, type: decl.taxpayer?.type || 'N/A' };
                if (editNIF !== origNIF) { updates.meta.manualNIF = editNIF; }
                if (editName !== origName) { updates.meta.manualTaxpayerName = editName; updates.meta.manualTaxpayer = { name: editName, nif: editNIF, address: editAddress }; updates.meta.taxpayerData = { name: editName, nif: editNIF, address: editAddress }; }
                if (editAddress !== origAddress) { updates.meta.manualTaxpayerAddress = editAddress; }
            }

            // Check if anything actually changed
            if (Object.keys(updates).length === 1 && Object.keys(updates.meta).length === Object.keys(decl.meta || {}).length) {
                alert('Aucune modification détectée.');
                setIsSavingDates(false);
                return;
            }

            const result = await updateDeclaration(id, updates);
            if (result.success) {
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

    const DOMAIN = "irms-dgrk-tax.vercel.app";
    const verifyUrl = `https://${DOMAIN}/verify/${id}`;

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
                        <button
                            onClick={() => router.push(`/declarations/${id}/label`)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            <Scissors className="h-3.5 w-3.5" />
                            Étiquette
                        </button>

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
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date & Heure Récépissé</label>
                            <input
                                type="datetime-local"
                                className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                                value={editReceiptDate}
                                onChange={(e) => {
                                    const newReceipt = e.target.value;
                                    setEditReceiptDate(newReceipt);
                                    setEditPaymentDate(clampBordereauDate(newReceipt, editPaymentDate));
                                }}
                            />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date & Heure Bordereau</label>
                            <input
                                type="datetime-local"
                                className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                                value={editPaymentDate}
                                onChange={(e) => {
                                    setEditPaymentDate(clampBordereauDate(editReceiptDate, e.target.value));
                                }}
                            />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Prix de Base ($)</label>
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-blue-800 font-bold text-xs z-10">$</span>
                            <select
                                className="pl-5 pr-2 py-1.5 w-32 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono font-bold text-blue-900"
                                value={parseFloat(editBaseAmount).toFixed(2)}
                                onChange={(e) => setEditBaseAmount(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {Array.from(new Set(GRILLE_2026.map(g => g.tarif.total.toFixed(2)))).sort((a, b) => parseFloat(a) - parseFloat(b)).map(price => (
                                    <option key={price} value={price}>{price}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Marque / Type (Override)</label>
                        <select
                            className="px-2 py-1.5 w-full md:w-48 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            value={editMarqueType}
                            onChange={(e) => {
                                const val = e.target.value;
                                setEditMarqueType(val);
                                // AUTOMATIC PRICE SELECTION
                                const matchingGrille = GRILLE_2026.find(g => g.label === val);
                                if (matchingGrille) {
                                    setEditBaseAmount(matchingGrille.tarif.total.toFixed(2));
                                }
                            }}
                        >
                            <option value="">-- Sélectionner --</option>
                            {GRILLE_2026.map(g => (
                                <option key={g.label} value={g.label}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Plaque d'immatriculation</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium w-32"
                            placeholder="1234AB01"
                            value={editPlate}
                            onChange={(e) => setEditPlate(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">NIF</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium w-40"
                            placeholder="A1234567K"
                            value={editNIF}
                            onChange={(e) => setEditNIF(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Nom / Raison Sociale</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            placeholder="Josuah Kitona"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[280px]">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Adresse Complète</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            placeholder="12 Av. de la Libération, Gombe"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Couleur</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium w-32"
                            placeholder="GRISE"
                            value={editCouleur}
                            onChange={(e) => setEditCouleur(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Année Fab.</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium w-24"
                            placeholder="2016"
                            value={editAnneeFab}
                            onChange={(e) => setEditAnneeFab(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Année Immat.</label>
                        <input
                            type="text"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium w-24"
                            placeholder="2022"
                            value={editAnneeImmat}
                            onChange={(e) => setEditAnneeImmat(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSaveDates}
                        disabled={isSavingDates}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        {isSavingDates ? (
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        Sauvegarder
                    </button>
                    <div className="text-[10px] text-blue-600/70 max-w-xs leading-tight ml-auto italic text-right">
                        Effet immédiat après validation.<br />
                        Toutes les rubriques sont synchronisées.
                    </div>
                </div>
            )}

            {/* Receipt Container - STRICT A4 FORMAT */}

            {/* WRAPPER pour print.css: ID = printable-root */}
            <div
                id="printable-root"
                className="mx-auto bg-white relative overflow-hidden"
                style={{ width: '210mm', minHeight: '296.5mm' }}
            >
                <div
                    id="printable-receipt" // L'ID cible du CSS
                    ref={receiptRef}
                    className="bg-white shadow-xl print:shadow-none w-full h-full p-[10mm] relative flex flex-col justify-between box-border overflow-hidden"
                    style={{
                        width: '210mm',
                        height: '296.5mm',
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

            <div className="mt-6 px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <h2 className="text-sm font-semibold text-gray-800">Aperçu du modèle d’étiquette DGRK</h2>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handlePrintLabelPreview}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#2C5EB5] text-white rounded text-xs font-medium hover:bg-[#1e4483] transition-colors"
                        >
                            <Scissors className="h-3.5 w-3.5" />
                            Imprimer 4 étiquettes A6
                        </button>
                        <button
                            onClick={handleDownloadLabelSheetPDF}
                            disabled={isBulkDownloading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            {isBulkDownloading ? (
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                            ) : (
                                <Download className="h-3.5 w-3.5" />
                            )}
                            {isBulkDownloading ? 'Génération...' : 'Télécharger 4 étiquettes A6'}
                        </button>
                    </div>
                </div>
                <div className="flex justify-center">
                    {(() => {
                        const userProvided = SPECIMEN_LABEL;
                        const declRef = (decl && (decl.reference || decl.id)) || id;
                        const categoryFromDecl = (decl && ((decl.meta && (decl.meta as any).manualMarqueType) || decl.category)) || note?.vehicle?.category || (note?.vehicle as any)?.manualMarqueType || 'Utilitaire light';
                        const validYear = userProvided.annee_fiscale || new Date().getFullYear().toString();
                        const validFrom = decl && decl.createdAt ? new Date(decl.createdAt) : new Date(`${validYear}-01-01`);
                        const validTo = new Date(`${validYear}-12-31`);

                        const labelData = {
                            year: validYear,
                            plate: userProvided.plaque_immatriculation || (note?.vehicle?.plate || id),
                            vehicleType: categoryFromDecl,
                            category: categoryFromDecl,
                            power: note?.vehicle?.fiscalPower ? `${String(note.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim()} CV` : 'N/A',
                            weight: note?.vehicle?.weight || 'N/A',
                            reference: userProvided.reference || (note?.id || declRef),
                            declarationNumber: declRef,
                            validFrom: `${String(validFrom.getDate()).padStart(2,'0')}/${String(validFrom.getMonth()+1).padStart(2,'0')}/${validFrom.getFullYear()}`,
                            validTo: `${String(validTo.getDate()).padStart(2,'0')}/${String(validTo.getMonth()+1).padStart(2,'0')}/${validTo.getFullYear()}`,
                            qrValue: userProvided.qr_code || verifyUrl,
                            logoLeft: userProvided.logoLeft || '/dgrk-logo.jpg',
                            logoRight: userProvided.logoRight || '/irms-logo-open.png',
                            mentions: userProvided.mentions || ['SPECIMEN - Document non valide']
                        };

                        return (
                            <div
                                id="printable-label-page"
                                className="overflow-hidden"
                                style={{
                                    width: '210mm',
                                    height: '297mm',
                                    minWidth: '210mm',
                                    minHeight: '297mm',
                                    background: '#f9fbff',
                                    padding: '0',
                                    boxSizing: 'border-box',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 105mm)',
                                    gridTemplateRows: 'repeat(2, 148.5mm)',
                                    gap: '0',
                                    margin: '0',
                                    border: 'none'
                                }}
                            >
                                <LabelTemplate data={labelData} />
                                <LabelTemplate data={labelData} />
                                <LabelTemplate data={labelData} />
                                <LabelTemplate data={labelData} />
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div >
    );
}

const LabelTemplate = ({ data }: { data: any }) => {
    const year = data.year || new Date().getFullYear().toString();
    const plate = data.plate || '0000AB00';
    const category = data.category || data.vehicleType || 'Utilitaire light';
    const powerText = data.power || '7 CV';
    const weightText = data.weight || '1630 T';
    const refText = data.reference || 'VIG-2026-000123';
    const declarationNumber = data.declarationNumber || 'DECL-2026-XXXXXX';
    const validFrom = data.validFrom || `01/01/${year}`;
    const validTo = data.validTo || `31/12/${year}`;
    const verifyUrlLabel = data.qrValue || '';

    const labelStyle: React.CSSProperties = {
        width: '105mm',
        height: '148.5mm',
        padding: '1.5mm',
        boxSizing: 'border-box',
        background: '#f9fbff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        border: '3mm solid #1d4ed8',
        borderRadius: '7mm',
        padding: '3mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#ffffff',
        boxSizing: 'border-box',
    };

    const topHeader: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '4mm',
        marginBottom: '1.5mm',
    };

    const logoBox: React.CSSProperties = {
        width: '24mm',
        minWidth: '24mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const titleBlock: React.CSSProperties = {
        flex: 1,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.5mm',
    };

    const titleText: React.CSSProperties = {
        fontSize: '7px',
        fontWeight: 800,
        color: '#1d4ed8',
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        lineHeight: 1.1,
    };

    const subtitleText: React.CSSProperties = {
        fontSize: '6px',
        fontWeight: 700,
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
    };

    const separatorStyle: React.CSSProperties = {
        height: '0.6mm',
        width: '100%',
        background: '#1d4ed8',
        margin: '2mm 0',
    };

    const yearStyle: React.CSSProperties = {
        width: '56%',
        margin: '0 auto',
        borderRadius: '999px',
        background: '#1d4ed8',
        color: '#fff',
        fontSize: '22px',
        fontWeight: 900,
        textAlign: 'center',
        padding: '3mm 0',
        letterSpacing: '0.16em',
    };

    const plateStyle: React.CSSProperties = {
        width: '100%',
        border: '4px solid #111',
        borderRadius: '6px',
        padding: '4.5mm 3mm',
        marginTop: '4mm',
        textAlign: 'center',
        fontSize: '34px',
        fontWeight: 900,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        background: '#ffffff',
    };

    const categoryStyle: React.CSSProperties = {
        marginTop: '3mm',
        fontSize: '9px',
        fontWeight: 800,
        color: '#1d4ed8',
        textTransform: 'capitalize',
        letterSpacing: '0.08em',
    };

    const infoStyle: React.CSSProperties = {
        fontSize: '8.5px',
        color: '#1d4ed8',
        fontWeight: 700,
        textAlign: 'center',
        marginTop: '1mm',
    };

    const middleGrid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4mm',
        marginTop: '5mm',
    };

    const squareBox: React.CSSProperties = {
        width: '100%',
        minHeight: '35mm',
        background: '#f8fafc',
        borderRadius: '5px',
        border: '0.75mm solid #d1d5db',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const hologramStyle: React.CSSProperties = {
        width: '100%',
        minHeight: '35mm',
        borderRadius: '5px',
        border: '0.75mm dashed #9ca3af',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2mm',
        color: '#9ca3af',
        fontSize: '8px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1.2,
    };

    const footerRow: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '4mm',
        marginTop: '4mm',
        fontSize: '7.5px',
        lineHeight: 1.3,
        color: '#111827',
        fontWeight: 700,
    };

    const footerLeft: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5mm',
    };

    return (
        <div className="printable-label-card" style={labelStyle}>
            <div style={cardStyle}>
                <div style={topHeader}>
                    <div style={logoBox}>
                        <img src={data.logoLeft || '/logo-dgrk-form.jpg'} alt="DGRK" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                    <div style={titleBlock}>
                        <span style={titleText}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</span>
                        <span style={subtitleText}>VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES</span>
                    </div>
                    <div style={logoBox}>
                        <img src={data.logoRight || '/irms-logo-open.png'} alt="IRMS" style={{ width: '100%', height: 'auto' }} crossOrigin="anonymous" />
                    </div>
                </div>

                <div style={separatorStyle} />

                <div style={yearStyle}>{year}</div>
                <div style={plateStyle}>{plate}</div>
                <div style={categoryStyle}>{category}</div>
                <div style={infoStyle}>{powerText} • {weightText}</div>

                <div style={middleGrid}>
                    <div style={squareBox}>
                        {verifyUrlLabel ? <QRCode value={verifyUrlLabel} size={110} /> : <div style={{ width: '86px', height: '86px', background: '#fff' }} />}
                    </div>
                    <div style={hologramStyle}>HOLOGRAMME<br />ZONE</div>
                </div>

                <div style={footerRow}>
                    <div style={footerLeft}>
                        <span>N° Déclaration: {declarationNumber}</span>
                        <span>REF: {refText}</span>
                        <span>{`Valide du ${validFrom}`}</span>
                        <span>{`au ${validTo}`}</span>
                    </div>
                    <div style={{ textAlign: 'right', color: '#1d4ed8', fontSize: '7.5px' }}>{category}</div>
                </div>
            </div>
        </div>
    );
};
