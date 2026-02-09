'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { Declaration } from '@/types';
import { ArrowLeft, Printer, Download } from 'lucide-react';

export default function BordereauPage({ params }: { params: { id: string } }) {
    let rawId = params?.id;
    if ((!rawId || rawId === 'undefined') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx = segments.indexOf('declarations');
            if (idx !== -1) rawId = segments[idx + 1];
        } catch (e) { }
    }
    const id = rawId ? decodeURIComponent(rawId) : '';

    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        getDeclarationById(id).then(d => {
            if (d) setDecl(d);
        });
    }, [id]);

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

    if (!decl) return <div className="p-10 text-center font-mono text-sm">Chargement...</div>;

    // Extract numeric sequence safely (handles KP001, DECL-123, etc)
    const idSuffix = id.split('-').pop() || '';
    const numericPart = idSuffix.replace(/\D/g, ''); // Remove non-digits (KP001 -> 001)
    const sequence = parseInt(numericPart, 10) || 0;
    const bordereauNo = 30078 + (sequence % 10000);
    const rabRef = `RAB${25118948 + sequence}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Try to get taxpayer name
    const taxpayerName = (decl.meta as any)?.manualTaxpayer?.name || decl.vehicle.type || 'CLIENT';

    // Dynamic Tax Calculation
    const { calculateTax } = require('@/lib/tax-rules');
    const taxInfo = calculateTax(decl.vehicle.fiscalPower || 0, decl.vehicle.type || '');

    // Extract dynamic values
    const amount = taxInfo.creditAmount; // Base credited amount (e.g. 65)
    // Note: On the slip, "Montant versement" usually includes fees?
    // Let's re-read the images carefully.
    // Image 63$: Total Recu 63.00. Credit 59.00. Versement top says 63.00. 
    // Image 69$: Total Recu 73.00 (Wait, image 2 is 73). Credit 69.00. Versement top says 73.00.
    // Image 69$: Total Recu 69.00. Credit 65.00. Versement top says 69.00.
    // So "Montant versement" at top = TOTAL AMOUNT.

    const displayTotal = taxInfo.totalAmount;
    const displayCredit = taxInfo.creditAmount;
    const timbre = taxInfo.timbre;
    const taxes = taxInfo.taxe; // This is the 0.55 floating right?

    // Warning: The image shows: 
    // Montant versement: 63.00
    // Timbre: 3.45
    // Frais: 0.00
    // Taxe ... : 0.55 (Floating right)
    // The sum 3.45 + 0.55 = 4.00.
    // Credit = Total - 4.00.
    // This matches our logic.

    const handlePrint = () => window.print();

    // Style STRICT Noir & Blanc + Police Courier + FOND
    const monoStyle = {
        fontFamily: '"Courier New", Courier, monospace',
        fontWeight: 400,
        color: 'black',
        backgroundImage: 'url(/bordereau-bg.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat'
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 font-mono text-black print:bg-white print:p-0">
            {/* Toolbar */}
            <div className="max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center print:hidden">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
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

            {/* PAPER */}
            <div
                id="printable-bordereau"
                ref={componentRef}
                className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-[40px] text-[13px] leading-tight relative print:w-[210mm] print:mx-auto h-[297mm] box-border"
                style={{ ...monoStyle, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
                {/* ESPACE POUR LE LOGO (déjà dans le fond) */}
                <div className="h-[120px]"></div>

                {/* 2. TITRE & NUMERO */}
                <div className="flex justify-center mb-10 pl-16">
                    <div className="tracking-widest">
                        BORDEREAU DE VERSEMENT DEVISE No&nbsp;&nbsp;{bordereauNo}
                    </div>
                </div>

                {/* 3. REF ET DATE */}
                <div className="flex justify-between mb-8 px-4">
                    <div>33000061711-79</div>
                    <div className="mr-12">
                        {dateStr} a {timeStr}
                    </div>
                </div>

                {/* 4. BLOC INFO GAUCHE */}
                <div className="space-y-1 mb-8">
                    <div className="flex">
                        <span className="w-[120px]">Agence</span>
                        <span className="mr-2">:</span>
                        <span>.... 00010 AGENCE GOMBE</span>
                    </div>
                    <div className="flex">
                        <span className="w-[120px]">Devise</span>
                        <span className="mr-2">:</span>
                        <span>.... USD DOLLAR USA</span>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex">
                            <span className="w-[120px]">Caisse</span>
                            <span className="mr-2">:</span>
                            <span>.... 140 CAISSE SEC. GOMBE USD - 140</span>
                        </div>
                        <div className="mr-20">VILLE DE KINSHASA</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex">
                            <span className="w-[120px]">Guichetier..</span>
                            <span className="mr-2">:</span>
                            <span>VNGOMBA</span>
                        </div>
                        <div className="mr-20">COLONEL EBEYA</div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex mt-2">
                            <span className="w-[120px]">Gestionnaire:</span>
                            <span className="pl-1">DIRECTEUR GENERAL</span>
                        </div>
                        <div className="mr-20">
                            GOMBE<br />
                            KINSHASA<br />
                            KINSHASA
                        </div>
                    </div>
                </div>

                {/* 5. REMETTANT ET MOTIF - Format officiel aligné */}
                <div className="mb-8 mt-6">
                    <div className="flex">
                        <span className="w-[150px]">Nom du remettant.</span>
                        <span className="mr-2">:</span>
                        <span>
                            {(() => {
                                const name = taxpayerName.toUpperCase();
                                // Check for Corporate
                                if (name.includes('STE ') || name.includes('SOCIETE') || name.includes('ENTREPRISE')) {
                                    return name;
                                }
                                // Check for Female Names (Heuristic)
                                const femaleNames = ['NGOZA', 'MARIA', 'SARAH', 'MIANDA', 'SYNTICHE', 'ELODIE', 'JESSICA', 'RUTH'];
                                const isFemale = femaleNames.some(fn => name.includes(fn));

                                return `${isFemale ? 'Mme' : 'Mr'} ${name}`;
                            })()}
                        </span>
                    </div>
                    <div className="whitespace-pre">
                        310 - REP DEM CONGO
                    </div>
                    <div className="flex mt-1">
                        <span className="w-[150px]">Motif</span>
                        <span className="mr-2 tracking-wider">:.......... :</span>
                        <span>VGT/{rabRef}/{taxpayerName.toUpperCase()}</span>
                    </div>
                </div>

                {/* 6. MONTANTS */}
                <div className="mb-6 max-w-2xl">
                    <div className="flex justify-between">
                        <div className="flex w-full">
                            <span className="w-[180px]">Montant versement :</span>
                            <span className="ml-auto pr-32">{displayTotal.toFixed(2)} USD</span>
                        </div>
                    </div>

                    <div className="flex items-center w-full mt-1">
                        <span className="w-[180px]">Timbre ...........:</span>
                        <span className="w-[120px] text-right">{timbre.toFixed(2)} USD</span>
                        <span className="ml-12 w-[120px]">Taxe ......:</span>
                        <span className="ml-auto w-[100px] text-right">{taxes.toFixed(2)} USD</span>
                    </div>

                    <div className="flex items-center w-full mt-1">
                        <span className="w-[180px]">Frais ............:</span>
                        <span className="w-[120px] text-right">0.00 USD</span>
                    </div>
                </div>

                {/* 7. GRILLE DE CALCUL - DYNAMIQUE */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-[12px]">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span>Valeur</span>
                            <span>Nombre</span>
                            <span>Montant</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>recu</span>
                            <span>recu</span>
                        </div>

                        {/* Dynamic Rows */}
                        {taxInfo.billBreakdown.map((row: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>{row.value.toFixed(2).replace('.', ',')}</span>
                                <span className="text-center w-10">{row.count}</span>
                                <span>{row.total.toFixed(2)}</span>
                            </div>
                        ))}

                        <div className="border-b border-dashed border-gray-400 my-2"></div>
                        <div className="flex justify-between">
                            <span>Total recu</span>
                            <span>{displayTotal.toFixed(2)}</span>
                            <span>Rendu</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 pl-4">
                            <span>Nombre</span>
                            <span>Montant</span>
                        </div>
                        <div className="flex justify-between text-gray-500 pl-4 mb-1">
                            <span>rendu</span>
                            <span>rendu</span>
                        </div>
                        {/* Placeholder zeros */}
                        <div className="flex justify-between pl-4">
                            <span className="text-center w-10">0</span>
                            <span>0.00</span>
                        </div>
                        <div className="flex justify-between pl-4">
                            <span className="text-center w-10">0</span>
                            <span>0.00</span>
                        </div>
                        <div className="flex justify-between pl-4">
                            <span className="text-center w-10">0</span>
                            <span>0.00</span>
                        </div>
                        <div className="border-b border-dashed border-gray-400 my-2"></div>
                        <div className="flex justify-end">
                            <span>0.00</span>
                        </div>
                    </div>
                </div>

                {/* 8. FOOTER PHRASE */}
                <div className="mb-8">
                    <div className="flex justify-between">
                        <p>Nous portons au credit du compte no 33000061711-79</p>
                        <p className="mr-8">{displayCredit.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between mt-1 items-end">
                        <p>Soit {taxInfo.textAmount} USD</p>
                        <div className="flex gap-4 mr-8">
                            <span>USD : </span>
                            <span>{displayCredit.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="text-right mt-1 mr-8">
                        Valeur : {now.toLocaleDateString('fr-FR')}
                    </div>
                </div>

                {/* 9. SIGNATURES */}
                <div className="border-t border-dashed border-gray-500 mt-4 pt-2 grid grid-cols-3">
                    <div className="pl-8">
                        CLIENT
                        <div className="text-center mt-4">!</div>
                        <div className="text-center">!</div>
                        <div className="text-center">!</div>
                    </div>

                    <div className="pl-16">
                        GUICHETIER
                        <div className="text-center mt-4 ml-[-40px]">!</div>
                        <div className="text-center ml-[-40px]">!</div>
                        <div className="text-center ml-[-40px]">!</div>
                    </div>

                    <div className="text-right pr-16 pt-12">
                        OPERATION EFFECTUEE
                    </div>
                </div>

                {/* PLUS DE WATERMARK MANUEL, LE FOND FAIT TOUT */}
            </div>
        </div>
    );
}
