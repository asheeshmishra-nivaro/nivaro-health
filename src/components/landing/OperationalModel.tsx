'use client';

import React from 'react';
import { UserCog, Stethoscope, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OperationalModel() {
    const steps = [
        { title: "Point of Entry", desc: "Patient visits village node", icon: "1" },
        { title: "Vitals Capture", desc: "Operator records core diagnostics", icon: "2" },
        { title: "Consultation", desc: "Specialist doctor joins remotely", icon: "3" },
        { title: "Structured RX", desc: "Digital prescription generated", icon: "4" },
        { title: "Managed Dispense", desc: "Medicines dispensed at node", icon: "5" },
        { title: "Clinical Follow-up", desc: "Automated followup scheduled", icon: "6" }
    ];

    return (
        <section id="operational-model" className="py-24 bg-slate-50 text-slate-900 border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Operations</h2>
                    <h3 className="text-4xl lg:text-5xl font-display font-bold mb-6 tracking-tight">How Nivaro Operates</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                        A seamless, structured clinical journey designed for efficiency at the edge.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-[2.4rem] left-0 w-full h-px bg-slate-200 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-y-12 gap-x-8">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative z-10 text-center lg:text-left group"
                            >
                                <div className="flex flex-col items-center lg:items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                                        {step.icon}
                                    </div>
                                    <h4 className="font-bold text-lg mb-2 text-slate-900 leading-tight pr-4">{step.title}</h4>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Narrative Proof Points */}
                <div className="mt-32 grid lg:grid-cols-2 gap-8">
                    <div className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Operational Excellence</h4>
                        <p className="text-2xl font-display font-bold text-slate-900 leading-snug">
                            "Infrastructure that enforces <span className="text-primary tracking-tight">Clinical Standards</span> at every point of care."
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Consultation", val: "12 Min" },
                            { label: "Wait Time", val: " < 15 Min" },
                            { label: "Traceability", val: "100%" },
                            { label: "Accuracy", val: "Enterprise" }
                        ].map((stat, i) => (
                            <div key={i} className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col justify-center">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl font-bold">{stat.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
