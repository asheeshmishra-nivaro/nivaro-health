'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Network, MapPin, Radio, Activity } from 'lucide-react';

export default function NodeInfrastructure() {
    return (
        <section id="nodes" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Core Innovation</h2>
                    <h3 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">Node-Based Healthcare Delivery</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed text-lg font-medium">
                        We are building the infrastructure for rural medicine, not just an app. Our model
                        transforms local operators into high-efficiency clinical nodes.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="grid sm:grid-cols-2 gap-8 lg:order-1 order-2">
                        {[
                            {
                                title: "Local Management",
                                desc: "Trained operators manage the node's physical infrastructure and patient intake.",
                                icon: MapPin
                            },
                            {
                                title: "Remote Consultation",
                                desc: "Licensed doctors consult with patients remotely via dedicated high-bandwidth nodes.",
                                icon: Radio
                            },
                            {
                                title: "Local Dispensing",
                                desc: "Medicines are dispensed directly at the node, ensuring immediate treatment availability.",
                                icon: Network
                            },
                            {
                                title: "Diagnostic Integration",
                                desc: "Core clinical vitals and diagnostic results are integrated into the central engine.",
                                icon: Activity
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="p-6 rounded-3xl bg-slate-50 border border-slate-100"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="lg:order-2 order-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-full opacity-20 dot-pattern" />

                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-12 text-center relative z-10">Infrastructure Deployment Model</h4>

                            <div className="flex flex-col items-center gap-1 relative z-10">
                                {[
                                    { label: "Village", sub: "Population Center", icon: "🏡" },
                                    { label: "Node", sub: "Infrastructure point", icon: "🏢" },
                                    { label: "Doctor", sub: "Clinical Center", icon: "🩺" },
                                    { label: "Prescription", sub: "Digital Record", icon: "📄" },
                                    { label: "Pharmacy", sub: "Local Dispensing", icon: "💊" }
                                ].map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center gap-6 w-full max-w-xs group">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl transition-all group-hover:bg-primary group-hover:border-primary">
                                                {step.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold">{step.label}</p>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{step.sub}</p>
                                            </div>
                                        </div>
                                        {i < 4 && (
                                            <div className="h-8 flex justify-start pl-6 items-center">
                                                <div className="w-px h-full bg-white/10" />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Architecture Badge */}
                            <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
                                <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Nivaro Scalable Arch v3.0 // Ready to Deploy
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
