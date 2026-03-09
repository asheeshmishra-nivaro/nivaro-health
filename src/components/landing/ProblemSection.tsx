'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ZapOff, Fingerprint, TrendingDown, Users, Activity } from 'lucide-react';

const challenges = [
    {
        title: "Doctor Shortage",
        desc: "India has approximately one government doctor for every 10,000 people in rural areas, leading to critical care delays.",
        icon: Users,
        color: "text-red-600",
        bg: "bg-red-50"
    },
    {
        title: "Inventory Leakage",
        desc: "Unmonitored supply chains result in 30%+ inventory loss through expiry and unaccounted stock distribution at the edge.",
        icon: ZapOff,
        color: "text-orange-600",
        bg: "bg-orange-50"
    },
    {
        title: "Diagnostic Inaccessibility",
        desc: "Patients travel 50km+ for basic blood tests. Infrastructure gaps prevent timely clinical screening and monitoring.",
        icon: Activity,
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    {
        title: "Fragmented Medical Records",
        desc: "Zero longitudinal patient history prevents clinical continuity, leading to redundant treatments and diagnostic errors.",
        icon: Fingerprint,
        color: "text-slate-700",
        bg: "bg-slate-100"
    }
];

export default function ProblemSection() {
    return (
        <section id="problem" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-5">
                        <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Infrastructure Narrative</h2>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-8 leading-tight lg:leading-[1.15]">
                            India's Rural Healthcare
                            <span className="text-primary tracking-tight block sm:inline"> Infrastructure Gap</span>
                        </h3>

                        <div className="bg-slate-50 border-l-4 border-primary p-8 rounded-r-2xl mb-10">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Critical Insight</p>
                            <p className="text-2xl font-display font-medium text-slate-800 leading-snug">
                                "India has one government doctor for <span className="text-primary font-bold">~10,000 people</span> in rural areas."
                            </p>
                        </div>

                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                            This systemic failure isn't just a shortage of manpower; it's a lack of structured
                            operating infrastructure that prevents efficient clinical delivery at the village level.
                        </p>
                    </div>

                    <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
                        {challenges.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
