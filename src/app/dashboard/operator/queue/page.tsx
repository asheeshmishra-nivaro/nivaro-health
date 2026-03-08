'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getConsultationsByNode } from '@/lib/db';
import { Consultation, VideoSession } from '@/types';
import {
    ClipboardList,
    Search,
    Filter,
    Loader2,
    Clock,
    User,
    Activity,
    ChevronRight,
    CheckCircle2,
    Video,
    Radio,
    ShieldCheck,
    Monitor,
    Zap,
    History as HistoryIcon,
    CircleDot,
    ArrowUpRight,
    Heart,
    Droplets
} from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import VideoEngine from '@/components/dashboard/VideoEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from '@/components/dashboard/MetricCard';
import Link from 'next/link';

export default function OperatorQueuePage() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSessions, setActiveSessions] = useState<VideoSession[]>([]);
    const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);
    const [viewMode, setViewMode] = useState<'live' | 'history'>('live');

    useEffect(() => {
        if (!user?.nodeId) return;

        // Listen for active video sessions for this node
        const sessionsQuery = query(
            collection(db, 'videoSessions'),
            where('nodeId', '==', user.nodeId),
            where('status', '==', 'requested')
        );

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoSession));
            setActiveSessions(sessions);

            if (sessions.length > activeSessions.length) {
                toast.info('Incoming Clinical Video Call Authorization Required');
            }
        }, (error) => console.error('Operator video sessions listener error:', error));

        return () => unsubscribe();
    }, [user?.nodeId, activeSessions.length]);

    useEffect(() => {
        const fetchQueue = async () => {
            if (!user?.nodeId) return;
            try {
                // Fetch all non-completed consultations for the node
                const data = await getConsultationsByNode(user.nodeId);
                const activeItems = data.filter(c => c.status !== 'completed');
                setQueue(activeItems);
            } catch (error: any) {
                console.error('Error fetching queue:', error);
                toast.error('Failed to load consultation queue');
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, [user?.nodeId]);

    const filteredQueue = queue.filter(c =>
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = queue.filter(c => c.status === 'pending').length;
    const activeCount = queue.filter(c => c.status === 'active').length;

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="max-w-7xl mx-auto py-10">
                {/* Tactical Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md">Live Command</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Node Sector: {user?.nodeId || 'GLOBAL'}</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Registry Monitor</h1>
                        <p className="text-slate-500 mt-2 font-medium">Real-time supervision of active consultations and clinical sessions.</p>
                    </div>

                    <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setViewMode('live')}
                            className={cn(
                                "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                                viewMode === 'live' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Live Monitor
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={cn(
                                "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                                viewMode === 'history' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Shift Logs
                        </button>
                    </div>
                </div>

                {/* Queue Intelligence */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <MetricCard
                        label="Wait Density"
                        value={pendingCount}
                        icon={Clock}
                        color="bg-amber-500"
                        description="Patients in queue"
                    />
                    <MetricCard
                        label="Active Uplinks"
                        value={activeCount}
                        icon={Activity}
                        color="bg-primary"
                        description="Live clinical sessions"
                    />
                    <MetricCard
                        label="Est. Wait Time"
                        value="12m"
                        icon={Zap}
                        color="bg-indigo-600"
                        description="Node throughput"
                    />
                    <MetricCard
                        label="System Integrity"
                        value="100%"
                        icon={ShieldCheck}
                        color="bg-emerald-600"
                        description="Uplink stable"
                    />
                </div>

                {/* Main Monitor Display */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Locate subject in monitor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl">
                                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Telemetry Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-32">
                                <div className="space-y-4 text-center">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary m-auto" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bridging Clinical Network...</p>
                                </div>
                            </div>
                        ) : filteredQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-32 text-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                    <Monitor className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Monitor Empty</h3>
                                <p className="text-sm font-medium text-slate-400 max-w-xs">No active clinical sessions or pending registrations detected in this sector.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Unit</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Vitals</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Node</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {filteredQueue.map((c, idx) => {
                                            const isCallActive = activeSessions.find(s => s.consultationId === c.id);
                                            return (
                                                <motion.tr
                                                    key={c.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                                                >
                                                    <td className="px-10 py-6">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest",
                                                            c.status === 'pending'
                                                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                : 'bg-primary/5 text-primary border border-primary/20 shadow-sm'
                                                        )}>
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                c.status === 'pending' ? 'bg-amber-500' : 'bg-primary animate-pulse'
                                                            )} />
                                                            {c.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                                                                {c.patientName[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{c.patientName}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {c.id.slice(-6).toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-4">
                                                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                                                                <Heart className="w-3 h-3 text-rose-500" />
                                                                <span className="text-[10px] font-black text-slate-700">{c.vitals.bp}</span>
                                                            </div>
                                                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                                                                <Droplets className="w-3 h-3 text-blue-500" />
                                                                <span className="text-[10px] font-black text-slate-700">{c.vitals.spo2}%</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sector Allocated</span>
                                                            <span className="text-xs font-bold text-slate-700">CLINICAL_ALPHA_0{idx + 1}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            {isCallActive ? (
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => setCurrentSession(isCallActive || null)}
                                                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 group/btn overflow-hidden relative"
                                                                >
                                                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                                    <Video className="w-4 h-4 relative z-10" />
                                                                    <span className="relative z-10">Sync Uplink</span>
                                                                </motion.button>
                                                            ) : (
                                                                <button className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-white transition-all">
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">System Integrity: OPTIMAL • {queue.length} Total Units in Sector</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Automatic Sector Synchronization Active</div>
                            <div className="h-4 w-px bg-slate-200" />
                            <Link href="/dashboard/operator" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2.5">
                                Return to Command <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Engine Overlay */}
            {currentSession && (
                <VideoEngine
                    sessionId={currentSession.id}
                    patientName={queue.find(c => c.id === currentSession.consultationId)?.patientName || 'Patient'}
                    role="OPERATOR"
                    onEnd={() => setCurrentSession(null)}
                />
            )}
        </DashboardLayout>
    );
}
