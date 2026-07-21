'use client';

import { useState, useEffect } from 'react';
import { Declaration } from '@/types';
import { BarChart3, Sun, Moon, FileText, DollarSign, TrendingUp, CalendarDays } from 'lucide-react';

function cn(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function getDayKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
    return isSameDay(dateStr, new Date().toISOString());
}

export default function StatistiquesPage() {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { getSavedDeclarations } = await import('@/lib/store');
            const data = await getSavedDeclarations();
            if (data) setDeclarations(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const isLegacy = (d: Declaration) => (d.meta as any)?.tariffMode !== 'new2026';
    const isNew2026 = (d: Declaration) => (d.meta as any)?.tariffMode === 'new2026';

    const days = new Map<string, Declaration[]>();
    declarations.forEach(d => {
        const key = getDayKey(d.createdAt);
        if (!days.has(key)) days.set(key, []);
        days.get(key)!.push(d);
    });

    const sortedDays = Array.from(days.entries()).sort(([a], [b]) => b.localeCompare(a));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-violet-700" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Bilan Comptable Journalier</h1>
                    <p className="text-xs text-gray-400">Clôture automatique chaque jour à 00h00</p>
                </div>
            </div>

            {sortedDays.map(([dayKey, dayDecls]) => {
                const today = isToday(dayKey);
                const legacy = dayDecls.filter(isLegacy);
                const new2026 = dayDecls.filter(isNew2026);

                const totalUSD = dayDecls.reduce((s, d) => s + (d.tax?.baseRate || 0), 0);
                const totalFC = dayDecls.reduce((s, d) => s + (d.tax?.totalAmountFC || 0), 0);
                const legacyUSD = legacy.reduce((s, d) => s + (d.tax?.baseRate || 0), 0);
                const legacyFC = legacy.reduce((s, d) => s + (d.tax?.totalAmountFC || 0), 0);
                const newUSD = new2026.reduce((s, d) => s + (d.tax?.baseRate || 0), 0);
                const newFC = new2026.reduce((s, d) => s + (d.tax?.totalAmountFC || 0), 0);

                const paidCount = dayDecls.filter(d => d.status === 'Payée').length;
                const billedCount = dayDecls.filter(d => d.status === 'Facturée').length;

                const earliest = dayDecls.reduce((earliest, d) => d.createdAt < earliest ? d.createdAt : earliest, dayDecls[0].createdAt);
                const latest = dayDecls.reduce((latest, d) => d.createdAt > latest ? d.createdAt : latest, dayDecls[0].createdAt);

                return (
                    <div
                        key={dayKey}
                        className={cn(
                            "rounded-xl border overflow-hidden transition-all",
                            today ? "border-violet-300 shadow-md bg-gradient-to-br from-white to-violet-50" : "border-gray-200 shadow-sm bg-white"
                        )}
                    >
                        {/* Day Header */}
                        <div className={cn(
                            "flex items-center justify-between px-5 py-3 border-b",
                            today ? "bg-violet-600 text-white border-violet-600" : "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                            <div className="flex items-center gap-3">
                                {today ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                <div>
                                    <h2 className="font-bold text-sm">{formatDate(dayKey)}</h2>
                                    <p className={cn("text-xs", today ? "text-violet-200" : "text-gray-400")}>
                                        {today ? 'Session en cours • ' : 'Clôturé • '}
                                        {formatTime(earliest)} - {formatTime(latest)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="font-bold">{dayDecls.length} dossier{dayDecls.length > 1 ? 's' : ''}</span>
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", today ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-600")}>
                                    {today ? 'ACTIF' : 'CLÔTURÉ'}
                                </span>
                            </div>
                        </div>

                        {/* Day Body */}
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Legacy */}
                                <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-4 border border-orange-100">
                                    <p className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Session Legacy</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{legacy.length}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-600 font-medium">
                                            <span className="text-emerald-600 font-bold">$ {legacyUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            FC {legacyFC.toLocaleString('en-US')}
                                        </p>
                                    </div>
                                </div>

                                {/* New 2026 */}
                                <div className="bg-gradient-to-br from-violet-50 to-white rounded-lg p-4 border border-violet-100">
                                    <p className="text-[10px] uppercase font-bold text-violet-600 tracking-wider">Session 2026</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{new2026.length}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-600 font-medium">
                                            <span className="text-emerald-600 font-bold">$ {newUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            FC {newFC.toLocaleString('en-US')}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Day */}
                                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Total Journée</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{dayDecls.length}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-bold">
                                            <span className="text-emerald-600">$ {totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </p>
                                        <p className="text-xs text-blue-700 font-semibold">
                                            FC {totalFC.toLocaleString('en-US')}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        {paidCount} Payée · {billedCount} Facturée
                                    </p>
                                </div>
                            </div>

                            {/* Declaration list for today */}
                            {today && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Déclarations du jour</p>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {dayDecls.map(d => (
                                            <div key={d.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-3 w-3 text-gray-400" />
                                                    <span className="font-mono text-gray-500">{d.vehicle.plate}</span>
                                                    <span className="text-gray-400">{(d.meta as any)?.tariffMode === 'new2026' ? '2026' : 'Legacy'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500">$ {(d.tax?.baseRate || 0).toFixed(2)}</span>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                                        d.status === 'Payée' ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"
                                                    )}>
                                                        {d.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {sortedDays.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">Aucune déclaration enregistrée.</p>
                </div>
            )}
        </div>
    );
}
