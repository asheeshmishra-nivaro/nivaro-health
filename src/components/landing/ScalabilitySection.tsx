'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe } from 'lucide-react';

export default function ScalabilitySection() {
    return (
        <section className="py-24 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Scale Infrastructure</h2>
                    <h3 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-6">Network Growth & Resilience</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed text-lg">
                        Built as a modular infrastructure, Nivaro scales across geographies with near-zero latency in clinical data distribution.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "RAPID DEPLOYMENT",
                            desc: "Deploy new healthcare nodes in less than 48 hours with standardized infrastructure kits.",
                            icon: Globe,
                            stat: "48H"
                        },
                        {
                            title: "DATA AGGREGATION",
                            desc: "Real-time population health insights aggregated centrally across thousands of medical points.",
                            icon: BarChart3,
                            stat: "Real-time"
                        },
                        {
                            title: "ECONOMIC EFFICIENCY",
                            desc: "Optimized resource allocation reduces operational costs by up to 40% per node.",
                            icon: TrendingUp,
                            stat: "40%"
                        }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                            <div className="text-primary font-display font-bold text-3xl mb-4">{item.stat}</div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <item.icon className="w-3.5 h-3.5" />
                                {item.title}
                            </h4>
                            <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
