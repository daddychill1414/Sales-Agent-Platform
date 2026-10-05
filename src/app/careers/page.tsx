"use client";

import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { CheckCircle2, Target, BookOpen, MapPin, Clock, Loader2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useEffect, useState } from 'react';

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    benefits: string[];
    salary_range: string;
}

export default function Careers() {
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPositions() {
            try {
                const res = await fetch('/api/job-positions', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPositions(data.positions || []);
                }
            } catch (err) {
                console.error('Failed to fetch positions:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPositions();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16 selection:bg-accent selection:text-black">
            <Navbar />

            <main className="max-w-6xl mx-auto w-full flex-grow mb-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mb-24">
                    <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold mb-8 heading-sans tracking-tighter">
                        Find your <span className="text-accent heading-serif italic font-normal tracking-normal pr-2">calling.</span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-2xl text-muted max-w-3xl font-light leading-relaxed">
                        We are looking for ambitious, driven individuals who want to take control of their career and earn what they are truly worth.
                    </motion.p>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                ) : positions.length > 0 ? (
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
                        {positions.map((position) => (
                            <motion.div key={position.id} variants={fadeInUp} className="glass-panel p-12 rounded-[2rem] border border-white/5 shadow-2xl">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                                    <div className="flex-grow">
                                        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-sans tracking-tight">{position.title}</h2>
                                        <div className="flex flex-wrap gap-4 items-center mb-8 text-sm font-medium">
                                            <span className="bg-accent/20 text-accent px-5 py-2.5 rounded-full border border-accent/20 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> {position.location || 'Remote'}
                                            </span>
                                            <span className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-white/80 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> {position.type || 'Full-Time'}
                                            </span>
                                            {position.department && (
                                                <span className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-white/80 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4" /> {position.department}
                                                </span>
                                            )}
                                            {position.salary_range && (
                                                <span className="bg-green-500/10 border border-green-500/20 px-5 py-2.5 rounded-full text-green-400 font-bold">
                                                    {position.salary_range}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted leading-relaxed mb-8 text-xl font-light">{position.description}</p>

                                        {position.requirements && position.requirements.length > 0 && (
                                            <div className="mb-8">
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                                                    <Target className="text-accent w-5 h-5" /> Requirements
                                                </h3>
                                                <ul className="space-y-3 text-muted font-light">
                                                    {position.requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start gap-4">
                                                            <CheckCircle2 className="w-5 h-5 text-accent/80 shrink-0 mt-0.5" /> {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {position.benefits && position.benefits.length > 0 && (
                                            <div className="mb-8">
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                                                    <BookOpen className="text-accent w-5 h-5" /> Benefits
                                                </h3>
                                                <ul className="space-y-3 text-muted font-light">
                                                    {position.benefits.map((benefit, i) => (
                                                        <li key={i} className="flex items-start gap-4">
                                                            <CheckCircle2 className="w-5 h-5 text-green-400/80 shrink-0 mt-0.5" /> {benefit}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:sticky lg:top-40 shrink-0 lg:w-56">
                                        <Link href={`/apply?position=${position.id}`} className="btn-primary w-full text-center text-lg py-4 shadow-lg shadow-accent/20 block">
                                            Apply Now
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                        <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white/60 mb-3">No Open Positions</h3>
                        <p className="text-muted text-lg">Check back later for new opportunities at OneNetworx.</p>
                    </div>
                )}

                {/* The Process Section - always visible */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mt-32">
                    <motion.div variants={fadeInUp}>
                        <h3 className="text-4xl font-bold mb-12 flex items-center gap-4 heading-sans tracking-tight">
                            <BookOpen className="text-accent w-8 h-8" /> The Process
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { step: '01', label: 'Quality Applicant Review' },
                                { step: '02', label: 'Orientation & Training' },
                                { step: '03', label: 'Targeted Evaluation Exam' },
                                { step: '04', label: 'Final Interview & Hired' },
                            ].map((item) => (
                                <motion.div key={item.step} variants={fadeInUp} className="glass-panel p-8 rounded-[2rem] border border-white/5 text-center">
                                    <span className="text-4xl font-bold text-accent font-mono mb-4 block">{item.step}</span>
                                    <p className="text-muted text-lg font-light">{item.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}
