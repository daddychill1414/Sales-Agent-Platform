"use client";

import { Navbar } from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Question {
    id: string;
    question_text: string;
    options: { text: string; isCorrect?: boolean }[];
    order_index: number;
}

interface ExamInfo {
    id: string;
    exam_id: string;
    exam_title: string;
    exam_description: string;
    status: string;
    score: number | null;
    questions: Question[];
}

export default function ExamPage() {
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchExam() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/sign-in');
                    return;
                }

                // Get assigned exam
                const { data: assignedExams, error: aeError } = await supabase
                    .from('applicant_exams')
                    .select('id, exam_id, score, status, exams(title, description)')
                    .eq('applicant_id', user.id)
                    .order('assigned_at', { ascending: false })
                    .limit(1);

                if (aeError || !assignedExams || assignedExams.length === 0) {
                    setLoading(false);
                    return;
                }

                const ae = assignedExams[0];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const examData = ae.exams as any;

                // If already completed, show result
                if (ae.status === 'Passed' || ae.status === 'Failed') {
                    setExamInfo({
                        id: ae.id,
                        exam_id: ae.exam_id,
                        exam_title: examData?.title || 'Assessment',
                        exam_description: examData?.description || '',
                        status: ae.status,
                        score: ae.score,
                        questions: [],
                    });
                    setLoading(false);
                    return;
                }

                // Fetch questions
                const { data: questions, error: qError } = await supabase
                    .from('exam_questions')
                    .select('id, question_text, options, order_index')
                    .eq('exam_id', ae.exam_id)
                    .order('order_index', { ascending: true });

                if (qError) {
                    console.error('Questions fetch error:', qError);
                }

                setExamInfo({
                    id: ae.id,
                    exam_id: ae.exam_id,
                    exam_title: examData?.title || 'Assessment',
                    exam_description: examData?.description || '',
                    status: ae.status,
                    score: ae.score,
                    questions: (questions || []).map(q => ({
                        ...q,
                        options: (q.options as { text: string; isCorrect?: boolean }[]).map(o => ({ text: o.text })), // Strip isCorrect from client
                    })),
                });
            } catch (err) {
                console.error('Exam fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchExam();
    }, [router]);

    const handleSelect = (questionId: string, optionText: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionText }));
    };

    const handleSubmit = async () => {
        if (!examInfo) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/exam/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: examInfo.exam_id,
                    applicantExamId: examInfo.id,
                    answers,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        );
    }

    // No exam assigned
    if (!examInfo) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16">
                <Navbar />
                <main className="max-w-3xl mx-auto w-full text-center py-32">
                    <Clock className="w-16 h-16 text-white/20 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">No Assessment Assigned</h1>
                    <p className="text-muted text-xl font-light mb-8">
                        You do not have an exam assigned yet. Your recruiter will schedule one when you reach the exam stage.
                    </p>
                    <button onClick={() => router.push('/dashboard')} className="btn-primary px-8 py-4">
                        Back to Dashboard
                    </button>
                </main>
            </div>
        );
    }

    // Already completed
    if (examInfo.status === 'Passed' || examInfo.status === 'Failed') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16">
                <Navbar />
                <main className="max-w-3xl mx-auto w-full text-center py-20">
                    <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center ${examInfo.status === 'Passed' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                        {examInfo.status === 'Passed' ? <CheckCircle className="w-12 h-12 text-green-400" /> : <XCircle className="w-12 h-12 text-red-400" />}
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">
                        {examInfo.status === 'Passed' ? 'Congratulations!' : 'Assessment Complete'}
                    </h1>
                    <p className="text-muted text-xl font-light mb-6">{examInfo.exam_title}</p>
                    <div className={`inline-flex items-center px-8 py-4 rounded-2xl text-4xl font-bold ${examInfo.status === 'Passed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {examInfo.score}%
                    </div>
                    <p className="text-muted mt-8 text-lg font-light">
                        {examInfo.status === 'Passed' ? 'You passed! Our team will be in touch regarding next steps.' : 'Unfortunately you did not meet the passing threshold. Please contact our team.'}
                    </p>
                    <button onClick={() => router.push('/dashboard')} className="btn-primary px-8 py-4 mt-8">
                        Back to Dashboard
                    </button>
                </main>
            </div>
        );
    }

    // Result just submitted
    if (result) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16">
                <Navbar />
                <main className="max-w-3xl mx-auto w-full text-center py-20">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center ${result.passed ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                            {result.passed ? <CheckCircle className="w-12 h-12 text-green-400" /> : <XCircle className="w-12 h-12 text-red-400" />}
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">
                            {result.passed ? 'You Passed! 🎉' : 'Assessment Complete'}
                        </h1>
                        <div className={`inline-flex items-center px-8 py-4 rounded-2xl text-4xl font-bold mb-4 ${result.passed ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {result.score}%
                        </div>
                        <p className="text-muted text-lg font-light mb-4">{result.correct} of {result.total} correct</p>
                        <p className="text-muted text-lg font-light mb-8">
                            {result.passed ? 'Excellent work! Our team will contact you about the next steps.' : 'Unfortunately you did not pass. Please contact our team for more information.'}
                        </p>
                        <button onClick={() => router.push('/dashboard')} className="btn-primary px-8 py-4">
                            Back to Dashboard
                        </button>
                    </motion.div>
                </main>
            </div>
        );
    }

    // Active exam
    const totalQuestions = examInfo.questions.length;
    const question = examInfo.questions[currentQuestion];
    const allAnswered = examInfo.questions.every(q => answers[q.id]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16">
            <Navbar />
            <main className="max-w-3xl mx-auto w-full mb-32">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-3">{examInfo.exam_title}</h1>
                    <p className="text-muted text-lg font-light">{examInfo.exam_description}</p>
                </div>

                {/* Progress */}
                <div className="mb-12">
                    <div className="flex justify-between text-sm text-white/40 mb-3 font-mono">
                        <span>Question {currentQuestion + 1} of {totalQuestions}</span>
                        <span>{Object.keys(answers).length}/{totalQuestions} answered</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }} />
                    </div>
                </div>

                {/* Question */}
                {question && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-panel rounded-[2rem] border border-white/5 p-10 shadow-xl mb-10"
                        >
                            <h2 className="text-2xl font-bold mb-8 tracking-tight">{question.question_text}</h2>
                            <div className="space-y-4">
                                {question.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(question.id, option.text)}
                                        className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${answers[question.id] === option.text
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[question.id] === option.text ? 'border-accent' : 'border-white/20'}`}>
                                            {answers[question.id] === option.text && <div className="w-3 h-3 rounded-full bg-accent" />}
                                        </div>
                                        <span className="text-lg">{option.text}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="btn-outline px-6 py-3 disabled:opacity-30"
                    >
                        Previous
                    </button>

                    {currentQuestion < totalQuestions - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                            className="btn-primary px-6 py-3 flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!allAnswered || submitting}
                            className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Submit Exam
                        </button>
                    )}
                </div>

                {/* Question Dots Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mt-10">
                    {examInfo.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(idx)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                idx === currentQuestion
                                    ? 'bg-accent text-black'
                                    : answers[q.id]
                                        ? 'bg-accent/20 text-accent border border-accent/30'
                                        : 'bg-white/5 text-white/40 border border-white/10'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}
