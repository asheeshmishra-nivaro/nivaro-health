'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Package,
    Plus,
    Search,
    Filter,
    Loader2,
    AlertTriangle,
    History,
    TrendingUp,
    MapPin,
    ArrowRightLeft,
    Shield,
    CheckCircle2
} from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addInventoryItem, updateInventoryStock, logActivity } from '@/lib/db';
import { InventoryItem, Node } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user, role } = useAuth();

    const [newItem, setNewItem] = useState({
        name: '',
        batchNumber: '',
        nodeId: '',
        quantity: 0,
        minStockLevel: 50,
        expiryDate: ''
    });

    const fetchData = async () => {
        try {
            const nSnap = await getDocs(collection(db, 'nodes'));
            const activeNodes = nSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Node));
            setNodes(activeNodes);

            // Fetch inventory from all nodes
            const allItems: InventoryItem[] = [];
            for (const node of activeNodes) {
                const iSnap = await getDocs(collection(db, 'inventory', node.id, 'items'));
                allItems.push(...iSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
            }
            setItems(allItems);
        } catch (error) {
            toast.error('Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItem.nodeId) return;

        try {
            await addInventoryItem(newItem.nodeId, {
                name: newItem.name,
                totalQuantity: Number(newItem.quantity),
                minStockLevel: Number(newItem.minStockLevel),
                nodeId: newItem.nodeId
            });

            await logActivity(
                user.uid,
                user.name,
                'ADMIN',
                'INVENTORY_RESTOCK',
                `Provisioned ${newItem.quantity} units of ${newItem.name} to Node ${newItem.nodeId}`,
                newItem.nodeId
            );

            toast.success('Inventory provisioned successfully');
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to add inventory');
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Inventory Lifecycle</h1>
                    <p className="text-slate-500">Global stock monitoring and node-specific provisioning.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Provision Stock
                </button>
            </div>

            {/* Analytics Summaries: Tactical Fleet Telemetry */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden border-b-4 border-b-indigo-500/20">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shadow-inner">
                        <Package className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Global Assets</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">{items.length}</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Package className="w-24 h-24" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden border-b-4 border-b-amber-500/20">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shadow-inner">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Stock Critical</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">{items.filter(i => i.totalQuantity <= i.minStockLevel).length}</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <AlertTriangle className="w-24 h-24" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden border-b-4 border-b-emerald-500/20">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shadow-inner">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Supply Yield</p>
                        <p className="text-3xl font-black text-emerald-600 leading-none">98.4%</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-500">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px] border-b-4 border-b-slate-900/10">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter Asset Registry..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-500 text-slate-400 transition-all shadow-sm">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-500 text-slate-400 transition-all shadow-sm">
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Node</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Level</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Accessing Encrypted Asset Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                                            <Package className="w-16 h-16 text-slate-200" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No assets registered in uplink.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-all group border-b border-slate-50 last:border-none">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-white transition-colors">
                                                {item.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: #{item.id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                            {nodes.find(n => n.id === item.nodeId)?.name || item.nodeId}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="bg-white border border-slate-100 px-2 py-1 rounded shadow-sm">BN: {(item as any).batchNumber || 'V-ALPHA-1'}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2 min-w-[120px]">
                                            <div className="flex justify-between items-end">
                                                <span className="text-base font-black text-slate-900 leading-none">{item.totalQuantity}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round((item.totalQuantity / 200) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (item.totalQuantity / 200) * 100)}%` }}
                                                    className={`h-full rounded-full ${item.totalQuantity <= item.minStockLevel ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {item.totalQuantity <= item.minStockLevel ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 w-fit">
                                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Depletion Alert</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 w-fit">
                                                <Shield className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Operational</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Item Modal: Tactical Provisioning */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Provisioning Link</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Satellite Node Stock Deployment</p>
                                </div>
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center">
                                    <Package className="w-8 h-8 text-indigo-500" />
                                </div>
                            </div>

                            <form onSubmit={handleAddItem} className="p-10 space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                                        <input
                                            required
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                                            placeholder="e.g. AMOXICILLIN 500MG"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Destination</label>
                                        <select
                                            required
                                            value={newItem.nodeId}
                                            onChange={e => setNewItem({ ...newItem, nodeId: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                                        >
                                            <option value="">SELECT TARGET NODE</option>
                                            {nodes.map(node => <option key={node.id} value={node.id}>{node.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch ID</label>
                                        <input
                                            required
                                            value={newItem.batchNumber}
                                            onChange={e => setNewItem({ ...newItem, batchNumber: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                                            placeholder="BN-2024-X"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payload Qty</label>
                                        <input
                                            required
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Epoch</label>
                                        <input
                                            required
                                            type="date"
                                            value={newItem.expiryDate}
                                            onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Abort Request
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-slate-900 text-white rounded-2xl py-5 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                                        Initialize Provisioning
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
