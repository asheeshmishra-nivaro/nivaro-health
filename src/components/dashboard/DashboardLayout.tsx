'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Bell, MessageSquare, History as HistoryIcon, X, Activity } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppNotification } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
    const [showActivity, setShowActivity] = React.useState(true);

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (role && !allowedRoles.includes(role)) {
                if (role === 'ADMIN') router.push('/dashboard/admin');
                else if (role === 'DOCTOR') router.push('/dashboard/doctor');
                else if (role === 'OPERATOR') router.push('/dashboard/operator');
            }
        }
    }, [user, role, loading, allowedRoles, router]);

    React.useEffect(() => {
        if (!user?.uid) return;

        const notifRef = collection(db, 'notifications');
        const q = query(
            notifRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            setNotifications(notifs);
        }, (error) => {
            console.error('Notification listener error:', error);
            // Ignore permission-denied errors during transition
        });

        return () => unsubscribe();
    }, [user?.uid]);

    if (loading || !user || !role || !allowedRoles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nivaro Syncing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 min-h-screen overflow-hidden">
            <Sidebar />

            <main className={cn(
                "flex-1 lg:ml-64 h-screen overflow-y-auto transition-all duration-500",
                showActivity && "lg:mr-80"
            )}>
                <div className="p-4 lg:p-8 pb-32">
                    <div className="max-w-[1400px] mx-auto">
                        <header className="flex justify-between items-center mb-8 lg:hidden">
                            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">NIVARO</h2>
                            <button
                                onClick={() => setShowActivity(!showActivity)}
                                className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm relative"
                            >
                                <Bell className="w-5 h-5 text-slate-500" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                                )}
                            </button>
                        </header>
                        {children}
                    </div>
                </div>
            </main>

            {/* Right Side Activity Panel */}
            <aside className={cn(
                "hidden lg:flex w-80 h-screen bg-white border-l border-slate-100 flex-col fixed right-0 top-0 z-40 transition-transform duration-500",
                !showActivity && "translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Live Feed
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 relative">
                            <Bell className="w-4 h-4" />
                            {notifications.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Notifications</p>
                        <div className="space-y-4">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <MessageSquare className="w-8 h-8 m-auto mb-2 text-slate-200" />
                                    <p className="text-xs font-medium text-slate-400 italic">No new activity.</p>
                                </div>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all cursor-default"
                                    >
                                        <p className="text-xs font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{notif.title}</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">{formatDateTime(notif.createdAt)}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">System Alerts</p>
                        <div className="p-5 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-tight">OS Optimization</p>
                            <p className="text-xs leading-relaxed text-slate-400">All clinical nodes are currently operating within nominal latency parameters.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Relay Connected</span>
                    </div>
                </div>
            </aside>

            {/* Float toggle for Activity Panel */}
            <button
                onClick={() => setShowActivity(!showActivity)}
                className={cn(
                    "hidden lg:flex fixed bottom-8 right-8 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl items-center justify-center text-white z-50 transition-all hover:scale-110 active:scale-95 hover:bg-primary hover:border-primary",
                    showActivity && "lg:right-[340px]"
                )}
            >
                {showActivity ? <X className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </button>
        </div>
    );
}
