'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (role && !allowedRoles.includes(role)) {
                // Redirect to their own dashboard if they try to access another role's dashboard
                if (role === 'ADMIN') router.push('/dashboard/admin');
                else if (role === 'DOCTOR') router.push('/dashboard/doctor');
                else if (role === 'OPERATOR') router.push('/dashboard/operator');
            }
        }
    }, [user, role, loading, allowedRoles, router]);

    if (loading || !user || !role || !allowedRoles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
