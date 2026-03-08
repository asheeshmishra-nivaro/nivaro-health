'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users,
    Search,
    Filter,
    UserPlus,
    ArrowRight,
    MapPin,
    Calendar,
    Phone,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PatientDirectoryPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user?.nodeId) return;

        const q = query(
            collection(db, 'patients'),
            where('nodeId', '==', user.nodeId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
            setPatients(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching patients:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.nodeId]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact.includes(searchTerm)
    );

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black rounded-md uppercase tracking-widest">
                            Clinical Records Vault
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.nodeId}</p>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Users className="w-10 h-10 text-indigo-500" />
                        Unified Patient Registry
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Permanent storage for medical reports and clinical consultation history.</p>
                </div>

                <Link href="/dashboard/operator/register">
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">
                        <UserPlus className="w-5 h-5" />
                        Quick Registration
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="relative max-w-xl w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Name, Contact, or Permanent ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-black placeholder:text-slate-300 outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="hidden md:flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{patients.length} Registered Subjects</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[800px] custom-scrollbar">
                    {loading ? (
                        <div className="col-span-full py-40 text-center flex flex-col items-center gap-6">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Accessing Distributed Ledger...</p>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="col-span-full py-40 text-center opacity-30 grayscale flex flex-col items-center gap-6">
                            <Users className="w-20 h-20 text-slate-200" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] italic">No patient identity found matching query.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredPatients.map((patient, idx) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link href={`/dashboard/operator/patients/${patient.id}`}>
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 group hover:bg-white hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-all duration-700" />

                                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-xl text-indigo-500 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                                    {patient.name[0]}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-black text-slate-900 text-lg tracking-tight truncate group-hover:text-indigo-600 transition-colors">{patient.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">ID: {patient.id.slice(-6).toUpperCase()}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-300 group-hover:text-indigo-500 group-hover:border-indigo-500/20 transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <div className="space-y-4 relative z-10 flex-1">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-white/50 border border-slate-100/50">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Age / Sex</p>
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tighter">{patient.age || '--'} / {patient.gender}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-white/50 border border-slate-100/50">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Active</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-3xl bg-white/40 border border-slate-100/50 space-y-3">
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <Phone className="w-3.5 h-3.5 text-indigo-400/60" />
                                                        <span className="text-[10px] font-bold tracking-widest uppercase">{patient.contact}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <MapPin className="w-3.5 h-3.5 text-indigo-400/60" />
                                                        <span className="text-[10px] font-bold tracking-widest uppercase truncate">{patient.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-500 pt-2 border-t border-slate-100/50">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-400/60" />
                                                        <span className="text-[10px] font-bold tracking-widest uppercase">Member Since: {patient.createdAt?.toDate?.()?.toLocaleDateString() || '...'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-100/50 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">Access Vault Protocol</span>
                                                <div className="px-4 py-2 bg-indigo-500/5 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-widest group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    Open Records
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
