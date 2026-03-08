'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Wallet,
    TrendingUp,
    ArrowUpRight,
    Clock,
    Shield,
    CheckCircle2,
    Loader2,
    DollarSign,
    Calendar,
    ArrowDownRight,
    Search,
    Filter
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { getWalletTransactions } from '@/lib/db';
import { OperatorWalletTransaction } from '@/types';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';

const earningsHistory = [
    { name: 'Mon', amount: 450 },
    { name: 'Tue', amount: 320 },
    { name: 'Wed', amount: 680 },
    { name: 'Thu', amount: 920 },
    { name: 'Fri', amount: 540 },
    { name: 'Sat', amount: 1100 },
    { name: 'Sun', amount: 850 },
];

export default function OperatorEarningsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<OperatorWalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        pending: 0
    });

    useEffect(() => {
        if (!user?.uid) return;
        const fetchData = async () => {
            try {
                const data = await getWalletTransactions(user.uid);
                setTransactions(data);

                const total = data.reduce((acc, curr) => acc + curr.commissionEarned, 0);
                const today = data
                    .filter(t => {
                        const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                        return date.toDateString() === new Date().toDateString();
                    })
                    .reduce((acc, curr) => acc + curr.commissionEarned, 0);

                setStats({ total, today, pending: total * 0.1 }); // Simulated pending
            } catch (error) {
                console.error("Error fetching wallet data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.uid]);

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['OPERATOR']}>
                <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-300">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Financial Uplink...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Financial Ledger</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Operator Commission & Revenue Tracking</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        Request Settlement
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                    { label: 'Total Revenue', value: `₹${stats.total}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/5', trend: '+15.2%', up: true },
                    { label: 'Today Earnings', value: `₹${stats.today}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/5', trend: '+₹240', up: true },
                    { label: 'Secured Balance', value: `₹${Math.floor(stats.total * 0.4)}`, icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/5', trend: 'LOCKED', up: true },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-16 h-16 rounded-3xl ${stat.bg} flex items-center justify-center transition-all group-hover:scale-110`}>
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-black px-4 py-2 rounded-2xl ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revenue mapping</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Weekly Earnings Distribution Stream</p>
                        </div>
                        <div className="flex gap-2">
                            {['7D', '1M', '3M'].map(t => (
                                <button key={t} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all ${t === '7D' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={earningsHistory}>
                                <defs>
                                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        border: 'none',
                                        borderRadius: '24px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 'black',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10B981"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#revenueGlow)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                        <Filter className="w-5 h-5 text-slate-300 pointer-events-none" />
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {transactions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale gap-4">
                                <Wallet className="w-16 h-16 text-slate-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">No financial activity recorded.</p>
                            </div>
                        ) : (
                            transactions.slice(0, 6).map((t, idx) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-500/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{t.serviceType}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{t.id.slice(-6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600 tracking-tight">+₹{t.commissionEarned}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.05em]">{formatDateTime(t.createdAt)}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <button className="w-full py-5 mt-8 bg-white border border-slate-200 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        View Complete Ledger
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
