import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: "Terms of Use | Nivaro Health Technologies",
    description: "Terms of use and service conditions for Nivaro Health Technologies platform and rural healthcare node network.",
};

export default function TermsOfUsePage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-8 hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Terms of Use</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-8">
                        Last Updated: September 2026 | Operational Framework
                    </p>

                    <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or utilizing the digital platform, partner inquiry forms, or healthcare operating workstation software provided by Nivaro Health Technologies ("Nivaro"), you agree to abide by these Terms of Use and all applicable guidelines.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Stage of Operation & Pilot Notice</h2>
                            <p>
                                Nivaro Health Technologies is a technology company developing node-based rural healthcare infrastructure. The platform is currently in a <strong>pre-pilot phase</strong> with initial deployment focused in Kanpur, Uttar Pradesh. Information provided on this website describes technology architecture and design targets.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Medical Disclaimer</h2>
                            <p>
                                Nivaro provides software operating infrastructure, clinical communication tools, and supply chain tracking for healthcare nodes. Clinical consultations conducted over the platform are performed independently by licensed healthcare practitioners. The website content does not constitute medical advice or a substitute for professional clinical judgment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Intellectual Property</h2>
                            <p>
                                All proprietary software designs, user interface components, architecture specifications, branding, and content on this site are the intellectual property of Nivaro Health Technologies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Contact</h2>
                            <p>
                                For questions regarding these terms, please contact us at <a href="mailto:info@nivarotech.in" className="text-primary font-semibold hover:underline">info@nivarotech.in</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
