'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    MapPin,
    History,
    Stethoscope,
    Package,
    UserPlus,
    ClipboardList,
    LogOut,
    Shield,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const adminLinks = [
    { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin' },
    { name: 'Nodes', icon: MapPin, href: '/dashboard/admin/nodes' },
    { name: 'Users', icon: Users, href: '/dashboard/admin/users' },
    { name: 'Inventory', icon: Package, href: '/dashboard/admin/inventory' },
    { name: 'Audit Logs', icon: History, href: '/dashboard/admin/logs' },
];

const doctorLinks = [
    { name: 'Consultations', icon: Stethoscope, href: '/dashboard/doctor' },
    { name: 'Patients', icon: Users, href: '/dashboard/doctor/patients' },
    { name: 'History', icon: History, href: '/dashboard/doctor/history' },
];

const operatorLinks = [
    { name: 'Operations', icon: Activity, href: '/dashboard/operator' },
    { name: 'Register Patient', icon: UserPlus, href: '/dashboard/operator/register' },
    { name: 'Inventory', icon: Package, href: '/dashboard/operator/inventory' },
    { name: 'Queue', icon: ClipboardList, href: '/dashboard/operator/queue' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user } = useAuth();
    const router = useRouter();

    const links = role === 'ADMIN' ? adminLinks : role === 'DOCTOR' ? doctorLinks : operatorLinks;

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
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <Shield className="w-8 h-8 text-primary" />
                    <div className="flex flex-col">
                        <span className="font-display font-bold text-lg tracking-tight">NIVARO</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Operating System</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-primary")} />
                                <span className="font-medium">{link.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 p-4 rounded-2xl mb-4">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Active User</p>
                        <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-primary font-bold bg-primary/10 inline-block px-2 py-0.5 rounded mt-1">
                            {role}
                        </p>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-50 flex justify-around items-center">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all relative",
                                isActive ? "text-primary" : "text-slate-400"
                            )}
                        >
                            <link.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{link.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Mobile Top Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="font-display font-black text-sm tracking-tight text-slate-900">NIVARO OS</span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Spacer */}
            <div className="lg:hidden h-16" />
        </>
    );
}
