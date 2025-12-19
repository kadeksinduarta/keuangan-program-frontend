'use client';

import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
    FaHome,
    FaFolderOpen,
    FaMoneyBillWave,
    FaChartBar,
    FaSignOutAlt,
    FaUserCircle,
    FaBars,
    FaTimes,
    FaWallet,
    FaExchangeAlt,
    FaFileInvoiceDollar
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
                setIsMobile(true);
            } else {
                setSidebarOpen(true);
                setIsMobile(false);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const menuItems = [
        { icon: FaHome, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'anggota', 'public'] },
        { icon: FaFolderOpen, label: 'Program Kerja', href: '/dashboard/programs', roles: ['admin', 'anggota'] },
        { icon: FaFileInvoiceDollar, label: 'RAB & Anggaran', href: '/dashboard/rab', roles: ['admin', 'anggota'] },
        { icon: FaExchangeAlt, label: 'Transaksi', href: '/dashboard/transactions', roles: ['admin', 'anggota'] },
        { icon: FaWallet, label: 'Pengeluaran', href: '/dashboard/expenses', roles: ['admin', 'anggota'] },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!user) return item.roles.includes('public');
        return item.roles.includes(user.role);
    });

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 h-screen z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none flex flex-col
                    ${sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                            <FaChartBar className="text-white text-lg" />
                        </div>
                        <div className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'} whitespace-nowrap`}>
                            <h1 className="font-bold text-xl tracking-tight text-slate-900">Keuangan</h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Dashboard System</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = router.pathname === item.href;

                        return (
                            <button
                                key={item.href}
                                onClick={() => {
                                    router.push(item.href);
                                    if (isMobile) setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                                )}
                                <Icon className={`text-xl flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span className={`transition-all duration-300 origin-left ${sidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 w-0'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!sidebarOpen && !isMobile && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className={`flex items-center gap-3 mb-4 transition-all duration-300 ${!sidebarOpen && 'justify-center'}`}>
                        {user ? (
                            <>
                                <div className="relative">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center">
                                            <span className="text-indigo-700 font-bold">{user.name.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>

                                {sidebarOpen && (
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-200
                            ${!sidebarOpen ? 'bg-transparent border-transparent hover:bg-slate-200 text-slate-500' : 'bg-white border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 shadow-sm'}
                        `}
                    >
                        <FaSignOutAlt className={`${sidebarOpen ? 'text-lg' : 'text-xl'}`} />
                        {sidebarOpen && <span className="font-medium text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 min-w-0 transition-all duration-300 flex flex-col h-screen overflow-hidden`}>
                {/* Mobile Header */}
                <div className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <FaBars className="text-xl" />
                        </button>
                        <span className="font-bold text-lg text-slate-900">Keuangan</span>
                    </div>
                    {user && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-700 font-bold text-xs">{user.name.charAt(0)}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-8 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}
