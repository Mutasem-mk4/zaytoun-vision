// ============================================================
// Home — Hero Landing Page
// ============================================================
// Stunning hero with gradient mesh, bilingual text selector,
// interactive UV light simulator, statistics section,
// interactive sandbox demo, and feature cards.
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
    
    // Features
    featuresTitle: "How It Works",
    featuresSubtitle: "Our three-step AI analysis pipeline",
    
    // Stats
    statsTitle: "Jordan & Palestine Olive Sector",
    statsSubtitle: "Why verification matters for our local communities",
    
    // Sandbox
    sandboxTitle: "Interactive Scan Sandbox",
    sandboxSubtitle: "Try a simulated UV fluorescence scan in-place",
    selectScenario: "Select a sample to start the analysis:",
    scanningText: "Initializing scanning camera...",
    viewReportBtn: "View Full Scientific Report",
    resetBtn: "Reset Sandbox",
    purityLabel: "Purity Score",
    statusLabel: "Status",
    verdictLabel: "Verdict",
    pureStatus: "Pure EVOO",
    warningStatus: "Aged/Oxidized",
    adulteratedStatus: "Adulterated/Refined",
  },
  ar: {
    heroTitle: "زيتون فيجن",
    heroSubtitle: "حماية الذهب السائل الفلسطيني",
    heroTagline: "تحقق من جودة وأصالة زيت الزيتون فوراً باستخدام تصوير الفلورة بالهاتف الذكي والذكاء الاصطناعي من أزور.",
    startDemoBtn: "ابدأ الفحص الحي",
    learnMoreBtn: "اقرأ المزيد",
    scanToOpen: "امسح الرمز لفتحه على الهاتف",
    
    // Features
    featuresTitle: "كيف يعمل النظام",
    featuresSubtitle: "خطوات تحليل الذكاء الاصطناعي الثلاثة",
    
    // Stats
    statsTitle: "قطاع الزيتون في الأردن وفلسطين",
    statsSubtitle: "لماذا يهمنا فحص وتوثيق جودة الزيت لمزارعينا ومستهلكينا",
    
    // Sandbox
    sandboxTitle: "مركز الفحص التفاعلي",
    sandboxSubtitle: "قم بتجربة فحص محاكاة الفلورة هنا مباشرة",
    selectScenario: "اختر عينة لبدء عملية التحليل:",
    scanningText: "جاري تشغيل كاميرا الفحص الطيفي...",
    viewReportBtn: "عرض التقرير العلمي الكامل",
    resetBtn: "إعادة تعيين الفحص",
    purityLabel: "نسبة النقاء",
    statusLabel: "الحالة",
    verdictLabel: "النتيجة النهائية",
    pureStatus: "بكر ممتاز نقي",
    warningStatus: "قديم / مؤكسد",
    adulteratedStatus: "مغشوش / مكرر",
  }
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'Azure Custom Vision',
    titleAr: 'رؤية أزور المخصصة',
    desc: 'AI-powered spectral analysis detects adulteration patterns invisible to the naked eye.',
    descAr: 'تحليل طيفي مدعوم بالذكاء الاصطناعي يكشف أنماط الغش غير المرئية بالعين المجردة.',
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    titleAr: 'نتائج فورية',
    desc: 'Get a purity score in under 10 seconds. No lab equipment required — just your smartphone.',
    descAr: 'احصل على نتيجة النقاء في أقل من 10 ثوانٍ. لا حاجة لمعدات مختبرية — فقط هاتفك الذكي.',
  },
  {
    icon: '📜',
    title: 'Digital Certificate',
    titleAr: 'شهادة رقمية',
    desc: 'Blockchain-ready QR-verified certificates for every sample analyzed. Tamper-proof authenticity.',
    descAr: 'شهادات موثقة رموز QR جاهزة للبلوكشين لكل عينة يتم تحليلها لحماية المصداقية.',
  },
];

