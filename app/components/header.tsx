'use client';

import { Bell, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean);

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6 sticky top-0 z-10 w-full print:hidden">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-900 transition-colors">
                    Accueil
                </Link>
                {pathSegments.length > 0 && <ChevronRight className="h-4 w-4" />}
                {pathSegments.map((segment, index) => {
                    const isLast = index === pathSegments.length - 1;
                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;

                    return (
                        <div key={href} className="flex items-center gap-2">
                            <Link
                                href={href}
                                className={`capitalize transition-colors ${isLast ? 'font-medium text-gray-900 pointer-events-none' : 'hover:text-gray-900'
                                    }`}
                            >
                                {segment}
                            </Link>
                            {!isLast && <ChevronRight className="h-4 w-4" />}
                        </div>
                    );
                })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200" />
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">Josuah Kitona</p>
                        <p className="text-xs text-gray-500">Contribuable</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700">
                        <User className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </header>
    );
}
