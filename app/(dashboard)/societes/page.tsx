'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Building, ChevronRight, FileText, Search, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { getSavedDeclarations } from '@/lib/store';
import { Declaration } from '@/types';

// Helper: Group declarations by NIF
function groupDeclarationsByCompany(declarations: Declaration[]) {
    const groups = new Map<string, {
        nif: string;
        name: string;
        address: string;
        count: number;
        totalAmountFC: number;
        lastUpdate: string;
        pendingCount: number;
        paidCount: number;
    }>();

    declarations.forEach(decl => {
        const taxnif = decl.meta?.manualTaxpayer?.nif || (decl.meta as any)?.taxpayerData?.nif || 'N/A';
        const taxname = decl.meta?.manualTaxpayer?.name || (decl.meta as any)?.taxpayerData?.name || 'INCONNU';
        const taxAddress = decl.meta?.manualTaxpayer?.address || (decl.meta as any)?.taxpayerData?.address || '';

        if (taxnif === 'N/A' || taxnif === '') return;

        const cleanName = taxname.replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, '').trim() || taxname;

        if (!groups.has(taxnif)) {
            groups.set(taxnif, {
                nif: taxnif,
                name: cleanName,
                address: taxAddress,
                count: 0,
                totalAmountFC: 0,
                lastUpdate: decl.createdAt,
                pendingCount: 0,
                paidCount: 0
            });
        }

        const group = groups.get(taxnif)!;
        group.count += 1;
        group.totalAmountFC += (decl.tax.totalAmountFC || 0);

        if (decl.status === 'Payée' || decl.status === 'Payé') {
            group.paidCount += 1;
        } else if (decl.status === 'En attente de paiement' || decl.status === 'En attente' || decl.status === 'Facturée') {
            group.pendingCount += 1;
        }

        if (new Date(decl.createdAt) > new Date(group.lastUpdate)) {
            group.lastUpdate = decl.createdAt;
        }
    });

    return Array.from(groups.values())
        .filter(g => g.count > 1)
        .sort((a, b) => b.count - a.count);
}

export default function SocietesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getSavedDeclarations();
            setCompanies(groupDeclarationsByCompany(data));
            setIsLoading(false);
        }
        load();
    }, []);

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.nif.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-indigo-600" />
                        Dossiers Entreprises
                    </h1>
                    <p className="text-gray-500 mt-1">Gérez les flottes de véhicules par société</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-lg">
                        <Building className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                        <p className="text-sm text-gray-500 font-medium">Sociétés Actives</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">
                            {companies.reduce((acc, curr) => acc + curr.count, 0)}
                        </p>
                        <p className="text-sm text-gray-500 font-medium">Véhicules en flotte</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher par NIF ou Nom..."
                            className="w-full pl-9 pr-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">Chargement des dossiers...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Société</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">NIF</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Flotte</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Total (FC)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCompanies.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                                <Search className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">Aucun dossier trouvé</p>
                                            <p className="text-sm mt-1">Vérifiez l'orthographe ou le NIF.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCompanies.map((comp) => (
                                        <tr key={comp.nif} className="hover:bg-indigo-50/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/societes/${comp.nif}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                        {comp.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors uppercase">{comp.name}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{comp.address}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 font-mono text-xs rounded-full border border-gray-200">
                                                    {comp.nif}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] w-full max-w-[80px]">
                                                        {comp.count} Véh.
                                                    </span>
                                                    {comp.pendingCount > 0 && (
                                                        <span className="inline-flex items-center justify-center bg-violet-100 text-violet-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] w-full max-w-[80px]">
                                                            {comp.pendingCount} Attente
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-gray-900 font-mono">
                                                    {comp.totalAmountFC.toLocaleString()} FC
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/societes/${comp.nif}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                                                >
                                                    Ouvrir
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
