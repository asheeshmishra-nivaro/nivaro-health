'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Stethoscope,
    Search,
    Filter,
    MapPin,
    Calendar,
    ChevronRight,
    Loader2,
    Activity,
    Shield,
    Clock,
    User
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Consultation, Node } from '@/types';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';

export default function AdminConsultationsPage() {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cSnap, nSnap] = await Promise.all([
                    getDocs(query(collection(db, 'consultations'), orderBy('createdAt', 'desc'))),
                    getDocs(collection(db, 'nodes'))
                ]);

                setConsultations(cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation)));
                setNodes(nSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
            } catch (error) {
                console.error("Error fetching consultation data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredConsultations = consultations.filter(c =>
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.doctorId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'doctor-assigned': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
            case 'active': return 'bg-primary/10 text-primary border-primary/20';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Operations Log</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Aggregate Consultation Master Stream</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 font-display">{consultations.length} Active Sessions</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="relative max-w-md w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter Sessions by Patient or Doctor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-[2rem] text-xs font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-inner placeholder:text-slate-300"
                        />
                    </div>
                    <button className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 text-slate-400 hover:text-primary transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Intel</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Node</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Activity</th>
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
                            ) : filteredConsultations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30 grayscale">
                                            <Stethoscope className="w-20 h-20 text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No active data streams detected.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredConsultations.map((consult, idx) => (
                                    <motion.tr
                                        key={consult.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xl shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                    {consult.patientName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base tracking-tight uppercase">{consult.patientName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User className="w-3 h-3 text-indigo-400" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Dr. ID: {consult.doctorId?.slice(-8).toUpperCase() || 'UNA-SSIGNED'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl w-fit group-hover:bg-white transition-colors">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    {nodes.find(n => n.id === consult.nodeId)?.name || 'Central Node'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-2">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${getStatusStyle(consult.status)}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{consult.status}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTime(consult.createdAt)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
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
