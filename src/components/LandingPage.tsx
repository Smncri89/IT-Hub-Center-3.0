import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Ticket, Monitor, AlertTriangle, BookOpen, Key, BarChart3,
  Building2, Sparkles, Users, MapPin, QrCode, Smartphone,
  Globe, Shield, ArrowRight, ChevronDown, Check, Minus,
  Star, Menu, X, Zap, Clock, TrendingDown,
} from 'lucide-react';
import { Logo } from '@/constants';

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } }),
};

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      if (root) root.style.overflow = '';
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const modules = [
    { icon: Ticket, title: 'Ticketing', desc: 'Kanban board, automated SLA, AI triage that categorizes and prioritizes instantly.', accent: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/15' },
    { icon: Monitor, title: 'Asset Management', desc: '25+ asset types, QR scanning, depreciation tracking, geo-mapping, bulk import.', accent: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
    { icon: AlertTriangle, title: 'Incidents', desc: 'Severity-based escalation, live timeline, root cause analysis, post-mortem docs.', accent: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/15' },
    { icon: BookOpen, title: 'Knowledge Base', desc: 'Write in 3 languages. Target by role. Rich editor with tags and categories.', accent: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-500/15' },
    { icon: Key, title: 'Licenses', desc: 'Track seats, costs, renewals. Get alerts before expiration. Cut waste.', accent: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-500/10 dark:bg-pink-500/15' },
    { icon: BarChart3, title: 'Analytics', desc: 'Six dashboards with interactive charts. Export to PDF and Excel.', accent: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15' },
  ];

  const benefits = [
    { icon: Zap, title: 'Deploy in minutes', desc: 'No infrastructure to manage. Sign up, invite your team, start working.' },
    { icon: Clock, title: 'Save 10+ hours/week', desc: 'AI triage, automated SLAs, and self-service KB reduce manual work dramatically.' },
    { icon: TrendingDown, title: 'Cut tool costs by 80%', desc: 'Replace six separate subscriptions with one platform at a fraction of the price.' },
    { icon: Shield, title: 'Enterprise-grade security', desc: 'AES-256 encryption, row-level security, EU hosting. GDPR compliant by design.' },
  ];

  const extras = [
    { icon: Building2, label: 'Vendor Management' },
    { icon: Sparkles, label: 'AI Assistant' },
    { icon: Users, label: 'On/Offboarding' },
    { icon: MapPin, label: 'Asset Geo-Map' },
    { icon: QrCode, label: 'QR Scanner' },
    { icon: Smartphone, label: 'Mobile PWA' },
    { icon: Globe, label: 'Multilingual' },
    { icon: Shield, label: 'Role-Based Access' },
  ];

  const testimonials = [
    { quote: 'We consolidated ServiceNow, a license spreadsheet, and a shared folder of docs into one tool. The team adopted it in a day.', name: 'Marco R.', role: 'IT Director', company: 'Manufacturing, 200+ employees' },
    { quote: 'AI triage alone saved us hours every week. Tickets arrive pre-categorized. We just confirm and assign.', name: 'Elena C.', role: 'Support Lead', company: 'Digital Agency, 50 employees' },
    { quote: 'Went from zero asset visibility to a fully tracked inventory with QR codes in one afternoon. The depreciation reports impressed our CFO.', name: 'Alessandro T.', role: 'CTO', company: 'Tech Startup, 30 employees' },
  ];

  const pricingTiers = [
    { name: 'Starter', price: 'Free', period: '/ 30 days', desc: 'Full platform access. No restrictions.', features: ['Up to 5 users', '50 assets', 'All modules', 'Knowledge Base', 'Basic reports', 'Email support'], cta: 'Start free trial', highlighted: false },
    { name: 'Pro', price: '\u20AC29', period: '/ mo', desc: 'Unlimited everything. For committed teams.', features: ['Unlimited users & assets', 'AI-powered triage', 'SLA management', 'Incident command center', 'Vendor management', '6 dashboards', 'PDF & Excel exports', 'Priority support'], cta: 'Start 14-day trial', highlighted: true },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'Tailored deployment and dedicated support.', features: ['Everything in Pro', 'SSO / SAML', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee 99.9%', 'On-premise option', '24/7 phone support', 'Assisted migration'], cta: 'Contact sales', highlighted: false },
  ];

  const faqs = [
    { q: 'How does the free trial work?', a: 'Sign up and get full access for 30 days. No credit card required. At the end, choose a plan or your account goes read-only.' },
    { q: 'Where is my data stored?', a: 'EU data centers via Supabase. Encrypted at rest (AES-256) and in transit (TLS 1.3). Row-level security on every table. Fully GDPR compliant.' },
    { q: 'Can I import existing data?', a: 'Yes. Bulk import via CSV and Excel for assets, users, and licenses. Enterprise plans include assisted migration from ServiceNow, Jira SM, Freshservice, and Zendesk.' },
    { q: 'Does it work on mobile?', a: 'IT Hub Center is a Progressive Web App. Install from your browser on any device. Supports offline mode and push notifications.' },
    { q: 'Is there annual billing?', a: 'Yes, with 20% off. Contact us for volume pricing on 50+ seats.' },
  ];

  const comparison = [
    { cap: 'Ticket management', old: false, multi: true },
    { cap: 'Asset lifecycle tracking', old: false, multi: true },
    { cap: 'License cost tracking', old: false, multi: false },
    { cap: 'AI-powered triage', old: false, multi: false },
    { cap: 'Multilingual (3 languages)', old: false, multi: false },
    { cap: 'Incident management', old: false, multi: true },
    { cap: 'Knowledge base', old: false, multi: true },
    { cap: 'QR code scanning', old: false, multi: false },
    { cap: 'Vendor management', old: false, multi: false },
    { cap: 'Offline / PWA', old: false, multi: false },
    { cap: 'Single price, all included', old: true, multi: false },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-x-hidden antialiased font-sans">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50 shadow-sm' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/#/" className="flex items-center gap-2.5">
              <Logo className="w-8 h-8" />
              <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">IT Hub Center</span>
            </a>
            <div className="hidden md:flex items-center gap-1">
              {[{ id: 'features', label: 'Features' }, { id: 'benefits', label: 'Benefits' }, { id: 'pricing', label: 'Pricing' }, { id: 'faq', label: 'FAQ' }].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className="px-3.5 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors duration-200">
                  {item.label}
                </button>
              ))}
              <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-3" />
              <a href="/#/login" className="px-3.5 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Log in</a>
              <a href="/#/register" className="ml-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-300 active:scale-95">
                Get started
              </a>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-neutral-500 dark:text-neutral-400" aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-neutral-200/50 dark:border-neutral-700/50"
              >
                <div className="py-3 flex flex-col gap-1">
                  {[{ id: 'features', label: 'Features' }, { id: 'benefits', label: 'Benefits' }, { id: 'pricing', label: 'Pricing' }, { id: 'faq', label: 'FAQ' }].map(item => (
                    <button key={item.id} onClick={() => scrollTo(item.id)} className="px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-left rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50">{item.label}</button>
                  ))}
                  <div className="flex gap-3 mt-2 px-3">
                    <a href="/#/login" className="flex-1 text-center py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Log in</a>
                    <a href="/#/register" className="flex-1 text-center py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl shadow-lg shadow-primary-500/20">Get started</a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-primary-100/60 via-primary-50/30 to-transparent dark:from-primary-950/40 dark:via-primary-900/10 dark:to-transparent rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-8 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 border border-primary-200/60 dark:border-primary-800/40 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Now in public beta
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
          >
            <span className="text-neutral-900 dark:text-white">One platform for your</span>
            <br />
            <span className="text-primary-600 dark:text-primary-400">entire IT operations</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
          >
            Ticketing, assets, incidents, licenses, knowledge base, vendors,
            and analytics — in a single tool that replaces them all.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a href="/#/register" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 active:scale-95">
              Start free trial
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <button onClick={() => scrollTo('features')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-300 shadow-sm">
              Explore platform
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-5 text-xs text-neutral-400 dark:text-neutral-500"
          >
            Free for 30 days &middot; No credit card &middot; GDPR compliant &middot; EU hosted
          </motion.p>
        </motion.div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-16 sm:mt-24"
        >
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm shadow-2xl shadow-neutral-900/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100/80 dark:bg-neutral-900/80 border-b border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>
              <div className="flex-1 mx-8">
                <div className="max-w-[200px] mx-auto h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md flex items-center justify-center">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">app.ithubcenter.com</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Open Tickets', val: '24', delta: '-12%', color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Tracked Assets', val: '312', delta: '+8', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'SLA Compliance', val: '98.2%', delta: '+2.1%', color: 'text-primary-600 dark:text-primary-400' },
                  { label: 'Avg Resolution', val: '4.2h', delta: '-1.3h', color: 'text-amber-600 dark:text-amber-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-neutral-200/50 dark:border-neutral-700/50">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{s.label}</p>
                    <p className={`text-xl font-semibold mt-0.5 ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{s.delta}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl p-4 border border-neutral-200/50 dark:border-neutral-700/50 h-32 sm:h-36">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3">Ticket volume — 12 weeks</p>
                  <div className="flex items-end gap-[3px] h-16 sm:h-20">
                    {[65, 72, 58, 80, 68, 55, 48, 60, 45, 52, 38, 42].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.8 + i * 0.04, ease: [0.25, 0.4, 0.25, 1] }}
                        className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 rounded-t opacity-80"
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl p-4 border border-neutral-200/50 dark:border-neutral-700/50 h-32 sm:h-36">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3">AI Triage Accuracy</p>
                  <div className="flex items-center justify-center h-16 sm:h-20">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-200 dark:text-neutral-700" />
                        <motion.circle
                          cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"
                          initial={{ strokeDasharray: '0 100' }}
                          animate={{ strokeDasharray: '94 100' }}
                          transition={{ duration: 1.2, delay: 1, ease: [0.25, 0.4, 0.25, 1] }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* What it replaces */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-y border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-neutral-400 dark:text-neutral-500">
              <span className="mr-2 text-neutral-500 dark:text-neutral-400 font-medium">Replaces:</span>
              {['ServiceNow', 'Jira Service Mgmt', 'Snipe-IT', 'Freshservice', 'Spreadsheets', 'Notion'].map((name, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-neutral-300 dark:text-neutral-700">/</span>}
                  <span>{name}</span>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fade} custom={0} className="max-w-xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Six modules. Zero compromises.</h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-lg">Every module works together. No add-ons, no per-feature pricing.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <motion.div
                key={i}
                variants={fade}
                custom={i}
                className="group p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center mb-4`}>
                  <mod.icon size={20} className={mod.accent} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">{mod.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Extras strip */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <span className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mr-1">Also built in:</span>
            {extras.map((e, i) => (
              <motion.span key={i} variants={fade} custom={i} className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <e.icon size={13} strokeWidth={1.5} className="text-neutral-400 dark:text-neutral-500" />
                {e.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-neutral-900/30 border-y border-neutral-200/30 dark:border-neutral-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fade} custom={0} className="text-center max-w-xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">Why switch</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Less friction. More focus.</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} variants={fade} custom={i} className="text-center">
                <div className="w-11 h-11 mx-auto mb-4 rounded-xl bg-primary-500/10 dark:bg-primary-500/15 border border-primary-200/40 dark:border-primary-800/30 flex items-center justify-center">
                  <b.icon size={18} className="text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1.5">{b.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Comparison */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="mt-20 max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200/50 dark:border-neutral-700/50">
                    <th className="text-left px-4 sm:px-5 py-3.5 text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 w-2/5" />
                    <th className="text-center px-3 py-3.5 text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Spreadsheets</th>
                    <th className="text-center px-3 py-3.5 text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Multiple tools</th>
                    <th className="text-center px-3 py-3.5 text-xs uppercase tracking-wider font-semibold text-primary-600 dark:text-primary-400">IT Hub Center</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800/60">
                      <td className="px-4 sm:px-5 py-2.5 text-neutral-600 dark:text-neutral-300 text-sm">{row.cap}</td>
                      <td className="text-center px-3 py-2.5">{row.old ? <span className="text-neutral-300 dark:text-neutral-600 text-xs">~</span> : <Minus size={14} className="text-neutral-200 dark:text-neutral-700 mx-auto" />}</td>
                      <td className="text-center px-3 py-2.5">{row.multi ? <Check size={14} className="text-neutral-400 dark:text-neutral-500 mx-auto" /> : <Minus size={14} className="text-neutral-200 dark:text-neutral-700 mx-auto" />}</td>
                      <td className="text-center px-3 py-2.5"><Check size={14} className="text-primary-600 dark:text-primary-400 mx-auto" strokeWidth={2.5} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fade} custom={0} className="text-center max-w-xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">From early adopters</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Teams that made the switch</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fade}
                custom={i}
                className="p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-700/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-semibold text-white shadow-lg shadow-primary-500/20">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{t.role} &middot; {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-neutral-900/30 border-y border-neutral-200/30 dark:border-neutral-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fade} custom={0} className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Simple, transparent pricing</h2>
            <p className="mt-3 text-neutral-500 dark:text-neutral-400">Every plan includes every module. No feature gates.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={i}
                variants={fade}
                custom={i}
                className={`relative flex flex-col p-6 sm:p-7 rounded-2xl border h-full transition-all duration-300 ${tier.highlighted
                  ? 'bg-white dark:bg-neutral-800 border-primary-300 dark:border-primary-700/50 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20'
                  : 'bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-5 px-3 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-full">Most popular</div>
                )}
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{tier.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">{tier.price}</span>
                  {tier.period && <span className="text-sm text-neutral-400 dark:text-neutral-500">{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{tier.desc}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {tier.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-neutral-600 dark:text-neutral-300">{feat}</span>
                    </li>
                  ))}
                </ul>
                <a href="/#/register" className={`mt-7 block text-center px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 active:scale-95 ${tier.highlighted
                  ? 'text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30'
                  : 'text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600'
                }`}>
                  {tier.cta}
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-10">Frequently asked questions</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-0">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fade} custom={i} className="border-b border-neutral-200/50 dark:border-neutral-700/50">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full py-4 text-left group">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 pr-4 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{faq.q}</span>
                  <ChevronDown size={15} className={`text-neutral-400 dark:text-neutral-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-neutral-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0} className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 sm:p-16 rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm overflow-hidden shadow-glass">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-primary-200/20 dark:from-primary-900/20 to-transparent rounded-full blur-3xl -translate-y-1/2" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Ready to simplify your IT stack?
              </h2>
              <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
                30 days free. All features. No credit card.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="/#/register" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 active:scale-95">
                  Get started for free
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-2">
              <a href="/#/" className="flex items-center gap-2">
                <Logo className="w-7 h-7" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">IT Hub Center</span>
              </a>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                IT service management for teams that want one tool instead of six. Built in Italy, hosted in the EU.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                <span>GDPR</span>
                <span>&middot;</span>
                <span>AES-256</span>
                <span>&middot;</span>
                <span>EU data centers</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Product</h4>
              <div className="flex flex-col gap-2">
                {[{ id: 'features', label: 'Features' }, { id: 'benefits', label: 'Benefits' }, { id: 'pricing', label: 'Pricing' }].map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id)} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-left">{item.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Company</h4>
              <div className="flex flex-col gap-2">
                <a href="/#/privacy" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                <a href="/#/terms" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Service</a>
                <a href="mailto:support@ithubcenter.com" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">support@ithubcenter.com</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-neutral-200/30 dark:border-neutral-800/50">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">&copy; {new Date().getFullYear()} IT Hub Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
