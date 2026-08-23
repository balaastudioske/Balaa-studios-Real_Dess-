import Link from 'next/link'
import { ArrowLeft, Shield, Check, Music, AlertTriangle, FileCheck } from 'lucide-react'

export default function TermsPage() {
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
            Terms of Service & Direct Master Licensing
          </h1>
          <p className="text-xs font-mono text-slate-400">Effective Date: August 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* CMO Independence Notice */}
          <section className="p-5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-black space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Independent Direct Licensing & CMO Non-Affiliation Declaration</span>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              <strong>REAL_DESS is a 100% independent recording artist and songwriter not affiliated with, represented by, or registered under any Collective Management Organization (CMO)</strong> (such as MCSK, PRISK, KAMP, or international collecting societies). 
            </p>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              <strong>What this means for you as a Licensee:</strong>
            </p>
            <ul className="space-y-1.5 text-xs text-amber-200/90 font-mono pl-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% direct master and publishing clearance straight from the creator.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>No secondary CMO collection fees or hidden royalty levies for the licensed scope.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant global synchronization rights without third-party intermediary delays.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-orange-400" />
              1. Master Sound Recording & Synchronization Tiers
            </h2>
            <p>
              Direct song licenses granted through BALAA STUDIOS are non-exclusive, non-transferable, and valid worldwide for the duration of your release according to the chosen tier:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 rounded-xl border border-white/10 bg-neutral-900/60">
                <span className="font-bold text-orange-400">Content Creator (KSh 200 / track):</span>
                <p className="text-slate-400 mt-1 text-[11px]">Social media, YouTube, TikTok, podcasts, and digital streams.</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-neutral-900/60">
                <span className="font-bold text-orange-400">Business & DJ (KSh 500 / track):</span>
                <p className="text-slate-400 mt-1 text-[11px]">Nightclubs, DJ sets, venue background, and corporate ambience.</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-neutral-900/60">
                <span className="font-bold text-orange-400">Commercial Advertising (KSh 700 / track):</span>
                <p className="text-slate-400 mt-1 text-[11px]">Paid digital ads, brand promo films, game & movie trailers.</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-neutral-900/60">
                <span className="font-bold text-orange-400">Premium Events (KSh 900 / track):</span>
                <p className="text-slate-400 mt-1 text-[11px]">Live festival synchronization, broadcast TV, and global OTT media.</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-orange-400" />
              2. Prohibited Uses & Protections
            </h2>
            <p>
              Licensees may not resell, sub-license, redistribute standalone master files, or use REAL_DESS audio tracks for training generative AI voice cloning models without prior written authorization from BALAA STUDIOS management.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white font-mono uppercase text-orange-300 flex items-center gap-2">
              3. Payments & Order Fulfillment
            </h2>
            <p>
              Payments via Safaricom M-Pesa Buy Goods Till <strong>5834631</strong> are confirmed by admin verification. Once verified, download links for 24-bit lossless WAV master stems and authorization certificates are issued to the customer's registered email address.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
