'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users,
    Search,
    Filter,
    MapPin,
    Calendar,
    ChevronRight,
    Loader2,
    Database,
    Shield
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient, Node } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';

export default function AdminPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pSnap, nSnap] = await Promise.all([
                    getDocs(query(collection(db, 'patients'), orderBy('createdAt', 'desc'))),
                    getDocs(collection(db, 'nodes'))
                ]);

                setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
                setNodes(nSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
            } catch (error) {
                console.error("Error fetching patient data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact?.includes(searchTerm)
    );

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Global Health Registry</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Master Patient Database Index</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{patients.length} Total Records</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="relative max-w-md w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Patients by Name or Identity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-[2rem] text-xs font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-inner placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 text-slate-400 hover:text-primary transition-all shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Intelligence</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Assignment</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Accessing Encrypted Bio-Records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30 grayscale">
                                            <Users className="w-20 h-20 text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No patient records found in uplink.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient, idx) => (
                                    <motion.tr
                                        key={patient.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
                                                    {patient.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base tracking-tight uppercase">{patient.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 mt-1">
                                                        <Shield className="w-3 h-3 text-indigo-400" />
                                                        PH: {patient.contact || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl w-fit group-hover:bg-white transition-colors">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    {nodes.find(n => n.id === patient.nodeId)?.name || 'Central Node'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatDateTime(patient.createdAt)}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active File</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="p-4 rounded-2xl bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all hover:bg-slate-900 hover:text-white shadow-sm">
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
