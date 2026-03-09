'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    History,
    BarChart3,
    LogOut,
    Shield,
    Activity,
    Settings,
    Package,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user } = useAuth();
    const router = useRouter();

    const getLinks = () => {
        const base = [
            { name: 'Dashboard', icon: LayoutDashboard, href: `/dashboard/${role?.toLowerCase()}` },
        ];

        if (role === 'ADMIN') {
            return [
                ...base,
                { name: 'Consultations', icon: Stethoscope, href: '/dashboard/admin/consultations' },
                { name: 'Patients', icon: Users, href: '/dashboard/admin/patients' },
                { name: 'Clinical Nodes', icon: MapPin, href: '/dashboard/admin/nodes' },
                { name: 'Clinical Authority', icon: Shield, href: '/dashboard/admin/users' },
                { name: 'History', icon: History, href: '/dashboard/admin/logs' },
                { name: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics' },
                { name: 'Inventory', icon: Package, href: '/dashboard/admin/inventory' },
            ];
        }

        if (role === 'DOCTOR') {
            return [
                ...base,
                { name: 'Consultations', icon: Stethoscope, href: '/dashboard/doctor' },
                { name: 'Patients', icon: Users, href: '/dashboard/doctor/patients' },
                { name: 'Consultation Logs', icon: History, href: '/dashboard/doctor/history' },
                { name: 'Analytics', icon: BarChart3, href: '/dashboard/doctor/analytics' },
            ];
        }

        if (role === 'OPERATOR') {
            return [
                ...base,
                { name: 'Consultations', icon: Activity, href: '/dashboard/operator/queue' },
                { name: 'Patients', icon: Users, href: '/dashboard/operator/patients' },
                { name: 'History', icon: History, href: '/dashboard/operator/history' },
                { name: 'Analytics', icon: BarChart3, href: '/dashboard/operator/earnings' },
                { name: 'Inventory', icon: Package, href: '/dashboard/operator/inventory' },
            ];
        }

        return base;
    };

    const links = getLinks();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/login');
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-64 h-screen bg-slate-900 text-white flex-col fixed left-0 top-0 z-50">
                <div className="p-8 flex items-center gap-3 border-b border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display font-black text-xl tracking-tight leading-none">NIVARO</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Health OS</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1">
                    <p className="px-4 mb-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</p>
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                                    isActive
                                        ? "bg-white/5 text-white"
                                        : "text-slate-500 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute inset-0 bg-primary/10 rounded-2xl blur-sm"
                                    />
                                )}
                                <link.icon className={cn(
                                    "w-5 h-5 transition-colors duration-300 relative z-10",
                                    isActive ? "text-primary" : "group-hover:text-primary"
                                )} />
                                <span className="font-bold text-sm relative z-10 tracking-tight">{link.name}</span>
                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-white/5">
                    <div className="bg-white/[0.03] p-5 rounded-[2rem] mb-6 border border-white/[0.05]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-primary border border-white/5">
                                {user?.name?.[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all font-bold text-[10px] uppercase tracking-widest"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Exit Session</span>
                        </button>
                    </div>
                    <p className="text-center text-[8px] text-slate-600 font-bold uppercase tracking-widest">Nivaro V2.0 PRO</p>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/5 px-2 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-50 flex justify-around items-center">
                {links.slice(0, 4).map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all relative",
                                isActive ? "text-primary" : "text-slate-500"
                            )}
                        >
                            <link.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                            <span className="text-[8px] font-bold uppercase tracking-tight">{link.name}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Mobile Top Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-white/5 px-6 flex items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display font-black text-sm tracking-tight text-white uppercase">NIVARO OS</span>
                </div>
            </div>

            {/* Mobile Spacer */}
            <div className="lg:hidden h-16" />
        </>
    );
}
