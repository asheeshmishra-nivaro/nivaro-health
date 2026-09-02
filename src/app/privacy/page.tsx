import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: "Privacy Policy | Nivaro Health Technologies",
    description: "Privacy policy and data protection commitments for Nivaro Health Technologies under the Digital Personal Data Protection (DPDP) Act 2023.",
};

export default function PrivacyPolicyPage() {
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
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Privacy Policy</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-8">
                        Last Updated: September 2026 | DPDP Act 2023 Readiness Standard
                    </p>

                    <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Introduction</h2>
                            <p>
                                Nivaro Health Technologies ("Nivaro", "we", "our", or "us") is committed to safeguarding personal and clinical data collected through our digital platforms and node-based healthcare operations. This Privacy Policy outlines our commitment to data protection in alignment with India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and applicable healthcare privacy principles.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Information We Collect</h2>
                            <p className="mb-2">We collect information strictly necessary to provide healthcare infrastructure services, process partnership requests, and facilitate tele-consultations:</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                <li><strong>Partnership Inquiry Data:</strong> Name, organization/clinic name, email address, phone number, and node location submitted via our partner forms.</li>
                                <li><strong>Operator & Healthcare Professional Data:</strong> Credentialing information, medical registration numbers, and node operational metrics for onboarded partners.</li>
                                <li><strong>Clinical & Patient Data (Pilot Operations):</strong> Vital statistics, chief complaints, digital prescriptions, and diagnostic logs captured strictly during authorized clinical consultations.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Purpose of Processing</h2>
                            <p>Data collected is used exclusively for:</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                <li>Responding to node deployment and partnership requests.</li>
                                <li>Facilitating remote clinical consultations between patients, local operators, and licensed physicians.</li>
                                <li>Ensuring prescription traceability and inventory audit compliance at rural healthcare nodes.</li>
                                <li>Maintaining system security and fulfilling statutory regulatory requirements under Indian law.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Security & Data Protection Commitments</h2>
                            <p>
                                We employ access controls, role-based authorization, and encrypted transmission channels designed for clinical integrity. We do not sell, rent, or trade personal data to third parties. Access to clinical records is restricted strictly to authorized consulting medical professionals and node operators managing direct patient care.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Contact Information</h2>
                            <p>
                                For any data protection inquiries or to request updates regarding personal data provided via our platform, please contact our Data Governance team at <a href="mailto:info@nivarotech.in" className="text-primary font-semibold hover:underline">info@nivarotech.in</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
