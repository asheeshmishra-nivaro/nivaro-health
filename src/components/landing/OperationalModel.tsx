'use client';

import React from 'react';
import { UserCog, Stethoscope, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OperationalModel() {
    const steps = [
        { title: "Patient", desc: "Edge-node entry", icon: "01" },
        { title: "Operator", desc: "Vitals & Screening", icon: "02" },
        { title: "Doctor", desc: "Clinical Assessment", icon: "03" },
        { title: "Prescription", desc: "Structured Advice", icon: "04" },
        { title: "Inventory", desc: "Automatic Deduction", icon: "05" },
        { title: "Audit Log", desc: "Governance Trace", icon: "06" }
    ];

    return (
        <section id="operational-model" className="py-24 bg-slate-900 text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-display font-bold mb-4">The Operational Lifecycle</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">Integrated infrastructure that ensures every clinical action is logged, validated, and accounted for.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-20">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 text-center relative"
                        >
                            {idx < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-slate-700 z-0" />
                            )}
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                                {step.icon}
                            </div>
                            <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                    {/* Problem Layer */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-red-500/5 p-8 rounded-3xl border border-red-500/10"
                    >
                        <h3 className="text-xl font-bold mb-6 text-red-400">Structural Gaps Resolved</h3>
                        <div className="space-y-4">
                            {[
                                "Fragmented consultation data",
                                "Zero prescription traceability",
                                "Opaque inventory leakage",
                                "Undefined accountability loops"
                            ].map((text) => (
                                <div key={text} className="flex items-center gap-3 text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <span className="text-sm font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Scalability Layer */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-primary/5 p-8 rounded-3xl border border-primary/10"
                    >
                        <h3 className="text-xl font-bold mb-6 text-primary">Governance Architecture</h3>
                        <div className="space-y-4">
                            {[
                                "Multi-node Scalable Governance",
                                "Real-time Node Health Scoring",
                                "Automated Clinical Audit Trails",
                                "Distributed Operations, Central Control"
                            ].map((text) => (
                                <div key={text} className="flex items-center gap-3 text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-sm font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
