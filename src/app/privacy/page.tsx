import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-slate-200 font-sans p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs font-bold text-orange-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO BALAA STAGE</span>
        </Link>

        <div className="border-b border-orange-500/20 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Shield className="w-4 h-4" />
            <span>BALAA STUDIOS LEGAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-slate-400">Effective Date: August 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" />
              1. Information We Collect
            </h2>
            <p>
              BALAA STUDIOS ("we", "us", or "our") operates the web-native 3D performance and commercial platform for REAL_DESS. We collect information necessary to fulfill digital song master licensing, direct physical merch orders, Safaricom M-Pesa till verification, and VIP Collector newsletter delivery. This includes your email address, name, order reference codes, and billing identifiers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              2. Payments & Transaction Security
            </h2>
            <p>
              Transactions completed via Safaricom M-Pesa Buy Goods Till <strong>5834631</strong> are processed through Safaricom’s official mobile financial network. We never store personal PINs, credit card numbers, or bank passwords on our servers. All transaction references are verified strictly for order fulfillment and license certificate issuance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              3. Master Audio & 3D Interactive Telemetry
            </h2>
            <p>
              We use client-side local caching and state management to persist your selected camera angle (Artist Front / Explore Orbit), 3D canvas rendering quality, and playlist playback preferences. We do not sell or monetize personal tracking data to third-party data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              4. Contact & Inquiries
            </h2>
            <p>
              If you have questions regarding your data, order history, or license certificates, reach out to our team at{' '}
              <a href="mailto:hello@balaastudios.com" className="text-orange-400 hover:underline font-mono">
                hello@balaastudios.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
