"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3, Users, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { FeatureCards } from '@/components/FeatureCards';
import { PhilosophySection } from '@/components/PhilosophySection';
import { ProtocolCards } from '@/components/ProtocolCards';
import { HeroBackground } from '@/components/HeroBackground';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Fallbacks in case settings fail to load
  const heroHeading = settings?.hero_heading || 'Elite Remote Sales. Zero Compromise.';
  const heroSubheading = settings?.hero_subheading || 'Join the top 1% of distributed agents.';
  const heroImage = settings?.hero_image_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';
  const philosophyText = settings?.philosophy_main || '"The future of sales isn\'t in a cubicle. It\'s distributed, asynchronous, and utterly relentless."';

  // Helper to colorize the last word of the heading (matching original Golden Whisk design)
  const headingWords = heroHeading.split(' ');
  const lastWord = headingWords.pop();
  const mainHeading = headingWords.join(' ');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />

      {/* ============================================================
          HERO SECTION — "The Opening Shot"
          100dvh, bottom-left content, full-bleed bg image + gradient
          ============================================================ */}
      <section id="hero-section" className="relative h-screen min-h-[700px] flex flex-col justify-end pb-32 px-8 md:px-16 z-10 selection:bg-accent selection:text-black">
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full"
          >
            <Image
              src={heroImage}
              alt="Business Background"
              fill
              priority
              className="object-cover grayscale mix-blend-luminosity"
              sizes="100vw"
            />
          </motion.div>
          {/* Animated network particle canvas */}
          <div className="absolute inset-0 z-20">
            <HeroBackground />
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl"
        >
          <motion.p variants={fadeInUp} className="text-accent uppercase tracking-[0.3em] font-bold text-xs md:text-sm mb-6 flex items-center gap-4">
            <span className="w-12 h-[2px] bg-accent"></span>
            Sales Agent Platform
          </motion.p>
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 leading-[0.9] heading-sans">
            {mainHeading} <span className="text-accent heading-serif italic font-normal tracking-tight pr-4">{lastWord}</span>
          </motion.h1>
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl text-white/70 font-light mb-12 max-w-2xl leading-relaxed">
            {heroSubheading}
          </motion.h2>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Link id="hero-cta-apply" href="/careers" className="btn-primary group text-lg px-10 py-5 shadow-2xl shadow-accent/20">
              <span className="btn-slide" />
              Apply Now
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link id="hero-cta-requirements" href="/careers" className="btn-outline text-lg px-10 py-5 hover:border-accent">
              <span className="btn-slide" />
              <span>View Requirements</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================
          FEATURES — Interactive Functional Artifacts
          Diagnostic Shuffler, Telemetry Typewriter, Cursor Scheduler
          ============================================================ */}
      <FeatureCards />

      {/* ============================================================
          PHILOSOPHY — "The Manifesto"
          ============================================================ */}
      <PhilosophySection mainQuote={philosophyText} />

      {/* ============================================================
          EARNINGS PROJECTION GRAPH
          ============================================================ */}
      <section id="metrics-section" className="py-32 px-8 md:px-16 bg-[#0D0D12] relative z-20 border-t border-b border-white/5">
        <div className="absolute inset-0 bg-accent/5 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10"
        >
          {/* Left Content */}
          <div className="flex-1 w-full lg:pr-10">
            <motion.div variants={fadeInUp} className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 border border-accent/20">
              <BarChart3 className="w-8 h-8 text-accent" />
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tighter leading-tight">
              The metrics of <span className="text-accent heading-serif italic font-normal">success.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted mb-10 leading-relaxed max-w-lg font-light">
              We believe in total transparency. See exactly how our applicant pipeline funnels the best talent into high-earning, long-lasting careers with uncapped commission.
            </motion.p>

            <div className="grid grid-cols-2 gap-6">
              <motion.div variants={fadeInUp} className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                <p className="text-4xl font-bold text-white mb-1">₱150k<span className="text-accent">+</span></p>
                <p className="text-sm text-muted font-mono uppercase tracking-widest">Avg Top Earner / Mo</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                <p className="text-4xl font-bold text-white mb-1">12<span className="text-accent">%</span></p>
                <p className="text-sm text-muted font-mono uppercase tracking-widest">Hired Rate</p>
              </motion.div>
            </div>
          </div>

          {/* Right Graph Visualization */}
          <motion.div variants={fadeInUp} className="flex-1 w-full max-w-2xl bg-black/40 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-widest mb-12 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Pipeline Data
            </h3>

            <div className="h-64 flex items-end justify-between gap-3 relative pb-8 mt-12 border-b border-white/10">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full h-px border-t border-dashed border-white/5" />
                ))}
              </div>

              {/* Chart Bars */}
              {[
                { label: 'Applied', value: 100 },
                { label: 'Screened', value: 40 },
                { label: 'Trained', value: 25 },
                { label: 'Hired', value: 12 },
                { label: 'Apex Tier', value: 5 },
              ].map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 relative z-10 group">
                  <div className="w-full relative flex justify-center h-full items-end">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      whileInView={{ height: `${data.value}%`, opacity: 1 }}
                      transition={{ duration: 1, delay: i * 0.15, ease: [0.25, 1, 0.5, 1] }}
                      className={`w-full max-w-[3rem] rounded-t-lg transition-all border-t border-white/20 relative group-hover:brightness-125
                        ${i === 4 ? 'bg-accent shadow-[0_0_30px_rgba(201,168,76,0.3)]' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      {i === 4 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.5 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-accent text-xs font-bold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap"
                        >
                          Apex Tier
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs text-white/40 font-mono absolute -bottom-8 whitespace-nowrap">{data.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================
          PROTOCOL — Sticky Stacking Cards
          ============================================================ */}
      <ProtocolCards />

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}
      <section id="testimonials-section" className="py-40 px-8 md:px-16 bg-[#0a0a0f] relative z-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-20">
            <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-bold mb-6 tracking-tighter">
              Stories from the <span className="heading-serif italic text-accent font-normal">field.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed">
              Hear directly from our active agents about their experience, onboarding, and how they built their success with us.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The provided leads and immediate access to the HR Knowledge Base gave me a massive headstart. The training isn't just theory, it's actionable sales tactics.",
                author: "Maria S.",
                role: "Senior Closer",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80"
              },
              {
                quote: "I've worked at three different agencies, and none had a portal this organized. The uncapped commissions and transparent career pipeline keep me motivated every day.",
                author: "David L.",
                role: "Sales Specialist",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"
              },
              {
                quote: "Reaching the Apex Tier in just 8 months changed my life. The system works if you put in the hours, and the management actually supports your growth.",
                author: "Sarah C.",
                role: "Apex Tier Agent",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80"
              }
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-panel p-10 rounded-[2rem] border border-white/5 hover:border-accent/30 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-accent fill-accent" />
                    ))}
                  </div>
                  <p className="text-lg text-white/90 leading-relaxed mb-8 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Image src={testimonial.image} alt={testimonial.author} width={56} height={56} className="w-14 h-14 rounded-full object-cover border-2 border-accent/20" />
                  <div>
                    <h4 className="font-bold text-white">{testimonial.author}</h4>
                    <p className="text-sm text-accent font-mono">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ============================================================
          FOOTER CTA
          ============================================================ */}
      <section id="footer-cta-section" className="py-48 px-8 text-center bg-[#0D0D12] relative overflow-hidden z-30 border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.h2 variants={fadeInUp} className="text-6xl md:text-8xl heading-serif italic mb-8">Ready to start?</motion.h2>
          <motion.p variants={fadeInUp} className="text-2xl text-muted mb-16 font-light leading-relaxed">
            Join OneNetworx today and discover what it truly means to be your own boss with endless earning potentials.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link id="footer-cta-apply" href="/careers" className="btn-primary text-2xl px-16 py-6 shadow-2xl shadow-accent/20">
              <span className="btn-slide" />
              Submit Application
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
