'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { QrRouterSequence } from '@/types';
import { Plus, Trash2, Copy, RefreshCw, QrCode, CheckSquare, Square, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Declaration {
    id: string;
}

export default function QrRouterAdminPage() {
    const [sequences, setSequences] = useState<QrRouterSequence[]>([]);
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState('');
    const [urlsInput, setUrlsInput] = useState('');
    const [routerUrl, setRouterUrl] = useState('');
    const [selectedDecls, setSelectedDecls] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        const [seqRes, declRes] = await Promise.all([
            supabase.from('qr_router_sequences').select('*').order('token').order('queue_order'),
            supabase.from('declarations').select('id').order('id')
        ]);
        if (!seqRes.error && seqRes.data) setSequences(seqRes.data as QrRouterSequence[]);
        if (!declRes.error && declRes.data) setDeclarations(declRes.data as Declaration[]);
        setLoading(false);
    };

    useEffect(() => {
        setRouterUrl(window.location.origin + '/api/router?token=');
        fetchAll();
    }, []);

    const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let t = '';
        for (let i = 0; i < 16; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
        setToken(t);
    };

    const toggleDecl = (id: string) => {
        setSelectedDecls(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addFromDeclarations = async () => {
        if (!token || selectedDecls.size === 0) return;

        const sorted = declarations
            .filter(d => selectedDecls.has(d.id))
            .sort((a, b) => a.id.localeCompare(b.id));

        const rows = sorted.map((d, i) => ({
            token,
            queue_order: i + 1,
            external_url: `${window.location.origin}/verify/${d.id}`,
            is_used: false,
        }));

        const { error } = await supabase.from('qr_router_sequences').insert(rows);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            setToken('');
            setSelectedDecls(new Set());
            setSearchTerm('');
            fetchAll();
        }
    };

    const addManualSequence = async () => {
        if (!token || !urlsInput.trim()) return;

        const urls = urlsInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
        if (urls.length === 0) return;

        const rows = urls.map((url, i) => ({
            token,
            queue_order: i + 1,
            external_url: url,
            is_used: false,
        }));

        const { error } = await supabase.from('qr_router_sequences').insert(rows);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            setToken('');
            setUrlsInput('');
            fetchAll();
        }
    };

    const deleteSequence = async (id: number) => {
        await supabase.from('qr_router_sequences').delete().eq('id', id);
        fetchAll();
    };

    const deleteToken = async (t: string) => {
        await supabase.from('qr_router_sequences').delete().eq('token', t);
        fetchAll();
    };

    const resetToken = async (t: string) => {
        await supabase.from('qr_router_sequences').update({ is_used: false, scan_date: null }).eq('token', t);
        fetchAll();
    };

    const grouped = sequences.reduce<Record<string, QrRouterSequence[]>>((acc, s) => {
        if (!acc[s.token]) acc[s.token] = [];
        acc[s.token].push(s);
        return acc;
    }, {});

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

    const filteredDecls = declarations.filter(d =>
        !searchTerm || d.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allFilteredSelected = filteredDecls.length > 0 && filteredDecls.every(d => selectedDecls.has(d.id));

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Routeur QR</h1>
                        <p className="text-sm text-gray-700">Créez une séquence de vérification pour vos dossiers</p>
                    </div>
                    <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                        <RefreshCw className="h-4 w-4" /> Actualiser
                    </button>
                </div>

                {/* Section 1 : depuis vos déclarations */}
                <div className="bg-white rounded-xl shadow border p-6 space-y-4">
                    <h2 className="font-bold text-gray-900">Depuis vos dossiers</h2>
                    <p className="text-sm text-gray-700">Sélectionnez les déclarations à lier. Le scan redirigera vers <strong>notre page de vérification</strong> avec vos données.</p>

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Token unique</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                    placeholder="ex: VIGNETTE2026A"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 font-medium"
                                />
                                <button onClick={generateToken} className="px-3 py-2 text-sm bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 text-gray-700 font-medium" title="Générer">
                                    <QrCode className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={addFromDeclarations}
                            disabled={!token || selectedDecls.size === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Créer ({selectedDecls.size})
                        </button>
                    </div>

                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un dossier..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900"
                        />
                    </div>

                    {/* Tableau */}
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        {filteredDecls.length === 0 ? (
                            <p className="p-4 text-sm text-gray-600">Aucun dossier trouvé.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 w-10 text-center">
                                            <button onClick={() => {
                                                if (allFilteredSelected) setSelectedDecls(prev => {
                                                    const next = new Set(prev);
                                                    filteredDecls.forEach(d => next.delete(d.id));
                                                    return next;
                                                });
                                                else setSelectedDecls(prev => {
                                                    const next = new Set(prev);
                                                    filteredDecls.forEach(d => next.add(d.id));
                                                    return next;
                                                });
                                            }}>
                                                {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-gray-400" />}
                                            </button>
                                        </th>
                                        <th className="px-3 py-2 text-left">ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDecls.map(d => (
                                        <tr key={d.id} onClick={() => toggleDecl(d.id)} className={`cursor-pointer hover:bg-gray-50 ${selectedDecls.has(d.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-3 py-2 text-center">
                                                {selectedDecls.has(d.id) ? <CheckSquare className="h-4 w-4 text-blue-600 inline" /> : <Square className="h-4 w-4 text-gray-300 inline" />}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-gray-800">{d.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{declarations.length} dossiers · {selectedDecls.size} sélectionné{selectedDecls.size > 1 ? 's' : ''}</p>

                    {token && selectedDecls.size > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg font-mono text-xs break-all">
                            <span className="text-blue-800 font-medium">URL du QR : {routerUrl}<span className="font-bold">{token}</span></span>
                            <button onClick={() => copyToClipboard(routerUrl + token)} className="shrink-0 p-1 text-blue-500 hover:text-blue-800">
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Section 2 : manuelle (pour irms-dgrk.com si besoin) */}
                <div className="bg-white rounded-xl shadow border p-6 space-y-4">
                    <h2 className="font-bold text-gray-900">Liens externes (irms-dgrk.com)</h2>
                    <p className="text-sm text-gray-700">Collez des URLs externes si vous voulez rediriger vers un autre site.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Token unique</label>
                            <input
                                type="text"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="ex: VIGNETTE2026A"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 font-medium"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-800 mb-1">URLs (une par ligne)</label>
                            <textarea
                                value={urlsInput}
                                onChange={e => setUrlsInput(e.target.value)}
                                placeholder="https://irms-dgrk.com/verify/..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900"
                            />
                        </div>
                    </div>
                    <button
                        onClick={addManualSequence}
                        disabled={!token || !urlsInput.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm w-full"
                    >
                        <Plus className="h-4 w-4" /> Créer
                    </button>
                </div>

                {/* Séquences existantes */}
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-900">Séquences existantes</h2>
                    {loading ? (
                        <p className="text-sm text-gray-600">Chargement...</p>
                    ) : Object.keys(grouped).length === 0 ? (
                        <p className="text-sm text-gray-600">Aucune séquence créée.</p>
                    ) : (
                        Object.entries(grouped).map(([t, rows]) => {
                            const used = rows.filter(r => r.is_used).length;
                            const total = rows.length;
                            return (
                                <div key={t} className="bg-white rounded-xl shadow border overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-sm text-blue-800">{t}</span>
                                            <span className="text-xs text-gray-700 font-medium">{used}/{total} utilisé{used > 1 ? 's' : ''}</span>
                                            <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(used / total) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => copyToClipboard(routerUrl + t)} className="p-1.5 text-gray-500 hover:text-gray-800" title="Copier URL QR">
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => resetToken(t)} className="p-1.5 text-gray-500 hover:text-green-700" title="Réinitialiser">
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => deleteToken(t)} className="p-1.5 text-gray-500 hover:text-red-700" title="Supprimer">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {rows.map(row => (
                                            <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${row.is_used ? 'bg-gray-300 text-gray-600' : 'bg-blue-200 text-blue-800'}`}>
                                                        {String.fromCharCode(64 + row.queue_order)}
                                                    </span>
                                                    <span className="font-mono text-xs text-gray-800 truncate max-w-lg">{row.external_url}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-medium">
                                                    {row.is_used && row.scan_date && (
                                                        <span className="text-gray-600">Scanné le {new Date(row.scan_date).toLocaleDateString('fr-FR')}</span>
                                                    )}
                                                    <span className={row.is_used ? 'text-amber-600 font-bold' : 'text-green-700 font-bold'}>
                                                        {row.is_used ? 'Utilisé' : 'Disponible'}
                                                    </span>
                                                    <button onClick={() => deleteSequence(row.id)} className="p-1 text-gray-500 hover:text-red-700">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
