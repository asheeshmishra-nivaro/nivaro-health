'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Package,
    Search,
    Loader2,
    AlertTriangle,
    History,
    Tag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInventory } from '@/lib/db';
import { InventoryItem } from '@/types';
import { toast } from 'sonner';

export default function OperatorInventoryPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            if (!user?.nodeId) return;
            try {
                const data = await getInventory(user.nodeId);
                setItems(data as InventoryItem[]);
            } catch (error) {
                toast.error('Failed to fetch node inventory');
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, [user?.nodeId]);

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">Node Inventory</h1>
                <p className="text-slate-500">Real-time stock levels for your assigned clinic point.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Medicines</p>
                        <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock Alert</p>
                        <p className="text-2xl font-bold text-slate-900">{items.filter(i => i.totalQuantity <= i.minStockLevel).length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search local stock..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry</th>
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
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">Node inventory is empty.</td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="font-bold text-slate-900">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.batchNumber}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${item.quantity <= item.minStockLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                                            {item.quantity} units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.expiryDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${item.quantity <= item.minStockLevel ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {item.quantity <= item.minStockLevel ? 'CRITICAL' : 'OPTIONAL'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
