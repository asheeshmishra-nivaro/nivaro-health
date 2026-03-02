'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    UserPlus,
    Activity,
    ChevronRight,
    ArrowLeft,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerPatient, initiateConsultation, logActivity } from '@/lib/db';
import { toast } from 'sonner';

export default function RegisterPatientPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { user, role } = useAuth();
    const router = useRouter();

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
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!user) return;
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
            await initiateConsultation(patientId, formData.name, user.uid, {
                bp: formData.bp,
                sugar: formData.sugar,
                temp: formData.temp,
                spo2: formData.spo2,
                capturedAt: new Date()
            }, user.nodeId);

            // 3. Log Activity
            await logActivity(
                user.uid,
                user.name,
                role!,
                'PATIENT_REGISTRATION',
                `Registered patient ${formData.name} and initiated consultation`,
                user.nodeId
            );

            toast.success('Patient registered and queued for consultation');
            router.push('/dashboard/operator');
        } catch (error) {
            console.error('Registration failed:', error);
            toast.error('Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout allowedRoles={['OPERATOR']}>
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 flex items-center gap-4">
                    <button
                        onClick={() => step === 1 ? router.back() : handleBack()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Patient Intake</h1>
                        <p className="text-slate-500">Capture details and vitals to initiate clinical governance.</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex gap-4 mb-8">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>

                <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <UserPlus className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Registration Details</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter patient name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        placeholder="10-digit number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        placeholder="Years"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Residential Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 resize-none"
                                    placeholder="Street, Node, Area..."
                                />
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!formData.name || !formData.age || !formData.contact}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg"
                            >
                                Proceed to Vitals <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Activity className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Clinical Vitals Capture</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Blood Pressure (BP)</label>
                                    <input
                                        type="text"
                                        value={formData.bp}
                                        onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                                        placeholder="e.g. 120/80"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Blood Sugar</label>
                                    <input
                                        type="text"
                                        value={formData.sugar}
                                        onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                                        placeholder="e.g. 110 mg/dL"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Temperature</label>
                                    <input
                                        type="text"
                                        value={formData.temp}
                                        onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                                        placeholder="e.g. 98.6 F"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">SpO2 (%)</label>
                                    <input
                                        type="text"
                                        value={formData.spo2}
                                        onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                                        placeholder="e.g. 98"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2 text-lg"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Complete Registration
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
