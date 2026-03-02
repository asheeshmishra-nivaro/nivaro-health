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
    MoreVertical
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Node, UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'OPERATOR' as UserRole,
        nodeId: '',
        tempPassword: ''
    });

    const fetchData = async () => {
        try {
            const uSnap = await getDocs(collection(db, 'users'));
            const nSnap = await getDocs(collection(db, 'nodes'));
            setUsers(uSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
            setNodes(nSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

            toast.success('User onboarded successfully');
            setShowAddModal(false);
            setFormData({ name: '', email: '', role: 'OPERATOR', nodeId: '', tempPassword: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to onboard user');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">User Governance</h1>
                    <p className="text-slate-500">Manage clinical authority and field personnel roles.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Onboard New User
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Node Assignment</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="animate-spin m-auto" /></td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">No users onboarded yet.</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <UsersIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                            user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                                                'bg-teal-100 text-teal-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {nodes.find(n => n.id === user.nodeId)?.name || 'Global Access'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-display font-bold text-slate-900">Configure Clinical Identity</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@nivaro.tech"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Role</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="OPERATOR">Operator (Field Staff)</option>
                                    <option value="DOCTOR">Doctor (Consultant)</option>
                                    <option value="ADMIN">Admin (Governance)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Node Assignment</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                                    value={formData.nodeId}
                                    onChange={e => setFormData({ ...formData, nodeId: e.target.value })}
                                >
                                    <option value="">Select a medical node...</option>
                                    {nodes.map(node => (
                                        <option key={node.id} value={node.id}>{node.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Temporary Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.tempPassword}
                                    onChange={e => setFormData({ ...formData, tempPassword: e.target.value })}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                />
                            </div>
                            <button
                                disabled={submitting}
                                type="submit"
                                className="w-full btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Provision Identity'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
