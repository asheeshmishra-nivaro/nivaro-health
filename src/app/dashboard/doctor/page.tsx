'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Monitor,
    Zap,
    CircleDot,
    Heart,
    Droplets,
    Database,
    CheckCircle2,
    Activity,
    Wallet,
    ArrowUpRight,
    Search,
    Loader2,
    Play,
    Clock,
    User,
    Package,
    ArrowRight,
    Filter,
    Stethoscope,
    ChevronRight,
    HeartPulse,
    ShieldCheck,
    History,
    Plus,
    Users,
    Calendar,
    Bell,
    Power,
    MoreVertical,
    Video,
    UserCheck,
    AlertCircle,
    Timer,
    Trash2,
    Send,
    FileText,
    FlaskConical,
    Thermometer,
    Wind,
    ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConsultationQueue } from '@/hooks/useConsultationQueue';
import {
    updateDoctorAvailability,
    getNotifications,
    markNotificationRead,
    getDoctorMetrics,
    finalizeConsultation,
    createDiagnosticOrder,
    getPatientHistory,
    getInventory,
    getPrescription,
    getCDSSSuggestions
} from '@/lib/db';
import { Consultation, AppNotification, Patient, Medicine, InventoryItem, LabTest, CDSSSuggestion } from '@/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import VideoEngine from '@/components/dashboard/VideoEngine';
import PrescriptionPreviewModal from '@/components/dashboard/PrescriptionPreviewModal';
import { generatePrescriptionPDF } from '@/lib/pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from '@/components/dashboard/MetricCard';

const COMMON_DIAGNOSES = [
    'Upper Respiratory Tract Infection',
    'Hypertension (Primary)',
    'Diabetes Mellitus Type 2',
    'Acute Gastroenteritis',
    'Lower Back Pain (Chronic)',
    'Iron Deficiency Anemia',
    'Urinary Tract Infection',
    'Viral Fever',
    'Bronchitis (Acute)',
    'Skin Rash (Allergic)'
];

