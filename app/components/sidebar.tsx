'use client';
// force-deploy: 2026-03-02T19:53

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Briefcase, ScanLine, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getTariffMode, TariffMode } from '@/lib/tariff-mode';

const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Scan IA', href: '/scan', icon: ScanLine },
    { name: 'Déclarations', href: '/declarations', icon: FileText },
    { name: 'Dossiers Entreprises', href: '/societes', icon: Briefcase },
    { name: 'Paramètres', href: '/parametres', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [tariffMode, setTariffMode] = useState<TariffMode>('legacy');

    useEffect(() => {
        setTariffMode(getTariffMode());
        const handleChange = (e: Event) => {
            setTariffMode((e as CustomEvent<TariffMode>).detail);
        };
        window.addEventListener('tariffModeChanged', handleChange);
        return () => window.removeEventListener('tariffModeChanged', handleChange);
    }, []);

    return (
        <div className="flex flex-col w-64 border-r border-gray-200 h-screen bg-white fixed left-0 top-0 print:hidden">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blurple-500">
                    tax-portal
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-violet-50 text-violet-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Indicateur de mode tarifaire */}
            <div className="px-4 pb-2">
                <Link href="/parametres" className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                    tariffMode === 'new2026'
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                )}>
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {tariffMode === 'new2026' ? '🆕 Grille 2026 Active' : '📋 Grille Actuelle Active'}
                </Link>
            </div>

            <div className="p-4 border-t border-gray-100">
                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                </button>
            </div>
        </div>
    );
}
