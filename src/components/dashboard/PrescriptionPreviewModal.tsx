'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Printer,
    ShieldCheck,
    Stethoscope,
    Calendar,
    User,
    MapPin,
    Phone,
    Mail,
    FileText,
    History,
    Activity
} from 'lucide-react';
import { Medicine, Patient, Consultation } from '@/types';
import { cn } from '@/lib/utils';

interface PrescriptionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patient: Patient | null;
    doctorName: string;
    medicines: Medicine[];
    clinicalNotes: string;
    diagnosis: string;
    labTests: string[];
    nodeId: string;
}

export default function PrescriptionPreviewModal({
    isOpen,
    onClose,
    onConfirm,
    patient,
    doctorName,
    medicines,
    clinicalNotes,
    diagnosis,
    labTests,
    nodeId
}: PrescriptionPreviewModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header Controls */}
                    <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Prescription Preview</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Review clinical dispatch protocol before finalization</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Preview Area (Letterhead Style) */}
                    <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 custom-scrollbar">
                        <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-[2rem] overflow-hidden border border-slate-200">
                            {/* Letterhead */}
                            <div className="p-10 border-b-4 border-indigo-600 bg-slate-900 text-white flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter mb-2">NIVARO<span className="text-indigo-400">HEALTH</span></h1>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Advanced Telemedicine OS</p>
                                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Node Cluster: {nodeId.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase text-indigo-400">Clinical Dispatch</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">Ref: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Patient & Doctor Intel */}
                            <div className="p-10 grid grid-cols-2 gap-10 border-b border-slate-100">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Intel</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase">{patient?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Age: {patient?.age} • Gender: {patient?.gender}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Contact: {patient?.contact}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-right">Consulting Physician</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase">Dr. {doctorName}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Nivaro Certified Provider</p>
                                        <p className="text-[10px] font-bold text-indigo-500 font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Clinical Context */}
                            <div className="p-10 border-b border-slate-100 bg-slate-50/30">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Provisional Diagnosis</h4>
                                        </div>
                                        <p className="text-xs font-black text-slate-700 uppercase pl-5 border-l border-indigo-200">{diagnosis}</p>
                                    </div>

                                    {clinicalNotes && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Clinical Observations</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium pl-5">{clinicalNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prescription Rx */}
                            <div className="p-10 flex flex-col min-h-[400px]">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="text-2xl font-black text-indigo-600 italic">Rx</div>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                <div className="space-y-6 flex-1">
                                    {medicines.map((med, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-4 last:border-none">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-300">#{idx + 1}</span>
                                                <p className="text-xs font-black text-slate-900 uppercase">{med.name}</p>
                                                <div className="h-px flex-1 bg-slate-50 border-dashed border-b" />
                                                <p className="text-xs font-black text-indigo-600">{med.dosage}</p>
                                            </div>
                                            <div className="flex items-center gap-8 pl-8 mt-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Course: {med.duration}</p>
                                                <div className="flex items-center gap-3">
                                                    {(['morning', 'afternoon', 'evening', 'night'] as const).map(t => (
                                                        <div
                                                            key={t}
                                                            className={cn(
                                                                "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                                                med.timing[t] ? "bg-indigo-100 text-indigo-600" : "text-slate-200"
                                                            )}
                                                        >
                                                            {t}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {medicines.length === 0 && (
                                        <p className="text-[10px] text-slate-300 italic font-medium uppercase tracking-widest text-center py-10">No medications assigned for this protocol.</p>
                                    )}
                                </div>

                                {labTests.length > 0 && (
                                    <div className="mt-10 pt-10 border-t border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Diagnostic Recommendations</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {labTests.map(test => (
                                                <span key={test} className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-600 rounded-full uppercase tracking-widest">
                                                    {test}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Signoff */}
                            <div className="p-10 bg-slate-50 flex justify-between items-end border-t border-slate-100">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated via</p>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Nivaro Digital Signature</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="w-32 h-px bg-slate-300 mb-2 ml-auto" />
                                    <p className="text-[9px] font-black text-slate-900 uppercase">Dr. {doctorName}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Consulting Provider</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[300px] leading-relaxed">
                            Ensuring document integrity. Once confirmed, this protocol will be committed to the clinical registry.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Back to Console
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Confirm & Finalize
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function FlaskConical({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10 2v7.5" />
            <path d="M14 2v7.5" />
            <path d="M8.5 2h7" />
            <path d="M14 11.5c.6 0 1 .4 1 1s-.4 1-1 1h-4c-.6 0-1-.4-1-1s.4-1 1-1h4" />
            <path d="M9 22h6c1.1 0 2-.9 2-2 0-.3 0-.5-.1-.8l-2.4-7.2c-.3-.9-1.2-1.5-2.1-1.5h-1.8c-.9 0-1.8.6-2.1 1.5l-2.4 7.2c-.1.3-.1.5-.1.8 0 1.1.9 2 2 2z" />
        </svg>
    );
}
