'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Briefcase, Anchor, User } from 'lucide-react';
import { TaxpayerType, VehicleCategory, Declaration } from '@/types';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { getNowOrBusinessHours } from '@/lib/business-calendar';
import { calculateTax } from '@/lib/tax-rules';

export default function CreateBoatPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        taxpayerType: 'N/A' as TaxpayerType,
        name: '',
        nif: '',
        address: '',
        city: 'Kinshasa',

        category: 'Bateau' as VehicleCategory,
        plate: '', 
        chassis: '', 
        baseAmount: '', 
        typeEmbarcation: '',
    });

    // --- DYNAMIC TAX CALCULATION ---
    const currentTax = calculateTax(0, 'bateau', parseFloat(formData.baseAmount) || 0);
    const EXCHANGE_RATE = 2355;
    const currentAmountFC = currentTax.creditAmount * EXCHANGE_RATE;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const sequence = getSecureSequence();
        const id = generateDeclarationId(sequence);
        const noteId = generateNoteId(sequence);

        const baseRate = currentTax.creditAmount;
        let totalAmount = currentAmountFC;

        const dateIso = getNowOrBusinessHours();

        const ZOMBIE_RE = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;
        const cleanAddress = (addr: string) =>
            addr.replace(ZOMBIE_RE, '').replace(/^\s*(N\/A|N\/A,|[,\s/-])+/, '').trim() || addr.trim();

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée',
            vehicle: {
                category: 'Bateau' as any,
                type: formData.typeEmbarcation || 'N/A',
                plate: formData.plate.toUpperCase(),
                chassis: formData.chassis.toUpperCase(),
                fiscalPower: '0 CV',
                weight: formData.baseAmount, 
                marque: 'BATEAU',
                modele: formData.typeEmbarcation?.toUpperCase() || '',
                genre: 'N/A',
            },
            tax: {
                baseRate,
                currency: 'USD',
                totalAmountFC: totalAmount,
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                manualTaxpayer: {
                    name: formData.name.toUpperCase(),
                    nif: formData.nif.toUpperCase(),
                    address: cleanAddress(formData.address.toUpperCase()),
                    type: 'N/A',
                },
                manualBaseAmount: formData.baseAmount 
            }
        } as any;

        try {
            const result = await saveDeclaration(newDeclaration);
            if (!result.success) {
                alert(`Erreur lors de la création: ${result.error}`);
                setIsSubmitting(false);
                return;
            }
        } catch (error: any) {
            console.error("Critical error:", error);
            alert(`Erreur critique système: ${error.message || error}`);
            setIsSubmitting(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        router.push(`/declarations/${id}/receipt`);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Déclaration Bateaux</h1>
                    <p className="text-gray-500 text-sm">Saisie simplifiée pour les embarcations fluviales et maritimes.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1: Contribuable */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Information Contribuable</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'Impôt / NIF <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: A1234567K"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono bg-yellow-50/50 border-yellow-200 text-gray-900"
                                value={formData.nif}
                                onChange={(e: any) => setFormData({ ...formData, nif: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet / Raison Sociale</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: BRALIMA SARL"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.name}
                                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Complète</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: 12 Av. du Drapeau, Kinshasa"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.address}
                                onChange={(e: any) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Embarcation */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Anchor className="h-5 w-5 text-mint-600" />
                        <h2 className="font-semibold text-gray-900">Information de l'Embarcation</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom ou Référence de l'embarcation <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: MV-LIBERTE / PIROGUE-01"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-gray-900"
                                value={formData.chassis}
                                onChange={(e: any) => setFormData({ ...formData, chassis: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation (Optionnel)</label>
                            <input
                                type="text"
                                placeholder="Ex: KIN-1234"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-gray-900"
                                value={formData.plate}
                                onChange={(e: any) => setFormData({ ...formData, plate: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type d'Embarcation</label>
                            <input
                                type="text"
                                placeholder="Ex: Baleinière, Canot, Pirogue"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.typeEmbarcation}
                                onChange={(e: any) => setFormData({ ...formData, typeEmbarcation: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <label className="block text-sm font-bold text-emerald-800 mb-2">Montant de base (USD) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 rounded-lg border-emerald-200 border text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 bg-white"
                                    value={formData.baseAmount}
                                    onChange={(e: any) => setFormData({ ...formData, baseAmount: e.target.value })}
                                />
                            </div>
                            <div className="mt-3 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-emerald-600 uppercase font-semibold">Total Estimation (Bordereau)</p>
                                    <p className="text-xs text-emerald-500">Inclut $4.00 de frais bancaires</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-emerald-700">${(currentTax.totalAmount).toFixed(2)}</p>
                                    <p className="text-xs text-emerald-500 font-mono">~ {currentAmountFC.toLocaleString()} FC</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Génération en cours...' : 'Enregistrer la Déclaration'}
                        {!isSubmitting && <Save className="h-5 w-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
