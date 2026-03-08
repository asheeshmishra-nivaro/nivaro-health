'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Monitor,
    Zap,
    CircleDot,
    Heart,
    Droplets,
    Database,
    Box,
    CheckCircle2,
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
    UserPlus,
    Activity,
    ClipboardList,
    TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Patient, Consultation, OperatorWalletTransaction, WalletStats, Prescription } from '@/types';
import { createVideoSession, getWalletTransactions, dispensePrescription, recordDiagnosticsCommission, getPrescription } from '@/lib/db';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from '@/components/dashboard/MetricCard';
import { generatePrescriptionPDF } from '@/lib/pdf';
import { FileText } from 'lucide-react';

export default function OperatorPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayPatients: 0,
        prescriptionsDispensed: 0,
        pendingConsultations: 0,
        registrations: 0,
        consultationsCompleted: 0
    });
    const [walletStats, setWalletStats] = useState<WalletStats>({
        currentBalance: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        thisMonthEarnings: 0
    });
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
    const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
    const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([]);
    const [pendingDiagnostics, setPendingDiagnostics] = useState<Consultation[]>([]);
    const [transactions, setTransactions] = useState<OperatorWalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid || !user?.nodeId) return;

        // 1. Listen for Recent Patients
        const patientsQuery = query(
            collection(db, 'patients'),
            where('nodeId', '==', user.nodeId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
            const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
            setRecentPatients(patients);
            setStats(prev => ({ ...prev, todayPatients: snapshot.size }));
        }, (error) => console.error('Operator patients listener error:', error));

        // 2. Listen for Pending Consultations (Active Queue)
        const consultQuery = query(
            collection(db, 'consultations'),
            where('nodeId', '==', user.nodeId),
            where('status', 'in', ['doctor-assigned', 'active']),
            orderBy('createdAt', 'desc')
        );

        const unsubConsults = onSnapshot(consultQuery, (snapshot) => {
            const consults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation));
            setPendingConsultations(consults);
            setStats(prev => ({
                ...prev,
                pendingConsultations: snapshot.size,
            }));
            setLoading(false);
        }, (error) => {
            console.error('Operator consults listener error:', error);
            setLoading(false);
        });

        // 3. Listen for Pending Prescriptions (Pharmacy Queue)
        const pharmacyQuery = query(
            collection(db, 'prescriptions'),
            where('nodeId', '==', user.nodeId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const unsubPharmacy = onSnapshot(pharmacyQuery, (snapshot) => {
            const prescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription));
            setPendingPrescriptions(prescriptions);
        }, (error) => console.error('Operator pharmacy listener error:', error));

        // 3.1 Listen for Completed Prescriptions (Dispense Rate)
        const dispensedQuery = query(
            collection(db, 'prescriptions'),
            where('nodeId', '==', user.nodeId),
            where('status', '==', 'dispensed')
        );

        const unsubDispensed = onSnapshot(dispensedQuery, (snapshot) => {
            setStats(prev => ({ ...prev, prescriptionsDispensed: snapshot.size }));
        }, (error) => console.error('Operator dispensed listener error:', error));

        // 4. Listen for Diagnostics (Lab Queue)
        const diagQuery = query(
            collection(db, 'consultations'),
            where('nodeId', '==', user.nodeId),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubDiag = onSnapshot(diagQuery, (snapshot) => {
            const diags = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Consultation))
                .filter(c => c.labTests && c.labTests.length > 0 && c.labTests.some(t => t.status === 'pending'));
            setPendingDiagnostics(diags);
        }, (error) => console.error('Operator diagnostics listener error:', error));

        // 5. Listen for Wallet Transactions & Calculate Stats
        const walletQuery = query(
            collection(db, 'operator_wallet_transactions'),
            where('operatorId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubWallet = onSnapshot(walletQuery, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OperatorWalletTransaction));
            setTransactions(txs);

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            let total = 0;
            let today = 0;
            let month = 0;

            txs.forEach(tx => {
                const date = tx.createdAt?.toDate?.() || new Date(tx.createdAt);
                total += tx.commissionEarned;
                if (date >= startOfDay) today += tx.commissionEarned;
                if (date >= startOfMonth) month += tx.commissionEarned;
            });

            setWalletStats({
                currentBalance: total,
                totalEarnings: total,
                todayEarnings: today,
                thisMonthEarnings: month
            });
        }, (error) => console.error('Operator wallet listener error:', error));

        return () => {
            unsubPatients();
            unsubConsults();
            unsubPharmacy();
            unsubDispensed();
            unsubDiag();
            unsubWallet();
        };
    }, [user?.uid, user?.nodeId]);

    const handleStartConsultation = async (consultation: Consultation) => {
        const toastId = toast.loading('Initiating clinical uplink...');
        try {
            const sessionId = await createVideoSession(
                consultation.id,
                consultation.nodeId,
                consultation.doctorId,
                consultation.operatorId
            );

            const consultRef = doc(db, 'consultations', consultation.id);
            await updateDoc(consultRef, {
                status: 'active',
                videoSessionId: sessionId,
                updatedAt: serverTimestamp()
            });

            toast.success('Optical link active. Waiting for doctor.', { id: toastId });
        } catch (error) {
            toast.error('Uplink failed. Check bandwidth.', { id: toastId });
        }
    };

    const handleDispense = async (prescriptionId: string) => {
        if (!user) return;
        try {
            await dispensePrescription(prescriptionId, user.uid);
            toast.success('Inventory dispensed. Credit recorded.');
            setSelectedPrescription(null);
        } catch (error) {
            toast.error('Dispensing protocol failed.');
        }
    };

    const handleLabComplete = async (consultationId: string) => {
        if (!user) return;
        try {
            await recordDiagnosticsCommission(consultationId, user.uid);
            const consultRef = doc(db, 'consultations', consultationId);
            const snap = await getDoc(consultRef);
            if (snap.exists()) {
                const tests = snap.data().labTests?.map((t: any) => ({ ...t, status: 'completed' }));
                await updateDoc(consultRef, { labTests: tests, updatedAt: serverTimestamp() });
            }
            toast.success('Specimen collection recorded.');
            setSelectedLab(null);
        } catch (error) {
            toast.error('Lab logging failed.');
        }
    };

    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [selectedLab, setSelectedLab] = useState<Consultation | null>(null);

    const handleViewPrescription = async (prescription: Prescription) => {
        try {
            const consultSnap = await getDoc(doc(db, 'consultations', prescription.consultationId));
            if (!consultSnap.exists()) return toast.error('Consultation record not found.');
            const consultData = { id: consultSnap.id, ...consultSnap.data() } as Consultation;

            const patientSnap = await getDoc(doc(db, 'patients', prescription.patientId));
            if (!patientSnap.exists()) return toast.error('Patient record not found.');
            const patientData = patientSnap.data() as Patient;

            // Fetch doctor name
            const doctorSnap = await getDoc(doc(db, 'users', prescription.doctorId));
            const doctorName = doctorSnap.exists() ? doctorSnap.data().name : 'Physician';

            const pdf = await generatePrescriptionPDF({
                consultation: consultData,
                patient: patientData,
                doctorName,
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
        <DashboardLayout allowedRoles={['OPERATOR']}>
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-widest">
                            Front-Desk Operations
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{user?.nodeId && `NODE: ${user.nodeId.slice(-6).toUpperCase()}`}</p>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Workspace</h1>
                    <p className="text-slate-500 font-medium">Coordinate patient care, manage clinical queues, and monitor fiscal authority.</p>
                </div>
                <Link href="/dashboard/operator/register">
                    <button className="px-8 py-4 bg-primary text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                        <UserPlus className="w-5 h-5" />
                        New Admission
                    </button>
                </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricCard
                    label="Queue Density"
                    value={stats.pendingConsultations.toString()}
                    icon={Activity}
                    color="bg-primary"
                    description="Active waiting queue"
                />
                <MetricCard
                    label="Clinical Load"
                    value={stats.todayPatients.toString()}
                    icon={User}
                    color="bg-indigo-600"
                    description="Total today's registry"
                />
                <MetricCard
                    label="Dispense Rate"
                    value={stats.prescriptionsDispensed.toString()}
                    icon={Package}
                    color="bg-emerald-600"
                    description="Units successfully dispatched"
                />
                <MetricCard
                    label="Fiscal Balance"
                    value={`₹${walletStats.currentBalance}`}
                    icon={Wallet}
                    color="bg-slate-900"
                    description="Total node commissions"
                />
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Tactical Ops Column */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Active Tele-Queue */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Monitor className="w-6 h-6 text-primary" />
                                    Active Tele-Queue
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest italic">Node Link: SECURE_UPLINK_09</p>
                            </div>
                            <Link href="/dashboard/operator/queue" className="text-xs font-bold text-primary hover:underline">Monitor Full Queue</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            <AnimatePresence>
                                {pendingConsultations.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center m-auto mb-4 border border-slate-100">
                                            <CircleDot className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-medium italic text-sm">Standby Mode. No patients in active waiting.</p>
                                    </div>
                                ) : pendingConsultations.map((c, idx) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-default"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-900/10">
                                                    {c.patientName[0]}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{c.patientName}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocol {c.id.slice(-6).toUpperCase()}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">DR. {c.doctorId?.slice(-4).toUpperCase() || 'P_AUTH'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex gap-2">
                                                <div className="px-3 py-1.5 bg-slate-100/50 rounded-xl text-[10px] font-black text-slate-500 flex items-center gap-2">
                                                    <Heart className="w-3 h-3 text-rose-500" />
                                                    {c.vitals.bp}
                                                </div>
                                                <div className="px-3 py-1.5 bg-slate-100/50 rounded-xl text-[10px] font-black text-slate-500 flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-primary" />
                                                    12m
                                                </div>
                                            </div>
                                            {c.status === 'doctor-assigned' ? (
                                                <button
                                                    onClick={() => handleStartConsultation(c)}
                                                    className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                    Initialize Link
                                                </button>
                                            ) : (
                                                <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10">
                                                    <Activity className="w-4 h-4 animate-pulse" />
                                                    In Session
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Dispensary Module */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-indigo-500/30">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                                <h3 className="font-display font-black text-indigo-900 tracking-tight flex items-center gap-3">
                                    <Package className="w-5 h-5" />
                                    Pharma Protocol
                                </h3>
                                <Link href="/dashboard/operator/inventory" className="p-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50 min-h-[300px]">
                                {pendingPrescriptions.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center m-auto mb-3">
                                            <Package className="w-6 h-6 text-indigo-200" />
                                        </div>
                                        <p className="text-slate-300 font-medium italic text-[10px] uppercase tracking-widest">Inventory Finalized</p>
                                    </div>
                                ) : pendingPrescriptions.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 font-black text-xs">
                                                    RX
                                                </div>
                                                {p.createdAt && (new Date().getTime() - (p.createdAt?.toDate?.()?.getTime() || new Date(p.createdAt).getTime())) < 300000 && (
                                                    <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-900 tracking-tight">#{p.id.slice(-6).toUpperCase()}</p>
                                                    {(p.createdAt && (new Date().getTime() - (p.createdAt?.toDate?.()?.getTime() || new Date(p.createdAt).getTime())) < 300000) && (
                                                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded uppercase tracking-tighter">New</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.medicines?.length || 0} Logistic Units</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleViewPrescription(p)}
                                                className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                                                title="View/Print PDF"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedPrescription(p)}
                                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                                            >
                                                Dispatch
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Diagnostics Module */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-rose-500/30">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
                                <h3 className="font-display font-black text-rose-900 tracking-tight flex items-center gap-3">
                                    <Activity className="w-5 h-5" />
                                    Diagnostic Lab
                                </h3>
                                <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="divide-y divide-slate-50 min-h-[300px]">
                                {pendingDiagnostics.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center m-auto mb-3">
                                            <Droplets className="w-6 h-6 text-rose-200" />
                                        </div>
                                        <p className="text-slate-300 font-medium italic text-[10px] uppercase tracking-widest">No Pending Orders</p>
                                    </div>
                                ) : pendingDiagnostics.map((d, idx) => (
                                    <motion.div
                                        key={d.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 italic font-black text-xs">
                                                LB
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 tracking-tight truncate max-w-[120px]">{d.patientName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{d.labTests?.filter(t => t.status === 'pending').length} Tests Pending</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLab(d)}
                                            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/10 active:scale-95"
                                        >
                                            Collect
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <h3 className="font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Database className="w-6 h-6 text-emerald-500" />
                                    Fiscal Audit Registry
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">Commission settlements & protocol credits</p>
                            </div>
                            <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all shadow-sm">
                                Export Ledger
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="px-10 py-5">Temporal Coordinate</th>
                                        <th className="px-8 py-5">Protocol ID</th>
                                        <th className="px-8 py-5">Tactical Service</th>
                                        <th className="px-8 py-5">Settlement</th>
                                        <th className="px-10 py-5 text-right">System Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-10 py-32 text-center">
                                                    <p className="text-slate-300 font-black italic text-[10px] uppercase tracking-widest">Protocol Ledger empty. Standby.</p>
                                                </td>
                                            </tr>
                                        ) : transactions.map((tx, idx) => (
                                            <motion.tr
                                                key={tx.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="hover:bg-slate-50/50 group cursor-default"
                                            >
                                                <td className="px-10 py-6 text-slate-500 font-mono text-[10px]">
                                                    {tx.createdAt?.toDate?.()?.toLocaleString() || 'SYNCING...'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-black text-slate-900 tracking-tight uppercase">#{tx.patientId.slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border",
                                                        tx.serviceType === 'Consultation' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            tx.serviceType === 'Medicine' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                'bg-rose-50 text-rose-600 border-rose-100'
                                                    )}>
                                                        {tx.serviceType}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[10px] font-black text-emerald-600">+</span>
                                                        <span className="text-xl font-black text-slate-900 tracking-tight">₹{tx.commissionEarned}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex items-center gap-2 justify-end text-emerald-500">
                                                        <ShieldCheck className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Settled</span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Intelligence & Registry Column */}
                <div className="lg:col-span-4 space-y-10">

                    {/* Wallet Intelligence */}
                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-1000" />

                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                                <Wallet className="w-4 h-4 text-primary" />
                                Fiscal Intelligence
                            </h3>

                            <div className="space-y-10">
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
                                    <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Today's Protocol Earnings</p>
                                    <div className="flex items-baseline gap-3">
                                        <p className="text-4xl font-display font-black tracking-tight">₹{walletStats.todayEarnings}</p>
                                        <span className="text-emerald-400 text-xs font-black flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                                            <ArrowUpRight className="w-3.5 h-3.5" /> +12%
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Cycle</p>
                                        <p className="text-xl font-black tracking-tight">₹{walletStats.thisMonthEarnings}</p>
                                    </div>
                                    <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Authority</p>
                                        <p className="text-xl font-black text-white/40 tracking-tight">₹{walletStats.totalEarnings}</p>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-12 py-5 bg-white text-slate-900 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-white/5 hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <ArrowRight className="w-5 h-5" />
                                Settlement Protocol
                            </button>
                        </div>
                    </div>

                    {/* Registry Intake History */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <UserPlus className="w-6 h-6 text-primary" />
                                Unified Registry
                            </h3>
                            <Link href="/dashboard/operator/register" className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors">
                                <Plus className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-6">
                            <AnimatePresence>
                                {recentPatients.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-[1.75rem] group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all border border-transparent hover:border-primary/10 cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-sm text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            {p.name[0]}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-slate-900 truncate tracking-tight">{p.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {p.id.slice(-6).toUpperCase()}</p>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <button className="w-full mt-10 py-5 bg-slate-50 text-slate-400 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:bg-white hover:text-primary hover:border-primary/20 transition-all">
                            View Full Registry
                        </button>
                    </div>
                </div>
            </div>
            {/* Dispense Confirmation Modal */}
            <AnimatePresence>
                {selectedPrescription && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-10 border-b border-slate-100 bg-indigo-50/20">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-md mb-4 inline-block">Dispatch Protocol</span>
                                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none mb-2">Finalize Clinical Supply</h2>
                                <p className="text-slate-500 font-medium">Confirming inventory deduction and settlement for Order #{selectedPrescription.id.slice(-6).toUpperCase()}</p>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Payload</p>
                                    <div className="space-y-3">
                                        {selectedPrescription.medicines?.map((med: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                        <Box className="w-5 h-5 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900">{med.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.dosage} • {med.duration} days</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-900 uppercase">Unit Qty</p>
                                                    <p className="text-xl font-black text-indigo-600">{parseInt(med.duration) * (Object.values(med.timing).filter(Boolean).length)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-900/10">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Settlement Yield</p>
                                        <p className="text-4xl font-display font-black text-emerald-400 tracking-tight leading-none">₹20.00</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/5 shadow-2xl">
                                        <Wallet className="w-7 h-7" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedPrescription(null)}
                                    className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-slate-900 transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={() => handleDispense(selectedPrescription.id)}
                                    className="flex-[2] py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Authorize & Dispatch
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lab Confirmation Modal */}
            <AnimatePresence>
                {selectedLab && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-10 border-b border-slate-100 bg-rose-50/20">
                                <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md mb-4 inline-block">Clinical Asset Collection</span>
                                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none mb-2">Authorize Lab Tests</h2>
                                <p className="text-slate-500 font-medium">Confirming specimen collection for Patient: <span className="font-bold text-slate-900">{selectedLab.patientName}</span></p>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Vectors</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedLab.labTests?.filter((t: any) => t.status === 'pending').map((test: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <p className="font-black text-slate-900 text-xs uppercase tracking-widest truncate">{test.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-900/10">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fiscal Settlement</p>
                                        <p className="text-4xl font-display font-black text-emerald-400 tracking-tight leading-none">₹50.00</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/5 shadow-2xl">
                                        <History className="w-7 h-7" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedLab(null)}
                                    className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-slate-900 transition-all active:scale-95"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleLabComplete(selectedLab.id)}
                                    className="flex-[2] py-5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Authorize Collection
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