export default function DoctorPortalConsole() {
    const { user } = useAuth();
    const { queue, loading: queueLoading } = useConsultationQueue(user?.nodeId, user?.uid);

    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(user?.availability || 'offline');
    const [metrics, setMetrics] = useState({
        todayPatients: 0,
        activeConsultations: 0,
        completedToday: 0,
        avgConsultationTime: 0
    });
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [history, setHistory] = useState<Consultation[]>([]);

    // Active Consultation Data
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [labTests, setLabTests] = useState<string[]>([]);
    const [sessionTimer, setSessionTimer] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false);
    const [cdssSuggestions, setCdssSuggestions] = useState<CDSSSuggestion[]>([]);

    // Refs for timer
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Fetch Initial Data (Metrics, Notifications)
    useEffect(() => {
        if (user?.uid) {
            refreshMetrics();
            fetchNotifications();
            setIsOnline(user.availability || 'offline');
        }
    }, [user?.uid]);

    // 2. Handle Selected Consultation (Left Panel click)
    useEffect(() => {
        if (!selectedId) {
            setConsultation(null);
            setPatient(null);
            setHistory([]);
            return;
        }

        const unsub = onSnapshot(doc(db, 'consultations', selectedId), async (snap) => {
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as Consultation;
                setConsultation(data);

                // Fetch Patient Details
                const pSnap = await getDoc(doc(db, 'patients', data.patientId));
                if (pSnap.exists()) setPatient(pSnap.data() as Patient);

                // Fetch History
                const pHistory = await getPatientHistory(data.patientId);
                setHistory(pHistory);

                // If it becomes active, start timer
                if (data.status === 'active' && !timerRef.current) {
                    startTimer();
                }
            }
        }, (error) => {
            console.error('Doctor consultation listener error:', error);
        });

        return () => unsub();
    }, [selectedId]);

    // 2.1 Update CDSS Suggestions
    useEffect(() => {
        if (clinicalNotes.length > 5 || consultation?.complaint) {
            const text = `${consultation?.complaint || ''} ${clinicalNotes}`;
            const suggestions = getCDSSSuggestions(text);
            setCdssSuggestions(suggestions);
        } else {
            setCdssSuggestions([]);
        }
    }, [clinicalNotes, consultation?.complaint]);

    const refreshMetrics = async () => {
        if (!user?.uid) return;
        const data = await getDoctorMetrics(user.uid);
        setMetrics(data);
    };

    const fetchNotifications = async () => {
        if (!user?.uid) return;
        const data = await getNotifications(user.uid);
        setNotifications(data.filter(n => !n.read));
    };

    const handleToggleStatus = async (status: 'online' | 'offline' | 'busy') => {
        if (!user?.uid) return;
        try {
            await updateDoctorAvailability(user.uid, status);
            setIsOnline(status);
            toast.success(`Status updated to ${status.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSessionTimer(prev => prev + 1);
        }, 1000);
    };

    const handleFinalize = () => {
        if (!diagnosis) return toast.error('Diagnosis is required');
        setShowPreview(true);
    };

    const confirmFinalize = async () => {
        setShowPreview(false);
        setSubmitting(true);
        try {
            if (labTests.length > 0) {
                await createDiagnosticOrder({
                    consultationId: selectedId!,
                    patientId: consultation!.patientId,
                    doctorId: user!.uid,
                    nodeId: consultation!.nodeId,
                    tests: labTests,
                    status: 'pending'
                });
            }

            await finalizeConsultation(selectedId!, user!.uid, clinicalNotes, {
                patientId: consultation!.patientId,
                nodeId: consultation!.nodeId,
                medicines,
                labTests: labTests.map(t => ({ id: Math.random().toString(36).substr(2, 9), name: t, price: 0, status: 'pending' })),
                diagnosis,
                duration: sessionTimer
            });

            if (timerRef.current) clearInterval(timerRef.current);
            setSessionTimer(0);
            setSelectedId(null);
            refreshMetrics();
            toast.success('Consultation Finalized');
        } catch (error) {
            toast.error('Failed to save consultation');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleViewPrescription = async (consultId: string, prescriptionId: string) => {
        try {
            const prescription = await getPrescription(prescriptionId);
            if (!prescription) return toast.error('Prescription record not found.');

            const consultSnap = await getDoc(doc(db, 'consultations', consultId));
            if (!consultSnap.exists()) return toast.error('Consultation record not found.');
            const consultData = { id: consultSnap.id, ...consultSnap.data() } as Consultation;

            const patientSnap = await getDoc(doc(db, 'patients', consultData.patientId));
            if (!patientSnap.exists()) return toast.error('Patient record not found.');
            const patientData = patientSnap.data() as Patient;

            const pdf = await generatePrescriptionPDF({
                consultation: consultData,
                patient: patientData,
                doctorName: user?.name || 'Physician',
                medicines: prescription.medicines || [],
                nodeName: user?.nodeId
            });

            pdf.save(`Prescription_${patientData.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.pdf`);
            toast.success('Prescription generated successfully.');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate prescription PDF.');
        }
    };

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="flex flex-col h-[calc(100vh-120px)] -mt-4 overflow-hidden">
                {/* Header Section: Clinical Command Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-slate-900 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl gap-6 shrink-0 text-white">
                    <div className="flex items-center gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black rounded-md uppercase tracking-[0.2em]">
                                    Clinical Terminal
                                </div>
                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">{user?.nodeId && `NODE: ${user.nodeId.slice(-6).toUpperCase()}`}</p>
                            </div>
                            <h1 className="text-2xl font-display font-black text-white tracking-tight uppercase">Telemedicine Console</h1>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Authenticated: Dr. {user?.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                            {(['online', 'busy', 'offline'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleToggleStatus(s)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isOnline === s
                                        ? s === 'online' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : s === 'busy' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white text-slate-900 shadow-lg shadow-white/20'
                                        : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all relative shadow-sm group">
                            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {notifications.length > 0 && <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* LEFT PANEL: Professional Patient Queue */}
                    <div className={cn(
                        "w-full lg:w-72 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden shrink-0",
                        selectedId && "hidden 2xl:flex"
                    )}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between font-display">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Queue Status</h3>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-black text-slate-900 uppercase">Incoming Patients</span>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-indigo-500 text-white text-xs font-black rounded-lg shadow-lg shadow-indigo-500/20">
                                {queue.length}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {queueLoading ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Polling Secure Uplink...</p>
                                </div>
                            ) : queue.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Zap className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic text-center leading-relaxed">No pending clinical transmissions detected.</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {queue.map((c, idx) => (
                                        <motion.button
                                            key={c.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedId(c.id)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative group ${selectedId === c.id
                                                ? 'border-indigo-500 bg-indigo-50/50 shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-500/5'
                                                : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50/30'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${selectedId === c.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {c.patientName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-xs">{c.patientName}</p>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{c.id.slice(-6).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${c.status === 'active' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                    <div className={`w-1 h-1 rounded-full ${c.status === 'active' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                    <span className="text-[7px] font-black uppercase tracking-[0.1em]">{c.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 pl-10">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight line-clamp-1">{c.complaint}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Launch Consultation</span>
                                                    <History className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* MAIN WORKSPACE: Three Column Expansion */}
                    {!selectedId ? (
                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8">
                                <Monitor className="w-10 h-10 text-slate-200" />
                            </div>
                            <h2 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight uppercase">Standby Mode</h2>
                            <p className="text-slate-400 max-w-sm text-sm font-medium leading-relaxed uppercase tracking-widest italic">Select a patient from the tactical queue to initiate clinical protocol.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex gap-6 overflow-hidden min-w-0">
                            {/* CENTER PANEL: Live Video Consultation (Dominant 65%) */}
                            <div className="flex-[3.5] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative min-w-0">
                                {/* Workspace Header */}
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedId(null)}
                                                className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0"
                                                title="Return to Queue List"
                                            >
                                                <ChevronLeft className="w-4 h-4" /> Queue
                                            </button>
                                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-indigo-600/20 shrink-0">
                                                {patient?.name?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{patient?.name}</h2>
                                                    <div className="px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded-md uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20 shrink-0">
                                                        <ShieldCheck className="w-2.5 h-2.5" /> Verified Profile
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span>Age: {patient?.age} • Gender: {patient?.gender}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="text-indigo-500 flex items-center gap-1">
                                                        <Database className="w-2.5 h-2.5 text-indigo-400" /> Secure Vault
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                                            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center gap-3 px-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Session</span>
                                                    <span className="text-xs font-mono font-black text-slate-900 leading-none">{formatTime(sessionTimer)}</span>
                                                </div>
                                                <Timer className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
                                            </div>

                                            <button
                                                onClick={() => setShowVideo(!showVideo)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.1em] flex items-center gap-2 transition-all active:scale-95 shadow-md shrink-0",
                                                    showVideo
                                                        ? "bg-rose-600 text-white shadow-rose-600/20"
                                                        : "bg-indigo-600 text-white shadow-indigo-600/20"
                                                )}
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                                {showVideo ? 'Terminate Link' : 'Start Consultation'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
                                    {/* Clinical Video Terminal (Dominant) */}
                                    <div className="flex-[2] min-h-[450px] rounded-[3rem] bg-slate-950 border border-white/5 shadow-2xl overflow-hidden relative">
                                        <VideoEngine
                                            sessionId={selectedId!}
                                            patientName={patient?.name || 'Patient'}
                                            role="DOCTOR"
                                            mode="inline"
                                            onEnd={() => setShowVideo(false)}
                                        />
                                    </div>

                                    {/* Verified Vitals Panel (Directly Below Video) */}
                                    {consultation && (
                                        <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Verified Clinical Metrics</h3>
                                                <ShieldCheck className="w-4 h-4 text-emerald-500 ml-auto" />
                                            </div>

                                            <div className="grid grid-cols-5 gap-4">
                                                <VitalsMetricCard icon={<Thermometer className="w-4 h-4" />} value={`${consultation.vitals.temp}°F`} label="TEMP" color="text-rose-500" bgColor="bg-rose-50/30" />
                                                <VitalsMetricCard
                                                    icon={<Activity className="w-4 h-4" />}
                                                    value={consultation.vitals.bp}
                                                    label="BP (S/D)"
                                                    color={parseInt(consultation.vitals.bp?.split('/')?.[0]) > 140 ? "text-rose-600" : "text-indigo-600"}
                                                    bgColor={parseInt(consultation.vitals.bp?.split('/')?.[0]) > 140 ? "bg-rose-50 ring-2 ring-rose-200" : "bg-indigo-50/30"}
                                                />
                                                <VitalsMetricCard icon={<Wind className="w-4 h-4" />} value={`${consultation.vitals.spo2}%`} label="SPO2" color="text-sky-500" bgColor="bg-sky-50/30" />
                                                <VitalsMetricCard icon={<Droplets className="w-4 h-4" />} value={`${consultation.vitals.sugar} mg/dL`} label="GLC" color="text-emerald-500" bgColor="bg-emerald-50/30" />
                                                <VitalsMetricCard icon={<HeartPulse className="w-4 h-4" />} value={`${consultation.vitals.pulse || '--'} bpm`} label="PULSE" color="text-rose-500" bgColor="bg-rose-50/30" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT PANEL: Integrated Clinical Workspace */}
                            <div className="w-full xl:w-96 flex flex-col bg-slate-50 border-l border-slate-100 overflow-hidden shrink-0 min-w-[320px]">
                                <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 font-display">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Workbench</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                    {/* CDSS Intelligence Module */}
                                    {cdssSuggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <Zap className="w-3.5 h-3.5 text-indigo-200" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Clinical Intelligence</span>
                                            </div>
                                            <div className="space-y-4">
                                                {cdssSuggestions.map((s, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">{s.symptom} Protocol</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {s.possibleDiagnoses.map(d => (
                                                                <button
                                                                    key={d}
                                                                    onClick={() => setDiagnosis(d)}
                                                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[8px] font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    {d}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 opacity-60">
                                                            {s.suggestedTests.map(t => (
                                                                <span key={t} className="px-1.5 py-0.5 border border-white/20 rounded text-[7px] font-black uppercase">
                                                                    Test: {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Clinical Observations */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between font-display">
                                            <span className="flex items-center gap-2 uppercase"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Observations</span>
                                            <span className="text-[8px] font-bold text-emerald-500 italic">Auto-sync Active</span>
                                        </label>
                                        <textarea
                                            className="w-full h-32 p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-xs font-semibold text-slate-700 placeholder:text-slate-300 shadow-sm"
                                            placeholder="Clinical findings..."
                                            value={clinicalNotes}
                                            onChange={(e) => setClinicalNotes(e.target.value)}
                                        />
                                    </div>

                                    {/* Diagnosis Module */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                                            <Activity className="w-3.5 h-3.5 text-rose-500" /> Clinical Diagnosis
                                        </label>
                                        <div className="relative group">
                                            <input
                                                className="w-full px-5 py-4 bg-white border-2 border-indigo-500/10 rounded-2xl outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all text-xs font-black text-slate-900 placeholder:text-slate-300 shadow-sm"
                                                placeholder="Formal code/diagnosis..."
                                                value={diagnosis}
                                                onChange={(e) => {
                                                    setDiagnosis(e.target.value);
                                                    setShowDiagnosisSuggestions(e.target.value.length > 2);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Prescription Dispatch Protocol */}
                                    <div className="space-y-4 pt-6 border-t border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                                                <Zap className="w-3.5 h-3.5 text-amber-500" /> Prescription Builder
                                            </label>
                                            <div className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[8px] font-black rounded-md">{medicines.length} ITEMS</div>
                                        </div>

                                        <div className="space-y-3">
                                            <AnimatePresence mode="popLayout">
                                                {medicines.map((med, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group shadow-sm border-l-4 border-l-amber-500"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black text-slate-900 uppercase truncate">{med.name}</p>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase">{med.dosage} • {med.duration}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}
                                                            className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        <MedicineInputs onAdd={(m) => setMedicines([...medicines, m])} nodeId={user?.nodeId || ''} />
                                    </div>

                                    {/* Lab Order Panel */}
                                    <div className="space-y-4 pt-6 border-t border-slate-200">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                                            <FlaskConical className="w-3.5 h-3.5 text-indigo-500" /> Laboratory Investigations
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Blood CBC', 'Blood Sugar', 'Liver Panel', 'Kidney Panel', 'X-Ray', 'ECG'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => labTests.includes(t) ? setLabTests(labTests.filter(lt => lt !== t)) : setLabTests([...labTests, t])}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all",
                                                        labTests.includes(t)
                                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                                            : "bg-white text-slate-400 border-slate-50 hover:border-slate-100"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Patient Insights & Tactical Sidebar */}
                                    <div className="space-y-4 pt-6 border-t border-slate-200">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                                            <Database className="w-3.5 h-3.5 text-indigo-500" /> Clinical History
                                        </label>

                                        {history.length === 0 ? (
                                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                                                <History className="w-5 h-5 text-slate-200 mx-auto mb-3" />
                                                <p className="text-[8px] font-black text-slate-300 uppercase italic tracking-widest">No previous encounters.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                                {history.slice(0, 3).map(h => (
                                                    <div key={h.id} className="relative pl-7 group">
                                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-200 border border-white group-hover:bg-indigo-500 transition-all shadow-sm" />
                                                        <div className="p-3 bg-white border border-slate-50 rounded-xl shadow-sm hover:border-indigo-100 transition-all">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-[9px] font-black text-slate-900 uppercase truncate">{h.clinicalData?.diagnosis || 'Standard Triage'}</p>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                                                <span>{h.updatedAt?.toDate()?.toLocaleDateString()}</span>
                                                                <button onClick={() => handleViewPrescription(h.id, h.prescriptionId!)} className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                                    <FileText className="w-2.5 h-2.5" /> Prescription
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Critical Intel Feed */}
                                    <div className="space-y-4 pt-6 border-t border-slate-200">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                                            <Bell className="w-3.5 h-3.5 text-rose-500" /> Intelligence Feed
                                        </label>
                                        <div className="space-y-3">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 border border-slate-100 bg-white rounded-2xl text-center">
                                                    <p className="text-[8px] font-black text-slate-300 uppercase italic">Uplink Clear.</p>
                                                </div>
                                            ) : (
                                                notifications.slice(0, 2).map(n => (
                                                    <div key={n.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0 animate-pulse" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-0.5">{n.title}</p>
                                                            <p className="text-[8px] text-slate-400 font-medium leading-relaxed">{n.message}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Complete Consultation Action */}
                                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                                    <button
                                        onClick={handleFinalize}
                                        disabled={submitting}
                                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                Complete Consultation
                                                <ArrowRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PrescriptionPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                onConfirm={confirmFinalize}
                patient={patient}
                doctorName={user?.name || ''}
                medicines={medicines}
                clinicalNotes={clinicalNotes}
                diagnosis={diagnosis}
                labTests={labTests}
                nodeId={user?.nodeId || ''}
            />
        </DashboardLayout>
    );
}

function MetricBox({ label, value, color, icon }: any) {
    return (
        <div className="flex items-center gap-4 group cursor-default">
            <div className={cn("p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300", color)}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
                <span className="text-lg font-black text-slate-900 leading-none">{value}</span>
            </div>
        </div>
    );
}

function VitalsMetricCard({ icon, value, label, color, bgColor }: any) {
    return (
        <div className={cn("p-5 rounded-3xl border border-slate-100 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-lg transition-all duration-300", bgColor)}>
            <div className={cn("mb-3 p-2 rounded-xl bg-white shadow-sm", color)}>
                {icon}
            </div>
            <p className="text-xs font-black text-slate-900 leading-none mb-1.5">{value}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        </div>
    );
}

function MedicineInputs({ onAdd, nodeId }: { onAdd: (m: Medicine) => void, nodeId: string }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [duration, setDuration] = useState('');
    const [timing, setTiming] = useState({ morning: false, afternoon: false, evening: false, night: false });
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (nodeId) {
            getInventory(nodeId).then(setInventory);
        }
    }, [nodeId]);

    useEffect(() => {
        if (name.length > 1) {
            const filtered = inventory.filter(i => i.name.toLowerCase().includes(name.toLowerCase()));
            setFilteredInventory(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [name, inventory]);

    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="relative group">
                    <input
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                        placeholder="Search Medicine Protocol..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onFocus={() => name.length > 1 && setShowSuggestions(true)}
                    />
                    {showSuggestions && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-56 overflow-hidden border-t-4 border-t-amber-500"
                        >
                            <div className="p-3 bg-slate-50/50 border-b border-slate-100 italic text-[10px] font-bold text-slate-400">Inventory Uplink</div>
                            <div className="overflow-y-auto max-h-40 custom-scrollbar">
                                {filteredInventory.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            if (item.totalQuantity > 0) {
                                                setName(item.name);
                                                setShowSuggestions(false);
                                            } else {
                                                toast.error('Strategic Stock Depletion: Protocol Halted.');
                                            }
                                        }}
                                        className="w-full p-4 text-left text-xs hover:bg-amber-50 hover:text-amber-700 transition-all flex justify-between items-center border-b border-slate-50 last:border-none"
                                    >
                                        <span className="font-black uppercase tracking-widest">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-3 h-3" />
                                            <span className={cn(
                                                "text-[9px] px-2 py-0.5 rounded-md font-black",
                                                item.totalQuantity > 0 ? "bg-slate-100 text-slate-500" : "bg-rose-500 text-white"
                                            )}>STOCK: {item.totalQuantity}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
                <input
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                    placeholder="Dosage (e.g. 1 Tablet)"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-4">
                <input
                    className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                    placeholder="Duration (e.g. 5 Days)"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                />
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    {(['morning', 'afternoon', 'evening', 'night'] as const).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTiming(prev => ({ ...prev, [t]: !prev[t] }))}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center ${timing[t]
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {t[0]}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => {
                        if (!name || !dosage) return toast.warning('Protocol Integrity Failure: Missing details.');
                        onAdd({ id: Math.random().toString(36).substr(2, 9), name, dosage, duration, timing });
                        setName(''); setDosage(''); setDuration('');
                        setTiming({ morning: false, afternoon: false, evening: false, night: false });
                    }}
                    className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all group"
                >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        </div>
    );
}
