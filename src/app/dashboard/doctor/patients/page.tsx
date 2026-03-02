'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getPatientsByNode } from '@/lib/db';
import { Patient } from '@/types';
import { Users, Search, Filter, Mail, Phone, Calendar, ChevronRight, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            if (!user?.nodeId) return;
            try {
                const data = await getPatientsByNode(user.nodeId);
                setPatients(data);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [user?.nodeId]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact.includes(searchTerm)
    );

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Patient Directory</h1>
                    <p className="text-slate-500">View and manage all patients registered at this node.</p>
                </div>
                <div className="flex bg-white rounded-2xl p-1 border border-slate-100 shadow-sm">
                    <span className="px-4 py-2 text-primary font-bold text-sm">All Patients</span>
                    <span className="px-4 py-2 text-slate-400 font-bold text-sm">Recently Seen</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Filters</span>
                    </button>
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                            <Users className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-lg font-medium">No patients found</p>
                            <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredPatients.map((patient) => (
                                <div key={patient.id} className="group p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden">
                                    <div className="flex gap-4 items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                                            <UserCircle className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{patient.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{patient.gender}, {patient.age} Yrs</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium">{patient.contact}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs">Joined: {(patient as any).createdAt?.toDate()?.toLocaleDateString() || 'Recently'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: #{patient.id.slice(-6).toUpperCase()}</span>
                                        <div className="p-2 bg-primary text-white rounded-xl scale-0 group-hover:scale-100 transition-all shadow-lg shadow-primary/20">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-400">Showing {filteredPatients.length} of {patients.length} patients registered at Node {user?.nodeId}.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
