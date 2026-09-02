'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Stethoscope, Briefcase } from 'lucide-react';

const founders = [
    {
        name: "Asheesh Mishra",
        role: "Founder & Chief Executive",
        photo: "/team/asheesh_mishra.jpg",
        bio: "B.Tech Chemical Technology, HBTU Kanpur; President, Business Club HBTU & Vice-President at AutoRob Club. Participated in Startup World Cup at AIC BIMTECH and pitched at ILBS New Delhi under Walk for Life Event.",
        icon: Briefcase,
        highlights: ["HBTU Kanpur", "Startup World Cup", "ILBS New Delhi"]
    },
    {
        name: "Juhi Singh",
        role: "Co-Founder & Head of Clinical Governance",
        photo: "/team/juhi_singh.jpg",
        bio: "Pursuing MBBS from UP Government college. Owns clinical governance, physician onboarding workflows, medical protocols, and regulatory compliance standards across all rural nodes.",
        icon: Stethoscope,
        highlights: ["UP Govt Medical College", "Clinical Governance", "DPDP Compliance"]
    }
];

export default function TeamSection() {
    return (
        <section id="about" className="py-20 sm:py-28 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14 sm:mb-20">
                    <h2 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em] mb-3">Leadership</h2>
                    <h3 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">Founding Team</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed text-base sm:text-xl font-medium">
                        Combining technological innovation with direct clinical expertise to transform rural healthcare infrastructure.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                    {founders.map((founder, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 sm:p-8 lg:p-10 rounded-[2.5rem] bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                {/* Founder High-Resolution Portrait Photo */}
                                <div className="w-full h-80 sm:h-96 relative rounded-[1.8rem] overflow-hidden mb-8 border border-slate-200/80 shadow-md group-hover:shadow-lg transition-all bg-slate-200">
                                    <Image
                                        src={founder.photo}
                                        alt={founder.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                        priority
                                        quality={95}
                                    />
                                    <div className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md text-primary flex items-center justify-center shadow-lg border border-white">
                                        <founder.icon className="w-6 h-6" />
                                    </div>
                                </div>

                                <h4 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2 tracking-tight">{founder.name}</h4>
                                <div className="mb-6">
                                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs sm:text-sm font-bold text-primary uppercase tracking-wide">
                                        {founder.role}
                                    </span>
                                </div>
                                <p className="text-base sm:text-lg text-slate-700 leading-relaxed sm:leading-relaxed mb-8 font-normal">
                                    {founder.bio}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2.5 pt-6 border-t border-slate-200">
                                {founder.highlights.map((tag, i) => (
                                    <span key={i} className="px-3.5 py-1.5 bg-white border border-slate-200/80 shadow-2xs rounded-full text-xs font-semibold text-slate-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
