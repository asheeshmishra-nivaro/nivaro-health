'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-primary" />
                        <span className="text-xl font-display font-bold text-primary tracking-tight">
                            NIVARO <span className="text-secondary">HEALTH</span>
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="nav-link">Platform</Link>
                        <Link href="#operational-model" className="nav-link">Model</Link>
                        <Link href="#partner" className="nav-link">Partner</Link>
                        <Link href="/login" className="btn-primary py-2 px-6 text-sm">
                            Let's Start
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className={cn(
                "md:hidden absolute top-20 w-full bg-white border-b border-slate-200 p-4 space-y-4 transition-all duration-300",
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            )}>
                <Link href="#features" className="block nav-link text-lg px-2">Platform</Link>
                <Link href="#operational-model" className="block nav-link text-lg px-2">Model</Link>
                <Link href="#partner" className="block nav-link text-lg px-2">Partner</Link>
                <Link href="/login" className="block btn-primary text-center">
                    Let's Start
                </Link>
            </div>
        </nav>
    );
}
