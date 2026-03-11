'use client';

import React from 'react';
import {
  ClipboardCheck,
  Stethoscope,
  PackageSearch,
  Users,
  BarChart3,
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';

const modules = [
  {
    title: "Clinical Governance Engine",
    description: "Standardized protocols for consultations, ensuring clinical accountability at every node.",
    icon: Stethoscope,
    color: "bg-blue-500"
  },
  {
    title: "Structured Prescription System",
    description: "Linked prescription flow that automatically interacts with inventory and patient history.",
    icon: ClipboardCheck,
    color: "bg-teal-500"
  },
  {
    title: "Inventory Lifecycle Intelligence",
    description: "Batch tracking, expiry warnings, and automated stock deduction per prescription.",
    icon: PackageSearch,
    color: "bg-indigo-500"
  },
  {
    title: "Multi-Node Administration",
    description: "Global control over healthcare service points, personnel, and resource allocation.",
    icon: Network,
    color: "bg-cyan-500"
  },
  {
    title: "Node-Based Operations",
    description: "Designed for localized efficiency while maintaining centralized governance standards.",
    icon: Users,
    color: "bg-slate-700"
  },
  {
    title: "Data & Analytics Engine",
    description: "Real-time heatmaps, performance metrics, and audit trails for all critical actions.",
    icon: BarChart3,
    color: "bg-blue-600"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Platform Modules</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Interface components designed for scale and clinical precision.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${module.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <module.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{module.title}</h3>
              <p className="text-slate-600 leading-relaxed">{module.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
