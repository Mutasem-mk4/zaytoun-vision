// ============================================================
// Home — Hero Landing Page
// ============================================================
// Stunning hero with gradient mesh, bilingual text selector,
// and interactive UV light simulator.
// ============================================================

import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import OliveLogo from '@/components/shared/OliveLogo';
import UVSimulator from '@/components/shared/UVSimulator';
import { useAnalysisStore } from '@/store/analysisStore';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const TRANSLATIONS = {
  en: {
    heroTitle: "Zaytoun Vision",
    heroSubtitle: "Protecting Palestine's Liquid Gold",
    heroTagline: "Verify olive oil authenticity and purity instantly using smartphone fluorescence imaging & Azure Custom Vision AI.",
    startDemoBtn: "Start Live Test",
    learnMoreBtn: "Learn More",
    scanToOpen: "Scan to open on smartphone",
  },
  ar: {
    heroTitle: "زيتون فيجن",
    heroSubtitle: "حماية الذهب السائل الفلسطيني",
    heroTagline: "تحقق من جودة وأصالة زيت الزيتون فوراً باستخدام تصوير الفلورة بالهاتف الذكي والذكاء الاصطناعي من أزور.",
    startDemoBtn: "ابدأ الفحص الحي",
    learnMoreBtn: "اقرأ المزيد",
    scanToOpen: "امسح الرمز لفتحه على الهاتف",
  }
};

export default function Home() {
  const { language } = useAnalysisStore();
  const text = TRANSLATIONS[language];

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden gradient-mesh py-16 sm:py-24">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-32 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero text */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="lg:col-span-7 text-center lg:text-left rtl:lg:text-right flex flex-col justify-center"
            >
              {/* Brand Logo & Tag */}
              <motion.div variants={fadeUp} className="mb-6 flex justify-center lg:justify-start items-center gap-3">
                <OliveLogo size={56} />
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary">
                    {text.heroTitle}
                  </h1>
                  <p className="font-arabic text-sm text-primary/60 -mt-1">
                    {TRANSLATIONS.ar.heroTitle}
                  </p>
                </div>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-dark-light leading-tight mb-4"
              >
                {text.heroSubtitle}
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg text-dark/70 max-w-2xl mb-8 leading-relaxed"
              >
                {text.heroTagline}
              </motion.p>

              {/* Action Buttons */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <Link
                  to="/capture"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-olive text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="text-xl">🔬</span>
                  <span>{text.startDemoBtn}</span>
                </Link>
                <Link
                  to="/capture"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-primary/25 text-primary font-semibold text-base hover:bg-primary/5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{text.learnMoreBtn}</span>
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
                <div className="text-left rtl:text-right">
                  <p className="text-xs font-semibold text-dark/80">{text.scanToOpen}</p>
                  <p className="text-[10px] text-dark/50">Open Zaytoun Vision on mobile</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Interactive UVSimulator Graphic */}
            <motion.div
              initial={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-5"
            >
              <UVSimulator />
            </motion.div>
          </div>
        </div>
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
            <div className="text-left rtl:text-right">
              <span className="font-display text-base font-bold text-white block">Zaytoun Vision</span>
              <span className="text-[10px] text-zinc-500">© 2026. All rights reserved.</span>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1">
              Built with ❤️ for the Azure AI Hackathon
            </p>
            <p className="font-arabic text-zinc-500 text-[10px]">
              صُنع بحب لمسابقة هاكاثون أزور للذكاء الاصطناعي
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
