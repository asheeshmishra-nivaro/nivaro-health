'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative min-h-screen lg:min-h-0 py-10 sm:py-12 lg:py-20 overflow-visible bg-white">
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-xl"
                    >
                        <h1 className="text-3xl sm:text-4xl lg:text-7xl font-display font-extrabold text-slate-900 leading-tight lg:leading-[1.05] mb-6 lg:mb-8">
                            The Operating System
                            <span className="text-primary tracking-tight block sm:inline italic sm:not-italic"> for Rural Healthcare</span>
                            <span className="text-slate-400 italic block"> Infrastructure</span>
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 mb-6 lg:mb-10 leading-relaxed font-medium">
                            Nivaro Health connects rural healthcare operators with licensed doctors
                            through a node-based telemedicine platform that manages consultations,
                            prescriptions, diagnostics, and medicine distribution in a unified system.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link href="/login" className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg shadow-xl shadow-primary/20">
                                Access Healthcare System <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="#features" className="w-full sm:w-auto btn-outline flex items-center justify-center px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg">
                                Explore Platform
                            </Link>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-3 text-center sm:text-left">
                            Currently piloting in Kanpur, Uttar Pradesh — request early access
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full max-w-full flex flex-col gap-4 mt-6 lg:mt-0"
                    >
                        <div className="bg-slate-50 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />

                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">System Architecture</h4>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pre-Pilot Architecture</div>
                                </div>
                            </div>

                            {/* Card Grid: 1 col on mobile, 2 col on sm+ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {[
                                    { label: "Patient Entry", sub: "Edge Capture", icon: "👤", color: "bg-white" },
                                    { label: "Operator Node", sub: "Clinical Vitals", icon: "🏢", color: "bg-blue-50/50" },
                                    { label: "Doctor Consult", sub: "Remote Specialization", icon: "🩺", color: "bg-primary text-white" },
                                    { label: "Prescription", sub: "Engineered RX", icon: "📄", color: "bg-blue-50/50" },
                                    { label: "Diagnostics", sub: "Synced Results", icon: "🔬", color: "bg-white" },
                                    { label: "Distribution", sub: "Verified Handover", icon: "💊", color: "bg-white" }
                                ].map((step, i) => (
                                    <div
                                        key={i}
                                        className={`p-5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${step.color} relative overflow-hidden group/card`}
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/card:opacity-10 transition-opacity">
                                            <div className="w-12 h-12 rounded-full border border-current" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-slate-400/10">
                                                {step.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">{step.label}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{step.sub}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

