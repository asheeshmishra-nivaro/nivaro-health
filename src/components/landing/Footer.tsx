import React from 'react';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="w-8 h-8 text-primary" />
                            <span className="text-xl font-display font-bold text-primary tracking-tight uppercase">
                                Nivaro <span className="text-secondary">Health</span>
                            </span>
                        </div>
                        <p className="text-slate-600 max-w-sm leading-relaxed">
                            Advancing rural healthcare through structured clinical governance and node-based operational excellence.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Platform</h4>
                        <ul className="space-y-4">
                            <li><a href="#features" className="text-slate-600 hover:text-primary transition-colors">Modules</a></li>
                            <li><a href="#operational-model" className="text-slate-600 hover:text-primary transition-colors">Governance</a></li>
                            <li><a href="/login" className="text-slate-600 hover:text-primary transition-colors">Start Node</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-primary" />
                                founder@nivarotech.in
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-4 h-4 text-primary" />
                                +91 95806 78320
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <MapPin className="w-4 h-4 text-primary" />
                                Physical Node Infrastructure
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Nivaro Health Technologies. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-sm text-slate-400">
                        <span>Privileged Clinical Access</span>
                        <span>Enterprise Security Guaranteed</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
