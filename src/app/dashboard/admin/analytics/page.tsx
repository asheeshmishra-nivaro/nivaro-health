'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    BarChart3,
    TrendingUp,
    Users,
    Activity,
    Shield,
    Zap,
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

const data = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
];

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['ADMIN']}>
                <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-300">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Global Telemetry...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">System Intelligence</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Real-time Clinical Performance Index</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Last 24 Hours
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Network Load', value: '82%', icon: Activity, color: 'text-indigo-500', trend: '+12.4%', up: true },
                    { label: 'Patient Influx', value: '1,284', icon: Users, color: 'text-emerald-500', trend: '+8.2%', up: true },
                    { label: 'Latency', value: '24ms', icon: Zap, color: 'text-amber-500', trend: '-2.1ms', up: false },
                    { label: 'Security Score', value: '99.8', icon: Shield, color: 'text-blue-500', trend: 'STABLE', up: true },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-white`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Clinical Throughput</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Consultations Mapping</p>
                        </div>
                        <div className="flex gap-2">
                            {['7D', '1M', '3M', '1Y'].map(t => (
                                <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${t === '7D' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
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
                                        borderRadius: '16px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#4F46E5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden group h-full flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                    <Globe className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight">Node Topology</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Distribution</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                {[
                                    { label: 'North Bangalore', value: '42%', color: 'bg-primary' },
                                    { label: 'South Mumbai', value: '28%', color: 'bg-blue-500' },
                                    { label: 'East Delhi', value: '18%', color: 'bg-emerald-500' },
                                    { label: 'West Pune', value: '12%', color: 'bg-amber-500' },
                                ].map((node, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{node.label}</span>
                                            <span>{node.value}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: node.value }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={`h-full ${node.color} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 mt-8 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl shadow-black/20">
                                View Full Network Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
