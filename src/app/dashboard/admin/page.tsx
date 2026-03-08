'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
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
    Loader2,
    Shield,
    Globe,
    UserCircle,
    ClipboardList,
    PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, ActivityLog, Consultation, Node, Patient, GovernanceStats } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getGovernanceStats } from '@/lib/db';

export default function AdminPage() {
    const { user, role } = useAuth();
    const [stats, setStats] = useState({
        totalNodes: 0,
        activeDoctors: 0,
        activeOperators: 0,
        todayConsultations: 0,
        totalPatients: 0,
        inventoryValue: 0
    });
    const [governance, setGovernance] = useState<GovernanceStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || role !== 'ADMIN') return;

        // 1. Real-time listener for nodes
        const unsubNodes = onSnapshot(collection(db, 'nodes'), (snap) => {
            setStats(prev => ({ ...prev, totalNodes: snap.size }));
        }, (error) => console.error('Nodes listener error:', error));

        // 2. Real-time listener for users (to count doctors and operators)
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const users = snap.docs.map(doc => doc.data() as User);
            const onlineDoctors = users.filter(u => u.role === 'DOCTOR' && u.availability === 'online').length;
            const onlineOperators = users.filter(u => u.role === 'OPERATOR').length;
            setStats(prev => ({
                ...prev,
                activeDoctors: onlineDoctors,
                activeOperators: onlineOperators
            }));
        }, (error) => console.error('Users listener error:', error));

        // 3. Real-time listener for today's consultations
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const qConsults = query(
            collection(db, 'consultations'),
            where('createdAt', '>=', startOfDay)
        );
        const unsubConsults = onSnapshot(qConsults, (snap) => {
            setStats(prev => ({ ...prev, todayConsultations: snap.size }));
        }, (error) => console.error('Consults listener error:', error));

        // 4. Real-time listener for total patients
        const unsubPatients = onSnapshot(collection(db, 'patients'), (snap) => {
            setStats(prev => ({ ...prev, totalPatients: snap.size }));
        }, (error) => console.error('Patients listener error:', error));

        // 5. Fetch logs (static limit is fine)
        const unsubLogs = onSnapshot(
            query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5)),
            (snap) => {
                setRecentLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
                setLoading(false);
            }, (error) => {
                console.error('Logs listener error:', error);
                setLoading(false);
            }
        );

        // 6. Fetch Governance Stats
        const fetchGov = async () => {
            const data = await getGovernanceStats();
            setGovernance(data);
        };
        fetchGov();

        return () => {
            unsubNodes();
            unsubUsers();
            unsubConsults();
            unsubPatients();
            unsubLogs();
        };
    }, [user, role]);

    const metrics = [
        { label: 'SATELLITE NODES', value: stats.totalNodes, icon: Globe, color: 'bg-blue-600', trend: { value: 'STABLE', isUp: true } },
        { label: 'CLINICAL STAFF', value: stats.activeDoctors, icon: Stethoscope, color: 'bg-indigo-600', trend: { value: 'ONLINE', isUp: true } },
        { label: 'OPERATIONAL UNITS', value: stats.activeOperators, icon: UserCircle, color: 'bg-emerald-600', trend: { value: 'ACTIVE', isUp: true } },
        { label: 'CONSULTATION YIELD', value: stats.todayConsultations, icon: Activity, color: 'bg-amber-600', trend: { value: `Total: ${governance?.consultationVolume || 0}`, isUp: true } },
        { label: 'VIDEO UPLINKS', value: governance?.videoSessionMetrics.totalSessions || 0, icon: Users, color: 'bg-rose-600', trend: { value: `Avg ${Math.round((governance?.videoSessionMetrics.avgDuration || 0) / 60)}m`, isUp: true } },
        { label: 'STOCK RISK INDEX', value: `${Math.round(governance?.inventoryRiskIndex || 0)}%`, icon: Package, color: 'bg-violet-500', trend: { value: governance?.inventoryRiskIndex && governance.inventoryRiskIndex > 20 ? 'CRITICAL' : 'OPTIMAL', isUp: governance?.inventoryRiskIndex ? governance.inventoryRiskIndex < 20 : true } },
    ];

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-widest">
                            System Admin
                        </div>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">OS Governance Center</h1>
                    <p className="text-slate-500 font-medium">Real-time infrastructure oversight across all healthcare nodes.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/admin/nodes">
                        <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Provision Node
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/users">
                        <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/10 border border-slate-800 flex items-center gap-2 hover:bg-slate-800 transition-all">
                            <PlusCircle className="w-4 h-4 text-primary" />
                            Provision Personnel
                        </button>
                    </Link>
                </div>
            </div>

            {/* Metrics Horizontal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10 overflow-x-auto pb-4">
                {metrics.map((metric, idx) => (
                    <MetricCard
                        key={idx}
                        {...metric}
                        loading={loading}
                    />
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Control Panel Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Infrastructure Intelligence</h3>
                                <p className="text-sm text-slate-500 font-medium">Regional load distribution and node performance</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                                    <TrendingUp className="w-5 h-5" />
                                </button>
                                <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/20">
                                    <option>Real-time View</option>
                                    <option>Last 24 Hours</option>
                                    <option>Weekly History</option>
                                </select>
                            </div>
                        </div>
                        <div className="h-80 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border border-dashed border-slate-200 p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <Globe className="w-16 h-16 text-slate-200 mb-6 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-700" />
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Processing Global Relay Data...</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Audit Registry</h3>
                                <p className="text-sm text-slate-500 font-medium">Immutable log of critical system operations</p>
                            </div>
                            <Link href="/dashboard/admin/logs" className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-bold text-primary hover:bg-primary/5 transition-all flex items-center gap-2 uppercase tracking-widest">
                                Full Audit <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {loading ? (
                                <div className="py-12 text-center"><Loader2 className="animate-spin m-auto text-primary" /></div>
                            ) : recentLogs.length === 0 ? (
                                <div className="py-20 text-center">
                                    <History className="w-12 h-12 text-slate-100 m-auto mb-4" />
                                    <p className="text-slate-400 text-sm font-medium italic">Protocol standby. No recent events.</p>
                                </div>
                            ) : recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center gap-5 p-5 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 tracking-tight group-hover:translate-x-1 transition-transform inline-block">{log.action.replace(/_/g, ' ')}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-sm">
                                                {log.userName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formatDateTime(log.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                                        <Shield className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column modules */}
                <div className="space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        <h3 className="text-[10px] font-bold text-primary mb-8 uppercase tracking-[0.3em] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Critical Integrity Alert
                        </h3>
                        <div className="space-y-8 relative z-10">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Safety Index</p>
                                    <p className="text-2xl font-black text-white">99.2%</p>
                                </div>
                                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '99.2%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(255,59,48,0.4)]"
                                    />
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] relative overflow-hidden group/alert">
                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Stock Variance Detected
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Minor discrepancy in Batch #BK-45 recorded at North Bangalore Node. Internal audit scheduled.</p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                                Initiate System Audit
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Growth Protocol</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Infrastructure Scaling</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">System resources are currently optimized. Deployment of the next 4 nodes is authorized based on current clinical load.</p>
                        <div className="space-y-3">
                            <Link href="/dashboard/admin/nodes">
                                <button className="w-full py-4 bg-slate-50 hover:bg-primary/5 border border-slate-100 rounded-2xl transition-all font-bold text-[10px] text-slate-600 hover:text-primary uppercase tracking-widest">
                                    Configure New Nodes
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
