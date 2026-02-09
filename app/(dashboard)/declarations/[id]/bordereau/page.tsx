'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { calculateTax } from '@/lib/tax-rules';
import type { Declaration } from '@/types';
import { ArrowLeft, Printer, Download } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function BordereauPage({ params }: PageProps) {
    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [id, setId] = useState<string>('');
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        params.then((resolvedParams) => {
            let rawId = resolvedParams?.id;
            if ((!rawId || rawId === 'undefined') && typeof window !== 'undefined') {
                try {
                    const segments = window.location.pathname.split('/');
                    const idx = segments.indexOf('declarations');
                    if (idx !== -1) rawId = segments[idx + 1];
                } catch (e) { }
            }
            const resolvedId = rawId ? decodeURIComponent(rawId) : '';
            setId(resolvedId);
        });
    }, [params]);

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

    // Extract numeric sequence safely
    const idSuffix = id.split('-').pop() || '';
    const numericPart = idSuffix.replace(/\D/g, '');
    const sequence = parseInt(numericPart, 10) || 0;
    const bordereauNo = 39383 + (sequence % 10000);

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const valeurDate = now.toLocaleDateString('fr-FR');

    // Taxpayer info
    const taxpayerName = decl.meta?.manualTaxpayer?.name || 'CLIENT';
    const taxpayerPhone = decl.meta?.manualTaxpayer?.phone || '+243000000000';
    const taxpayerRef = `5B${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    // Tax calculation
    // Force fiscalPower to be a number to avoid TypeScript errors
    const taxInfo = calculateTax(Number(decl.vehicle.fiscalPower) || 0, decl.vehicle.type || '');
    const displayTotal = taxInfo.totalAmount;
    const displayCredit = taxInfo.creditAmount;
    const timbre = taxInfo.timbre;
    const taxes = taxInfo.taxe;

    const handlePrint = () => window.print();

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
                        Telecharger PDF
                    </button>
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Imprimer
                    </button>
                </div>
            </div>

            {/* PAPER - Format exact Solidaire Bank + FOND ORIGINEL */}
            <div
                id="printable-bordereau"
                ref={componentRef}
                className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none px-[30px] py-[20px] text-[10pt] leading-[1.15] relative print:w-[210mm] print:mx-auto min-h-[297mm] box-border"
                style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontWeight: 400,
                    color: 'black',
                    // RESTAURATION DU FOND
                    backgroundImage: 'url(/bordereau-bg.png)',
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                } as React.CSSProperties}
            >
                {/* ESPACE RESERVE POUR LE LOGO (déjà présent sur le fond) */}
                <div className="h-[120px]"></div>

                {/* TITRE & NUMERO */}
                <div className="text-center mb-6">
                    <span className="tracking-[4px]">
                        BORDEREAU DE VERSEMENT DEVISE No
                    </span>
                    <span className="ml-2">{bordereauNo}</span>
                </div>

                {/* REF ET DATE */}
                <div className="flex justify-between mb-4">
                    <div>33000061711-79</div>
                    <div>{dateStr} a {timeStr}</div>
                </div>

                {/* BLOC INFO - Format exact */}
                <div className="space-y-0 mb-4 text-[10pt]">
                    <div className="flex">
                        <span className="w-[100px]">Agence</span>
                        <span className="mr-1">....:</span>
                        <span>00010 AGENCE GOMBE</span>
                    </div>
                    <div className="flex">
                        <span className="w-[100px]">Devise</span>
                        <span className="mr-1">....:</span>
                        <span>USD</span>
                        <span className="ml-4">DOLLAR USA</span>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex">
                            <span className="w-[100px]">Caisse</span>
                            <span className="mr-1">....:</span>
                            <span>140</span>
                            <span className="ml-4">CAISSE SEC. GOMBE USD - 140</span>
                        </div>
                        <span>VILLE DE KINSHASA</span>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex">
                            <span className="w-[100px]">Guichetier</span>
                            <span className="mr-1">..:</span>
                            <span>VNGOMBA</span>
                        </div>
                        <span>COLONEL EBEYA</span>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex">
                            <span className="w-[100px]">Gestionnaire</span>
                            <span className="mr-1">:</span>
                            <span>DIRECTEUR GENERAL</span>
                        </div>
                        <span>GOMBE</span>
                    </div>
                    <div className="flex justify-end">
                        <span>KINSHASA</span>
                    </div>
                    <div className="flex justify-end">
                        <span>KINSHASA</span>
                    </div>
                </div>

                {/* REMETTANT - Format exact aligné */}
                <div className="mb-4 mt-4 space-y-0">
                    <div className="flex">
                        <span className="w-[160px] flex justify-between">
                            <span>Nom du remettant</span>
                            <span className="mr-2">.:</span>
                        </span>
                        <span>{taxpayerName.toUpperCase()}/{taxpayerPhone}</span>
                    </div>
                    <div className="flex">
                        <span className="w-[160px] flex justify-between">
                            <span>Adresse</span>
                            <span className="mr-2">:</span>
                        </span>
                        <span>{taxpayerName.toUpperCase()}/{taxpayerRef}</span>
                    </div>
                    <div className="ml-[160px]">
                        310 - REP DEM CONGO
                    </div>
                    <div className="flex">
                        <span className="w-[160px] flex justify-between">
                            <span>Motif</span>
                            <span className="mr-2">:</span>
                        </span>
                        <span>{taxpayerName.toUpperCase()}/{taxpayerRef}</span>
                    </div>
                </div>

                {/* MONTANTS - Format exact */}
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

                {/* GRILLE DE CALCUL - Format exact */}
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
                        {taxInfo.billBreakdown.map((row, i: number) => (
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

                    {/* Separators */}
                    <div className="flex text-[9pt] mt-2">
                        <span className="w-[60px]"></span>
                        <span className="w-[140px]">----------------------</span>
                        <span className="w-[80px]"></span>
                        <span className="w-[140px]">------------------------------</span>
                    </div>

                    {/* Totals */}
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

                {/* CREDIT INFO - Format exact */}
                <div className="mb-4 mt-8">
                    <div className="flex justify-between">
                        <span>Nous portons au credit du compte no 33000061711-79</span>
                        <span>USD : <span className="ml-8">{displayCredit.toFixed(2)}</span></span>
                    </div>
                    <div className="flex justify-end mt-1">
                        <span>Valeur : <span className="ml-8">{valeurDate}</span></span>
                    </div>
                    <div className="mt-1">
                        <span>Soit {taxInfo.textAmount} USD</span>
                    </div>
                </div>

                {/* SIGNATURES - Format exact */}
                <div className="mt-8 pt-2">
                    <div className="border-t border-dashed border-gray-500"></div>
                    <div className="flex mt-2">
                        <div className="w-1/3 text-center">
                            <div>CLIENT</div>
                            <div className="mt-2">!</div>
                            <div>!</div>
                            <div>!</div>
                        </div>
                        <div className="w-1/3 text-center">
                            <div>GUICHETIER</div>
                            <div className="mt-2">!</div>
                            <div>!</div>
                            <div>!</div>
                        </div>
                        <div className="w-1/3 text-center pt-8">
                            <div>OPERATION EFFECTUEE</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
