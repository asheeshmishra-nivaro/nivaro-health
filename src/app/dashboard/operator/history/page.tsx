'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    History,
    Search,
    Filter,
    Clock,
    Shield,
    Activity,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Database,
    ArrowRight
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLog } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';

export default function OperatorHistoryPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user?.uid || !user?.nodeId) return;
        const fetchLogs = async () => {
            try {
                const logsRef = collection(db, 'activityLogs');
                const q = query(
                    logsRef,
                    where('nodeId', '==', user.nodeId),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );
                const snapshot = await getDocs(q);
                setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user?.uid, user?.nodeId]);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionStyle = (action: string) => {
        if (action.includes('CONSULTATION')) return 'bg-primary/10 text-primary border-primary/20';
        if (action.includes('INVENTORY')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (action.includes('REGISTER')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    };

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Mission Control History</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Node-Specific Activity & Operational Stream</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{logs.length} Recorded Actions</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="relative max-w-md w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Logs by Action or Detail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-[2.5rem] text-xs font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-inner placeholder:text-slate-300"
                        />
                    </div>
                    <button className="p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-primary/20 text-slate-400 hover:text-primary transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Event</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Lifecycle</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp Index</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Accessing Mission Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30 grayscale">
                                            <History className="w-20 h-20 text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No mission records found for this node.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log, idx) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-base shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
                                                    {log.action[0]}
                                                </div>
                                                <div className="max-w-md">
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none mb-2">{log.action.replace(/_/g, ' ')}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{log.details}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${getActionStyle(log.action)}`}>
                                                <Shield className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Event</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Clock className="w-4 h-4 text-slate-300" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{formatDateTime(log.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 inline-flex items-center gap-2 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all opacity-0 group-hover:opacity-100">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Signed Log</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
