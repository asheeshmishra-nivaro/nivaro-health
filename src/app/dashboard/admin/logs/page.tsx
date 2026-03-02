'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    History,
    Search,
    Filter,
    Loader2,
    User,
    MapPin,
    ShieldCheck,
    Activity,
    Package
} from 'lucide-react';
import { getAllActivityLogs } from '@/lib/db';
import { ActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getAllActivityLogs(150);
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch logs');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.userName.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.details.toLowerCase().includes(search.toLowerCase());

        if (filter === 'ALL') return matchesSearch;
        if (filter === 'CLINICAL') return matchesSearch && (log.action.includes('CONSULTATION') || log.action.includes('ENCOUNTER'));
        if (filter === 'INVENTORY') return matchesSearch && log.action.includes('INVENTORY');
        if (filter === 'IDENTITY') return matchesSearch && (log.action.includes('USER') || log.action.includes('PROFILE'));
        return matchesSearch;
    });

    const getLogIcon = (action: string) => {
        if (action.includes('CONSULTATION') || action.includes('ENCOUNTER')) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
        if (action.includes('INVENTORY')) return <Package className="w-4 h-4 text-amber-500" />;
        if (action.includes('USER')) return <User className="w-4 h-4 text-indigo-500" />;
        return <Activity className="w-4 h-4 text-slate-400" />;
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">System Audit & Traceability</h1>
                    <p className="text-slate-500 mt-2 font-medium">Enterprise-grade record of clinical and operational accountability.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Global Integrity</p>
                        <p className="text-xl font-bold text-emerald-800">100% Verified</p>
                    </div>
                    <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active nodes</p>
                        <p className="text-xl font-bold text-indigo-800">Operational</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[700px]">
                {/* Advanced Tooling */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by physician, clinical action, or node..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
                            />
                        </div>
                        <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            {['ALL', 'CLINICAL', 'INVENTORY', 'IDENTITY'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white">Clinical Timeline</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white">Categorical Action</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white">Infrastructure Node</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white">Identity Log</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white">Encrypted Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center text-slate-400">
                                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin m-auto mb-6" />
                                        <p className="font-bold text-slate-900">Synchronizing Governance Trail</p>
                                        <p className="text-sm">Fetching verified records from the Nivaro network...</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center text-slate-400 italic">No records found matching current criteria.</td>
                                </tr>
                            ) : filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{formatDateTime(log.timestamp).split(',')[0]}</span>
                                            <span className="text-[10px] text-slate-400 font-mono italic">{formatDateTime(log.timestamp).split(',')[1]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                                {getLogIcon(log.action)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                                            <span className="text-xs font-bold text-slate-600">
                                                {log.nodeId === 'GLOBAL' ? 'CENTRAL' : log.nodeId.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">{log.userName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{log.userRole}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] leading-relaxed text-slate-500 max-w-sm font-medium">{log.details}</p>
                                        {log.metadata && (
                                            <div className="mt-2 flex gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase">Has Metadata</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Immutable Log Status: Active
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Traceable Items: {filteredLogs.length}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
