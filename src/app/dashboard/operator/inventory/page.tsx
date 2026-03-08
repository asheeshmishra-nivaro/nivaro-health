'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Package,
    Search,
    Loader2,
    AlertTriangle,
    History,
    Tag,
    ChevronRight,
    ArrowRight,
    Filter,
    Layers,
    Warehouse,
    ShieldAlert,
    Database,
    Zap,
    Box
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInventory } from '@/lib/db';
import { InventoryItem } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from '@/components/dashboard/MetricCard';

export default function OperatorInventoryPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockItems = items.filter(i => i.totalQuantity <= i.minStockLevel);

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="max-w-7xl mx-auto py-10">
                {/* Protocol Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-md">Logistics Sector</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Inventory Protocol 4.0</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Node Asset Management</h1>
                        <p className="text-slate-500 mt-2 font-medium">Real-time telemetry of clinical supplies at Node: <span className="font-bold text-slate-900">{user?.nodeId || 'GLOBAL'}</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center m-auto">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Stock Alerts</p>
                                <p className="text-lg font-black text-slate-900 leading-none">{lowStockItems.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logistics Intelligence */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <MetricCard
                        label="Total Assets"
                        value={items.length}
                        icon={Package}
                        color="bg-indigo-600"
                        description="Distinct medicine units"
                    />
                    <MetricCard
                        label="Critical Lows"
                        value={lowStockItems.length}
                        icon={ShieldAlert}
                        color="bg-rose-600"
                        description="Requires replenishment"
                    />
                    <MetricCard
                        label="Node Stability"
                        value="98%"
                        icon={Zap}
                        color="bg-emerald-600"
                        description="Supply-demand ratio"
                    />
                    <MetricCard
                        label="Storage Capacity"
                        value="82%"
                        icon={Warehouse}
                        color="bg-primary"
                        description="Allocated node space"
                    />
                </div>

                {/* Table Protocol */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Query local asset ledger..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all flex items-center gap-2 shadow-sm">
                                <Filter className="w-3 h-3" />
                                Filter Parameters
                            </button>
                            <button className="px-6 py-4 bg-slate-900 border border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                                <Database className="w-3 h-3" />
                                Export Ledger
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Asset</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Allocation Unit</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity Telemetry</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry Vector</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="space-y-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-primary m-auto" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Asset Ledger...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-slate-400">
                                            <div className="space-y-4">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center m-auto text-3xl font-black italic">!</div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No Assets Matching Search Parameter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredItems.map((item, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-default"
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                                                    <Box className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sector CLINICAL_A</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700">BATCH Protocol</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{(item as any).batchNumber || 'V_2439'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                <div className="flex items-end gap-1.5">
                                                    <span className={cn("text-2xl font-black leading-none", item.totalQuantity <= item.minStockLevel ? 'text-rose-600' : 'text-slate-900')}>
                                                        {item.totalQuantity}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Units</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full", item.totalQuantity <= item.minStockLevel ? 'bg-rose-500' : 'bg-emerald-500')}
                                                        style={{ width: `${Math.min(100, (item.totalQuantity / (item.minStockLevel * 5)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <History className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-600">{(item as any).expiryDate || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end">
                                                <span className={cn(
                                                    "px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-sm border",
                                                    item.totalQuantity <= item.minStockLevel
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                )}>
                                                    {item.totalQuantity <= item.minStockLevel ? 'CRITICAL_DEPLETION' : 'NOMINAL_STABILITY'}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Logistics Support */}
                <div className="mt-12 flex gap-8">
                    <div className="flex-1 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group cursor-pointer hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                <Layers className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">Stock Authorization</h4>
                                <p className="text-sm text-slate-400 font-medium">Request replenishment from central repository authority.</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-2" />
                    </div>

                    <div className="flex-1 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group cursor-pointer hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">Discrepancy Report</h4>
                                <p className="text-sm text-slate-400 font-medium">Log Stock mismatches or logistical protocol violations.</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-2" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
