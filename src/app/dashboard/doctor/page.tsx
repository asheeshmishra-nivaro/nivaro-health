'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users,
    Stethoscope,
    Clock,
    Search,
    CheckCircle2,
    ChevronRight,
    Filter,
    Activity,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConsultationQueue } from '@/hooks/useConsultationQueue';
import Link from 'next/link';

export default function DoctorPage() {
    const { user } = useAuth();
    const { queue, loading } = useConsultationQueue(user?.nodeId);

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">Clinical Queue</h1>
                <p className="text-slate-500">Manage pending consultations and patient history.</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Queue Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 text-primary mb-4">
                            <Clock className="w-5 h-5" />
                            <span className="font-bold">Queue Today</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Pending</span>
                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">08</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Completed</span>
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">14</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200">
                        <Stethoscope className="w-8 h-8 opacity-20 mb-4" />
                        <h3 className="font-bold mb-2">Available Nodes</h3>
                        <p className="text-xs text-slate-400 mb-4">You are currently assigned to:</p>
                        <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                            <p className="text-sm font-bold">Main Service Node A</p>
                            <p className="text-[10px] text-primary">ID: NODE-001</p>
                        </div>
                    </div>
                </div>

                {/* Main Queue List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[600px]">
                        {/* Toolbar */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative max-w-sm w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none"
                                    />
                                </div>
                                <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50">
                                    <Filter className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-500">ALL</span>
                                <span className="text-xs font-bold px-3 py-1 bg-blue-50 rounded-full text-primary">PENDING</span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : queue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No pending consultations in queue.</p>
                                </div>
                            ) : queue.map((c) => (
                                <div key={c.id} className="group p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-colors flex items-center gap-6 cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                        {c.patientName?.[0] || 'P'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{c.patientName} <span className="text-slate-400 font-normal text-sm ml-2">#{c.id.slice(-6).toUpperCase()}</span></h4>
                                        <div className="flex gap-4 mt-1 items-center">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                BP: {c.vitals.bp}
                                            </span>
                                            <span className="text-xs text-slate-500">Temp: {c.vitals.temp}</span>
                                            <span className="text-xs text-slate-400">• {(c as any).createdAt?.toDate()?.toLocaleTimeString() || 'Just now'}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/doctor/consultation/${c.id}`}
                                        className="flex items-center gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-primary font-bold text-sm"
                                    >
                                        Start Consultation
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Empty State / Footer */}
                        <div className="p-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-400 italic">Showing {queue.length} patients in pending queue.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
