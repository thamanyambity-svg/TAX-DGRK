'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Anchor } from 'lucide-react';
import { TaxpayerType, VehicleCategory, Declaration } from '@/types';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { getNowOrBusinessHours } from '@/lib/business-calendar';

export default function NewBoatDeclarationPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State (Simplified for Boats)
    const [formData, setFormData] = useState({
        taxpayerType: 'N/A' as TaxpayerType,
        name: '',
        nif: '',
        address: '',
        city: 'Kinshasa',

        category: 'Bateau' as VehicleCategory,
        plate: '',
        chassis: '', // Used for "Nom ou Référence"
        typeEmbarcation: '', // Maps to vehicle.type or vehicle.modele
        fiscalPower: '',
        weight: '',
        baseAmount: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const sequence = getSecureSequence();
        const id = generateDeclarationId(sequence);
        const noteId = generateNoteId(sequence);
        const dateIso = getNowOrBusinessHours();

        const baseRate = parseFloat(formData.baseAmount) || 0;
        const EXCHANGE_RATE = 2355;
        const totalAmountFC = baseRate * EXCHANGE_RATE;

        // Cleanup address from any zombie data or metadata tags
        const ZOMBIE_RE = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;
        const cleanAddress = (addr: string) =>
            addr.replace(ZOMBIE_RE, '').replace(/^\s*(N\/A|N\/A,|[,\s/-])+/, '').trim() || addr.trim();

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée',
            vehicle: {
                category: 'Bateau',
                type: formData.typeEmbarcation.toUpperCase(),
                plate: formData.plate.toUpperCase(),
                chassis: formData.chassis.toUpperCase(),
                fiscalPower: formData.fiscalPower,
                weight: formData.weight,
                marque: 'BATEAU',
                modele: formData.typeEmbarcation.toUpperCase(),
                genre: 'N/A',
            },
            tax: {
                baseRate,
                currency: 'USD',
                totalAmountFC: totalAmountFC,
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                manualBaseAmount: baseRate,
                manualMarqueType: 'Bateau',
                manualTaxpayer: {
                    name: formData.name.toUpperCase(),
                    nif: formData.nif.toUpperCase(),
                    address: cleanAddress(formData.address.toUpperCase()),
                    type: 'N/A',
                }
            }
        } as any;

        try {
            const result = await saveDeclaration(newDeclaration);
            if (!result.success) {
                alert(`Erreur: ${result.error}`);
                setIsSubmitting(false);
                return;
            }
        } catch (error: any) {
            alert(`Erreur critique: ${error.message}`);
            setIsSubmitting(false);
            return;
        }

        router.push(`/declarations/${id}/receipt`);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saisie simplifiée pour les embarcations</h1>
                    <p className="text-gray-500 text-sm">Remplissez les informations spécifiques aux bateaux (Plaque incluse).</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet / Raison Sociale <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Jean Dupont"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                            <input
                                type="text"
                                placeholder="Numéro d'Impôt"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-gray-900"
                                value={formData.nif}
                                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Complète</label>
                            <input
                                type="text"
                                placeholder="Ex: 12 Av. de l'Equateur"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Embarcation */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Anchor className="h-5 w-5 text-emerald-600" />
                        <h2 className="font-semibold text-gray-900">Information de l'Embarcation</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plaque d'immatriculation</label>
                            <input
                                type="text"
                                placeholder="Ex: 1234AB01"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-gray-900 bg-yellow-50/30"
                                value={formData.plate}
                                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom ou Référence de l'embarcation <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: MV-LIBERTE / PIROGUE-01"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-gray-900"
                                value={formData.chassis}
                                onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type d'Embarcation</label>
                            <input
                                type="text"
                                placeholder="Ex: Baleinière, Canot, Pirogue"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.typeEmbarcation}
                                onChange={(e) => setFormData({ ...formData, typeEmbarcation: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Puissance Fiscale (CV)</label>
                            <input
                                type="text"
                                placeholder="Ex: 100 CV"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.fiscalPower}
                                onChange={(e) => setFormData({ ...formData, fiscalPower: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Poids / Jauge</label>
                            <input
                                type="text"
                                placeholder="Ex: 10 tonnes"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant de base (USD) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                step="any"
                                placeholder="Ex: 150.00"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-gray-900 bg-emerald-50/30"
                                value={formData.baseAmount}
                                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Action */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
                    >
                        {isSubmitting ? 'Traitement...' : 'Enregistrer & Imprimer'}
                        {!isSubmitting && <Save className="h-5 w-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
