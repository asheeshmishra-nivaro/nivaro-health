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
    ArrowRightLeft
} from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addInventoryItem, updateInventoryStock, logActivity } from '@/lib/db';
import { InventoryItem, Node } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

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

            {/* Analytics Summaries */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Items</p>
                        <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
                        <p className="text-2xl font-bold text-slate-900">{items.filter(i => i.totalQuantity <= i.minStockLevel).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment Rate</p>
                        <p className="text-2xl font-bold text-slate-900">98.4%</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter inventory..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-400">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-400">
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
                                    <td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="animate-spin m-auto" /></td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">No inventory provisioned.</td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-400">ID: {item.id.toUpperCase()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-300" />
                                            {nodes.find(n => n.id === item.nodeId)?.name || item.nodeId}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        BN: {(item as any).batchNumber || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 text-sm font-bold">{item.totalQuantity}</div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.totalQuantity <= item.minStockLevel ? 'bg-amber-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, (item.totalQuantity / 200) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.totalQuantity <= item.minStockLevel ? (
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                                                <AlertTriangle className="w-3 h-3" /> Reorder Soon
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Adequate</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-display font-bold">Provision New Inventory</h2>
                            <Package className="w-8 h-8 text-primary/20" />
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Medicine Name</label>
                                    <input
                                        required
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        placeholder="e.g. Amoxicillin 500mg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Node Assignment</label>
                                    <select
                                        required
                                        value={newItem.nodeId}
                                        onChange={e => setNewItem({ ...newItem, nodeId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    >
                                        <option value="">Select a Node</option>
                                        {nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Batch Number</label>
                                    <input
                                        required
                                        value={newItem.batchNumber}
                                        onChange={e => setNewItem({ ...newItem, batchNumber: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        placeholder="e.g. BN-2024-X1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Quantity</label>
                                    <input
                                        required
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Expiry Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={newItem.expiryDate}
                                        onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary py-4 text-xl">Confirm & Provision</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
