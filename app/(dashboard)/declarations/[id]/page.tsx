'use client';

import { ArrowLeft, Car, FileText, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils'; // Keeping local utils check
import { Declaration } from '@/types';
import { generateDeclaration, DECL_BASE } from '@/lib/generator';
import { use, useState, useEffect } from 'react';
import { getDeclarationById } from '@/lib/store';

export default function DeclarationPage({ params }: { params: Promise<{ id: string }> }) {
    // Parse sequence from ID (DECL-2026-XXXXXX)
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);

    // Standardize Algorithmic Generation (Server/Hydration Safe)
    const [data, setData] = useState<Declaration>(() => {
        const idParts = id.split('-');
        const sequencePart = idParts[idParts.length - 1];

        // Parse as Hex
        const fullIdValue = parseInt(sequencePart, 16);
        let sequence = 0;
        if (!isNaN(fullIdValue)) {
            sequence = fullIdValue - DECL_BASE;
        }
        if (sequence < 0) sequence = 1; // Fallback

        return generateDeclaration(sequence);
    });

    // Check for Manual Override on Client (Async)
    useEffect(() => {
        let isMounted = true;
        async function fetchOverride() {
            try {
                const manualData = await getDeclarationById(id);
                if (isMounted && manualData) {
                    setData(manualData);
                }
            } catch (e) {
                console.error("Failed to fetch override", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchOverride();
        return () => { isMounted = false; };
    }, [id]);

    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">{data.id}</h1>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                {data.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Crée le {data.createdAt}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - MAIN INFO */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Informations sur la déclaration</h2>
                            <span className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-500 uppercase font-medium">
                                Vehicle
                            </span>
                        </div>

                        <div className="p-6">
                            <div className="bg-mint-50 rounded-lg p-6 border border-mint-100">
                                <div className="flex items-center gap-2 text-mint-700 mb-6 font-semibold">
                                    <Car className="h-5 w-5" />
                                    <h3>INFORMATIONS VÉHICULE</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Catégorie</label>
                                        <p className="text-mint-900 font-medium">{data.vehicle.category}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Plaque</label>
                                        <span className="bg-white border border-mint-200 px-2 py-1 rounded text-mint-900 font-mono font-medium">
                                            {data.vehicle.plate}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Type Contribuable</label>
                                        <p className="text-mint-900 font-medium">{data.vehicle.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Chassis (VIN)</label>
                                        <p className="text-mint-900 font-mono font-medium">{data.vehicle.chassis}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Puissance Fiscale</label>
                                        <p className="text-mint-900 font-medium">{data.vehicle.fiscalPower}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-mint-600 uppercase mb-1">Poids</label>
                                        <p className="text-mint-900 font-medium">{data.vehicle.weight}</p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <label className="block text-xs font-medium text-mint-600 uppercase mb-3">Photo du moteur</label>
                                    <button className="flex items-center gap-2 bg-white border border-mint-200 text-mint-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-mint-50 transition-colors">
                                        <Eye className="h-4 w-4" />
                                        Voir la photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 uppercase text-sm tracking-wide">Calcul Vignette Annuelle</h2>
                            <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600 font-medium">Annuel</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Catégorie Véhicule</span>
                                <span className="font-medium text-gray-900">{data.vehicle.category}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Type Contribuable</span>
                                <span className="font-medium text-gray-900">{data.vehicle.type}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500">Taux de Base</span>
                                <span className="font-medium text-gray-900">${data.tax.baseRate}</span>
                            </div>

                            <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-end">
                                <span className="font-semibold text-gray-900">Total Impôt Dû</span>
                                <span className="text-2xl font-bold text-blurple-500">
                                    FC {data.tax.totalAmountFC.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <p className="text-xs text-gray-400 italic mt-4">
                                Référence: {data.meta.reference}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - SIDEBAR */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">État & Actions</h3>
                        <Link
                            href={`/declarations/${data.id}/receipt`}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-medium transition-colors"
                        >
                            <Eye className="h-4 w-4" />
                            Voir la Note
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Méta-Données</h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Référence</span>
                                <span className="font-medium text-gray-900">{data.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID Système</span>
                                <span className="font-mono text-gray-700">{data.meta.systemId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mise à jour</span>
                                <span className="text-gray-900">{data.updatedAt}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
