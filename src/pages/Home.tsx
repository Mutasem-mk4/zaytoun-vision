// ============================================================
// Home — Hero Landing Page
// ============================================================
// Stunning hero with gradient mesh, interactive UV light simulator,
// and integrated Capture testing section. English-only.
// ============================================================

import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import OliveLogo from '@/components/shared/OliveLogo';
import UVSimulator from '@/components/shared/UVSimulator';
import Capture from '@/pages/Capture';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden gradient-mesh"
        style={{ minHeight: 'calc(100svh - 64px)' }}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-32 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between" style={{ minHeight: 'calc(100svh - 64px)' }}>
          <div className="flex-1 flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full py-12">
              {/* Hero text */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="lg:col-span-7 text-center lg:text-left flex flex-col justify-center"
              >
                {/* Brand Logo & Tag */}
                <motion.div variants={fadeUp} className="mb-6 flex justify-center lg:justify-start items-center gap-3">
                  <OliveLogo size={56} />
                  <div>
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary">
                      ZaytounCom
                    </h1>
                  </div>
                </motion.div>

                <motion.h2
                  variants={fadeUp}
                  className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-dark-light leading-tight mb-4"
                >
                  Protecting Palestine's Liquid Gold
                </motion.h2>

                <motion.p
                  variants={fadeUp}
                  className="text-base sm:text-lg text-dark/70 max-w-2xl mb-8 leading-relaxed"
                >
                  Verify olive oil authenticity and purity instantly using smartphone fluorescence imaging & Azure Custom Vision AI.
                </motion.p>

                {/* Action Buttons */}
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                  <a
                    href="#capture-section"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-olive text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl">🔬</span>
                    <span>Start Live Test</span>
                  </a>
                  <Link
                    to="/history"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-primary/25 text-primary font-semibold text-base hover:bg-primary/5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>Scan History</span>
                  </Link>
                </motion.div>

                {/* QR Code */}
                <motion.div
                  variants={fadeUp}
                  className="hidden sm:inline-flex items-center gap-4 bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-center lg:self-start"
                >
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? window.location.origin : 'https://zaytoun.vision'}
                      size={72}
                      bgColor="#FFFFFF"
                      fgColor="#2D5016"
                      level="H"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-dark/80">Scan to open on smartphone</p>
                    <p className="text-[10px] text-dark/50">Open ZaytounCom on mobile</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Interactive UVSimulator Graphic */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5"
              >
                <UVSimulator />
              </motion.div>
            </div>
          </div>

          {/* Scroll-down cue */}
          <motion.a
            href="#capture-section"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-col items-center gap-1 pb-6 text-primary/50 hover:text-primary transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-medium tracking-widest uppercase">Scroll</span>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </motion.svg>
          </motion.a>
        </div>
      </section>


      {/* ── Capture Section ────────────────────────────────── */}
      <section id="capture-section" className="py-12 border-t border-dark/5 bg-surface-warm/20">
        <Capture />
      </section>

      {/* ── Footer CTA ────────────────────────────────────── */}
      <section className="py-12 text-center px-4 bg-zinc-900 text-zinc-400">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <OliveLogo size={32} />
            <div className="text-left">
              <span className="font-display text-base font-bold text-white block">ZaytounCom</span>
              <span className="text-[10px] text-zinc-500">© 2026. All rights reserved.</span>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1">
              Built with ❤️ for the Azure AI Hackathon
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
