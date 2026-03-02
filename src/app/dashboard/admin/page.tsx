'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users,
    MapPin,
    Activity,
    Package,
    Stethoscope,
    TrendingUp,
    AlertCircle,
    History,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, ActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const statsInitial = [
    { label: 'Network Nodes', value: '0', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Doctor Utilization', value: '0%', icon: Stethoscope, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Inventory Risk', value: 'Low', icon: AlertCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'System Health', value: '0', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function AdminPage() {
    const [metrics, setMetrics] = useState({
        nodes: 0,
        utilization: 0,
        inventoryRisk: 'Low',
        healthScore: 0
    });
    const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGovernanceMetrics = async () => {
            try {
                const [nSnap, uSnap, cSnap, lSnap] = await Promise.all([
                    getDocs(collection(db, 'nodes')),
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'consultations')),
                    getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5)))
                ]);

                const doctors = uSnap.docs.filter(u => u.data().role === 'DOCTOR').length;
                const consultations = cSnap.size;
                const nodes = nSnap.size;

                // Simple Governance Logic
                const utilization = doctors > 0 ? (consultations / (doctors * 10)) * 100 : 0; // Assuming 10 consultations/doctor capacity
                const healthScore = Math.min(100, (nodes * 10) + (consultations / 5));

                setMetrics({
                    nodes,
                    utilization: Math.round(utilization),
                    inventoryRisk: 'Minimal', // Placeholder until multi-node inventory fetch
                    healthScore: Math.round(healthScore)
                });

                setRecentLogs(lSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
            } catch (error) {
                console.error('Governance metrics error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGovernanceMetrics();
    }, []);

    const statCards = [
        { label: 'Network Nodes', value: metrics.nodes, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Doctor Utilization', value: `${metrics.utilization}%`, icon: Stethoscope, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Inventory Risk', value: metrics.inventoryRisk, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'System Health Score', value: metrics.healthScore, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Governance Control System</h1>
                    <p className="text-slate-500">Infrastructure oversight and multi-node accountability.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-slate-900 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-slate-900/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Infrastructure Online
                    </div>
                </div>
            </div>

            {/* Governance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon className="w-20 h-20" />
                        </div>
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        {loading ? (
                            <div className="h-8 w-16 bg-slate-50 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-display font-bold text-slate-900">{stat.value}</p>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Governance View */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Infrastructure Scalability</h3>
                                <p className="text-xs text-slate-500 font-medium">Node deployment and clinical volume trends</p>
                            </div>
                            <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10">
                                <option>Quarterly View</option>
                                <option>Monthly View</option>
                            </select>
                        </div>
                        <div className="h-72 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 p-8">
                            <TrendingUp className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 text-sm font-medium">Data Intelligence Layer Processing...</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Audit & Accountability Log</h3>
                                <p className="text-xs text-slate-500 font-medium">Global activity trace for all critical events</p>
                            </div>
                            <Link href="/dashboard/admin/logs" className="text-xs font-bold text-primary hover:underline group flex items-center gap-1">
                                Full Registry <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="py-10 text-center"><Loader2 className="animate-spin m-auto text-primary" /></div>
                            ) : recentLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 text-sm font-medium">No system-wide activity recorded yet.</p>
                            ) : recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            {log.userName} • {formatDateTime(log.timestamp)}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-500">DETAILS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Governance Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <Package className="w-4 h-4 text-indigo-500" />
                            Stock Leakage Index
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                                    <span className="text-slate-500">Traceability Rate</span>
                                    <span className="text-indigo-600">98.4%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[98.4%] transition-all duration-1000" />
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/10">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-white mb-1">Stock Anomaly Detected</p>
                                        <p className="text-slate-400 leading-relaxed">Minor variance in Batch #BK-45 at Node 04. Audit required.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <TrendingUp className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Network Expansion</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Infrastructure is optimized for current load. Scaling protocol ready for next 5 nodes.</p>
                        <button className="w-full py-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs uppercase tracking-widest">
                            Download Audit Report
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
