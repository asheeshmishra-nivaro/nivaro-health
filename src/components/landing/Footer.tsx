import React from 'react';
import Link from 'next/link';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="inline-block mb-6">
                            <Logo width={190} height={50} />
                        </Link>
                        <p className="text-slate-600 max-w-sm leading-relaxed">
                            Advancing rural healthcare through structured clinical governance and node-based operational excellence.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Platform</h4>
                        <ul className="space-y-4">
                            <li><a href="#about" className="text-slate-600 hover:text-primary transition-colors">Team</a></li>
                            <li><a href="#features" className="text-slate-600 hover:text-primary transition-colors">Modules</a></li>
                            <li><a href="#operational-model" className="text-slate-600 hover:text-primary transition-colors">Governance</a></li>
                            <li><Link href="/privacy" className="text-slate-600 hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-slate-600 hover:text-primary transition-colors">Terms of Use</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-primary" />
                                info@nivarotech.in
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-4 h-4 text-primary" />
                                +91 95806 78320
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <MapPin className="w-4 h-4 text-primary" />
                                Kanpur, Uttar Pradesh
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Nivaro Health Technologies. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm text-slate-500 font-medium">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
                        <span>DPDP 2023 Compliant Architecture</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
