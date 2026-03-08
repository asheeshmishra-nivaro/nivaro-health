'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users as UsersIcon,
    Plus,
    Search,
    Loader2,
    Shield,
    MapPin,
    Mail,
    MoreVertical,
    X,
    UserCircle,
    Stethoscope,
    Activity,
    CheckCircle2,
    ExternalLink,
    Filter
} from 'lucide-react';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Node, UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'OPERATOR' as UserRole,
        nodeId: '',
        tempPassword: ''
    });

    useEffect(() => {
        // Real-time users listener
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
            setLoading(false);
        }, (error) => {
            console.error('Users registry listener error:', error);
            setLoading(false);
        });

        // Fetch nodes for selection
        const fetchNodes = async () => {
            try {
                const snap = await getDocs(collection(db, 'nodes'));
                setNodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
            } catch (error) {
                console.error('Error fetching nodes for registry:', error);
            }
        };

        fetchNodes();
        return () => unsubUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    adminUid: currentUser.uid
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Clinical identity provisioned successfully');
            setShowAddModal(false);
            setFormData({ name: '', email: '', role: 'OPERATOR', nodeId: '', tempPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to onboard user');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return Shield;
            case 'DOCTOR': return Stethoscope;
            case 'OPERATOR': return Activity;
            default: return UserCircle;
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-widest">
                            Personnel Governance
                        </div>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Authority</h1>
                    <p className="text-slate-500 font-medium">Provision and manage roles for doctors, operators, and administrative staff.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-8 py-4 bg-primary text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Provision Identity
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search clinical registry..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none px-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Identity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Authority</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node Assignment</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <Loader2 className="animate-spin m-auto text-primary w-10 h-10 mb-4" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Registry...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <UserCircle className="w-16 h-16 text-slate-100 m-auto mb-4" />
                                        <p className="text-slate-400 font-medium italic">No identities found in this coordinate.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u, idx) => {
                                const Icon = getRoleIcon(u.role);
                                return (
                                    <motion.tr
                                        key={u.uid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50/80 transition-all group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{u.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all",
                                                u.role === 'ADMIN' ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                                                    u.role === 'DOCTOR' ? "bg-primary/5 border-primary/10 text-primary" :
                                                        "bg-emerald-50 border-emerald-100 text-emerald-600"
                                            )}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {u.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 italic font-black text-slate-400 text-[10px]">
                                                    {u.nodeId ? 'ND' : 'GS'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{nodes.find(n => n.id === u.nodeId)?.name || 'Global Access'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{u.nodeId ? 'Restricted Node' : 'Unrestricted Operator'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-20" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation Modal */}
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
                                    <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Provision Clinical Identity</h2>
                                    <p className="text-slate-500 text-sm font-medium">Configure authority level and system access.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                                        <input
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Authority</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@nivaro.ch"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Authority</label>
                                        <select
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-primary text-xs tracking-widest uppercase cursor-pointer"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                        >
                                            <option value="OPERATOR">Clinical Operator</option>
                                            <option value="DOCTOR">Medical Consultant</option>
                                            <option value="ADMIN">System Governance</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Node Assignment</label>
                                        <select
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 text-sm cursor-pointer"
                                            value={formData.nodeId}
                                            onChange={e => setFormData({ ...formData, nodeId: e.target.value })}
                                        >
                                            <option value="">Select Target Node...</option>
                                            {nodes.map(node => (
                                                <option key={node.id} value={node.id}>{node.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Temporary Protocol Password</label>
                                    <div className="relative">
                                        <Shield className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            type="password"
                                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 font-mono"
                                            value={formData.tempPassword}
                                            onChange={e => setFormData({ ...formData, tempPassword: e.target.value })}
                                            placeholder="••••••••"
                                            minLength={8}
                                        />
                                    </div>
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
                                                Provision Access
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
