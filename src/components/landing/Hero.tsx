'use client';

import React from 'react';
import { ArrowRight, Activity, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden hero-gradient">
            <div className="dot-pattern absolute inset-0 opacity-[0.4] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            Enterprise Healthcare Governance
                        </span>

                        <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 leading-tight mb-6">
                            Clinical Governance <br />
                            <span className="text-primary italic">at Infrastructure Scale</span>
                        </h1>

                        <p className="max-w-3xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                            Nivaro Health transforms fragmented healthcare into a structured, node-based
                            operating infrastructure. Eliminating consultation gaps, inventory leakage,
                            and traceability loss through centralized governance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Link href="/login" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                                Launch Infrastructure <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="#operational-model" className="btn-outline text-lg px-8 py-4">
                                System Philosophy
                            </Link>
                        </div>

                        {/* Problem Layer Tags */}
                        <div className="flex flex-wrap justify-center gap-3 mb-12">
                            {['Zero Leakage', 'Node Governance', 'Full Traceability', 'Clinical Accountability'].map((tag) => (
                                <span key={tag} className="px-4 py-1.5 rounded-full bg-slate-900 text-slate-100 text-[10px] font-bold uppercase tracking-widest">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Stats/Badge area */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {[
                            { icon: Activity, label: "Clinical Accountability", color: "text-blue-600" },
                            { icon: Database, label: "Node-Based Scalability", color: "text-teal-600" },
                            { icon: ShieldCheck, label: "Structured Governance", color: "text-indigo-600" },
                            { icon: Activity, label: "Inventory Lifecycle", color: "text-cyan-600" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3">
                                <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
