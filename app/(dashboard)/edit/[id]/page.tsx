
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react'; // React 18+ unpack params
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react';
import { updateDeclaration, getDeclarationById, deleteDeclaration } from '@/lib/store';
import { calculateTax } from '@/lib/tax-rules';
import { Declaration, VehicleCategory, TaxpayerType } from '@/types';

// Reuse types from create page logic
interface EditPageProps {
    params: Promise<{ id: string }>;
}

export default function EditDeclarationPage({ params }: EditPageProps) {
    const router = useRouter();
    // Unwrap params
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        taxpayerType: 'N/A' as TaxpayerType,
        name: '',
        nif: '',
        address: '',
        city: 'Kinshasa',

        category: 'Vignette Automobile' as VehicleCategory,
        plate: '',
        chassis: '',
        fiscalPower: '',
        weight: '',
        marque: '',
        modele: '',
        status: 'En attente' // Can edit status
    });

    // Fetch existing data
    useEffect(() => {
        async function loadData() {
            try {
                const decl = await getDeclarationById(id);
                if (!decl) {
                    setError("Déclaration introuvable.");
                    setIsLoading(false);
                    return;
                }

                // Populate form
                setFormData({
                    taxpayerType: 'N/A', // Force N/A as per user request
                    name: decl?.taxpayer?.name || '',
                    nif: decl?.taxpayer?.nif || '',
                    address: decl?.taxpayer?.address || '',
                    city: 'Kinshasa',

                    category: (decl?.vehicle?.category || 'Vignette Automobile') as VehicleCategory,
                    plate: decl?.vehicle?.plate || '',
                    chassis: decl?.vehicle?.chassis || '',
                    fiscalPower: decl?.vehicle?.fiscalPower || '',
                    weight: decl?.vehicle?.weight || '',
                    marque: decl?.vehicle?.marque || '',
                    modele: decl?.vehicle?.modele || '',
                    status: decl?.status || 'En attente'
                });
            } catch (err) {
                console.error(err);
                setError("Erreur chargement données.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    // Dynamic Tax Calc Helper
    const getCV = (powerStr: string) => {
        const match = (powerStr || '').match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };
    const currentTax = calculateTax(getCV(formData.fiscalPower), formData.category);
    const EXCHANGE_RATE = 2355;
    const currentAmountFC = currentTax.totalAmount * EXCHANGE_RATE;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Re-calculate finalized tax
            const taxInfo = calculateTax(getCV(formData.fiscalPower), formData.category);

            const updates: Partial<Declaration> = {
                updatedAt: new Date().toISOString(),
                status: formData.status as any,
                taxpayer: {
                    type: formData.taxpayerType,
                    name: formData.name.toUpperCase(),
                    nif: formData.nif.toUpperCase(),
                    address: formData.address.toUpperCase()
                },
                vehicle: {
                    category: formData.category,
                    plate: formData.plate.toUpperCase().replace(/\s/g, ''),
                    chassis: formData.chassis.toUpperCase(),
                    fiscalPower: formData.fiscalPower,
                    weight: formData.weight,
                    marque: formData.marque.toUpperCase(),
                    modele: formData.modele.toUpperCase(),
                    type: formData.taxpayerType,
                    // Preserve existing fields if not in form? Ideally we load all.
                    // For now we overwrite vehicle object.
                    genre: '', // Simplify
                    couleur: '',
                    annee: ''
                },
                tax: {
                    baseRate: taxInfo.totalAmount,
                    currency: 'USD',
                    totalAmountFC: taxInfo.totalAmount * EXCHANGE_RATE
                },
                meta: {
                    // Update meta manual taxpayer to keep Receipt sync
                    manualTaxpayer: {
                        name: formData.name.toUpperCase(),
                        nif: formData.nif.toUpperCase(),
                        address: formData.address.toUpperCase(),
                    }
                } as any
            };

            const result = await updateDeclaration(id, updates);
            if (result.success) {
                router.push('/'); // Back to dashboard
            } else {
                alert(`Erreur lors de la sauvegarde: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erreur critique.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Voulez-vous vraiment supprimer ce dossier ?")) {
            await deleteDeclaration(id);
            router.push('/');
        }
    };

    if (isLoading) return <div className="p-8">Chargement...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Modifier la Déclaration</h1>
                        <p className="text-sm text-gray-500 font-mono">{id}</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-600 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                    <Trash2 className="h-4 w-4" /> Supprimer
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Logic similar to Create Page */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SECTION 1: CONTRIBUABLE */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">1. Informations Contribuable</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Contribuable</label>
                                <input
                                    type="text"
                                    name="taxpayerType"
                                    value="N/A"
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut Dossier</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none font-bold text-gray-900"
                                >
                                    <option value="Payée">Payée (Validé)</option>
                                    <option value="En attente">En attente</option>
                                    <option value="Annulée">Annulée</option>
                                </select>
                            </div>
                            <div className="md:col-spam-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Raison Sociale</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 uppercase text-gray-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIF / ID Nat</label>
                                <input
                                    type="text"
                                    name="nif"
                                    value={formData.nif}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Complète</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: VEHICULE */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">2. Identité du Véhicule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plaque d'Immatriculation</label>
                                <input
                                    type="text"
                                    name="plate"
                                    value={formData.plate}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase bg-yellow-50 text-gray-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Châssis</label>
                                <input
                                    type="text"
                                    name="chassis"
                                    value={formData.chassis}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase text-gray-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                                <input
                                    type="text"
                                    name="marque"
                                    value={formData.marque}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg uppercase text-gray-900"
                                    placeholder="ex: TOYOTA"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                                <input
                                    type="text"
                                    name="modele"
                                    value={formData.modele}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg uppercase text-gray-900"
                                    placeholder="ex: HILUX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Puissance Fiscale (CV)</label>
                                <input
                                    type="text"
                                    name="fiscalPower"
                                    value={formData.fiscalPower}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                                    placeholder="ex: 15 CV"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Poids (T)</label>
                                <input
                                    type="text"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                                    placeholder="ex: 5 T"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                                >
                                    <option value="Vignette Automobile">Vignette Automobile</option>
                                    <option value="Véhicule utilitaire">Véhicule utilitaire / Poids Lourds</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: RECAP & ACTION */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg sticky top-6">
                        <h3 className="font-semibold text-indigo-200 uppercase text-xs tracking-wider mb-2">Estimation Fiscale</h3>
                        <div className="text-4xl font-bold mb-1">${currentTax.totalAmount.toFixed(2)}</div>
                        <div className="text-indigo-300 text-sm mb-6">~ {currentAmountFC.toLocaleString()} FC</div>

                        <div className="space-y-3 text-sm text-indigo-100 border-t border-indigo-800 pt-4 mb-6">
                            <div className="flex justify-between">
                                <span>Taxe Principale</span>
                                <span>${currentTax.creditAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Frais Timbre</span>
                                <span>${currentTax.timbre.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Frais Divers</span>
                                <span>${currentTax.taxe.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-gray-100 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            {isSaving ? "Enregistrement..." : (
                                <>
                                    <Save className="h-5 w-5" /> Enregistrer Modifs
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800">
                        <div className="flex gap-2 font-bold mb-1">
                            <AlertCircle className="h-4 w-4" /> Mode Édition
                        </div>
                        <p>Vous modifiez un dossier existant. Assurez-vous que les changements sont justifiés (erreur de saisie, changement de propriétaire, etc.).</p>
                    </div>
                </div>
            </form>
        </div>
    );
}
