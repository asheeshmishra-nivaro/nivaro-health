'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Stethoscope,
    History,
    Activity,
    Plus,
    Trash2,
    Send,
    Loader2,
    CheckCircle2,
    ClipboardList,
    Video,
    Clock,
    User,
    ChevronLeft,
    Search,
    Thermometer,
    Droplets,
    Wind,
    ArrowLeft,
    Timer,
    AlertCircle,
    FileText,
    FlaskConical,
    ShieldCheck,
    Phone,
    Bell,
    Wifi,
    Zap,
    X,
    HeartPulse
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    finalizeConsultation,
    logActivity,
    getPatientHistory,
    createDiagnosticOrder,
    getInventory,
    getPrescription
} from '@/lib/db';
import { Consultation, Patient, Medicine, InventoryItem, LabTest } from '@/types';
import { toast } from 'sonner';
import VideoEngine from '@/components/dashboard/VideoEngine';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import PrescriptionPreviewModal from '@/components/dashboard/PrescriptionPreviewModal';
import { generatePrescriptionPDF } from '@/lib/pdf';
import MetricCard from '@/components/dashboard/MetricCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<Consultation[]>([]);
    const [showVideo, setShowVideo] = useState(false);
    const [sessionTimer, setSessionTimer] = useState(0);
    const [isVideoConnected, setIsVideoConnected] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Clinical Input State
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [labTests, setLabTests] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Medicine Builder State
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentMed, setCurrentMed] = useState<Medicine>({
        id: '',
        name: '',
        dosage: '',
        duration: '',
        timing: {
            morning: false, afternoon: false, evening: false, night: false,
            morningTime: '08:00', afternoonTime: '13:00', eveningTime: '18:00', nightTime: '21:00'
        },
        foodRelation: 'After Food',
        frequency: 'Daily'
    });

    useEffect(() => {
        if (!id || authLoading) return;
        if (!user || (role !== 'DOCTOR' && role !== 'ADMIN')) return;

        // Use onSnapshot for real-time vitals/status updates from operator
        const unsubscribe = onSnapshot(doc(db, 'consultations', id as string), async (snap) => {
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as Consultation;
                setConsultation(data);

                // Fetch patient and history if not done
                if (!patient) {
                    const pSnap = await getDoc(doc(db, 'patients', data.patientId));
                    if (pSnap.exists()) setPatient(pSnap.data() as Patient);

                    const pHistory = await getPatientHistory(data.patientId);
                    setHistory(pHistory);
                }

                setLoading(false);
            } else {
                toast.error('Consultation not found');
                router.push('/dashboard/doctor');
            }
        }, (error) => {
            console.error('Consultation detail listener error:', error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, user, role, authLoading]);

    // Start timer when status becomes 'active'
    useEffect(() => {
        if (consultation?.status === 'active' && !timerRef.current) {
            timerRef.current = setInterval(() => {
                setSessionTimer(prev => prev + 1);
            }, 1000);
        }
    }, [consultation?.status]);

    useEffect(() => {
        if (consultation?.nodeId) {
            getInventory(consultation.nodeId).then(setInventory);
        }
    }, [consultation?.nodeId]);

    useEffect(() => {
        if (currentMed.name.length > 1) {
            const filtered = inventory.filter(i => i.name.toLowerCase().includes(currentMed.name.toLowerCase()));
            setFilteredInventory(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [currentMed.name, inventory]);

    const handleAddMedicine = () => {
        if (!currentMed.name) return toast.warning('Missing medicine details');
        setMedicines([...medicines, { ...currentMed, dosage: currentMed.dosage || '1-0-1' }]);
        setCurrentMed({
            id: '',
            name: '',
            dosage: '',
            duration: '',
            timing: {
                morning: false, afternoon: false, evening: false, night: false,
                morningTime: '08:00', afternoonTime: '13:00', eveningTime: '18:00', nightTime: '21:00'
            },
            foodRelation: 'After Food',
            frequency: 'Daily'
        });
    };

    const removeMedicine = (idx: number) => {
        setMedicines(medicines.filter((_, i) => i !== idx));
    };

    const toggleLabTest = (test: string) => {
        if (labTests.includes(test)) {
            setLabTests(labTests.filter(t => t !== test));
        } else {
            setLabTests([...labTests, test]);
        }
    };

    const handleFinalize = () => {
        if (!diagnosis) return toast.error('Diagnosis is required');
        setShowPreview(true);
    };

    const confirmFinalize = async () => {
        setShowPreview(false);
        setSubmitting(true);

        try {
            // 1. Create Diagnostic Order if tests selected
            if (labTests.length > 0) {
                await createDiagnosticOrder({
                    consultationId: id as string,
                    patientId: consultation!.patientId,
                    doctorId: user!.uid,
                    nodeId: consultation!.nodeId,
                    tests: labTests,
                    status: 'pending'
                });
            }

            // 2. Finalize Consultation
            await finalizeConsultation(id as string, user!.uid, clinicalNotes, {
                patientId: consultation!.patientId,
                nodeId: consultation!.nodeId,
                operatorId: consultation!.operatorId, // Pass assigned operator for notification
                medicines,
                labTests: labTests.map(t => ({ id: Math.random().toString(36).substr(2, 9), name: t, price: 0, status: 'pending' })),
                diagnosis,
                duration: sessionTimer
            });

            toast.success('Consultation completed successfully');
            router.push('/dashboard/doctor');
        } catch (error) {
            console.error(error);
            toast.error('Finalization failed');
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

    if (authLoading) return (
        <DashboardLayout allowedRoles={['DOCTOR', 'ADMIN']}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Authenticating Clinical Session...</p>
            </div>
        </DashboardLayout>
    );

    if (!user || (role !== 'DOCTOR' && role !== 'ADMIN')) {
        return (
            <DashboardLayout allowedRoles={['DOCTOR', 'ADMIN']}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Unauthorized Clinical Access</p>
                    <Link href="/dashboard/doctor" className="text-indigo-600 font-bold uppercase tracking-tighter hover:underline">Return to Hub</Link>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) return (
        <DashboardLayout allowedRoles={['DOCTOR', 'ADMIN']}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Syncing Clinical Link...</p>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            {/* Header: Consultation Intelligence Hub */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 px-2">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/doctor" className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm group active:scale-95">
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Consultation Hub</h1>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Encrypted RTC Active</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold text-xs uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Patient: {patient?.name || 'Loading...'} (Alpha Node)</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Session: Production Secured</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-6 py-4 bg-slate-950 text-white rounded-3xl flex items-center gap-4 shadow-2xl shadow-indigo-500/10 border border-white/5">
                        <Timer className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Elapsed Time</span>
                            <span className="font-mono font-black text-xl leading-none">{formatTime(sessionTimer)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="grid lg:grid-cols-12 gap-8 mb-20 relative">
                {/* Left Column: Video & Vitals (7/12) */}
                <div className="lg:col-span-12 xl:col-span-7 2xl:col-span-6 space-y-8">
                    {/* Primary Video Terminal */}
                    <div className="relative aspect-video bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 group">
                        {!isVideoConnected ? (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all duration-700">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsVideoConnected(true)}
                                    className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-xl flex items-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all"
                                >
                                    <Phone className="w-8 h-8 fill-current" />
                                    <span>Connect (Join Channel)</span>
                                </motion.button>
                                <p className="mt-8 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Waiting for operator at Village Alpha Node...</p>
                            </div>
                        ) : (
                            <VideoEngine
                                sessionId={id as string}
                                patientName={patient?.name || 'Patient'}
                                role="DOCTOR"
                                mode="inline"
                                onEnd={() => setIsVideoConnected(false)}
                            />
                        )}

                        {/* Decorative HUD Elements */}
                        <div className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 z-10 pointer-events-none">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{isVideoConnected ? 'Live Feed' : 'Standby'}</span>
                            </div>
                        </div>
                    </div>

                    {/* High-Fidelity Verified Vitals (Light Theme) */}
                    {consultation && (
                        <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">Verified Vitals</h3>
                                <div className="ml-auto flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Validated</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <ClinicalMetric icon={Thermometer} value={`${consultation.vitals.temp}°F`} label="TEMP" color="bg-rose-500" bgColor="bg-rose-50/50" textColor="text-rose-500" />
                                <ClinicalMetric icon={Activity} value={consultation.vitals.bp} label="BP (S/D)" color="bg-indigo-600" bgColor="bg-indigo-50/50" textColor="text-indigo-600" />
                                <ClinicalMetric icon={Wind} value={`${consultation.vitals.spo2}%`} label="SPO2" color="bg-sky-500" bgColor="bg-sky-50/50" textColor="text-sky-500" />
                                <ClinicalMetric icon={Droplets} value={`${consultation.vitals.sugar} mg/dL`} label="GLUCOSE" color="bg-emerald-500" bgColor="bg-emerald-50/50" textColor="text-emerald-500" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: High-Fidelity Prescription Panel (5/12) */}
                <div className="lg:col-span-5 2xl:col-span-4">
                    <div className="bg-white rounded-[4rem] border-2 border-indigo-600/10 shadow-2xl flex flex-col min-h-[850px] relative overflow-hidden sticky top-8">
                        {/* Decorative Sidebar Accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600 shadow-[4px_0_24px_rgba(79,70,229,0.3)]" />

                        <div className="p-10 flex-1 flex flex-col">
                            {/* Panel Header */}
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-3xl font-display font-black text-slate-900 tracking-tighter mb-1">E-Prescription</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">ID: NV-2026-RX{(id as string)?.slice(-4).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900">Dr. {user?.name}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">MC-2026-9921</p>
                                </div>
                            </div>

                            {/* Med Selection Builder */}
                            <div className="space-y-8 flex-1">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Select Medication (Searchable)</label>
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all shadow-inner"
                                            placeholder="Search Name, SKU, or Generic..."
                                            value={currentMed.name}
                                            onChange={e => setCurrentMed({ ...currentMed, name: e.target.value })}
                                            onFocus={() => currentMed.name.length > 1 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        />

                                        <AnimatePresence>
                                            {showSuggestions && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 max-h-72 overflow-hidden border-t-8 border-t-indigo-600"
                                                >
                                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Inventory Lookup</span>
                                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono">{filteredInventory.length} Protocols Found</span>
                                                    </div>
                                                    <div className="overflow-y-auto max-h-56 p-2 custom-scrollbar">
                                                        {filteredInventory.map(item => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    setCurrentMed({ ...currentMed, name: item.name, id: item.id });
                                                                    setShowSuggestions(false);
                                                                }}
                                                                className="w-full p-4 hover:bg-indigo-50 rounded-2xl text-left transition-all border border-transparent hover:border-indigo-100 group flex justify-between items-center mb-1"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.category}</p>
                                                                </div>
                                                                 <div className={cn(
                                                                     "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase flex items-center gap-1.5",
                                                                     item.totalQuantity > (item.minStockLevel || 10)
                                                                         ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                         : item.totalQuantity > 0
                                                                             ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                             : "bg-red-50 text-red-700 border-red-200"
                                                                 )}>
                                                                     <div className={cn(
                                                                         "w-1.5 h-1.5 rounded-full",
                                                                         item.totalQuantity > (item.minStockLevel || 10)
                                                                             ? "bg-emerald-500 animate-pulse"
                                                                             : item.totalQuantity > 0
                                                                                 ? "bg-amber-500"
                                                                                 : "bg-red-500"
                                                                     )} />
                                                                     {item.totalQuantity > 0 ? `Stock: ${item.totalQuantity} ${item.unit}` : 'Out of Stock'}
                                                                 </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Advanced Timing UI (Mockup Component) */}
                                <div className="p-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <TimingToggle label="Morning" icon="08:00" isActive={currentMed.timing.morning} onToggle={() => setCurrentMed({ ...currentMed, timing: { ...currentMed.timing, morning: !currentMed.timing.morning } })} />
                                        <TimingToggle label="Afternoon" icon="13:00" isActive={currentMed.timing.afternoon} onToggle={() => setCurrentMed({ ...currentMed, timing: { ...currentMed.timing, afternoon: !currentMed.timing.afternoon } })} />
                                        <TimingToggle label="Evening" icon="18:00" isActive={currentMed.timing.evening} onToggle={() => setCurrentMed({ ...currentMed, timing: { ...currentMed.timing, evening: !currentMed.timing.evening } })} />
                                        <TimingToggle label="Night" icon="21:00" isActive={currentMed.timing.night} onToggle={() => setCurrentMed({ ...currentMed, timing: { ...currentMed.timing, night: !currentMed.timing.night } })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                                            <input
                                                className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all shadow-sm"
                                                value={currentMed.duration}
                                                onChange={e => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                                placeholder="e.g. 5"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Food Relation</label>
                                            <select
                                                className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none"
                                                value={currentMed.foodRelation}
                                                onChange={e => setCurrentMed({ ...currentMed, foodRelation: e.target.value as any })}
                                            >
                                                <option>After Food</option>
                                                <option>Before Food</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                        <select
                                            className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none"
                                            value={currentMed.frequency}
                                            onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                        >
                                            <option>Daily</option>
                                            <option>Thrice Weekly</option>
                                            <option>Monthly</option>
                                            <option>Sos (Whenever required)</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!currentMed.name) return toast.error('Medicine name required');
                                            setMedicines([...medicines, { ...currentMed, dosage: currentMed.dosage || '1-0-1' }]);
                                            setCurrentMed({
                                                id: '', name: '', dosage: '', duration: '',
                                                timing: { morning: false, afternoon: false, evening: false, night: false, morningTime: '08:00', afternoonTime: '13:00', eveningTime: '18:00', nightTime: '21:00' },
                                                foodRelation: 'After Food', frequency: 'Daily'
                                            });
                                        }}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        Add to Protocol
                                    </button>
                                </div>

                                {/* Active Rx Items */}
                                <AnimatePresence mode="wait">
                                    {medicines.length > 0 ? (
                                        <div className="space-y-3 mt-8">
                                            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] ml-1">Active Prescription Stack</label>
                                            {medicines.map((med, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center gap-4 group"
                                                >
                                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm">{idx + 1}</div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-black text-slate-900">{med.name}</p>
                                                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{med.duration} • {med.foodRelation}</p>
                                                    </div>
                                                    <button onClick={() => removeMedicine(idx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-10 p-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-50 mb-6 group-hover:scale-110 transition-transform">
                                                <HeartPulse className="w-10 h-10 text-slate-200 animate-pulse" />
                                            </div>
                                            <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Draft prescription here...</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Clinical Advice */}
                                <div className="space-y-4 py-8 border-t border-slate-100 mt-8">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clinical Advice & Notes</label>
                                    <textarea
                                        className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                        placeholder="Advice to patient..."
                                        value={clinicalNotes}
                                        onChange={e => setClinicalNotes(e.target.value)}
                                    />
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Provisional Diagnosis *</label>
                                        <input
                                            className="w-full mt-3 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500 transition-all placeholder:text-emerald-300"
                                            placeholder="Enter medical diagnosis..."
                                            value={diagnosis}
                                            onChange={e => setDiagnosis(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Finalize Action */}
                            <div className="pt-10 flex gap-4">
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="flex-1 py-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <FileText className="w-5 h-5" />
                                    Preview
                                </button>
                                <button
                                    onClick={handleFinalize}
                                    disabled={submitting}
                                    className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                                    Finalize
                                </button>
                            </div>
                            <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6 leading-none italic">Authorized Under NIVARO-OS Security Kernel 2.4.1</p>
                        </div>
                    </div>
                </div>

                {/* Rightmost Intelligence Feed (Hidden on smaller screens, shown in SS 2) */}
                <div className="hidden 2xl:block col-span-2 space-y-6">
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-indigo-500" />
                                Live Feed
                            </h4>
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <Bell className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="py-10 text-center grayscale opacity-20">
                            <Zap className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No new activity.</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <ShieldCheck className="w-16 h-16" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 leading-none">System Alerts</h4>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">OS Optimization</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">All clinical nodes are currently operating within nominal latency parameters.</p>
                        </div>
                    </div>

                    <div className="mt-auto px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Relay Connected</span>
                        </div>
                        <button className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
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

function ClinicalMetric({ icon: Icon, value, label, color, bgColor, textColor }: any) {
    return (
        <div className={cn("p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-start gap-4 transition-all duration-500 group", bgColor)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={cn("text-2xl font-display font-black group-hover:scale-105 transition-transform origin-left", textColor)}>{value}</p>
            </div>
        </div>
    );
}

function TimingToggle({ label, icon, isActive, onToggle }: { label: string, icon: string, isActive: boolean, onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={onToggle}
                    className="w-4 h-4 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">{label}</span>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer" onClick={onToggle}>
                <Clock className={cn("w-3.5 h-3.5 transition-colors", isActive ? "text-indigo-600" : "text-slate-300")} />
                <span className={cn("text-[9px] font-black transition-colors", isActive ? "text-indigo-600" : "text-slate-400")}>{icon}</span>
            </div>
        </div>
    );
}
