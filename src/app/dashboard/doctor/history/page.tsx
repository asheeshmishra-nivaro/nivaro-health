'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getDoctorConsultationHistory } from '@/lib/db';
import { Consultation } from '@/types';
import { History, Search, Filter, Loader2, CheckCircle2, ChevronRight, FileText, Calendar, Clock, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DoctorHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.uid) return;
            try {
                const data = await getDoctorConsultationHistory(user.uid);
                setHistory(data);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user?.uid]);

    const filteredHistory = history.filter(h =>
        h.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">Clinical History</h1>
                <p className="text-slate-500">Review your past consultations and clinical outcomes.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                            <Filter className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <History className="w-12 h-12 opacity-20" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">No completed cases</h3>
                            <p className="text-sm max-w-xs">Your completed consultations will appear here once finalized in the clinical queue.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-6 py-4">Patient</th>
                                        <th className="px-6 py-4">Vitals Summary</th>
                                        <th className="px-6 py-4">Completed On</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((h) => (
                                        <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[10px] font-bold w-fit">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    COMPLETED
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{h.patientName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">#{h.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-xs text-slate-600 font-medium">{h.vitals.bp}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-xs">{h.vitals.temp}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{(h as any).updatedAt?.toDate()?.toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-400">{(h as any).updatedAt?.toDate()?.toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link
                                                    href={`/dashboard/doctor/consultation/${h.id}`}
                                                    className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
                                                >
                                                    View File
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-sm text-slate-400 italic">Clinical Records Audit Logs Active</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Previous</button>
                        <button className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Next</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
