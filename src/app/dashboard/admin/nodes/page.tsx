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
    Shield
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNode, logActivity } from '@/lib/db';
import { Node } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function NodesPage() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user, role } = useAuth();

    const [newNode, setNewNode] = useState({
        name: '',
        location: '',
        contact: '',
    });

    const fetchNodes = async () => {
        try {
            const snap = await getDocs(collection(db, 'nodes'));
            setNodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node)));
        } catch (error) {
            toast.error('Failed to fetch nodes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNodes();
    }, []);

    const handleAddNode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await createNode(newNode);
            await logActivity(user.uid, user.name, 'ADMIN', 'NODE_CREATED', `Created node ${newNode.name}`, 'GLOBAL');
            toast.success('Node created successfully');
            setShowAddModal(false);
            fetchNodes();
        } catch (error) {
            toast.error('Failed to create node');
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Node Management</h1>
                    <p className="text-slate-500">Configure and monitor physical healthcare service points.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Provision New Node
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {loading ? (
                        <Loader2 className="animate-spin text-primary m-auto" />
                    ) : nodes.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <Building2 className="w-12 h-12 m-auto mb-4 opacity-20" />
                            <p>No nodes provisioned yet.</p>
                        </div>
                    ) : nodes.map(node => (
                        <div key={node.id} className="p-6 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{node.name}</h3>
                            <p className="text-sm text-slate-500 mb-6">{node.location}</p>

                            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Index</p>
                                    <p className="text-sm font-bold text-emerald-500">OPTIMAL</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staffing</p>
                                    <p className="text-sm font-bold">12 Active</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Node Modal Placeholder */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-display font-bold mb-6">Provision New Node</h2>
                        <form onSubmit={handleAddNode} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Node Name</label>
                                <input
                                    required
                                    value={newNode.name}
                                    onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="e.g. Central Clinical Node A"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Location / Address</label>
                                <input
                                    required
                                    value={newNode.location}
                                    onChange={e => setNewNode({ ...newNode, location: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="Street, District..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary py-3">Create Node</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
