"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface ScreeningQuestion {
    id: string;
    question_text: string;
    question_type: 'yes_no' | 'multiple_choice' | 'text' | 'number_range';
    options: string[];
    is_required: boolean;
    order_index: number;
}

interface ScreeningStepProps {
    responses: Record<string, string>;
    onResponseChange: (questionId: string, answer: string) => void;
    errors: Record<string, string>;
    positionId?: string;
}

export function ScreeningStep({ responses, onResponseChange, errors, positionId }: ScreeningStepProps) {
    const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchQuestions() {
            if (!positionId) {
                setLoading(false);
                setDebugError('positionId is completely empty.');
                return;
            }
            try {
                const res = await fetch(`/api/screening?jobId=${positionId}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data.questions || []);
                } else {
                    const r = await res.text();
                    setDebugError(`HTTP ${res.status}: ${r}`);
                }
            } catch (err: any) {
                console.error('Failed to fetch screening questions:', err);
                setDebugError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchQuestions();
    }, [positionId]);

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                        <div className="h-12 bg-white/5 rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (debugError) {
        return (
            <div className="p-8 border-2 border-red-500/50 rounded-2xl bg-red-500/10 text-red-500 font-mono text-sm break-all">
                <h3 className="font-bold mb-2">DEBUG ERROR</h3>
                {debugError}
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <motion.div variants={fadeInUp} className="text-center py-12 text-muted">
                <p>No screening questions configured yet.</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="screening"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInUp}
            className="space-y-8"
        >
            <div className="glass-panel p-6 rounded-2xl border border-accent/20 bg-accent/5 mb-8">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-white/70 leading-relaxed">
                        Please answer all questions honestly. Your responses help us match you with the right opportunities.
                    </p>
                </div>
            </div>

            {questions.map((q, index) => (
                <div key={q.id} className="space-y-3">
                    <label className="text-sm font-medium text-white/80 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 border border-white/10">
                            {index + 1}
                        </span>
                        {q.question_text}
                        {q.is_required && <span className="text-accent text-xs">*</span>}
                    </label>

                    {/* Yes/No questions */}
                    {q.question_type === 'yes_no' && (
                        <div className="flex gap-4">
                            {(q.options.length > 0 ? q.options : ['Yes', 'No']).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onResponseChange(q.id, option)}
                                    className={`flex-1 py-4 px-6 rounded-2xl border text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                        responses[q.id] === option
                                            ? 'bg-accent/10 border-accent/30 text-accent'
                                            : 'bg-[#0D0D12]/50 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    {responses[q.id] === option && (
                                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                                    )}
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Multiple choice questions */}
                    {q.question_type === 'multiple_choice' && (
                        <div className="relative">
                            <select
                                value={responses[q.id] || ''}
                                onChange={(e) => onResponseChange(q.id, e.target.value)}
                                className={`w-full bg-[#0D0D12]/50 border ${
                                    errors[q.id] ? 'border-red-500' : 'border-white/10'
                                } rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors appearance-none cursor-pointer text-white`}
                            >
                                <option value="" disabled className="text-white/40">Select an option...</option>
                                {q.options.map((option) => (
                                    <option key={option} value={option} className="bg-[#0D0D12] text-white">
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                        </div>
                    )}

                    {/* Text input questions */}
                    {q.question_type === 'text' && (
                        <input
                            type="text"
                            value={responses[q.id] || ''}
                            onChange={(e) => onResponseChange(q.id, e.target.value)}
                            className={`w-full bg-[#0D0D12]/50 border ${
                                errors[q.id] ? 'border-red-500' : 'border-white/10'
                            } rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`}
                            placeholder="Type your answer..."
                        />
                    )}

                    {errors[q.id] && (
                        <p className="text-red-500 text-sm mt-1">{errors[q.id]}</p>
                    )}
                </div>
            ))}
        </motion.div>
    );
}
