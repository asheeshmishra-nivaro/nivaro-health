'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    getDoc,
    doc,
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient, Consultation, Medicine } from '@/types';
import { getPrescription } from '@/lib/db';
import { generatePrescriptionPDF } from '@/lib/pdf';
import { toast } from 'sonner';
import {
    UserCircle,
    Activity,
    Calendar,
    Clock,
    ChevronLeft,
    FileText,
    Stethoscope,
    Pill,
    FlaskConical,
    Loader2,
    CalendarDays,
    HeartPulse,
    Thermometer,
    Droplets,
    Wind,
    History as HistoryIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Fetch Patient Profile
                const pSnap = await getDoc(doc(db, 'patients', id as string));
                if (pSnap.exists()) {
                    setPatient({ id: pSnap.id, ...pSnap.data() } as Patient);
                }

                // 2. Fetch Consultation History
                const q = query(
                    collection(db, 'consultations'),
                    where('patientId', '==', id),
                    where('status', '==', 'completed'),
                    orderBy('updatedAt', 'desc')
                );
                const hSnap = await getDocs(q);
                setHistory(hSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation)));
            } catch (error) {
                console.error('Error fetching patient data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleViewPrescription = async (consult: Consultation) => {
        if (!consult.prescriptionId) return toast.error('No prescription issued for this session.');
        const tid = toast.loading('Generating clinical record...');
        try {
            const prescription = await getPrescription(consult.prescriptionId);
            if (!prescription) return toast.error('Prescription record not found.', { id: tid });

            const pdf = await generatePrescriptionPDF({
                consultation: consult,
                patient: patient!,
                doctorName: 'Physician',
                medicines: prescription.medicines || [],
                nodeName: consult.nodeId
            });

            pdf.save(`Prescription_${patient!.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.pdf`);
            toast.success('Clinical record generated.', { id: tid });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate record.', { id: tid });
        }
    };

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['DOCTOR']}>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!patient) {
        return (
            <DashboardLayout allowedRoles={['DOCTOR']}>
                <div className="text-center p-20">
                    <h2 className="text-2xl font-bold text-slate-900">Patient not found</h2>
                    <button onClick={() => router.back()} className="mt-4 text-primary font-bold">Go Back</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Clinical Profile</h1>
                    <p className="text-slate-500 font-medium">Deep medical history & records overview.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Patient Identity Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 text-center relative border-b-4 border-b-indigo-500/20">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-slate-900/5 -z-1" />
                        <div className="w-32 h-32 bg-white rounded-[2rem] border-8 border-white shadow-xl mx-auto flex items-center justify-center text-primary mb-6 ring-1 ring-slate-100">
                            <UserCircle className="w-16 h-16" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-1">{patient.name}</h2>
                        <div className="flex justify-center gap-3 mb-8">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest leading-none flex items-center">
                                {patient.gender}
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest leading-none flex items-center">
                                {patient.age} Yrs
                            </span>
                            <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest leading-none flex items-center shadow-lg shadow-indigo-500/20">
                                #{patient.id.slice(-6).toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                                    <CalendarDays className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enrolled On</p>
                                    <p className="text-sm font-bold text-slate-700">{(patient as any).createdAt?.toDate()?.toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                                    <HeartPulse className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                                    <p className="text-sm font-bold text-slate-700">{(patient as any).bloodGroup || 'O+'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[64px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <Activity className="w-12 h-12 text-primary mb-4 relative z-10" />
                        <h3 className="text-lg font-black tracking-tight mb-2 relative z-10">Total Records Found</h3>
                        <p className="text-5xl font-display font-black tracking-tighter text-white/90 relative z-10">{history.length}</p>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-4 relative z-10">Clinical Data Packets</p>
                    </div>
                </div>

                {/* Right Column: Longitudinal History Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[600px] border-b-4 border-b-emerald-500/20">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HistoryIcon className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Longitudinal Medical Records</h3>
                            </div>
                        </div>

                        <div className="flex-1 p-8">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center grayscale opacity-50">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-2">Clean Clinical Record</h3>
                                    <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">No prior clinical sessions found in the global registry for this identity.</p>
                                </div>
                            ) : (
                                <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                    {history.map((record, rIdx) => (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: rIdx * 0.1 }}
                                            className="relative pl-14 group"
                                        >
                                            <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-white ring-4 ring-slate-50 border-2 border-emerald-500 group-hover:scale-125 transition-all shadow-sm z-10" />

                                            <div className="flex flex-col md:flex-row gap-8">
                                                <div className="flex-1 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group-hover:border-emerald-500/30">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md leading-none">Complete</span>
                                                                <span className="text-[10px] text-slate-300 font-black">•</span>
                                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Consultation Log</span>
                                                            </div>
                                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{record.clinicalData?.diagnosis || 'Standard Triage Session'}</h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-bold leading-none">{record.updatedAt?.toDate()?.toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-300 justify-end">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{record.updatedAt?.toDate()?.toLocaleTimeString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                        <MiniVital
                                                            icon={<Thermometer className="w-3 h-3 text-rose-500" />}
                                                            value={(() => {
                                                                const val = parseFloat(record.vitals?.temp);
                                                                return (!isNaN(val) && val > 80 && val < 110) ? `${record.vitals.temp}°F` : '98.6°F';
                                                            })()}
                                                            label="Temp"
                                                        />
                                                        <MiniVital icon={<Activity className="w-3 h-3 text-indigo-500" />} value={record.vitals.bp} label="BP" />
                                                        <MiniVital icon={<Droplets className="w-3 h-3 text-sky-500" />} value={record.vitals.sugar} label="Glu" />
                                                        <MiniVital icon={<Wind className="w-3 h-3 text-emerald-500" />} value={`${record.vitals.spo2}%`} label="SpO2" />
                                                    </div>

                                                    {(record.clinicalData as any)?.notes && (
                                                        <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 mb-6 italic border-l-4 border-l-slate-200">
                                                            "{(record.clinicalData as any).notes}"
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                                                        {(record.clinicalData as any)?.medicines && (record.clinicalData as any).medicines.length > 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                                                                <Pill className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{(record.clinicalData as any).medicines.length} Medicines</span>
                                                            </div>
                                                        )}
                                                        {(record.clinicalData as any)?.labTests && (record.clinicalData as any).labTests.length > 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                                                                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{(record.clinicalData as any).labTests.length} Lab Tasks</span>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleViewPrescription(record)}
                                                            className="ml-auto px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 cursor-pointer hover:bg-slate-800 transition-colors"
                                                        >
                                                            View Full Log
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MiniVital({ icon, value, label }: any) {
    return (
        <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-xl">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}
