'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Déclarations', href: '/declarations', icon: FileText },
    { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 border-r border-gray-200 h-screen bg-white fixed left-0 top-0 print:hidden">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blurple-500">
                    TaxPortal
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
                    return (
                        <Link
                            key={item.name}
                            href="#"
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

            <div className="p-4 border-t border-gray-100">
                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                </button>
            </div>
        </div>
    );
}
