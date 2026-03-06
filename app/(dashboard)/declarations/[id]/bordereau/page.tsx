'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { Declaration } from '@/types';
import { ArrowLeft, Printer, Download, CalendarClock, Save } from 'lucide-react';
import { calculateTax } from '@/lib/tax-rules';
import { generateNote, DECL_BASE, CONGO_NAMES, generateRandomPhone } from '@/lib/generator';
import { numberToWords } from '@/lib/number-to-words';
import { getPaymentDate } from '@/lib/business-calendar';
import { formatKinshasaDateLong, formatKinshasaTime } from '@/lib/utils';

export default function BordereauPage() {
    const params = useParams();
    // Robust ID retrieval with fallback
    let rawId = params?.id as string;

    // EMERGENCY FALLBACK: If params.id is missing or 'undefined', parse from URL
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx = segments.indexOf('declarations');
            if (idx !== -1 && segments[idx + 1]) {
                const recoveredId = segments[idx + 1];
                if (recoveredId && recoveredId !== '[id]') {
                    rawId = recoveredId;
                    console.warn("⚠️ Params missing. ID recovered from window.location:", rawId);
                }
            }
        } catch (e) { }
    }
    const id = rawId && rawId !== 'undefined' ? decodeURIComponent(rawId).trim() : '';

    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    // --- ADMIN DATE CONTROL STATE ---
    const [showAdminDates, setShowAdminDates] = useState(false);
    const [editReceiptDate, setEditReceiptDate] = useState('');
    const [editPaymentDate, setEditPaymentDate] = useState('');
    const [editBaseAmount, setEditBaseAmount] = useState('');
    const [editMarqueType, setEditMarqueType] = useState('');
    const [isSavingDates, setIsSavingDates] = useState(false);

    useEffect(() => {
        // Charger les styles d'impression
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/print.css';
        link.media = 'print';
        document.head.appendChild(link);

        return () => {
            // Nettoyage optionnel (parfois mieux de laisser pour éviter le flash)
            // document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        if (!id) return;
        getDeclarationById(id).then(d => {
            if (d) {
                setDecl(d);

                // Initialize Admin Fields
                const rDate = d.createdAt ? new Date(d.createdAt) : new Date();
                const toKinshasaLocal = (dateInput: Date | string) => {
                    const date = new Date(dateInput);
                    const kDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Kinshasa' }));
                    const pad = (n: number) => String(n).padStart(2, '0');
                    return `${kDate.getFullYear()}-${pad(kDate.getMonth() + 1)}-${pad(kDate.getDate())}T${pad(kDate.getHours())}:${pad(kDate.getMinutes())}`;
                };
                setEditReceiptDate(toKinshasaLocal(rDate));

                const pDateStr = (d.meta as any)?.manualPaymentDate || getPaymentDate(d.createdAt);
                setEditPaymentDate(toKinshasaLocal(new Date(pDateStr)));

                const currentBase = (d.meta as any)?.manualBaseAmount || d.tax?.baseRate || 0;
                setEditBaseAmount(currentBase.toString());

                setEditMarqueType((d.meta as any)?.manualMarqueType || '');
            }
        });
    }, [id]);

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
            const exchangeRate = 2355;
            const newTotalFC = newBaseAmount * exchangeRate;

            const updates = {
                createdAt: newReceiptDate,
                tax: {
                    ...decl.tax,
                    baseRate: newBaseAmount,
                    totalAmountFC: newTotalFC
                },
                meta: {
                    ...decl.meta,
                    manualPaymentDate: newPaymentDate,
                    manualBaseAmount: newBaseAmount,
                    manualMarqueType: editMarqueType
                }
            };

            const result = await updateDeclaration(id, updates);
            if (result.success) {
                window.location.reload();
            } else {
                alert("Erreur: " + result.error);
            }
        } catch (e) {
            console.error("Save failed", e);
            alert("Erreur système lors de la sauvegarde.");
        } finally {
            setIsSavingDates(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (isGeneratingPDF) return;
        setIsGeneratingPDF(true);
        try {
            const { downloadElementAsPDF } = await import('@/lib/pdf-utils');
            await downloadElementAsPDF('printable-bordereau', `bordereau-${id}`);
        } catch (error) {
            console.error('PDF error', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrint = () => {
        // Force le chargement du fond avant d'imprimer
        const bgImg = new Image();
        bgImg.src = '/bordereau-bg.png';
        bgImg.onload = () => {
            window.print();
        };
        // Fallback rapide
        setTimeout(() => window.print(), 1000);
    };

    if (!decl) return <div className="p-10 text-center font-mono text-sm">Chargement...</div>;

    // Calculs pour le bordereau - Correction HEX
    const idSuffix = id.split('-').pop() || '';
    const declarationVal = parseInt(idSuffix, 16);
    const sequence = !isNaN(declarationVal) ? declarationVal - DECL_BASE : 0;
    const bordereauNo = 39383 + (Math.abs(sequence) % 100000); // Plage plus large pour éviter les doublons bordereau

    const creationDate = decl.createdAt ? new Date(decl.createdAt) : new Date();

    // --- BORDEREAU DATE: use manualPaymentDate if set, otherwise updatedAt/createdAt ---
    // Extract manualPaymentDate directly from meta for maximum reliability
    const manualDate = decl.meta && (decl.meta as any).manualPaymentDate;
    const rawBordereauDate = manualDate || decl.updatedAt || decl.createdAt;
    const bordereauDate = new Date(rawBordereauDate);
    const dateStr = formatKinshasaDateLong(bordereauDate);
    const timeStr = formatKinshasaTime(bordereauDate).replace(':', 'H');

    // Tax calculation
    let displayTotal = 0;
    let displayCredit = 0;
    let timbre = 3.45;
    let taxes = 0.00; // Updated: Total bank fee is 3.45 as per user request
    let taxInfo: any = {}; // Initialize empty

    // RÈGLE BANQUE: arrondi vers le haut (ceiling) + 4 USD frais fixes
    // Récépissé affiche le montant brut (ex: 64.50 USD)
    // Bordereau affiche: Math.ceil(base) + 4 USD (ex: 65 + 4 = 69 USD)

    if ((decl.meta as any)?.manualBaseAmount) {
        // Prix de base saisi manuellement (ex: 64.50, 68.20...)
        const rawBase = parseFloat((decl.meta as any).manualBaseAmount);
        const roundedBase = Math.ceil(rawBase); // 64.50 -> 65, 68.20 -> 69

        displayCredit = roundedBase;            // Montant crédité au compte banque
        displayTotal = roundedBase + 4.00;      // Total bordereau = arrondi + 4 USD frais
        timbre = 3.45;
        taxes = 0.55; // 3.45 + 0.55 = 4.00

        // Build taxInfo for bill breakdown
        taxInfo = {
            textAmount: numberToWords(Math.round(displayTotal)),
            billBreakdown: [
                { value: roundedBase, count: 1, total: roundedBase },
                { value: 4.00, count: 1, total: 4.00 }
            ]
        };
    } else {
        // Calcul automatique standard
        taxInfo = calculateTax(
            Number(decl.vehicle.fiscalPower) || 0,
            decl.vehicle.category,
            decl.vehicle.weight
        );
        displayTotal = taxInfo.totalAmount;          // Math.ceil(base) + 4
        displayCredit = taxInfo.roundedBase ?? taxInfo.creditAmount; // Montant arrondi
        timbre = taxInfo.timbre;                     // 3.45
        taxes = taxInfo.taxe;                        // 0.55
    }

    // --- AUTOMATION: REMETTANT & MOTIF ---

    // 2. Récupérer l'ID NDP pour le motif
    const note = generateNote(decl);
    const taxpayerRef = note.id;

    // Seed based on sequence for stability (use absolute value to avoid negative modulo issues)
    const safeSequence = Math.abs(sequence);
    const facilitatorName = CONGO_NAMES[safeSequence % CONGO_NAMES.length] || 'MUKENDI';

    // Ensure last name is different from first name
    let lastNameIndex = (safeSequence * 7) % CONGO_NAMES.length;
    if (CONGO_NAMES[lastNameIndex] === facilitatorName) {
        lastNameIndex = (lastNameIndex + 1) % CONGO_NAMES.length;
    }
    const facilitatorLastName = CONGO_NAMES[lastNameIndex] || 'TSHIMANGA';

    const facilitatorPhone = generateRandomPhone(safeSequence);

    const remettantDisplay = `${facilitatorName} ${facilitatorLastName} / ${facilitatorPhone}`.replace(/\/ $/, '');
    // --- ADMINISTRATIVE MODIFICATION (POUR TOUS) ---
    // User requested format for Bordereau: NAME /1579A471 (ID Suffix)
    const ownerFullName = (note.taxpayer.name || 'CLIENT').trim().toUpperCase();
    const noteSuffix = note.id.split('-').pop() || '';
    const motifDisplay = `${ownerFullName} /${noteSuffix}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8 text-black" data-version="2026-02-23-14-50">
            {/* VERSION_TAG: 2026_02_23_14_50 */}
            {/* Toolbar */}
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <div className="flex gap-2 items-center">
                    <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                    </button>
                    <button
                        onClick={() => setShowAdminDates(!showAdminDates)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${showAdminDates ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 shadow-sm border border-transparent hover:bg-gray-50'}`}
                    >
                        <CalendarClock className="h-3.5 w-3.5" />
                        {showAdminDates ? 'Masquer Admin' : 'Admin Dates'}
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow-sm text-sm flex items-center gap-2"
                    >
                        {isGeneratingPDF ? (
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Télécharger PDF
                    </button>
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Imprimer
                    </button>
                </div>
            </div>

            {/* ADMIN DATE PANEL */}
            {showAdminDates && (
                <div className="max-w-[210mm] mx-auto mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-inner mb-6 flex flex-wrap items-end gap-4 animate-in fade-in slide-in-from-top-2 no-print">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date & Heure Récépissé</label>
                        <input
                            type="datetime-local"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            value={editReceiptDate}
                            onChange={(e) => setEditReceiptDate(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Date & Heure Bordereau</label>
                        <input
                            type="datetime-local"
                            className="px-2 py-1.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            value={editPaymentDate}
                            onChange={(e) => setEditPaymentDate(e.target.value)}
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
                                <option value="58.70">58.70</option>
                                <option value="63.10">63.10</option>
                                <option value="64.50">64.50</option>
                                <option value="68.20">68.20</option>
                                <option value="70.10">70.10</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Marque / Type</label>
                        <select
                            className="px-2 py-1.5 w-44 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                            value={editMarqueType}
                            onChange={(e) => {
                                const val = e.target.value;
                                setEditMarqueType(val);
                                if (val === 'touristique_medium') setEditBaseAmount('63.10');
                                else if (val === 'touristique_light') setEditBaseAmount('58.70');
                                else if (val === 'touristique_heavy') setEditBaseAmount('70.10');
                                else if (val === 'utilitaire_medium') setEditBaseAmount('64.50');
                                else if (val === 'utilitaire_heavy') setEditBaseAmount('68.20');
                            }}
                        >
                            <option value="">-- Sélectionner --</option>
                            <option value="touristique_heavy">Touristique Heavy</option>
                            <option value="touristique_medium">Touristique Medium</option>
                            <option value="utilitaire_heavy">Utilitaire Heavy</option>
                            <option value="utilitaire_medium">Utilitaire Medium</option>
                        </select>
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

            {/* Zone d'impression - ID root pour CSS */}
            <div
                id="printable-root"
                className="mx-auto"
                style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}
            >
                <div
                    id="printable-bordereau"
                    ref={componentRef}
                    className="relative w-full h-full bg-white shadow-xl px-[30px] py-[20px] text-[10pt] leading-[1.2] box-border"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        fontFamily: '"Courier New", Courier, monospace',
                        fontWeight: 400,
                        position: 'relative'
                    }}
                >
                    {/* Image de fond pour impression */}
                    <img
                        src="/bordereau-bg.png"
                        alt="Fond"
                        className="bg-overlay absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                        style={{ zIndex: 0 }}
                    />

                    {/* Contenu du bordereau */}
                    <div className="content-layer relative z-10 text-gray-800" style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 400 }}>
                        {/* ESPACE POUR LE LOGO */}
                        <div className="h-[120px]"></div>

                        {/* TITRE & NUMERO - ALIGNEMENT CENTRE */}
                        <div className="text-center mb-4 whitespace-pre">
                            <span>BORDEREAU DE VERSEMENT DEVISE No  {bordereauNo}</span>
                        </div>

                        {/* REF ET DATE - ALIGNEMENT GRID */}
                        <div className="whitespace-pre mb-8 pl-10">
                            <span>33000061711-79                                     {dateStr} a {timeStr}</span>
                        </div>

                        {/* BLOC INFO - FORMAT TERMINAL BANCAIRE AVEC TRIANGLE ROUGE (RECALIBRÉ) */}
                        <div className="relative mb-6 text-[10pt] leading-[1.3] whitespace-pre">
                            <div className="flex">
                                <div className="w-[500px]">Agence      ....: 00010 AGENCE GOMBE</div>
                                <div></div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Devise      ....: USD   DOLLAR USA</div>
                                <div>VILLE DE KINSHASA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Caisse      ....: 140   CAISSE SEC. GOMBE USD - 140</div>
                                <div>COLONEL EBEYA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Guichetier  ..: VNGOMBA</div>
                                <div>     GOMBE</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Gestionnaire  : DIRECTEUR GENERAL</div>
                                <div>KINSHASA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]"></div>
                                <div>KINSHASA</div>
                            </div>

                            {/* Symbole rouge banque (reproduction exacte image 834) */}
                            <div className="absolute right-[20px] bottom-[20px]">
                                <svg width="35" height="35" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path
                                        d="M100,0 L100,100 L0,85 C40,75 70,45 100,0 Z"
                                        fill="#C40000"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* REMETTANT & MOTIF - POINTS ALIGNÉS */}
                        <div className="mb-6 mt-8 whitespace-pre text-[10pt]">
                            <div>Nom du remettant ..: {remettantDisplay.toUpperCase()}</div>
                            <div className="ml-[185px]">310 - REP DEM CONGO</div>
                            <div className="mt-1">Motif             : {motifDisplay.toUpperCase()}</div>
                        </div>

                        {/* MONTANTS */}
                        <div className="mb-4 mt-6">
                            <div className="flex">
                                <span className="w-[180px]">Montant versement :</span>
                                <span className="ml-4">{displayTotal.toFixed(2)} USD</span>
                            </div>
                            <div className="flex">
                                <span className="w-[180px]">Timbre ...........:</span>
                                <span className="ml-4 w-[80px]">{timbre.toFixed(2)} USD</span>
                                <span className="ml-8">Taxe ......:</span>
                                <span className="ml-4">{taxes.toFixed(2)} USD</span>
                            </div>
                            <div className="flex">
                                <span className="w-[180px]">Frais ............:</span>
                                <span className="ml-4">0.00 USD</span>
                            </div>
                        </div>

                        {/* GRILLE DE CALCUL */}
                        <div className="mb-6 mt-6">
                            {/* Headers */}
                            <div className="flex text-[9pt]">
                                <span className="w-[60px]">Valeur</span>
                                <span className="w-[60px] text-center">Nombre</span>
                                <span className="w-[80px] text-right">Montant</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[60px] text-center">Nombre</span>
                                <span className="w-[80px] text-right">Montant</span>
                            </div>
                            <div className="flex text-[9pt] text-gray-600">
                                <span className="w-[60px]"></span>
                                <span className="w-[60px] text-center">recu</span>
                                <span className="w-[80px] text-right">recu</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[60px] text-center">rendu</span>
                                <span className="w-[80px] text-right">rendu</span>
                            </div>

                            <div className="mt-2">
                                {/* Dynamic bill rows */}
                                {taxInfo.billBreakdown.map((row: any, i: number) => (
                                    <div key={i} className="flex text-[9pt]">
                                        <span className="w-[60px]">{row.value.toFixed(2).replace('.', ',')}</span>
                                        <span className="w-[60px] text-center">{row.count}</span>
                                        <span className="w-[80px] text-right">{row.total.toFixed(2)}</span>
                                        <span className="w-[80px]"></span>
                                        <span className="w-[60px] text-center">0</span>
                                        <span className="w-[80px] text-right">0.00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Separators - Tirets réduits (CORRECTION MAINTENUE) */}
                            <div className="flex text-[9pt] mt-2">
                                <span className="w-[60px]"></span>
                                <span className="w-[140px]">------------------</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[140px]">------------------</span>
                            </div>

                            {/* Totals - Ajoutés pour compléter la grille comme demandé dans l'exemple */}
                            <div className="flex text-[9pt]">
                                <span className="w-[60px]">Total recu</span>
                                <span className="w-[60px]"></span>
                                <span className="w-[80px] text-right">{displayTotal.toFixed(2)}</span>
                                <span className="w-[40px]"></span>
                                <span className="w-[40px]">Rendu</span>
                                <span className="w-[60px]"></span>
                                <span className="w-[80px] text-right">0.00</span>
                            </div>
                        </div>

                        {/* FOOTER - ALIGNEMENT CARACTÈRE PAR CARACTÈRE (GRID) */}
                        <div className="mt-10 text-[10pt] leading-[1.4] text-gray-800" style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 400 }}>
                            {/* Ligne Crédit & USD - Alignement millimétré des deux-points */}
                            <div className="whitespace-pre">
                                <span className="inline-block">Nous portons au credit du compte no 33000061711-79   USD :</span>
                                <span className="inline-block w-[140px] text-right">{displayCredit.toFixed(2)}</span>
                            </div>

                            {/* Ligne Valeur - Alignement parfait (50 espaces + Valeur :) */}
                            <div className="whitespace-pre">
                                <span className="inline-block">                                                  Valeur :</span>
                                <span className="inline-block w-[140px] text-right">{dateStr}</span>
                            </div>

                            {/* Montant en lettres - Ver: 1.0.1 */}
                            <div className="mt-2 text-gray-800">
                                <span>soit montant {numberToWords(Math.round(displayCredit)).toLowerCase()} usd</span>
                            </div>

                            {/* Matrice de signatures */}
                            <div className="mt-2 whitespace-pre leading-[1.3] text-gray-800 relative">

                                <div>------------------------------------</div>
                                <div>      CLIENT       !    GUICHETIER    !</div>
                                <div>                   !                  !</div>
                                <div>                   !                  !</div>
                                <div>                   !                  !  OPERATION EFFECTUEE</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
