'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getConsultationsByNode } from '@/lib/db';
import { Consultation, VideoSession } from '@/types';
import { ClipboardList, Search, Filter, Loader2, Clock, User, Activity, ChevronRight, CheckCircle2, Video } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import VideoEngine from '@/components/dashboard/VideoEngine';

export default function OperatorQueuePage() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSessions, setActiveSessions] = useState<VideoSession[]>([]);
    const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);

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
                toast.info('Incoming Clinical Video Call...');
            }
        });

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
                if (error.code === 'failed-precondition') {
                    toast.error('Queue requires a database index. Check console for link.');
                } else {
                    toast.error('Failed to load consultation queue');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, [user?.nodeId]);

    const filteredQueue = queue.filter(c =>
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">Clinical Queue</h1>
                <p className="text-slate-500">Monitor patients waiting for clinical consultation at your node.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find patient in queue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg">LIVE QUEUE</button>
                        <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-lg">HISTORY</button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <Clock className="w-12 h-12 opacity-20" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Queue is empty</h3>
                            <p className="text-sm max-w-xs">New patients will appear here once registered for clinical consultation.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-6 py-4">Patient Details</th>
                                    <th className="px-6 py-4">Current Vitals</th>
                                    <th className="px-6 py-4">Estd. Wait</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQueue.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold ${c.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'}`} />
                                                {c.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                                                    {c.patientName[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{c.patientName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold tracking-widest leading-none">ID: #{c.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-3">
                                                <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">BP: {c.vitals.bp}</div>
                                                <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">SpO2: {c.vitals.spo2}%</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-slate-500">{c.status === 'pending' ? '15-20 min' : 'In Consult'}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {activeSessions.find(s => s.consultationId === c.id) && (
                                                    <button
                                                        onClick={() => setCurrentSession(activeSessions.find(s => s.consultationId === c.id) || null)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold animate-pulse hover:animate-none transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        JOIN CALL
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-white hover:text-primary rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <p className="text-xs text-slate-400 font-medium">Node: {user?.nodeId?.toUpperCase()} • Clinical Point Online</p>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-refreshing in 30s</div>
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
