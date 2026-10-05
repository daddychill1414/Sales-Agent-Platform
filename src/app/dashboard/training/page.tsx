"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Navbar } from '@/components/Navbar';
import {
    GraduationCap, Video, FileText, CheckCircle2, Loader2,
    ChevronRight, Lock, PlayCircle, BookOpen, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface TrainingModule {
    id: string;
    title: string;
    description: string;
    content: string;
    video_url: string;
    order_index: number;
    is_required: boolean;
}

interface TrainingProgress {
    module_id: string;
    completed: boolean;
    completed_at: string | null;
}

export default function AgentTrainingPage() {
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [progress, setProgress] = useState<TrainingProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [completing, setCompleting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            // Fetch active modules
            const res = await fetch('/api/training');
            if (res.ok) {
                const data = await res.json();
                setModules((data.modules || []).filter((m: TrainingModule) => m.is_required || true).sort((a: TrainingModule, b: TrainingModule) => a.order_index - b.order_index));
            }

            // Fetch user progress
            const { data: progressData } = await supabase
                .from('training_progress')
                .select('module_id, completed, completed_at')
                .eq('user_id', user.id);

            if (progressData) setProgress(progressData);
        } catch (err) {
            console.error('Training fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [router, supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isCompleted = (moduleId: string) => progress.some(p => p.module_id === moduleId && p.completed);

    const markComplete = async (moduleId: string) => {
        setCompleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('training_progress').upsert({
                user_id: user.id,
                module_id: moduleId,
                completed: true,
                completed_at: new Date().toISOString(),
            });

            setProgress(prev => [...prev.filter(p => p.module_id !== moduleId), { module_id: moduleId, completed: true, completed_at: new Date().toISOString() }]);
        } catch (err) {
            console.error('Mark complete error:', err);
        } finally {
            setCompleting(false);
        }
    };

    const completedCount = modules.filter(m => isCompleted(m.id)).length;
    const totalRequired = modules.filter(m => m.is_required).length;
    const progressPercent = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
    };

    const activeModuleData = modules.find(m => m.id === activeModule);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Navbar />
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-muted font-mono text-sm uppercase tracking-widest">Loading training...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-32 px-8 md:px-16 selection:bg-accent selection:text-black">
            <Navbar />

            <main className="max-w-6xl mx-auto w-full flex-grow mb-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    {/* Header */}
                    <motion.div variants={fadeInUp} className="mb-10">
                        <Link href="/dashboard" className="text-accent text-sm font-bold mb-4 inline-flex items-center gap-1 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                            Training Portal
                        </h1>
                        <p className="text-muted text-lg font-light">
                            Complete all required training modules to proceed in the onboarding process.
                        </p>
                    </motion.div>

                    {/* Progress Bar */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="w-6 h-6 text-accent" />
                                <h2 className="text-xl font-bold tracking-tight">Your Progress</h2>
                            </div>
                            <span className="text-2xl font-bold font-mono text-accent">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="bg-accent h-full rounded-full"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-white/40 font-mono">
                            <span>{completedCount} of {modules.length} modules completed</span>
                            <span>{totalRequired} required</span>
                        </div>
                    </motion.div>

                    {/* Active Module View */}
                    {activeModuleData ? (
                        <motion.div variants={fadeInUp} className="glass-panel rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden mb-10">
                            {/* Video */}
                            {activeModuleData.video_url && getEmbedUrl(activeModuleData.video_url) && (
                                <div className="aspect-video w-full bg-black">
                                    <iframe
                                        src={getEmbedUrl(activeModuleData.video_url)!}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title={activeModuleData.title}
                                    />
                                </div>
                            )}

                            <div className="p-8 md:p-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <span className="text-xs font-mono text-accent uppercase tracking-widest mb-2 block">
                                            Module {activeModuleData.order_index}
                                        </span>
                                        <h2 className="text-3xl font-bold tracking-tight">{activeModuleData.title}</h2>
                                    </div>
                                    <button
                                        onClick={() => setActiveModule(null)}
                                        className="btn-outline px-5 py-2.5 text-sm"
                                    >
                                        Back to List
                                    </button>
                                </div>

                                {activeModuleData.description && (
                                    <p className="text-white/60 text-lg font-light mb-8 leading-relaxed">{activeModuleData.description}</p>
                                )}

                                {/* Text Content */}
                                {activeModuleData.content && (
                                    <div className="prose prose-invert max-w-none mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <pre className="whitespace-pre-wrap text-sm text-white/70 leading-relaxed font-sans">{activeModuleData.content}</pre>
                                    </div>
                                )}

                                {/* Complete Button */}
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    {isCompleted(activeModuleData.id) ? (
                                        <div className="flex items-center gap-2 text-green-400 font-bold">
                                            <CheckCircle2 className="w-5 h-5" /> Module Completed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => markComplete(activeModuleData.id)}
                                            disabled={completing}
                                            className="btn-primary px-8 py-3 flex items-center gap-2"
                                        >
                                            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Mark as Complete
                                        </button>
                                    )}

                                    {/* Next Module */}
                                    {(() => {
                                        const idx = modules.findIndex(m => m.id === activeModuleData.id);
                                        const next = idx < modules.length - 1 ? modules[idx + 1] : null;
                                        if (!next) return null;
                                        return (
                                            <button
                                                onClick={() => setActiveModule(next.id)}
                                                className="text-accent text-sm font-bold flex items-center gap-1 hover:text-white transition-colors"
                                            >
                                                Next: {next.title} <ChevronRight className="w-4 h-4" />
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Module List */
                        <div className="space-y-4">
                            {modules.map((m, i) => {
                                const completed = isCompleted(m.id);
                                const prevCompleted = i === 0 || isCompleted(modules[i - 1].id);
                                const locked = !prevCompleted && !completed;

                                return (
                                    <motion.div
                                        key={m.id}
                                        variants={fadeInUp}
                                        className={`glass-panel p-6 rounded-2xl border transition-all cursor-pointer group ${
                                            completed
                                                ? 'border-green-500/20 bg-green-500/[0.02]'
                                                : locked
                                                ? 'border-white/5 opacity-50'
                                                : 'border-white/5 hover:border-accent/30 hover:bg-accent/[0.02]'
                                        }`}
                                        onClick={() => !locked && setActiveModule(m.id)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                                completed
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                    : locked
                                                    ? 'bg-white/5 border-white/10 text-white/20'
                                                    : 'bg-accent/10 border-accent/20 text-accent'
                                            }`}>
                                                {completed ? (
                                                    <CheckCircle2 className="w-6 h-6" />
                                                ) : locked ? (
                                                    <Lock className="w-5 h-5" />
                                                ) : (
                                                    <span className="font-bold font-mono text-sm">{i + 1}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-white text-lg">{m.title}</h3>
                                                    {m.is_required && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">Required</span>
                                                    )}
                                                    {m.video_url && <span title="Has video"><Video className="w-4 h-4 text-blue-400" /></span>}
                                                    {m.content && <span title="Has text content"><FileText className="w-4 h-4 text-green-400" /></span>}
                                                </div>
                                                {m.description && (
                                                    <p className="text-sm text-white/40 truncate">{m.description}</p>
                                                )}
                                            </div>

                                            <div className="shrink-0">
                                                {completed ? (
                                                    <span className="text-xs text-green-400 font-bold">DONE</span>
                                                ) : locked ? (
                                                    <span className="text-xs text-white/20 font-mono">LOCKED</span>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <PlayCircle className="w-5 h-5" />
                                                        <span className="text-sm font-bold">Start</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {modules.length === 0 && (
                                <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                                    <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <p className="text-xl font-bold mb-2">No Training Modules Available</p>
                                    <p className="text-white/40 font-light">Your training modules will appear here once assigned.</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
