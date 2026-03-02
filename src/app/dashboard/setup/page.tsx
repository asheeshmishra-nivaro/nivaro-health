'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/db';
import { Shield, Mail, Lock, User as UserIcon, Loader2, CheckCircle2, Stethoscope, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/types';

export default function GenesisSetupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('ADMIN');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // 2. Create Firestore Profile
            await createUserProfile(uid, {
                uid,
                email,
                name,
                role: role,
                nodeId: role === 'ADMIN' ? 'GLOBAL' : 'TEST-NODE-01', // Local node for others
                status: 'active'
            });

            setSuccess(true);
            toast.success(`${role} account created successfully!`);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error: any) {
            console.error('Setup error:', error);
            toast.error(error.message || 'Failed to create account');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Setup Complete</h1>
                    <p className="text-slate-500">Redirecting to login as {role}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full py-12">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-6 shadow-xl shadow-primary/20">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Nivaro User Genesis</h1>
                    <p className="text-slate-500 mt-2">Initialize your system with various specialized clinical roles.</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
                    <form onSubmit={handleSetup} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Role Assignment</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['ADMIN', 'DOCTOR', 'OPERATOR'] as UserRole[]).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === r
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {r === 'ADMIN' && <Shield className="w-5 h-5" />}
                                        {r === 'DOCTOR' && <Stethoscope className="w-5 h-5" />}
                                        {r === 'OPERATOR' && <Users className="w-5 h-5" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{r}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    placeholder="e.g. Dr. Nivaro"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    placeholder={`${role.toLowerCase()}@nivarotech.in`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Initialize ${role} Account`}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-xs text-slate-400 italic">
                    Note: Use this page to initialize test credentials for each of the three clinical roles.
                </p>
            </div>
        </div>
    );
}