const STATS = [
  { 
    value: '70%', 
    label: 'Production Decline', 
    labelAr: 'انخفاض الإنتاج', 
    desc: 'Palestinian olive oil output since 2000 due to instability and lack of resources.',
    descAr: 'انخفاض إنتاج زيت الزيتون الفلسطيني منذ عام 2000 بسبب عدم الاستقرار ونقص الموارد.'
  },
  { 
    value: '$850M', 
    label: 'Market Value', 
    labelAr: 'قيمة السوق', 
    desc: 'Jordan & Palestine olive oil industry contribution to local GDP.',
    descAr: 'مساهمة صناعة زيت الزيتون في الأردن وفلسطين في الاقتصاد المحلي.'
  },
  { 
    value: '75,000', 
    label: 'Farmers', 
    labelAr: 'المزارعون الكادحون', 
    desc: 'Families depending on olive cultivation as their primary livelihood.',
    descAr: 'العائلات التي تعتمد على زراعة الزيتون كمصدر عيش أساسي لها.'
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { language, demoScenarios, setResult } = useAnalysisStore();
  const text = TRANSLATIONS[language];

  // Sandbox simulation states
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningMessage, setScanningMessage] = useState('');
  const [scanComplete, setScanComplete] = useState(false);

  const handleSandboxClick = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
  };

  useEffect(() => {
    if (!isScanning || selectedScenarioId === null) return;

    const scanStages = [
      { label: language === 'ar' ? 'جاري التقاط صورة الفلورة...' : 'Capturing fluorescence image...', duration: 1000 },
      { label: language === 'ar' ? 'جاري الرفع إلى Azure Blob Storage...' : 'Uploading signature to Azure Blob...', duration: 1200 },
      { label: language === 'ar' ? 'يقوم نموذج Azure Custom Vision بالتحليل الطيفي...' : 'Azure Custom Vision analyzing spectrum...', duration: 1500 },
      { label: language === 'ar' ? 'حساب مؤشرات النقاء والجودة...' : 'Computing EVOO quality metrics...', duration: 800 }
    ];

    let currentStep = 0;
    setScanningMessage(scanStages[0].label);

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < scanStages.length) {
        setScanningMessage(scanStages[currentStep].label);
        setScanProgress((currentStep / scanStages.length) * 100);
      } else {
        clearInterval(stepInterval);
        setScanProgress(100);
        
        // Find result and set in global store
        const scenario = demoScenarios.find(s => s.id === selectedScenarioId);
        if (scenario) {
          const result = {
            ...scenario.result,
            id: `zv-${Date.now().toString(36)}-sandbox`,
            timestamp: new Date().toISOString(),
          };
          setResult(result);
        }

        setTimeout(() => {
          setIsScanning(false);
          setScanComplete(true);
        }, 600);
      }
    }, 1100);

    return () => clearInterval(stepInterval);
  }, [isScanning, selectedScenarioId, language, demoScenarios, setResult]);

  const activeScenario = demoScenarios.find(s => s.id === selectedScenarioId);

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
                <a
                  href="#sandbox"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-primary/25 text-primary font-semibold text-base hover:bg-primary/5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{text.learnMoreBtn}</span>
                  <span className="text-sm">↓</span>
                </a>
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

      {/* ── Stats Section ──────────────────────────────────── */}
      <section className="py-16 bg-surface-warm border-y border-dark/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="font-display text-3xl font-bold text-primary mb-2">
              {text.statsTitle}
            </h3>
            <p className="text-xs sm:text-sm text-dark/50 uppercase tracking-wider">
              {text.statsSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="glass rounded-2xl p-6 border border-white/40 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="font-display text-4xl sm:text-5xl font-black text-accent-dark block mb-2">
                    {stat.value}
                  </span>
                  <h4 className="font-display text-lg font-bold text-primary mb-2">
                    {language === 'ar' ? stat.labelAr : stat.label}
                  </h4>
                  <p className="text-xs sm:text-sm text-dark/60 leading-relaxed">
                    {language === 'ar' ? stat.descAr : stat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Sandbox Section ───────────────────── */}
      <section id="sandbox" className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h3 className="font-display text-3xl font-bold text-primary mb-2">
              {text.sandboxTitle}
            </h3>
            <p className="text-xs sm:text-sm text-dark/50 uppercase tracking-wider">
              {text.sandboxSubtitle}
            </p>
          </motion.div>

          {/* Sandbox Main Container */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-elevated border border-white/30">
            <AnimatePresence mode="wait">
              {!isScanning && !scanComplete ? (
                /* Stage 1: Selection */
                <motion.div
                  key="select"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-sm text-dark/60 mb-6 text-center">
                    {text.selectScenario}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {demoScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => handleSandboxClick(scenario.id)}
                        className="glass hover:bg-primary/5 active:scale-97 border border-white/40 p-5 rounded-2xl text-left rtl:text-right cursor-pointer transition-all flex flex-col justify-between items-start min-h-[160px] group relative overflow-hidden"
                      >
                        <div
                          className="absolute top-0 bottom-0 left-0 w-1"
                          style={{ backgroundColor: scenario.thumbnailColor }}
                        />
                        <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                          {scenario.icon}
                        </span>
                        <div>
                          <h4 className="font-display text-base font-bold text-dark group-hover:text-primary transition-colors">
                            {language === 'ar' ? scenario.nameAr : scenario.name}
                          </h4>
                          <p className="text-[10px] text-dark/50 mt-1 line-clamp-2 leading-relaxed">
                            {language === 'ar' ? scenario.descriptionAr : scenario.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : isScanning ? (
                /* Stage 2: Scanning Simulation */
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  {/* Glowing Scanning Indicator */}
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      🫒
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-primary mb-2">
                    {text.scanningText}
                  </p>
                  <p className="text-xs text-dark/50 mb-6 text-center animate-pulse">
                    {scanningMessage}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-sm bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Stage 3: Scan Complete (Result Overview) */
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <span className="text-5xl mb-4">
                    {activeScenario?.result.status === 'pure' ? '✅' : activeScenario?.result.status === 'warning' ? '⚠️' : '🚨'}
                  </span>
                  
                  <h4 className="font-display text-2xl font-bold text-dark mb-1">
                    {language === 'ar' ? activeScenario?.nameAr : activeScenario?.name}
                  </h4>
                  
                  <p className="text-xs text-dark/40 mb-6 uppercase tracking-wider">
                    {text.verdictLabel}: <strong className="text-primary">{activeScenario?.result.verdict}</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                    {/* Purity */}
                    <div className="bg-white/40 p-4 rounded-xl border border-white/10 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-dark/40">{text.purityLabel}</span>
                      <span className="text-2xl font-bold text-accent-dark mt-1">
                        {activeScenario?.result.purityScore}%
                      </span>
                    </div>

                    {/* Status */}
                    <div className="bg-white/40 p-4 rounded-xl border border-white/10 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-dark/40">{text.statusLabel}</span>
                      <span className="text-sm font-semibold text-primary mt-2">
                        {activeScenario?.result.status === 'pure' 
                          ? text.pureStatus 
                          : activeScenario?.result.status === 'warning' 
                            ? text.warningStatus 
                            : text.adulteratedStatus}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      onClick={() => navigate('/results')}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-all active:scale-95 cursor-pointer shadow-md text-sm"
                    >
                      {text.viewReportBtn}
                    </button>
                    <button
                      onClick={() => setScanComplete(false)}
                      className="px-6 py-3 border border-dark/10 hover:bg-dark/5 text-dark font-medium rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
                    >
                      {text.resetBtn}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-dark/5 bg-surface-warm/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="font-display text-3xl sm:text-4xl font-bold text-dark mb-2">
              {text.featuresTitle}
            </h3>
            <p className="text-xs sm:text-sm text-dark/40 uppercase tracking-wider">
              {text.featuresSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass rounded-2xl p-6 sm:p-8 text-center group cursor-default border border-white/40 shadow-sm"
              >
                <motion.span
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-4xl sm:text-5xl block mb-5"
                >
                  {feature.icon}
                </motion.span>
                <h4 className="font-display text-xl font-bold text-dark mb-2">
                  {language === 'ar' ? feature.titleAr : feature.title}
                </h4>
                <p className="text-xs sm:text-sm text-dark/60 leading-relaxed">
                  {language === 'ar' ? feature.descAr : feature.desc}
                </p>
              </motion.div>
            ))}
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
