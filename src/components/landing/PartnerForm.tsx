'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Building2, User, Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { createPartnerRequest } from '@/lib/db';
import { toast } from 'sonner';

export default function PartnerForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        type: 'Healthcare Provider', // Default
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createPartnerRequest(formData);
            setSuccess(true);
            toast.success('Your partnership request has been submitted for review.');
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xl shadow-primary/5">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Request Received</h3>
                <p className="text-slate-600 mb-8">Thank you for your interest in Nivaro Health. Our team will review your application and contact you shortly.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-primary font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
                >
                    Submit another request <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-100 shadow-2xl shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10" />

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Partner with Nivaro</h3>
                <p className="text-slate-500 mb-8">Join our ecosystem of integrated healthcare nodes.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                    placeholder="e.g. Dr. Sameer Khan"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Organization</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                    placeholder="Hospital or Clinic Name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Official Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                    placeholder="contact@organization.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Entity Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                        >
                            <option>Healthcare Provider</option>
                            <option>Government Body</option>
                            <option>Pharmacy Network</option>
                            <option>Research Institute</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Message (Optional)</label>
                        <textarea
                            rows={3}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm resize-none"
                            placeholder="Tell us about your interest in Nivaro..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>Submit Partnership Request</span>
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                        Secure Submission Protocol Active
                    </p>
                </form>
            </div>
        </div>
    );
}
