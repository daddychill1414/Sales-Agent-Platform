"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, CheckSquare, Loader2, X, Save, ChevronDown, ChevronUp, Users, ChevronLeft, Briefcase } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    active: boolean;
}

interface Exam {
    id: string;
    job_id: string;
    title: string;
    description: string;
    active: boolean;
    questions: number;
    completions: number;
    avgScore: number;
    created_at: string;
}

interface Question {
    id?: string;
    question_text: string;
    options: { text: string; isCorrect: boolean }[];
    order_index: number;
}

interface Applicant {
    id: string;
    name: string;
    email: string;
    stage: string;
}

export default function ExamsPage() {
    const [jobs, setJobs] = useState<JobPosition[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
    const [loadingJobs, setLoadingJobs] = useState(true);

    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [expandedExam, setExpandedExam] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [assignExamId, setAssignExamId] = useState<string | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);

    // Create/edit form
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');

    // Load Jobs
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/admin/job-positions');
                if (res.ok) {
                    const data = await res.json();
                    setJobs(data.positions || []);
                }
            } catch (err) { console.error('Failed to load jobs'); } finally { setLoadingJobs(false); }
        };
        fetchJobs();
    }, []);

    const fetchExams = async (jobId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/exams?jobId=${jobId}`);
            if (res.ok) {
                const data = await res.json();
                setExams(data.exams || []);
            }
        } catch (err) {
            console.error('Fetch exams error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedJob) fetchExams(selectedJob.id);
    }, [selectedJob]);

    const fetchQuestions = async (examId: string) => {
        setQuestionsLoading(true);
        try {
            const res = await fetch(`/api/admin/exams/questions?examId=${examId}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
            }
        } catch (err) {
            console.error('Fetch questions error:', err);
        } finally {
            setQuestionsLoading(false);
        }
    };

    const handleCreateExam = async () => {
        if (!formTitle.trim() || !selectedJob) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: formTitle, description: formDesc, jobId: selectedJob.id }),
            });
            if (res.ok) {
                setFormTitle(''); setFormDesc(''); setShowCreate(false);
                fetchExams(selectedJob.id);
            }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleUpdateExam = async () => {
        if (!editingExam || !selectedJob) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/exams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingExam.id, title: formTitle, description: formDesc, jobId: selectedJob.id }),
            });
            if (res.ok) {
                setEditingExam(null); setFormTitle(''); setFormDesc('');
                fetchExams(selectedJob.id);
            }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleDeleteExam = async (id: string) => {
        if (!selectedJob || !confirm('Delete this exam and all its questions?')) return;
        try {
            await fetch('/api/admin/exams', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchExams(selectedJob.id);
        } catch (err) { console.error(err); }
    };

    const toggleExpand = (examId: string) => {
        if (expandedExam === examId) {
            setExpandedExam(null);
        } else {
            setExpandedExam(examId);
            fetchQuestions(examId);
        }
    };

    const addNewQuestion = () => {
        setQuestions(prev => [...prev, {
            question_text: '',
            options: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
            ],
            order_index: prev.length,
        }]);
    };

    const updateQuestion = (idx: number, field: string, value: string) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const updateOption = (qIdx: number, oIdx: number, text: string) => {
        setQuestions(prev => prev.map((q, i) => i === qIdx ? {
            ...q,
            options: q.options.map((o, j) => j === oIdx ? { ...o, text } : o),
        } : q));
    };

    const setCorrectOption = (qIdx: number, oIdx: number) => {
        setQuestions(prev => prev.map((q, i) => i === qIdx ? {
            ...q,
            options: q.options.map((o, j) => ({ ...o, isCorrect: j === oIdx })),
        } : q));
    };

    const removeQuestion = async (idx: number) => {
        const q = questions[idx];
        if (q.id) {
            await fetch('/api/admin/exams/questions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: q.id }),
            });
        }
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const saveQuestions = async (examId: string) => {
        setSaving(true);
        try {
            await fetch('/api/admin/exams/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId, questions }),
            });
            fetchQuestions(examId);
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const openAssignModal = async (examId: string) => {
        setAssignExamId(examId);
        try {
            const res = await fetch('/api/admin/applicants');
            if (res.ok) {
                const data = await res.json();
                setApplicants(data.applicants || []);
            }
        } catch (err) { console.error(err); }
    };

    const handleAssign = async (applicantId: string) => {
        if (!selectedJob) return;
        try {
            const res = await fetch('/api/admin/exams/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId, examId: assignExamId }),
            });
            if (res.ok) {
                setAssignExamId(null);
                fetchExams(selectedJob.id);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to assign');
            }
        } catch (err) { console.error(err); }
    };

    if (!selectedJob) {
        return (
            <div className="space-y-8 pb-32">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Assessment Center</h1>
                    <p className="text-muted font-light">Select a Job Position to configure its specific examinations.</p>
                </div>
                
                {loadingJobs ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : (
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map(job => (
                            <motion.button
                                key={job.id}
                                variants={fadeInUp}
                                onClick={() => setSelectedJob(job)}
                                className={`text-left p-6 glass-panel rounded-[2rem] border transition-all hover:-translate-y-1 hover:border-accent hover:shadow-xl hover:shadow-accent/5 ${job.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white tracking-tight leading-tight">{job.title}</h3>
                                        {job.department && <p className="text-xs text-white/40 uppercase tracking-widest">{job.department}</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-mono text-white/30">{job.location}</span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}>
                                        {job.active ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-4 focus:outline-none">
                        <ChevronLeft className="w-4 h-4" /> Back to Jobs
                    </button>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Exams: <span className="text-accent">{selectedJob.title}</span></h1>
                    <p className="text-muted font-light">Create, manage, and assign examinations uniquely tailored to this job position.</p>
                </div>
                <button onClick={() => { setShowCreate(true); setFormTitle(''); setFormDesc(''); }} className="btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus className="w-5 h-5" /> Create Assessment
                </button>
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {(showCreate || editingExam) && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCreate(false); setEditingExam(null); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0D0D12] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl">
                            <h2 className="text-2xl font-bold tracking-tight mb-6">{editingExam ? 'Edit' : 'Create New'} Assessment</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Title</label>
                                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Sales Aptitude Assessment" />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Description</label>
                                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors h-28 resize-none" placeholder="Describe the purpose of this exam..." />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => { setShowCreate(false); setEditingExam(null); }} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                                    <button onClick={editingExam ? handleUpdateExam : handleCreateExam} disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingExam ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Assign Modal */}
            <AnimatePresence>
                {assignExamId && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignExamId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0D0D12] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
                            <h2 className="text-2xl font-bold tracking-tight mb-6 shrink-0">Assign to Applicant</h2>
                            <div className="overflow-y-auto space-y-2 flex-grow">
                                {applicants.filter(a => a.stage !== 'Rejected' && a.stage !== 'Hired').map(a => (
                                    <button key={a.id} onClick={() => handleAssign(a.id)} className="w-full p-4 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{a.name}</p>
                                            <p className="text-xs text-white/40">{a.email} • {a.stage}</p>
                                        </div>
                                        <CheckSquare className="w-5 h-5 text-accent" />
                                    </button>
                                ))}
                                {applicants.length === 0 && <p className="text-center text-white/30 py-8">No applicants found</p>}
                            </div>
                            <button onClick={() => setAssignExamId(null)} className="mt-4 w-full py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors shrink-0">Cancel</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Exam Cards */}
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                    {exams.length > 0 ? exams.map(exam => (
                        <div key={exam.id} className="glass-panel rounded-[2rem] border border-white/5 bg-[#0D0D12] shadow-xl overflow-hidden">
                            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-bold tracking-tight">{exam.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${exam.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {exam.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-muted text-sm font-light">{exam.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-center px-4">
                                        <p className="text-2xl font-bold">{exam.questions}</p>
                                        <p className="text-xs text-white/40">Questions</p>
                                    </div>
                                    <div className="text-center px-4 border-l border-white/5">
                                        <p className="text-2xl font-bold">{exam.completions}</p>
                                        <p className="text-xs text-white/40">Completions</p>
                                    </div>
                                    <div className="text-center px-4 border-l border-white/5">
                                        <p className="text-2xl font-bold">{exam.avgScore}%</p>
                                        <p className="text-xs text-white/40">Avg Score</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 pb-6 flex flex-wrap gap-3">
                                <button onClick={() => toggleExpand(exam.id)} className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2">
                                    {expandedExam === exam.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {expandedExam === exam.id ? 'Hide' : 'Manage'} Questions
                                </button>
                                <button onClick={() => openAssignModal(exam.id)} className="px-4 py-2 text-sm bg-accent/10 border border-accent/20 text-accent rounded-xl hover:bg-accent/20 transition-colors flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Assign
                                </button>
                                <button onClick={() => { setEditingExam(exam); setFormTitle(exam.title); setFormDesc(exam.description); setShowCreate(false); }} className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteExam(exam.id)} className="px-4 py-2 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expanded Questions */}
                            <AnimatePresence>
                                {expandedExam === exam.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 overflow-hidden">
                                        <div className="p-8 space-y-6">
                                            {questionsLoading ? (
                                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
                                            ) : (
                                                <>
                                                    {questions.map((q, qIdx) => (
                                                        <div key={q.id || qIdx} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-grow">
                                                                    <label className="text-xs text-white/40 font-mono mb-2 block">Question {qIdx + 1}</label>
                                                                    <input value={q.question_text} onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent text-sm" placeholder="Enter question..." />
                                                                </div>
                                                                <button onClick={() => removeQuestion(qIdx)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-center gap-3">
                                                                        <button onClick={() => setCorrectOption(qIdx, oIdx)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'border-green-400 bg-green-400/20' : 'border-white/20 hover:border-white/40'}`}>
                                                                            {opt.isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-green-400" />}
                                                                        </button>
                                                                        <input value={opt.text} onChange={e => updateOption(qIdx, oIdx, e.target.value)} className="flex-grow bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder={`Option ${oIdx + 1}`} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-4">
                                                        <button onClick={addNewQuestion} className="flex-1 py-3 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center gap-2">
                                                            <Plus className="w-5 h-5" /> Add Question
                                                        </button>
                                                        <button onClick={() => saveQuestions(exam.id)} disabled={saving} className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg shadow-accent/20">
                                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Questions
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )) : (
                        <div className="glass-panel p-16 rounded-[2rem] border border-white/5 bg-[#0D0D12] text-center shadow-xl">
                            <CheckSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white/60 mb-2">No Assessments Yet</h3>
                            <p className="text-white/30 mb-6">Create your first exam tightly coupled strictly to the <span className="text-accent underline underline-offset-4">{selectedJob?.title}</span> pipeline.</p>
                            <button onClick={() => setShowCreate(true)} className="btn-primary px-8 py-3 shadow-lg shadow-accent/20">Create Assessment</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
