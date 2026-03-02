'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    UserPlus,
    Activity,
    ClipboardList,
    Package,
    TrendingUp,
    Search,
    Plus,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Patient, Consultation } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OperatorPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ registrations: 0, consultations: 0 });
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.nodeId) return;

        const patientsQuery = query(
            collection(db, 'patients'),
            where('nodeId', '==', user.nodeId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
            const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
            setRecentPatients(patients);
            setStats(prev => ({ ...prev, registrations: snapshot.size }));
            setLoading(false);
        }, (error) => {
            console.error('Patients listener error:', error);
            setLoading(false);
            if (error.code === 'failed-precondition') {
                toast.error('Dashboard requires a database index. Please check the console for the link.');
            }
        });

        // Also get active consultations count
        const consultQuery = query(
            collection(db, 'consultations'),
            where('nodeId', '==', user.nodeId),
            where('status', '==', 'pending')
        );
        getDocs(consultQuery).then(snap => {
            setStats(prev => ({ ...prev, consultations: snap.size }));
        }).catch(err => {
            console.error('Consultations fetch error:', err);
        });

        return () => unsubscribe();
    }, [user?.nodeId]);

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Field Operations</h1>
                    <p className="text-slate-500">Manage patient intake and daily node statistics.</p>
                </div>
                <Link href="/dashboard/operator/register">
                    <button className="btn-primary flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        New Patient Registration
                    </button>
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick Actions & Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Node Activity Today
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">New Registrations</span>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-bold">{stats.registrations}</span>}
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Active Consultations</span>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-bold">{stats.consultations}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200">
                        <TrendingUp className="w-8 h-8 opacity-50 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Inventory Sync</h3>
                        <p className="text-emerald-50/80 text-sm mb-6">Stock levels are being tracked in real-time for your node.</p>
                        <Link href="/dashboard/operator/inventory" className="block w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-medium text-sm text-center">
                            Check Local Stock
                        </Link>
                    </div>
                </div>

                {/* Recent Registrations / Queue */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold">Recent Registrations</h3>
                            <div className="relative max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Find patient..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
                            ) : recentPatients.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                                    <p>No registrations found for this node.</p>
                                </div>
                            ) : recentPatients.map((p) => (
                                <div key={p.id} className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-6">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                                        {p.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{p.name}</p>
                                        <p className="text-xs text-slate-500">ID: {p.id.slice(-6).toUpperCase()} • {p.gender} • {p.age} yrs</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Enrolled</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">{(p as any).createdAt?.toDate()?.toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 text-center">
                            <button className="text-sm font-bold text-primary flex items-center gap-1 mx-auto hover:underline">
                                View Full Activity Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
