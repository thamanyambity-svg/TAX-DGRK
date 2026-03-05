import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDeclarations } from '@/lib/store';
import { ArrowLeft, Building, Car, FileText, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import BulkDownloadButton from '@/app/components/bulk-download-button';
import { Declaration } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Dossier Société | Tax Portal',
    description: 'Détails du dossier société',
};

export default async function DossierSpecifiquePage({ params }: { params: Promise<{ nif: string }> }) {
    const { nif } = await params;
    const rawDecls = await getDeclarations();

    // Filter declarations for this exact NIF
    const companyDecls = rawDecls.filter(decl => {
        const taxnif = decl.meta?.manualTaxpayer?.nif || (decl.meta as any)?.taxpayerData?.nif || 'N/A';
        return taxnif === nif;
    });

    if (companyDecls.length === 0) {
        notFound();
    }

    // Sort by Bank Date (manualPaymentDate > updatedAt > createdAt) newest first
    companyDecls.sort((a, b) => {
        const dateA = new Date((a.meta as any)?.manualPaymentDate || a.updatedAt || a.createdAt).getTime();
        const dateB = new Date((b.meta as any)?.manualPaymentDate || b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
    });

    // Get Company Info from the first record (they should all be the same)
    const firstDecl = companyDecls[0];
    const companyName = firstDecl.meta?.manualTaxpayer?.name || (firstDecl.meta as any)?.taxpayerData?.name || 'INCONNU';
    const cleanName = companyName.replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, '').trim() || companyName;
    const companyAddress = firstDecl.meta?.manualTaxpayer?.address || (firstDecl.meta as any)?.taxpayerData?.address || '';

    // Calculate aggregate totals
    const totalVehicles = companyDecls.length;
    const totalAmountUSD = companyDecls.reduce((sum, d) => sum + (d.tax.baseRate || 0), 0);
    const totalAmountFC = companyDecls.reduce((sum, d) => sum + (d.tax.totalAmountFC || 0), 0);
    const totalFees = totalVehicles * 4; // Assuming 4$ fee per vehicle per rules

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/societes" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux dossiers
                </Link>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -z-10 opacity-50 blur-3xl"></div>
                <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col md:flex-row gap-5 justify-between w-full">
                        <div className="flex gap-5">
                            <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-inner border border-indigo-200">
                                {cleanName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{cleanName}</h1>
                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                        <FileText className="w-4 h-4" />
                                        NIF: {nif}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Building className="w-4 h-4" />
                                        {companyAddress}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-1">Total à payer</p>
                                <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
                                    {totalAmountFC.toLocaleString()} FC
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    ~ {totalAmountUSD.toFixed(2)} USD (Taxes) + {totalFees}$ (Frais Bancaires)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-gray-100 pt-6 mt-2">
                        <BulkDownloadButton declarations={companyDecls as Declaration[]} companyName={cleanName} />
                    </div>
                </div>
            </div>

            {/* List of Declarations */}
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="h-5 w-5 text-indigo-600" />
                Flotte de {totalVehicles} véhicules
            </h2>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Réf Numérotation</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Véhicule</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Montant (FC)</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Documents</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {companyDecls.map((decl, index) => {
                                const reference = decl.meta?.reference || decl.meta?.systemId || decl.id;

                                return (
                                    <tr key={decl.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-semibold text-gray-900 border border-gray-200 bg-gray-50 rounded px-2 py-0.5 w-fit">
                                                    #{companyDecls.length - index}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono mt-1">{reference}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 font-mono text-lg tracking-wider">
                                                    {decl.vehicle.plate}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono">
                                                    Châssis: {decl.vehicle.chassis}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex py-1 px-2.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold w-fit">
                                                    {decl.vehicle.category}
                                                </span>
                                                <div className="flex gap-2 text-xs text-gray-500">
                                                    {decl.vehicle.fiscalPower && <span>{decl.vehicle.fiscalPower}</span>}
                                                    {decl.vehicle.weight && <span>• {decl.vehicle.weight}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 font-mono block">
                                                {decl.tax.totalAmountFC.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">
                                                ${decl.tax.baseRate.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-transparent"
                                                    title="Télécharger Bordereau PDF"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <Link
                                                    href={`/declarations/${decl.id}/bordereau`}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                                                    title="Voir Bordereau"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Link>
                                                <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
                                                <button
                                                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-transparent"
                                                    title="Télécharger Récépissé PDF"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <Link
                                                    href={`/declarations/${decl.id}/receipt`}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                                    title="Voir Récépissé"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
