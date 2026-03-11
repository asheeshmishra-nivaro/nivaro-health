'use client';

import React from 'react';
import {
  ClipboardCheck,
  Stethoscope,
  PackageSearch,
  Users,
  BarChart3,
  Network,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const infrastructure = [
  {
    title: "Telemedicine Consultations",
    desc: "Encrypted high-definition video channels connecting edge nodes to clinical specialist centers instantly.",
    icon: Network,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    title: "Patient Health Records",
    desc: "Unified longitudinal EHR storage for end-to-end clinical journey visibility and patient data sovereignty.",
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    title: "Diagnostics Integration",
    desc: "Plug-and-play diagnostic equipment integration with automated clinical results syncing to EHR.",
    icon: ClipboardCheck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  {
    title: "Medicine Inventory Tracking",
    desc: "Real-time, batch-level inventory intelligence protecting against leakage and operational stockouts.",
    icon: PackageSearch,
    color: "text-teal-600",
    bg: "bg-teal-50"
  },
  {
    title: "Node Monitoring",
    desc: "Comprehensive remote oversight of healthcare service points, personnel, and node-level metrics.",
    icon: Activity,
    color: "text-slate-700",
    bg: "bg-slate-100"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">The Ecosystem</h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6">A Structured Telemedicine Infrastructure</h3>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            The Nivaro engine provides a complete technological stack for high-efficiency clinical
            delivery at the village level.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {infrastructure.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 group ${idx === 3 || idx === 4 ? 'lg:col-span-1' : ''}`}
              style={{
                backgroundColor: 'white'
              }}
            >
              <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{item.title}</h4>
              <p className="text-slate-500 leading-relaxed font-medium text-sm">{item.desc}</p>
            </motion.div>
          ))}

          {/* Visual Linkage Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-900 text-white flex flex-col justify-center items-center text-center group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transform group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck className="w-40 h-40" />
            </div>
            <h4 className="text-2xl font-display font-bold mb-4 relative z-10">Unified Control Plane</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">Integrated modules communicating in real-time to remove operational friction.</p>
            <div className="px-4 py-1 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest relative z-10">System Status: Active</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
