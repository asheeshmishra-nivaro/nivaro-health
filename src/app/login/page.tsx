'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Mail, Loader2, ArrowLeft, Activity, Users, Globe, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { role, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user && role) {
            redirectUser(role);
        }
    }, [user, role, authLoading]);

    const redirectUser = (userRole: string) => {
        switch (userRole) {
            case 'ADMIN':
                router.push('/dashboard/admin');
                break;
            case 'DOCTOR':
                router.push('/dashboard/doctor');
                break;
            case 'OPERATOR':
                router.push('/dashboard/operator');
                break;
            default:
                toast.error('Unauthorized user role');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Access Granted. Initializing Governance Secure Link.');
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to authenticate');
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">Syncing Integrity Layer...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden font-sans">
            {/* Visual Narrative Side (Interactive) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center p-12">
                {/* Background Graphics */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                            <Globe className="w-3.5 h-3.5" /> Distributed Health Network
                        </div>
                        <h2 className="text-5xl font-display font-black text-white leading-tight mb-8">
                            One Logic. <br />
                            <span className="text-indigo-400">Universal Care.</span>
                        </h2>

                        <div className="space-y-8">
                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                                    <Activity className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">Clinical Sovereignty</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Standardized medical intelligence deployed across every rural node.</p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                                    <Users className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">Authenticated Trust</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Role-based governance ensuring complete clinical accountability.</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Data Flow Simulation */}
                        <div className="mt-16 flex gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: [20, 40, 25, 50, 20],
                                        opacity: [0.2, 0.5, 0.2]
                                    }}
                                    transition={{
                                        duration: 2 + i * 0.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-1.5 rounded-full bg-indigo-500"
                                />
                            ))}
                            <span className="text-[10px] font-mono text-indigo-400/50 uppercase tracking-widest self-center ml-4">Network Activity: Optimized</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Login Frame Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 bg-white relative">
                {/* Navigation: Back to Home */}
                <Link
                    href="/"
                    className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Platform Landing
                </Link>

                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="mb-12">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-2xl shadow-slate-900/20">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight mb-2">Governance Access</h1>
                            <p className="text-slate-500 font-medium">Initialize your clinical or operational terminal.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Identity (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-900"
                                        placeholder="physician@nivarotech.in"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Protocol (Password)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-slate-950/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Authorize & Enter
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Network Secure</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">v2.4.0-GOV</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
