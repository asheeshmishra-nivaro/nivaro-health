'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Activity, Search } from 'lucide-react';

export default function GovernanceSection() {
    return (
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Trust Infrastructure</h2>
                        <h3 className="text-4xl lg:text-5xl font-display font-bold mb-8 leading-tight">
                            Clinical Governance Built <br />
                            <span className="text-slate-400">Into Infrastructure</span>
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
                            We ensure healthcare trust through automated clinical accountability and
                            end-to-end operational traceability.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-8">
                            {[
                                {
                                    title: "Doctor Verification",
                                    desc: "Strict credentialing and real-time verification of all consulting specialists.",
                                    icon: ShieldCheck
                                },
                                {
                                    title: "Encrypted Consultation",
                                    desc: "HIPAA-compliant high-bandwidth channels protecting clinical integrity.",
                                    icon: Lock
                                },
                                {
                                    title: "Prescription Traceability",
                                    desc: "Every digital prescription is linked to a unique consultation ID and node transaction.",
                                    icon: Activity
                                },
                                {
                                    title: "Inventory Audit System",
                                    desc: "Automated reconciliation of stock distribution against generated clinical records.",
                                    icon: Search
                                }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-primary">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold mb-2 text-slate-100">{item.title}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-bold">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visual Security Element */}
                    <div className="relative">
                        <div className="relative aspect-square max-w-md mx-auto">
                            {/* Circular ripples */}
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-ping" />
                            <div className="absolute inset-4 border border-white/10 rounded-full" />
                            <div className="absolute inset-12 border border-white/20 rounded-full" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 rounded-3xl bg-primary shadow-[0_0_50px_rgba(var(--primary),0.3)] flex items-center justify-center p-8">
                                    <ShieldCheck className="w-full h-full text-white opacity-90" />
                                </div>
                            </div>

                            {/* Data tags floating around */}
                            {[
                                "AES-256", "HIPAA Ready", "Clinical Log", "2FA"
                            ].map((label, idx) => (
                                <div
                                    key={label}
                                    className={`absolute px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400`}
                                    style={{
                                        top: `${15 + idx * 20}%`,
                                        left: idx % 2 === 0 ? '0%' : '80%'
                                    }}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
