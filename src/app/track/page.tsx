"use client";

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Search, Loader2, CheckCircle2, Clock, ArrowLeft, FileSearch } from 'lucide-react';
import Link from 'next/link';
import { getStageBadgeClass } from '@/lib/permissions';

interface ApplicationResult {
    trackingCode: string;
    name: string;
    stage: string;
    appliedAt: string;
}

export default function TrackPage() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'code' | 'email'>('code');
    const [results, setResults] = useState<ApplicationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const param = searchType === 'code'
                ? `trackingCode=${encodeURIComponent(query.trim())}`
                : `email=${encodeURIComponent(query.trim())}`;

            const res = await fetch(`/api/applications?${param}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Lookup failed');
                setResults([]);
            } else {
                setResults(data.applications || []);
            }
        } catch {
            setError('Network error. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    /**
     * Maps pipeline stages to a visual step progression.
     */
    const getStageProgress = (stage: string): number => {
        const stageMap: Record<string, number> = {
            'New': 1,
            'Screening Review': 2,
            'Qualified': 3,
            'Account Invited': 3,
            'Exam Assigned': 4,
            'Exam Completed': 4,
            'Interview Scheduled': 5,
            'Interview Completed': 5,
            'Offer Extended': 6,
            'Contract Sent': 6,
            'Contract Signed': 7,
            'Hired': 7,
            'Disqualified': 0,
            'Rejected': 0,
            'Withdrawn': 0,
        };
        return stageMap[stage] ?? 1;
    };

    const VISUAL_STAGES = [
        'Applied',
        'Under Review',
        'Qualified',
        'Assessment',
        'Interview',
        'Offer',
        'Hired',
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16 selection:bg-accent selection:text-black">
            <Navbar />
            <main className="max-w-3xl mx-auto w-full flex-grow mb-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    <motion.div variants={fadeInUp} className="mb-6">
                        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-accent text-sm font-mono uppercase tracking-widest transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold mb-4 heading-sans tracking-tight">
                        Track your <span className="text-accent heading-serif italic font-normal tracking-wide pr-2">application.</span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-muted text-xl font-light mb-12">
                        Enter your tracking code or email to check the status of your application.
                    </motion.p>

                    {/* Search Form */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 md:p-10 rounded-[2rem] border border-white/5 shadow-2xl mb-10">
                        {/* Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setSearchType('code')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                    searchType === 'code'
                                        ? 'bg-accent/10 text-accent border border-accent/20'
                                        : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'
                                }`}
                            >
                                Tracking Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType('email')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                    searchType === 'email'
                                        ? 'bg-accent/10 text-accent border border-accent/20'
                                        : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'
                                }`}
                            >
                                Email
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type={searchType === 'email' ? 'email' : 'text'}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchType === 'code' ? 'e.g. ONX-2026-1234' : 'e.g. john@example.com'}
                                    className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-2xl pl-14 pr-6 py-5 focus:outline-none focus:border-accent transition-colors text-lg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="btn-primary px-8 py-5 shrink-0 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                            </button>
                        </form>
                    </motion.div>

                    {/* Results */}
                    <AnimatePresence mode="wait">
                        {searched && !loading && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                {error && (
                                    <div className="glass-panel p-8 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-center">
                                        <p className="text-red-400 font-medium">{error}</p>
                                    </div>
                                )}

                                {!error && results.length === 0 && (
                                    <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                                        <FileSearch className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold mb-2">No Application Found</h3>
                                        <p className="text-muted font-light">
                                            Please check your tracking code or email and try again.
                                        </p>
                                    </div>
                                )}

                                {!error && results.length > 0 && results.map((app, index) => {
                                    const progress = getStageProgress(app.stage);
                                    const isTerminated = ['Disqualified', 'Rejected', 'Withdrawn'].includes(app.stage);

                                    return (
                                        <div key={index} className="glass-panel p-8 md:p-10 rounded-[2rem] border border-white/5 shadow-2xl mb-6">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <p className="text-xs text-muted uppercase tracking-[0.3em] font-mono font-bold mb-2">Tracking Code</p>
                                                    <p className="text-2xl font-bold text-accent font-mono tracking-wider">{app.trackingCode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted uppercase tracking-[0.3em] font-mono mb-2">Applied</p>
                                                    <div className="flex items-center gap-2 text-white/60">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="font-mono text-sm">{formatDate(app.appliedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Current Status */}
                                            <div className="mb-8">
                                                <p className="text-xs text-muted uppercase tracking-[0.3em] font-mono font-bold mb-3">Current Status</p>
                                                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest border ${getStageBadgeClass(app.stage)}`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {app.stage}
                                                </span>
                                            </div>

                                            {/* Visual Progress Pipeline */}
                                            {!isTerminated && (
                                                <div>
                                                    <p className="text-xs text-muted uppercase tracking-[0.3em] font-mono font-bold mb-4">Progress</p>
                                                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                                                        {VISUAL_STAGES.map((stageName, i) => {
                                                            const stageNum = i + 1;
                                                            const isActive = stageNum <= progress;
                                                            const isCurrent = stageNum === progress;

                                                            return (
                                                                <div key={i} className="flex items-center">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                                            isCurrent
                                                                                ? 'bg-accent text-black ring-4 ring-accent/20'
                                                                                : isActive
                                                                                    ? 'bg-accent/30 text-accent'
                                                                                    : 'bg-white/5 text-white/20 border border-white/10'
                                                                        }`}>
                                                                            {isActive ? '✓' : stageNum}
                                                                        </div>
                                                                        <span className={`text-[9px] font-mono uppercase tracking-wider mt-2 whitespace-nowrap ${
                                                                            isCurrent ? 'text-accent font-bold' : isActive ? 'text-white/50' : 'text-white/20'
                                                                        }`}>
                                                                            {stageName}
                                                                        </span>
                                                                    </div>
                                                                    {i < VISUAL_STAGES.length - 1 && (
                                                                        <div className={`w-6 h-[2px] mx-1 mt-[-18px] ${
                                                                            stageNum < progress ? 'bg-accent/40' : 'bg-white/10'
                                                                        }`} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    );
}
