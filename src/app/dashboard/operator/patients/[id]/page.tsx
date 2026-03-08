'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    User,
    Calendar,
    FileText,
    Download,
    History,
    Activity,
    Stethoscope,
    ArrowLeft,
    Loader2,
    ShieldCheck,
    Clock,
    ClipboardList,
    AlertCircle,
    ChevronRight,
    MapPin,
    Phone
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient, Consultation, Prescription, User as UserType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime, cn } from '@/lib/utils';
import { generatePrescriptionPDF } from '@/lib/pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PatientVaultPage() {
    const { id } = useParams();
    const { user: operator } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [doctors, setDoctors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!id || !operator) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Patient
                const patientSnap = await getDoc(doc(db, 'patients', id as string));
                if (!patientSnap.exists()) {
                    toast.error("Patient record not found");
                    router.push('/dashboard/operator/patients');
                    return;
                }
                const patientData = { id: patientSnap.id, ...patientSnap.data() } as Patient;
                setPatient(patientData);

                // 2. Fetch Consultations
                const consQuery = query(
                    collection(db, 'consultations'),
                    where('patientId', '==', id),
                    where('nodeId', '==', operator.nodeId),
                    orderBy('createdAt', 'desc')
                );
                const consSnap = await getDocs(consQuery);
                const consData = consSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation));
                setConsultations(consData);

                // 3. Fetch Prescriptions
                const presQuery = query(
                    collection(db, 'prescriptions'),
                    where('patientId', '==', id),
                    where('nodeId', '==', operator.nodeId),
                    orderBy('createdAt', 'desc')
                );
                const presSnap = await getDocs(presQuery);
                setPrescriptions(presSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription)));

                // 4. Fetch Doctor Names
                const doctorIds = Array.from(new Set(consData.map(c => c.doctorId).filter(Boolean)));
                const docMap: Record<string, string> = {};
                for (const docId of doctorIds) {
                    const docSnap = await getDoc(doc(db, 'users', docId));
                    if (docSnap.exists()) {
                        docMap[docId] = (docSnap.data() as UserType).name;
                    }
                }
                setDoctors(docMap);
            } catch (error) {
                console.error("Error fetching vault data:", error);
                toast.error("Critical error accessing records vault");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, router, operator]);

    const handleDownloadPrescription = async (prescription: Prescription) => {
        const consultation = consultations.find(c => c.id === prescription.consultationId);
        if (!consultation || !patient) {
            toast.error("Missing association data for PDF generation");
            return;
        }

        try {
            const pdf = await generatePrescriptionPDF({
                consultation,
                patient,
                doctorName: doctors[prescription.doctorId] || 'Medical Officer',
                medicines: prescription.medicines,
                nodeName: operator?.nodeId
            });
            pdf.save(`Nivaro_RX_${patient.name}_${prescription.id.slice(-6).toUpperCase()}.pdf`);
            toast.success("Prescription vault entry exported");
        } catch (error) {
            console.error(error);
            toast.error("PDF export protocol failed");
        }
    };

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['OPERATOR']}>
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
                    <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Deciphering Clinical History...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500/20 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">{patient?.name}</h1>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">
                                Validated Profile
                            </div>
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Permanent Identity ID: {patient?.id.toUpperCase()}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Consultations</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">{consultations.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-3xl font-black mb-8 shadow-xl shadow-slate-900/20 relative z-10 transition-transform group-hover:scale-105 duration-500">
                            {patient?.name[0]}
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Identity Synthesis</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Age</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{patient?.age} Standard Years</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Gender</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{patient?.gender}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 space-y-4">
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Encryption Handshake</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{patient?.contact}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Geospatial Coordinate</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{patient?.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    Node Authorization
                                </p>
                                <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Station ID</p>
                                        <p className="text-xs font-black tracking-widest uppercase">{patient?.nodeId}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-emerald-500 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2">Vault Integrity</h4>
                        <p className="text-xs font-medium text-emerald-50/70 leading-relaxed mb-6">Historical records are permanently locked in the clinical vault and cannot be modified once signed.</p>
                        <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-3">
                            <ShieldCheck className="w-4 h-4" />
                            Verify All Records
                        </button>
                    </div>
                </div>

                {/* Timeline & Records */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-6">
                            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <History className="w-6 h-6 text-indigo-500" />
                                Clinical Stream History
                            </h2>
                            <div className="flex gap-2">
                                <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all">Export All</button>
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[1200px] overflow-visible">
                            {consultations.length === 0 ? (
                                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center flex flex-col items-center gap-8 opacity-40">
                                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
                                        <ClipboardList className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No clinical events recorded for this subject.</p>
                                </div>
                            ) : (
                                consultations.map((consultation, idx) => {
                                    const rx = prescriptions.find(p => p.consultationId === consultation.id);

                                    return (
                                        <motion.div
                                            key={consultation.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                                        >
                                            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border-4 border-slate-100 flex flex-col items-center justify-center text-white relative group-hover:bg-indigo-600 transition-colors">
                                                        <Calendar className="w-6 h-6 mb-1" />
                                                        <span className="text-[10px] font-black leading-none">{new Date(consultation.createdAt?.toDate?.() || consultation.createdAt).getDate()}</span>
                                                        <span className="text-[7px] font-bold uppercase tracking-widest">{new Date(consultation.createdAt?.toDate?.() || consultation.createdAt).toLocaleString('default', { month: 'short' })}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                                                {consultation.clinicalData?.diagnosis || consultation.complaint || "Routine Checkup"}
                                                            </h3>
                                                            <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black rounded uppercase tracking-tighter">
                                                                Consultation Signature
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-slate-400">
                                                            <div className="flex items-center gap-2">
                                                                <Stethoscope className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Dr. {doctors[consultation.doctorId] || '...'}</span>
                                                            </div>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{formatDateTime(consultation.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    {rx && (
                                                        <button
                                                            onClick={() => handleDownloadPrescription(rx)}
                                                            className="flex-1 md:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 active:scale-95"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download PDF
                                                        </button>
                                                    )}
                                                    <button className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                                                        <FileText className="w-4 h-4" />
                                                        View Full Log
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Vitals Summary */}
                                            <div className="px-8 pb-8 flex flex-wrap gap-4">
                                                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Pulse</span>
                                                    <span className="text-[10px] font-black text-slate-900">{consultation.vitals.heartRate || '--'} BPM</span>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50">SPO2</span>
                                                    <span className="text-[10px] font-black text-slate-900">{consultation.vitals.spo2 || '--'}%</span>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50">BP</span>
                                                    <span className="text-[10px] font-black text-slate-900">{consultation.vitals.bp || '--'}</span>
                                                </div>
                                                {consultation.labTests && (
                                                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{consultation.labTests.length} Lab Tests Ordered</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
