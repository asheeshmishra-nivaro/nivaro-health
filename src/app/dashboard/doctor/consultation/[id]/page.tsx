'use client';

import React, { useState, useEffect } from 'react';
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
    Video
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { finalizeConsultation, logActivity } from '@/lib/db';
import { Consultation, Patient, Medicine, InventoryItem } from '@/types';
import { toast } from 'sonner';
import VideoEngine from '@/components/dashboard/VideoEngine';

export default function ConsultationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, role } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [showVideo, setShowVideo] = useState(false);

    // Structured Clinical Data
    const [clinicalData, setClinicalData] = useState({
        symptoms: '',
        observations: '',
        diagnosis: '',
        advice: ''
    });
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    // Medicine Builder State
    const [currentMed, setCurrentMed] = useState<Medicine>({
        id: '',
        name: '',
        dosage: '',
        duration: '',
        timing: { morning: false, afternoon: false, evening: false, night: false }
    });

    const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cSnap = await getDoc(doc(db, 'consultations', id as string));
                if (cSnap.exists()) {
                    const cData = cSnap.data();
                    setConsultation({ ...cData, id: cSnap.id } as Consultation);

                    const [pSnap, iSnap, hSnap] = await Promise.all([
                        getDoc(doc(db, 'patients', cData.patientId)),
                        getDocs(collection(db, 'inventory', cData.nodeId, 'items')),
                        getDocs(query(
                            collection(db, 'consultations'),
                            where('patientId', '==', cData.patientId),
                            where('status', '==', 'completed'),
                            orderBy('createdAt', 'desc'),
                            limit(3)
                        ))
                    ]);

                    if (pSnap.exists()) setPatient(pSnap.data() as Patient);
                    setInventory(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
                    setPastConsultations(hSnap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation)));
                }
            } catch (error) {
                toast.error('Failed to load consultation data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const addMedicine = () => {
        if (!currentMed.name || !currentMed.dosage) {
            toast.warning('Please enter medicine name and dosage');
            return;
        }

        const item = inventory.find(i => i.name === currentMed.name);
        if (!item) {
            toast.error('Medicine not found in node inventory');
            return;
        }

        // Calculate suggested quantity
        // dosage (e.g. 1) * times per day * duration (days)
        const timesPerDay = Object.values(currentMed.timing).filter(t => t).length;
        const days = parseInt(currentMed.duration) || 1;
        const totalSuggested = timesPerDay * days;

        if (item.totalQuantity < totalSuggested) {
            toast.warning(`Low Stock: Only ${item.totalQuantity} units available. Required: ${totalSuggested}`);
        }

        // Auto-assign to medicine ID from inventory
        setMedicines([...medicines, { ...currentMed, id: item.id }]);

        // Reset form
        setCurrentMed({
            id: '',
            name: '',
            dosage: '',
            duration: '',
            timing: { morning: false, afternoon: false, evening: false, night: false }
        });
    };

    const removeMedicine = (idx: number) => {
        setMedicines(medicines.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!user || !consultation) return;
        if (!clinicalData.diagnosis) {
            toast.error('Diagnosis is required for clinical accountability');
            return;
        }
        setSubmitting(true);

        try {
            await finalizeConsultation(id as string, user.uid, '', {
                patientId: consultation.patientId,
                nodeId: consultation.nodeId,
                medicines,
                structuredData: clinicalData,
                status: 'pending' // Prescription remains pending until dispensed
            });

            await logActivity(
                user.uid,
                user.name,
                'DOCTOR',
                'CLINICAL_ENCOUNTER_COMPLETED',
                `Structured consultation completed for ${patient?.name}. Diagnosis: ${clinicalData.diagnosis}`,
                user.nodeId
            );

            toast.success('Clinical encounter finalized');
            router.push('/dashboard/doctor');
        } catch (error) {
            toast.error('Failed to finalize clinical record');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <DashboardLayout allowedRoles={['DOCTOR']}><Loader2 className="animate-spin m-auto" /></DashboardLayout>;

    return (
        <DashboardLayout allowedRoles={['DOCTOR']}>
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Patient & Vitals Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Patient Profile
                        </h3>
                        <div className="space-y-2 mb-6">
                            <p className="text-2xl font-display font-bold text-slate-900 tracking-tight">{patient?.name}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase">{patient?.age} Yrs</span>
                                <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase">{patient?.gender}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator Vitals Log</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">BP</p>
                                    <p className="font-mono font-bold text-slate-900">{consultation?.vitals.bp}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Sugar</p>
                                    <p className="font-mono font-bold text-slate-900">{consultation?.vitals.sugar}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Temp</p>
                                    <p className="font-mono font-bold text-slate-900">{consultation?.vitals.temp} °F</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">SpO2</p>
                                    <p className="font-mono font-bold text-slate-900">{consultation?.vitals.spo2}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Video Trigger */}
                        <div className="pt-6">
                            <button
                                onClick={() => setShowVideo(true)}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                            >
                                <Video className="w-5 h-5" />
                                Initiate Video Clinical Link
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl shadow-slate-200 group">
                        <History className="w-10 h-10 text-primary mb-6 transition-transform group-hover:scale-110" />
                        <h3 className="text-xl font-bold mb-2">Clinical Timeline</h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            {pastConsultations.length > 0
                                ? `Last encounter: ${pastConsultations[0].clinicalData?.diagnosis || 'Follow-up'}`
                                : 'First recorded encounter for this patient.'}
                        </p>

                        <div className="space-y-4 mb-6">
                            {pastConsultations.map((pc, idx) => (
                                <div key={pc.id} className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                                    <p className="font-bold text-primary mb-1">{pc.clinicalData?.diagnosis || 'General Consultation'}</p>
                                    <p className="opacity-50">{(pc.createdAt as any)?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
                            Full History
                        </button>
                    </div>
                </div>

                {/* Consultation Module */}
                <div className="lg:col-span-2 space-y-8 pb-12">
                    {/* Structured Findings Section */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 text-primary mb-2">
                            <Stethoscope className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Structured Clinical Observation</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Presenting Complaints/Symptoms</label>
                                    <textarea
                                        value={clinicalData.symptoms}
                                        onChange={(e) => setClinicalData({ ...clinicalData, symptoms: e.target.value })}
                                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                                        placeholder="Enter key symptoms..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Observations</label>
                                    <textarea
                                        value={clinicalData.observations}
                                        onChange={(e) => setClinicalData({ ...clinicalData, observations: e.target.value })}
                                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                                        placeholder="Physical findings..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Provisional Diagnosis *</label>
                                    <textarea
                                        required
                                        value={clinicalData.diagnosis}
                                        onChange={(e) => setClinicalData({ ...clinicalData, diagnosis: e.target.value })}
                                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm font-bold text-indigo-700"
                                        placeholder="Primary clinical diagnosis..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Patient Advice & Plan</label>
                                    <textarea
                                        value={clinicalData.advice}
                                        onChange={(e) => setClinicalData({ ...clinicalData, advice: e.target.value })}
                                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                                        placeholder="Lifestyle or follow-up plan..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Section */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 text-primary mb-6">
                            <Activity className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Clinical Prescription System</h3>
                        </div>

                        {/* Added Medicines List */}
                        <div className="space-y-3 mb-8">
                            {medicines.length === 0 && (
                                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <p className="text-slate-400 text-sm font-medium italic">No medicines added to prescription.</p>
                                </div>
                            )}
                            {medicines.map((med, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-primary shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{med.name} <span className="text-xs text-slate-400">• {med.dosage}</span></p>
                                        <div className="flex gap-4 items-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration: {med.duration}</p>
                                            <div className="flex gap-1">
                                                {med.timing.morning && <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">M</span>}
                                                {med.timing.afternoon && <span className="w-4 h-4 rounded bg-amber-100 text-amber-700 flex items-center justify-center text-[8px] font-bold">A</span>}
                                                {med.timing.evening && <span className="w-4 h-4 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-[8px] font-bold">E</span>}
                                                {med.timing.night && <span className="w-4 h-4 rounded bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold">N</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeMedicine(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 p-2 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Medicine Form */}
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicine & Node Inventory</label>
                                    <input
                                        list="inventory-list"
                                        value={currentMed.name}
                                        onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                                        placeholder="Search clinical stock..."
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                                    />
                                    <datalist id="inventory-list">
                                        {inventory.map(item => <option key={item.id} value={item.name}>{item.name} (Available: {item.totalQuantity})</option>)}
                                    </datalist>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Dosage</label>
                                    <input
                                        value={currentMed.dosage}
                                        onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                        placeholder="e.g. 1 Tablet / 5ml"
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Treatment Duration</label>
                                    <input
                                        value={currentMed.duration}
                                        onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                        placeholder="e.g. 5 Days / SOS"
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Timing Schedule</label>
                                    <div className="flex gap-2">
                                        {['morning', 'afternoon', 'evening', 'night'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setCurrentMed({
                                                    ...currentMed,
                                                    timing: { ...currentMed.timing, [t]: !currentMed.timing[t as keyof typeof currentMed.timing] }
                                                })}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border-2 transition-all ${currentMed.timing[t as keyof typeof currentMed.timing]
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                    }`}
                                            >
                                                {t.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={addMedicine}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 uppercase text-xs tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> Add Formulation
                            </button>
                        </div>
                    </div>

                    {/* Finalize Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full btn-primary py-6 rounded-[2rem] flex items-center justify-center gap-4 text-xl shadow-2xl shadow-primary/30 group"
                    >
                        {submitting ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                            <>
                                <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Save Clinical Record & Issue Prescription
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Immersive Video Layer */}
            {showVideo && consultation && (
                <VideoEngine
                    sessionId={id as string}
                    patientName={patient?.name || 'Patient'}
                    role="DOCTOR"
                    onEnd={() => setShowVideo(false)}
                />
            )}
        </DashboardLayout>
    );
}
