'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    description?: string;
    trend?: {
        value: string;
        isUp: boolean;
    };
    loading?: boolean;
}

export default function MetricCard({
    label,
    value,
    icon: Icon,
    color,
    description,
    trend,
    loading
}: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
        >
            <div className="absolute -top-4 -right-4 bg-slate-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-4 rounded-2xl flex items-center justify-center transition-all duration-500", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all",
                            trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend.value}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    {loading ? (
                        <div className="h-10 w-24 bg-slate-50 animate-pulse rounded-xl" />
                    ) : (
                        <p className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
                    )}
                    {description && (
                        <p className="text-xs font-medium text-slate-400 pt-1">{description}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
