'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    UserPlus,
    Activity,
    ChevronRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    User,
    Stethoscope,
    ShieldCheck,
    Dna,
    Zap,
    Heart,
    Thermometer,
    Droplets,
    Smartphone,
    MapPin,
    ArrowRight,
    CircleDot,
    Star,
    Phone,
    Search,
    HeartPulse
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerPatient, initiateConsultation, logActivity, getDoctors, createVideoSession } from '@/lib/db';
import { User as UserType, VideoSession } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import VideoEngine from '@/components/dashboard/VideoEngine';

export default function RegisterPatientPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<UserType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
    const [registeredPatientName, setRegisteredPatientName] = useState('');
    const { user, role } = useAuth();
    const router = useRouter();

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doctor.specialty && doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        contact: '',
        address: '',
        bp: '',
        sugar: '',
        temp: '',
        spo2: '',
        pulse: '',
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            const doctorsList = await getDoctors('online');
            setDoctors(doctorsList);
        };
        fetchDoctors();
    }, []);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!user || !selectedDoctorId) {
            toast.error('Clinical Assignment Required');
            return;
        }
        const toastId = toast.loading('Synchronizing patient telemetry...');
        setLoading(true);

        try {
            // 1. Register Patient
            const patientId = await registerPatient({
                name: formData.name,
                age: parseInt(formData.age),
                gender: formData.gender as any,
                contact: formData.contact,
                address: formData.address,
            }, user.uid, user.nodeId);

            // 2. Capture Vitals and Initiate Consultation
            const consultationId = await initiateConsultation(patientId, formData.name, user.uid, {
                bp: formData.bp,
                sugar: formData.sugar,
                temp: formData.temp,
                spo2: formData.spo2,
                pulse: formData.pulse,
                capturedAt: new Date()
            }, user.nodeId, selectedDoctorId);

            // 3. Create immediate Video Session
            const sessionId = await createVideoSession(
                consultationId,
                user.nodeId,
                selectedDoctorId,
                user.uid
            );

            // 4. Log Activity
            await logActivity(
                user.uid,
                user.name,
                role!,
                'PATIENT_REGISTRATION',
                `Registered patient ${formData.name} and initiated video session with doctor ${doctors.find(d => d.uid === selectedDoctorId)?.name}`,
                user.nodeId
            );

            setRegisteredPatientName(formData.name);
            setActiveSession({
                id: sessionId,
                consultationId: consultationId,
                nodeId: user.nodeId,
                doctorId: selectedDoctorId,
                operatorId: user.uid,
                status: 'requested'
            });

            toast.success('Clinical uplink established. Syncing...', { id: toastId });
        } catch (error) {
            console.error('Registration failed:', error);
            toast.error('Uplink failed. Check protocol stability.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Identity', icon: User },
        { id: 2, title: 'Telemetry', icon: Activity },
        { id: 3, title: 'Assignment', icon: Stethoscope }
    ];

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="max-w-5xl mx-auto py-10">
                {/* Tactical Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => step === 1 ? router.back() : handleBack()}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-md">Admissions Unit</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Intake Protocol {step}/3</span>
                            </div>
                            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Patient Registry Enrollment</h1>
                        </div>
                    </div>

                    {/* Industrial Step Indicator */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                        {steps.map((s) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-500",
                                    step === s.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400"
                                )}
                            >
                                <s.icon className={cn("w-4 h-4", step === s.id ? "text-white" : "text-slate-300")} />
                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{s.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Main Processing Unit */}
                    <div className="lg:col-span-8">
                        <motion.div
                            layout
                            className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 min-h-[600px] flex flex-col relative overflow-hidden"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10 flex-1 flex flex-col relative z-10"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                                                <Dna className="w-6 h-6 text-primary" />
                                                Biological Identity
                                            </h3>
                                            <p className="text-sm text-slate-400 font-medium">Verify patient primary telemetry and contact authority.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Legal Designation</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Full Name"
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-slate-900"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Comm Link (Contact)</label>
                                                <div className="relative group">
                                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="tel"
                                                        value={formData.contact}
                                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                        placeholder="Telephone ID"
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-slate-900"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Age Cycle</label>
                                                <input
                                                    type="number"
                                                    value={formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                    placeholder="Standard Earth Years"
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-slate-900"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Gender Taxonomy</label>
                                                <select
                                                    value={formData.gender}
                                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23CBD5E1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[right_1.5rem_center] bg-no-repeat"
                                                >
                                                    <option value="male">MALE_CORE</option>
                                                    <option value="female">FEMALE_CORE</option>
                                                    <option value="other">NON_BINARY</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Spatial Coordinates (Address)</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-5 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    rows={3}
                                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-slate-900 resize-none"
                                                    placeholder="Residential uplink location..."
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-10">
                                            <button
                                                onClick={handleNext}
                                                disabled={!formData.name || !formData.age || !formData.contact}
                                                className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                            >
                                                Initialize Telemetry <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10 flex-1 flex flex-col relative z-10"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                                                <Zap className="w-6 h-6 text-primary" />
                                                Clinical Telemetry
                                            </h3>
                                            <p className="text-sm text-slate-400 font-medium">Capture real-time vital metrics for clinical baseline alignment.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all outline-none focus-within:ring-2 focus-within:ring-primary/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                                        <Heart className="w-4 h-4" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Pressure</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.bp}
                                                    onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                                                    placeholder="120/80"
                                                    className="w-full bg-transparent border-none outline-none font-black text-2xl text-slate-900 placeholder:text-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">SYSTOLIC / DIASTOLIC (mmHg)</p>
                                            </div>

                                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all outline-none focus-within:ring-2 focus-within:ring-primary/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                                        <Zap className="w-4 h-4" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serum Glucose</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.sugar}
                                                    onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                                                    placeholder="110 mg/dL"
                                                    className="w-full bg-transparent border-none outline-none font-black text-2xl text-slate-900 placeholder:text-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">POST-PRANDIAL MG/DL</p>
                                            </div>

                                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all outline-none focus-within:ring-2 focus-within:ring-primary/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                                        <Thermometer className="w-4 h-4" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thermal Core</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.temp}
                                                    onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                                                    placeholder="98.6 F"
                                                    className="w-full bg-transparent border-none outline-none font-black text-2xl text-slate-900 placeholder:text-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">FAHRENHEIT (°F)</p>
                                            </div>

                                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all outline-none focus-within:ring-2 focus-within:ring-primary/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                                        <Droplets className="w-4 h-4" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O2 Saturation</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.spo2}
                                                    onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                                                    placeholder="98%"
                                                    className="w-full bg-transparent border-none outline-none font-black text-2xl text-slate-900 placeholder:text-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">OXYGEN PERIPHERAL (%)</p>
                                            </div>

                                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all outline-none focus-within:ring-2 focus-within:ring-primary/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                                        <HeartPulse className="w-4 h-4" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pulse Rate</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.pulse}
                                                    onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                                                    placeholder="72 BPM"
                                                    className="w-full bg-transparent border-none outline-none font-black text-2xl text-slate-900 placeholder:text-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">BEATS PER MINUTE (BPM)</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-10 flex gap-6">
                                            <button
                                                onClick={handleBack}
                                                className="w-20 h-20 rounded-3xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all font-black uppercase text-[10px]"
                                            >
                                                <ArrowLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                className="flex-1 py-5 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                            >
                                                Clinical Assignment <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10 flex-1 flex flex-col relative z-10"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                                    Clinical Governance Assignment
                                                </h3>
                                                <p className="text-sm text-slate-400 font-medium">Assign patient to an active clinical authority for consultation.</p>
                                            </div>

                                            <div className="relative group w-full md:w-80">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Dr. or Specialty..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-12 pr-6 text-xs font-black placeholder:text-slate-400 focus:border-primary focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-8 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                                            {filteredDoctors.length === 0 ? (
                                                <div className="py-20 text-center space-y-4">
                                                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center m-auto border border-slate-100 italic font-black text-slate-200 text-3xl">!</div>
                                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No clinical authority matches your search.</p>
                                                </div>
                                            ) : (
                                                filteredDoctors.map((doctor) => (
                                                    <motion.div
                                                        key={doctor.uid}
                                                        layout
                                                        onClick={() => setSelectedDoctorId(doctor.uid)}
                                                        className={cn(
                                                            "p-10 rounded-[3rem] border-2 transition-all cursor-pointer relative overflow-hidden group",
                                                            selectedDoctorId === doctor.uid
                                                                ? 'border-primary bg-primary/[0.02] shadow-2xl shadow-primary/10'
                                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                                        )}
                                                    >
                                                        {selectedDoctorId === doctor.uid && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary shadow-[4px_0_24px_rgba(79,70,229,0.3)]" />
                                                        )}

                                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                                            {/* Avatar Section */}
                                                            <div className="relative">
                                                                <div className={cn(
                                                                    "w-24 h-24 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-xl transition-all duration-500",
                                                                    selectedDoctorId === doctor.uid ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400"
                                                                )}>
                                                                    {doctor.name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
                                                            </div>

                                                            {/* Details Section */}
                                                            <div className="flex-1 space-y-6">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-3">
                                                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{doctor.name}</h4>
                                                                        {selectedDoctorId === doctor.uid && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                                    </div>
                                                                    <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">{doctor.specialty || 'General Medicine'}</p>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Online</span>
                                                                    </div>
                                                                </div>

                                                                {/* Grid Specs */}
                                                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 pt-6 border-t border-slate-100">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">License No</p>
                                                                        <p className="font-bold text-slate-700 text-sm tracking-tight">{doctor.licenseNo || 'MC-2026-9921'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Degree</p>
                                                                        <p className="font-bold text-slate-700 text-sm tracking-tight">{doctor.degree || 'MD, General Medicine'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                                                                        <p className="font-bold text-slate-700 text-sm tracking-tight">{doctor.experience || '12 Years'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hospital</p>
                                                                        <p className="font-bold text-slate-700 text-sm tracking-tight">{doctor.hospital || 'City General Hospital'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-bold text-slate-700 text-sm">{doctor.rating || '4.8'}</span>
                                                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Response</p>
                                                                        <p className="font-bold text-slate-700 text-sm tracking-tight">~{doctor.responseTime || '5 mins'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Selection Overlay */}
                                                        {selectedDoctorId !== doctor.uid && (
                                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-primary/[0.01] transition-all" />
                                                        )}
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>

                                        <div className="mt-auto pt-10 flex gap-6">
                                            <button
                                                onClick={handleBack}
                                                className="px-8 h-20 rounded-3xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all font-black uppercase text-[10px] gap-3"
                                            >
                                                <ArrowLeft className="w-6 h-6" />
                                                Back to Vitals
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={loading || !selectedDoctorId}
                                                className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                    <>
                                                        <Phone className="w-5 h-5" />
                                                        Start Session Now
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Industrial Summary Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* ... existing sidebar ... */}
                        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Registry Manifest</h3>

                                <div className="space-y-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-10 bg-primary/30 rounded-full" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                                            <p className="text-lg font-black tracking-tight">{formData.name || 'PENDING_IDENTITY'}</p>
                                            <p className="text-[10px] font-bold text-slate-500">{formData.age ? `${formData.age} YEARS` : ''} {formData.gender.toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">BP</p>
                                            <p className="font-black text-sm">{formData.bp || '---'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Pulse</p>
                                            <p className="font-black text-sm">{formData.pulse || '---'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Uplink Parameters</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", formData.name ? "bg-emerald-500" : "bg-slate-700")} />
                                                Identity Authorization
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", formData.bp ? "bg-emerald-500" : "bg-slate-700")} />
                                                Telemetry Verification
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", selectedDoctorId ? "bg-emerald-500" : "bg-slate-700")} />
                                                Clinical Allocation
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Secure Intake
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Enrollment commits patient data to the sector-wide clinical ledger. Verification is finalized by the consulting authority.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Consultation Overlay */}
            <AnimatePresence>
                {activeSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
                    >
                        <div className="w-full h-full max-w-7xl relative">
                            <VideoEngine
                                sessionId={activeSession.id!}
                                patientName={registeredPatientName}
                                role={role as 'OPERATOR'}
                                mode="overlay"
                                onEnd={() => {
                                    setActiveSession(null);
                                    router.push('/dashboard/operator');
                                }}
                            />

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => {
                                    setActiveSession(null);
                                    router.push('/dashboard/operator');
                                }}
                                className="absolute top-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Exit Session
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
