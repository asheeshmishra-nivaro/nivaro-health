import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import OperationalModel from '@/components/landing/OperationalModel';
import PartnerForm from '@/components/landing/PartnerForm';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <OperationalModel />

      <section id="partner" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold text-slate-900 mb-6">Scale with Nivaro Health</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Join our mission to standardize healthcare delivery across rural and suburban nodes.
                Our platform provides the clinical governance, inventory oversight, and professional
                tools needed to run high-efficiency medical nodes.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">01</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Clinically Validated Flow</h4>
                    <p className="text-sm text-slate-500">Standardized consultation protocols at every node.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 font-bold">02</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Seamless Inventory Control</h4>
                    <p className="text-sm text-slate-500">Real-time tracking from prescription to dispensing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 font-bold">03</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Governance & Audit</h4>
                    <p className="text-sm text-slate-500">Full transparency and clinical accountability.</p>
                  </div>
                </div>
              </div>
            </div>

            <PartnerForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
