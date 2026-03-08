'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    MapPin,
    Plus,
    MoreVertical,
    Search,
    Loader2,
    Building2,
    Users as UsersIcon,
    Shield,
    Globe,
    Activity,
    CheckCircle2,
    X,
    Server,
    Zap,
    AlertTriangle,
    Navigation2
} from 'lucide-react';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNode, logActivity } from '@/lib/db';
import { Node } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NodesPage() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user, role } = useAuth();

    const [newNode, setNewNode] = useState({
        name: '',
        location: '',
        contact: '',
    });

    useEffect(() => {
        // Real-time nodes listener
        const unsubNodes = onSnapshot(collection(db, 'nodes'), (snap) => {
            setNodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
            setLoading(false);
        }, (error) => {
            console.error('Nodes registry listener error:', error);
            setLoading(false);
        });

        return () => unsubNodes();
    }, []);

    const handleAddNode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await createNode(newNode);
            await logActivity(user.uid, user.name, 'ADMIN', 'NODE_CREATED', `Provisioned healthcare node: ${newNode.name}`, 'GLOBAL');
            toast.success('Clinical node provisioned successfully');
            setShowAddModal(false);
            setNewNode({ name: '', location: '', contact: '' });
        } catch (error) {
            toast.error('Failed to provision node');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-widest">
                            Infrastructure Governance
                        </div>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Nodes</h1>
                    <p className="text-slate-500 font-medium">Provision and optimize physical service coordinates across the network.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 border border-slate-800"
                >
                    <Plus className="w-5 h-5" />
                    Provision Node
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Locate clinical nodes..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Sync</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                    {loading ? (
                        <div className="col-span-full py-24 text-center">
                            <Loader2 className="animate-spin text-primary m-auto w-12 h-12 mb-4" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Decrypting Node Matrix...</p>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="col-span-full py-32 text-center">
                            <Server className="w-16 h-16 m-auto mb-6 text-slate-100" />
                            <p className="text-slate-400 font-medium italic">No physical coordinates recorded. System standby.</p>
                        </div>
                    ) : nodes.map((node, idx) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden bg-white"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/20 transition-all duration-500">
                                    <MapPin className="w-7 h-7" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg">
                                        Active
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-600">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-display font-black text-xl text-slate-900 group-hover:text-primary transition-colors mb-2 tracking-tight">{node.name}</h3>
                            <div className="flex items-center gap-2 text-slate-400 mb-8">
                                <Navigation2 className="w-3.5 h-3.5" />
                                <p className="text-xs font-medium truncate">{node.location}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-50 relative z-10">
                                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 group-hover:bg-primary/[0.02] transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Health</p>
                                    </div>
                                    <p className="text-xs font-black text-slate-900">OPTIMAL</p>
                                </div>
                                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 group-hover:bg-primary/[0.02] transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <UsersIcon className="w-3 h-3 text-indigo-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff</p>
                                    </div>
                                    <p className="text-xs font-black text-slate-900">12 Active</p>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-4 rounded-xl bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Configure Core
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Provision Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Provision Clinical Node</h2>
                                    <p className="text-slate-500 text-sm font-medium">Register a physical coordinate in the network.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddNode} className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Node Identifier</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            value={newNode.name}
                                            onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                                            placeholder="e.g. Central Clinical Node A"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Physical Coordinate / Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            value={newNode.location}
                                            onChange={e => setNewNode({ ...newNode, location: e.target.value })}
                                            placeholder="Street 42, Metro District..."
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 flex gap-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">Provisioning a new node allocates cloud resources and enables clinical routing protocols for the specified location.</p>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={submitting}
                                        type="submit"
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                                Confirm Provisioning
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
