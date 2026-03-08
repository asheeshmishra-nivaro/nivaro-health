'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Activity,
    TrendingUp,
    Users,
    Clock,
    Shield,
    Star,
    Award,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { getDoctorMetrics } from '@/lib/db';
import { motion } from 'framer-motion';

const performanceData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 },
    { name: 'Fri', count: 20 },
    { name: 'Sat', count: 25 },
    { name: 'Sun', count: 14 },
];

export default function DoctorAnalyticsPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        todayPatients: 0,
        activeConsultations: 0,
        completedToday: 0,
        avgConsultationTime: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        const fetchMetrics = async () => {
            try {
                const data = await getDoctorMetrics(user.uid);
                setMetrics(data);
            } catch (error) {
                console.error("Error fetching doctor metrics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, [user?.uid]);

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['DOCTOR']}>
                <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-300">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Clinical Performance Profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="mb-12 flex justify-between items-end text-slate-900">
                <div>
                    <h1 className="text-4xl font-display font-black tracking-tight">Clinical Performance</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Personal Efficiency & Impact Index</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-4 bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-900/10 flex items-center gap-4 text-white">
                        <Award className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Clinical Rank</p>
                            <p className="text-sm font-black tracking-tight uppercase">Senior Consultant</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Today Total', value: metrics.todayPatients, icon: Users, color: 'bg-indigo-600', trend: 'ACTIVE' },
                    { label: 'Avg Session', value: `${metrics.avgConsultationTime}m`, icon: Clock, color: 'bg-emerald-600', trend: '-2.4m' },
                    { label: 'Completion', value: metrics.completedToday, icon: Activity, color: 'bg-primary', trend: '+12%' },
                    { label: 'Patient Rank', value: '4.9/5', icon: Star, color: 'bg-amber-500', trend: 'HIGH' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">{stat.trend}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Patient Throughput</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Consultation Volume Mapping</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Current Week</div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="doctorGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
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
                                        borderRadius: '20px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                                    }}
                                />
                                <Area
                                    type="stepBefore"
                                    dataKey="count"
                                    stroke="#4F46E5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#doctorGlow)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden group order-first lg:order-last">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)] pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-10 text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-6">
                                <Award className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mb-2">Excellence Badge</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clinical Compliance Rating</p>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-10">
                            {[
                                { label: 'Empathy Score', value: '4.8/5', icon: Star },
                                { label: 'Protocol Adherence', value: '100%', icon: Shield },
                                { label: 'Diagnostic Accuracy', value: '98.2%', icon: Activity },
                            ].map((badge, i) => (
                                <div key={i} className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <badge.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black tracking-tight">{badge.value}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{badge.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-xs text-slate-400 italic">"System logs indicate outstanding clinical efficiency. Your current node is performing at 112% target capacity."</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
