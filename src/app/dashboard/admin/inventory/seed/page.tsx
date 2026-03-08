'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { seedInventory } from '@/lib/db';
import { Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedInventoryPage() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            await seedInventory('TEST-NODE-01'); // Standard test node
            setDone(true);
            toast.success('Inventory seeded successfully!');
        } catch (error: any) {
            console.error('Seeding error:', error);
            toast.error(error.message || 'Failed to seed inventory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="max-w-2xl mx-auto py-20">
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 text-center text-slate-800">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Package className="w-12 h-12 text-primary" />
                    </div>

                    <h1 className="text-3xl font-display font-black mb-4">Inventory Data Genesis</h1>
                    <p className="text-slate-500 mb-10 leading-relaxed">
                        This utility will populate your clinical inventory with 20 essential medicines
                        including Paracetamol, Metformin, Amlodipine, and more, categorized for clinical testing.
                    </p>

                    {done ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col items-center gap-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            <p className="text-emerald-700 font-bold">20 Clinical Data Packets Synchronized</p>
                            <a
                                href="/dashboard/admin/inventory"
                                className="mt-4 px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
                            >
                                View Inventory
                            </a>
                        </div>
                    ) : (
                        <button
                            onClick={handleSeed}
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Initializing Data Stream...
                                </>
                            ) : (
                                "Execute Inventory Genesis"
                            )}
                        </button>
                    )}

                    <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-left">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-normal">
                            Note: This action will add new items to <b>TEST-NODE-01</b>.
                            Existing items will remain untouched.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
