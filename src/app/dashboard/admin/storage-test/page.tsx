'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { verifyStorage } from '@/lib/test-storage';
import { Loader2, CheckCircle2, XCircle, Shield } from 'lucide-react';

export default function StorageTestPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleTest = async () => {
        setStatus('loading');
        const success = await verifyStorage();
        if (success) {
            setStatus('success');
            setMessage('Firebase Storage is connected and ready for use!');
        } else {
            setStatus('error');
            setMessage('Failed to connect to Firebase Storage. Check your bucket URL and CORS settings.');
        }
    };

    return (
        <DashboardLayout allowedRoles={['ADMIN']}>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">Storage Connectivity Test</h1>
                <p className="text-slate-500">Verify that your Nivaro Health environment is correctly synchronized with Firebase Storage.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${status === 'success' ? 'bg-green-50 text-green-500' :
                            status === 'error' ? 'bg-red-50 text-red-500' :
                                'bg-primary/5 text-primary'
                        }`}>
                        {status === 'loading' ? <Loader2 className="w-10 h-10 animate-spin" /> :
                            status === 'success' ? <CheckCircle2 className="w-10 h-10" /> :
                                status === 'error' ? <XCircle className="w-10 h-10" /> :
                                    <Shield className="w-10 h-10" />}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {status === 'idle' ? 'Ready to Test' :
                            status === 'loading' ? 'Testing Connection...' :
                                status === 'success' ? 'Connection Successful' :
                                    'Connection Failed'}
                    </h2>

                    <p className="text-slate-500 mb-8 max-w-sm">
                        {message || 'Click the button below to perform a live handshake with your Firebase Storage bucket.'}
                    </p>

                    <button
                        onClick={handleTest}
                        disabled={status === 'loading'}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {status === 'loading' ? 'Verifying...' : 'Run Connectivity Test'}
                    </button>

                    {status === 'error' && (
                        <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                            <p className="text-xs font-bold text-amber-700 uppercase mb-1">Troubleshooting Tip</p>
                            <p className="text-sm text-amber-800">
                                Ensure `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in your `.env` matches the URL in Firebase Console (e.g., `[project-id].firebasestorage.app`).
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
