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
import { LEGACY_PRICES } from '@/lib/tax-rules';
import { getTariffMode } from '@/lib/tariff-mode';

import { numberToWords } from '@/lib/number-to-words';
import SPECIMEN_LABEL from '@/lib/label-specimen';
import { clampBordereauDate } from '@/lib/utils';
import { mapCategoryToDisplayLabel } from '@/lib/category-display';

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
    const principalUSD = note.payment.principalTaxUSD;
    const RATE_FC = 2244.76;
    const displayAmountFC_Num = principalUSD * RATE_FC;

    const displayAmountUSD = principalUSD;
    const displayAmountFC = displayAmountFC_Num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const textAmountFC = numberToWords(Math.round(displayAmountFC_Num)).toUpperCase();

    const { formatKinshasaDate, formatKinshasaTime } = require('@/lib/utils');
    const creationDate = note.generatedAt ? new Date(note.generatedAt) : new Date();
    const dateStr = formatKinshasaDate(creationDate);
    const timeStr = formatKinshasaTime(creationDate);

    // Format NDP - 2026 - A519D5D4 (with spaces around dashes like PDF)
    const formattedRef = note.id ? note.id.replace(/^NDP\s*-\s*(\d{4})\s*-?\s*/, 'NDP-$1-') : '';
    const formattedRefDisplay = formattedRef.replace(/^(NDP)-(\d{4})-(.+)$/, '$1 - $2 - $3');

    // Bank name from note or default
    const bankName = (note as any).payment?.bank || (note as any).bank || 'SOLIDAIRE BANQUE';

    // Vehicle fields
    const vehicleIsBoat = note.vehicle.category === 'Bateau';
    const marqueLabel = mapCategoryToDisplayLabel(String(((note as any).meta as any)?.tariffLabel || (note.vehicle as any).manualMarqueType || note.vehicle.category || '-'));
    const modele = (note.vehicle as any).modele || (note.vehicle as any).model || '-';
    const couleur = (note.vehicle as any).couleur || (note.vehicle as any).color || '-';
    const numMoteur = (note.vehicle as any).numMoteur || (note.vehicle as any).motorNumber || '0000';
    const anneeFab = (note.vehicle as any).annee || (note.vehicle as any).yearFab || '-';
    const anneeImmat = (note.vehicle as any).anneeImmat || ((note as any).meta as any)?.manualAnneeImmat || '-';
    const puissance = note.vehicle.fiscalPower ? `${String(note.vehicle.fiscalPower).replace(/(cv|vc)/gi, '').trim()} CV` : '- CV';
    const poids = note.vehicle.weight ? `${note.vehicle.weight} T` : '0 T';
    const categorie = marqueLabel;

    return (
        <div className="w-full bg-white text-[#333333] font-sans text-sm relative">

            {/* Main Ticket Container with dashed border matching PDF reference */}
            <div className="border-2 border-dashed border-gray-400 bg-white rounded-none">

                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
                    {/* Logo DGRK (left) */}
                    <div className="flex-shrink-0 w-[72px]">
                        <img
                            src="/logo-dgrk-form.jpg"
                            alt="Logo DGRK"
                            className="w-full h-auto object-contain max-h-[44px]"
                        />
                    </div>

                    {/* Title center */}
                    <div className="text-center flex-1 leading-tight">
                        <h1 className="text-[18px] font-black uppercase text-[#1F2937] tracking-wider leading-none">RÉCÉPISSÉ</h1>
                        <p className="text-[9.5px] text-gray-500 mt-0.5 font-medium tracking-wide">
                            {vehicleIsBoat ? 'Vignette Bateaux' : 'Vignette Automobile'} | Exercice 2026
                        </p>
                    </div>

                    {/* COPIE BANQUE badge (right) */}
                    <div className="flex-shrink-0 flex justify-end w-[100px]">
                        <span className="border border-gray-400 text-gray-600 text-[8px] font-bold px-2 py-0.5 uppercase tracking-widest whitespace-nowrap bg-white">
                            COPIE {type === 'BANQUE' ? 'BANQUE' : 'CONTRIBUABLE'}
                        </span>
                    </div>
                </div>

                {/* Blue separator line under header */}
                <div className="w-full h-[2px] bg-[#2C5EB5]" />

                {/* ── REFERENCE BANNER ─────────────────────────────── */}
                <div className="text-center py-2 px-3">
                    <h2
                        className="text-[15px] text-[#1D4ED8] font-black tracking-[0.18em] leading-none"
                        style={{ fontFamily: 'var(--font-source-code-pro), "Courier New", monospace' }}
                    >
                        {formattedRefDisplay}
                    </h2>
                    <p className="text-[8px] text-gray-500 uppercase font-semibold mt-1 tracking-wider">
                        N° DE RÉFÉRENCE (À MENTIONNER AU PAIEMENT)
                    </p>
                </div>

                {/* ── MAIN GRID: Left column + Right column ──────────── */}
                <div className="grid px-3 pb-2 gap-2.5" style={{ gridTemplateColumns: '1fr 55mm' }}>

                    {/* ═══ LEFT COLUMN ════════════════════════════════ */}
                    <div className="space-y-2">

                        {/* ── CONTRIBUABLE ── */}
                        <div className="border border-[#D1D5DB]">
                            <div className="px-2 py-[3px] border-b border-[#D1D5DB] bg-white">
                                <h3 className="font-black text-[#1F2937] text-[9px] uppercase tracking-wide">CONTRIBUABLE</h3>
                            </div>
                            <div className="px-2 py-1 space-y-[3px] text-[8.5px]">
                                <div className="grid border-b border-[#F0F0F0] pb-[3px]" style={{ gridTemplateColumns: '130px 1fr' }}>
                                    <span className="font-bold text-gray-600">Noms/Raison Sociale:</span>
                                    <span className="uppercase text-gray-900 break-words leading-tight pl-8">{note.taxpayer.name}</span>
                                </div>
                                <div className="grid border-b border-[#F0F0F0] pb-[3px] pt-[3px]" style={{ gridTemplateColumns: '130px 1fr' }}>
                                    <span className="font-bold text-gray-600">N° Impôt/NIF:</span>
                                    <span className="text-gray-900 pl-8">
                                        {note.taxpayer.name.includes('SOCIMEX') ? 'N/A' : (note.taxpayer.nif || '-')}
                                    </span>
                                </div>
                                <div className="grid pt-[3px]" style={{ gridTemplateColumns: '130px 1fr' }}>
                                    <span className="font-bold text-gray-600">Adresse:</span>
                                    <span className="text-gray-900 break-words leading-tight pl-8">
                                        {(note.taxpayer.address || 'KINSHASA')
                                            .replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, '')
                                            .replace(/^[,/\s-]+/, '')
                                            .replace(/[,/\s-]+$/, '')
                                            .trim() || 'KINSHASA'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── VÉHICULE & TAXATION ── 3 colonnes × 4 lignes comme PDF */}
                        <div className="border border-[#D1D5DB]">
                            <div className="px-2 py-[3px] border-b border-[#D1D5DB] bg-white">
                                <h3 className="font-black text-[#1F2937] text-[9px] uppercase tracking-wide">
                                    {vehicleIsBoat ? 'BATEAUX & TAXATION' : 'VÉHICULE & TAXATION'}
                                </h3>
                            </div>
                            <div className="px-2 py-1 text-[8px]">
                                {/* 3-column grid */}
                                <div className="grid gap-x-2 gap-y-[3px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    {/* Row 1 */}
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">{vehicleIsBoat ? 'Embarcation:' : 'Chassis:'}</span>
                                        <span className="uppercase text-gray-900 truncate">{note.vehicle.chassis || '-'}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Plaque:</span>
                                        <span className="uppercase text-gray-900 truncate">{note.vehicle.plate || '-'}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Usage:</span>
                                        <span className="text-gray-900 truncate">N/A</span>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Marque:</span>
                                        <span className="text-gray-900 truncate lowercase first-letter:uppercase">{marqueLabel}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Modèle:</span>
                                        <span className="text-gray-900 truncate lowercase first-letter:uppercase">{modele}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Couleur:</span>
                                        <span className="text-gray-900 truncate lowercase first-letter:uppercase">{couleur}</span>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">N° Moteur:</span>
                                        <span className="text-gray-900 truncate">{numMoteur}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Année Fab.:</span>
                                        <span className="text-gray-900 truncate">{anneeFab}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 border-b border-[#F0F0F0] pb-[3px] pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Année Immat.:</span>
                                        <span className="text-gray-900 truncate">{anneeImmat}</span>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="flex gap-1 min-w-0 pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Puissance:</span>
                                        <span className="text-gray-900 truncate">{puissance}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Poids:</span>
                                        <span className="text-gray-900 truncate">{poids}</span>
                                    </div>
                                    <div className="flex gap-1 min-w-0 pt-[3px]">
                                        <span className="font-bold text-gray-600 whitespace-nowrap">Catégorie:</span>
                                        <span className="text-gray-900 truncate lowercase first-letter:uppercase">{categorie}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── DÉTAIL DU PAIEMENT ── */}
                        <div className="border border-[#D1D5DB]">
                            <div className="px-2 py-[3px] border-b border-[#D1D5DB] bg-white">
                                <h3 className="font-black text-[#1F2937] text-[9px] uppercase tracking-wide">DÉTAIL DU PAIEMENT</h3>
                            </div>
                            <div className="px-2 py-1.5 text-[8.5px]">
                                <div className="flex justify-between mb-1 border-b border-[#F0F0F0] pb-1">
                                    <span className="text-gray-600">Taxe Principale (USD):</span>
                                    <span className="text-gray-900 font-semibold">${displayAmountUSD.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-0.5">
                                    <div>
                                        <span className="font-black text-[#DC2626] uppercase text-[8.5px] tracking-wide block">MONTANT TOTAL DÛ:</span>
                                        <p className="text-[7px] text-gray-500 italic leading-tight mt-0.5">
                                            (Payable en Francs Congolais au taux du jour)
                                        </p>
                                    </div>
                                    <span className="text-[14px] font-black text-[#DC2626] tracking-tight whitespace-nowrap">FC {displayAmountFC}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── INSTRUCTIONS DE PAIEMENT ── */}
                        <div className="border border-[#E5C96A] bg-[#FFFBEB]">
                            <div className="px-2 py-[3px] border-b border-[#E5C96A]">
                                <h3 className="font-black text-[#92400E] text-[9px] uppercase tracking-wide">INSTRUCTIONS DE PAIEMENT</h3>
                            </div>
                            <div className="px-2 py-1.5 text-[8.5px]">
                                <div className="flex items-baseline gap-1.5 mb-1">
                                    <span className="font-bold text-gray-700 whitespace-nowrap">Banque Sélectionnée:</span>
                                    <span className="font-black text-[#1D4ED8] uppercase">{bankName}</span>
                                </div>
                                <p className="text-[7.5px] text-gray-600 leading-snug">
                                    Veuillez vous rendre dans une agence {bankName} et effectuer le dépôt sur le compte IRMS.
                                    Présentez votre Note de Perception pour finaliser l'opération.
                                </p>
                            </div>
                        </div>

                    </div>
                    {/* ═══ END LEFT COLUMN ════════════════════════════ */}

                    {/* ═══ RIGHT COLUMN: Banque + QR ══════════════════ */}
                    <div className="flex flex-col gap-2 items-center w-[55mm]">

                        {/* Bank Box — gray text, light border */}
                        <div className="border border-[#D1D5DB] flex items-center justify-center w-full" style={{ minHeight: '70px' }}>
                            <p className="text-[8.5px] text-gray-400 font-bold uppercase text-center leading-snug tracking-widest">
                                CADRE RÉSERVÉ<br />À LA BANQUE
                            </p>
                        </div>

                        {/* QR Code block (Strictly 55mm x 55mm square box) */}
                        <div
                            className="border border-[#D1D5DB] p-1.5 bg-white flex flex-col items-center justify-center w-full shrink-0"
                            style={{ width: '55mm', height: '55mm' }}
                        >
                            {verifyUrl ? (
                                <QRCode value={verifyUrl} size={90} viewBox={`0 0 256 256`} />
                            ) : (
                                <div className="w-[90px] h-[90px] bg-gray-100" />
                            )}
                            <p className="text-[7.5px] text-gray-500 italic font-medium mt-1">Scan pour verifier</p>
                        </div>

                        {/* Timestamp */}
                        <div className="text-center w-full">
                            <p className="text-[7.5px] text-gray-500 font-medium">
                                Généré le: {dateStr} {timeStr}
                            </p>
                        </div>
                    </div>
                    {/* ═══ END RIGHT COLUMN ═══════════════════════════ */}

                </div>
                {/* ── END MAIN GRID ──────────────────────────────── */}

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

    const basePrices = getTariffMode() === 'new2026'
        ? Array.from(new Set(GRILLE_2026.map(g => g.tarif.total.toFixed(2))))
        : LEGACY_PRICES.map(p => p.toFixed(2));
    const sortedPrices = [...basePrices].sort((a, b) => parseFloat(a) - parseFloat(b));

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
                const exchangeRate = 2244.76;
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
                                {sortedPrices.map(price => (
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
                                // AUTOMATIC PRICE SELECTION (2026 only)
                                if (getTariffMode() === 'new2026') {
                                    const matchingGrille = GRILLE_2026.find(g => g.label === val);
                                    if (matchingGrille) {
                                        setEditBaseAmount(matchingGrille.tarif.total.toFixed(2));
                                    }
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

            {/* Receipt Container - TWO COPIES ON ONE A4 PAGE */}

            {/* WRAPPER pour print.css: ID = printable-root */}
            <div
                id="printable-root"
                className="mx-auto bg-white relative overflow-hidden"
                style={{ width: '210mm', minHeight: '296.5mm' }}
            >
                <div
                    id="printable-receipt"
                    ref={receiptRef}
                    className="bg-white shadow-xl print:shadow-none w-full h-full p-[10mm] relative flex flex-col box-border"
                    style={{
                        width: '210mm',
                        height: '296.5mm',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                    }}
                >
                    {/* 1. TOP COPY (BANQUE) */}
                    <div className="flex-1 flex flex-col justify-center">
                        <ReceiptView type="BANQUE" note={note} verifyUrl={verifyUrl} />
                    </div>

                    {/* COUPER ICI */}
                    <div className="h-[10mm] flex items-center justify-center gap-4 text-gray-400 shrink-0">
                        <div className="h-px w-full border-t border-dashed border-gray-400"></div>
                        <Scissors className="h-3 w-3 text-gray-400 transform rotate-180" />
                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-gray-400 whitespace-nowrap">COUPER ICI</span>
                        <Scissors className="h-3 w-3 text-gray-400" />
                        <div className="h-px w-full border-t border-dashed border-gray-400"></div>
                    </div>

                    {/* 2. BOTTOM COPY (CONTRIBUABLE) */}
                    <div className="flex-1 flex flex-col justify-center">
                        <ReceiptView type="CONTRIBUABLE" note={note} verifyUrl={verifyUrl} />
                    </div>
                </div>

                <p className="no-print text-center text-[10px] text-gray-400 mt-6 mb-12 select-none">
                    Format A4 Standard (210 x 297 mm). 2 récépissés par page. Ajustez l'échelle à 100% lors de l'impression.
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
                        const categoryFromDecl = mapCategoryToDisplayLabel(
                            (decl?.meta as any)?.tariffLabel ||
                            (decl?.meta as any)?.manualMarqueType ||
                            decl?.category ||
                            note?.vehicle?.category ||
                            (note?.vehicle as any)?.manualMarqueType ||
                            'Utilitaire light'
                        );
                        const validYear = (decl?.meta as any)?.annee_fiscale || (decl?.createdAt ? new Date(decl.createdAt).getFullYear().toString() : new Date().getFullYear().toString());
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
    const BLUE = '#1d4ed8';
    const BLACK = '#111827';

    const yearLabel = data.year || new Date().getFullYear().toString();
    const plate = data.plate || '0000AB00';
    const category = data.category || data.vehicleType || 'Utilitaire light';
    const powerLabel = data.power || '7 CV';
    const weightLabel = data.weight || '1630 T';
    const refId = data.reference || 'VIG-2026-000123';
    const validFromStr = data.validFrom || `01/01/${yearLabel}`;
    const validToStr = data.validTo || `31/12/${yearLabel}`;
    const verifyUrl = data.qrValue || '';

    return (
        <div className="printable-label-card" style={{
            width: '105mm',
            height: '148.5mm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            boxSizing: 'border-box',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cousine:wght@400;700&display=swap');
            `}</style>
            {/*
             * ═══════════════════════════════════════════════════
             *  ÉTIQUETTE — UNE SEULE BORDURE épaisse + arrondie
             * ═══════════════════════════════════════════════════
             */}
            <div style={{
                width: '90mm',
                height: '130mm',
                border: `10px solid ${BLUE}`,   /* épaisse, unique */
                borderRadius: '8mm',
                background: 'white',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: '5mm 4mm 4mm',
                overflow: 'hidden',
            }}>

                {/* ── LOGOS ─────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5mm',
                    width: '100%',
                    marginBottom: '1.5mm',
                    flexShrink: 0,
                }}>
                    {/* DGRK — Nouveau blason avec texte en dessous */}
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img
                            src="/kinshasa-coat.webp"
                            alt="Kinshasa"
                            style={{ height: '12mm', width: 'auto', objectFit: 'contain' }}
                            crossOrigin="anonymous"
                        />
                        <div style={{
                            fontSize: '9px', fontWeight: 900, color: BLACK,
                            fontFamily: 'Arial, Helvetica, sans-serif', marginTop: '1mm',
                            letterSpacing: '0.05em'
                        }}>
                            DGRK
                        </div>
                    </div>
                    {/* IRMS — nouveau logo SVG exact */}
                    <img
                        src="/irms-logo-new.svg"
                        alt="IRMS DGRK"
                        style={{ height: '19mm', width: 'auto', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                    />
                </div>

                {/* ── TITRES ────────────────────────────────── */}
                <div style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: '1.5mm', flexShrink: 0 }}>
                    <div style={{
                        fontSize: '9px', fontWeight: 900, color: BLACK,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        fontFamily: '"Abadi MT Extra Bold", "Abadi MT", Arial, sans-serif',
                        whiteSpace: 'nowrap',
                    }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div style={{
                        fontSize: '8.5px', fontWeight: 300, color: BLACK,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        fontFamily: '"Abadi MT Light", "Abadi MT", Arial, sans-serif',
                        whiteSpace: 'nowrap',
                    }}>
                        VILLE DE KINSHASA/DGRK - TAXE VEHICULE
                    </div>
                </div>

                {/* ── ENCADRÉ VÉHICULE ── */}
                <div style={{
                    width: '90%',
                    border: `1.5px solid ${BLUE}`,
                    borderRadius: '8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '3mm 2mm 1mm',
                    marginBottom: '3mm', flexShrink: 0,
                }}>

                    {/* ── BADGE ANNÉE ───────────────────── */}
                    <div style={{
                        background: BLUE, color: '#fff',
                        fontSize: '24px', fontWeight: 900,
                        letterSpacing: '0.06em',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        borderRadius: '999px',
                        padding: '2.5mm 14mm',
                        lineHeight: 1, marginBottom: '3mm', flexShrink: 0,
                        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                    }}>
                        {yearLabel}
                    </div>

                    {/* ── PLAQUE ────────────────────────────────── */}
                    <div style={{
                        width: '64mm',
                        border: `3.5px solid ${BLUE}`,
                        borderRadius: '5px',
                        padding: '3mm 2mm',
                        textAlign: 'center',
                        fontSize: '30px', fontWeight: 900,
                        fontFamily: '"Cousine", "Courier New", monospace',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: BLACK, lineHeight: 1,
                        background: 'white',
                        marginBottom: '2mm', flexShrink: 0,
                    }}>
                        {plate}
                    </div>

                    {/* ── CATÉGORIE + PUISSANCE + POIDS ─────────── */}
                    <div style={{ textAlign: 'center', marginBottom: '2mm', lineHeight: 1.4, flexShrink: 0 }}>
                        <div style={{
                            fontSize: '8.5px', fontWeight: 600, color: '#222',
                            fontFamily: 'Arial, Helvetica, sans-serif',
                        }}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </div>
                        <div style={{
                            fontSize: '8.5px', fontWeight: 700, color: BLUE,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                        }}>
                            {powerLabel} &nbsp;•&nbsp; {weightLabel}
                        </div>
                    </div>
                </div> {/* ── FIN ENCADRÉ VÉHICULE ── */}

                {/* ── ENCADRÉ SÉCURITÉ (QR + POL) ── */}
                <div style={{
                    width: '90%',
                    border: `1.5px solid ${BLUE}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2mm',
                    marginBottom: '2mm', flexShrink: 0,
                    position: 'relative',
                }}>
                    <div style={{
                        background: 'white',
                        padding: '4px',
                        border: '1.5px solid #d0d0d0',
                        borderRadius: '3px',
                        lineHeight: 0,
                    }}>
                        {verifyUrl ? <QRCode value={verifyUrl} size={104} /> : <div style={{ width: '104px', height: '104px', background: '#f3f4f6' }} />}
                    </div>

                    {/* ── POL. ─ */}
                    <div style={{
                        position: 'absolute',
                        right: '4mm',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        transformOrigin: 'center',
                        color: BLACK,
                        fontSize: '12px', fontWeight: 900,
                        letterSpacing: '0.06em',
                        fontFamily: '"Abadi MT Extra Bold", "Abadi MT", Arial, sans-serif',
                    }}>
                        POL.
                    </div>
                </div>

                {/* ── FOOTER — dans le flux, juste sous l'encadré sécurité ───────── */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '9px', fontWeight: 700,
                    color: BLUE, lineHeight: 1.3,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    flexShrink: 0,
                    marginTop: '-1mm', // pull it up slightly to ensure visibility
                }}>
                    <div>REF: {refId}</div>
                    <div>Valide du {validFromStr} au {validToStr}</div>
                </div>

            </div>{/* fin étiquette */}
        </div>
    );
};
