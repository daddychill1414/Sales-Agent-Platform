"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Plus, Edit3, Trash2, GripVertical, Save, X, AlertTriangle, AlertCircle, Info, Loader2, CheckCircle2, ChevronLeft, Briefcase, ListTodo, Type, ClipboardList } from 'lucide-react';

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    active: boolean;
}

interface ScreeningQuestion {
    id: string;
    job_id: string;
    question_text: string;
    question_type: 'yes_no' | 'multiple_choice' | 'text' | 'number_range';
    options: string[];
    qualifying_answers: string[];
    priority: 'critical' | 'high' | 'info';
    is_required: boolean;
    order_index: number;
    is_active: boolean;
}

interface CustomField {
    id?: string;
    fieldLabel: string;
    fieldName: string;
    fieldType: 'text' | 'email' | 'tel' | 'url' | 'long_text';
    isRequired: boolean;
    section: 'personal_details' | 'professional_background';
}

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', desc: 'Auto-disqualifies if wrong' },
    high: { label: 'High', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Flagged for review' },
    info: { label: 'Info', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', desc: 'Data collection only' },
};

const QUESTION_TYPES = [
    { value: 'yes_no', label: 'Yes / No' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'text', label: 'Free Text' },
];

export default function ApplicationBuilderPage() {
    const [jobs, setJobs] = useState<JobPosition[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
    const [activeTab, setActiveTab] = useState<'screening' | 'personal' | 'professional'>('screening');
    
    // Screening State
    const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    
    // Custom Fields State
    const [fields, setFields] = useState<CustomField[]>([]);
    
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Screening Form Stage
    const [formText, setFormText] = useState('');
    const [formType, setFormType] = useState<'yes_no' | 'multiple_choice' | 'text' | 'number_range'>('yes_no');
    const [formOptions, setFormOptions] = useState<string[]>(['']);
    const [formQualifying, setFormQualifying] = useState<string[]>([]);
    const [formPriority, setFormPriority] = useState<'critical' | 'high' | 'info'>('info');
    const [formRequired, setFormRequired] = useState(true);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    // Load Data when a job is picked
    const fetchJobData = useCallback(async (jobId: string) => {
        setLoadingData(true);
        try {
            // Fetch Screening
            const resScreening = await fetch(`/api/screening?includeInactive=true&jobId=${jobId}`);
            if (resScreening.ok) {
                const data = await resScreening.json();
                setQuestions((data.questions || []).sort((a: any, b: any) => a.order_index - b.order_index));
            }
            // Fetch Fields
            const resFields = await fetch(`/api/application-fields?jobId=${jobId}`);
            if (resFields.ok) {
                const data = await resFields.json();
                setFields((data.fields || []).map((f: any) => ({
                    id: f.id,
                    fieldLabel: f.field_label,
                    fieldName: f.field_name,
                    fieldType: f.field_type,
                    isRequired: f.is_required,
                    section: f.section || 'personal_details'
                })));
            }
        } catch {
            showToast('Failed to load job configuration.', 'error');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (selectedJob) {
            fetchJobData(selectedJob.id);
            setActiveTab('screening');
            setShowNew(false);
        }
    }, [selectedJob, fetchJobData]);

    const handleSaveScreening = async () => {
        if (!selectedJob || !formText.trim()) return;
        setSaving(true);
        try {
            const payload = {
                jobId: selectedJob.id,
                id: editingId,
                questionText: formText,
                questionType: formType,
                options: formType === 'multiple_choice' ? formOptions.filter(o => o.trim()) : [],
                qualifyingAnswers: formQualifying,
                priority: formPriority,
                isRequired: formRequired,
                orderIndex: questions.length,
                isActive: true
            };

            const url = '/api/screening';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Saving failed');

            showToast(editingId ? 'Saved successfully' : 'Question added', 'success');
            setShowNew(false);
            setEditingId(null);
            fetchJobData(selectedJob.id);
        } catch {
            showToast('Failed to save question', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteScreening = async (id: string) => {
        if (!selectedJob || !confirm('Disable this question?')) return;
        try {
            const res = await fetch(`/api/screening?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Question removed', 'success');
                fetchJobData(selectedJob.id);
            }
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const resetScreeningForm = () => {
        setFormText('');
        setFormType('yes_no');
        setFormOptions(['']);
        setFormQualifying([]);
        setFormPriority('info');
        setFormRequired(true);
    };

    const openEditScreening = (q: ScreeningQuestion) => {
        setEditingId(q.id);
        setFormText(q.question_text);
        setFormType(q.question_type);
        setFormOptions(q.options.length ? q.options : ['']);
        setFormQualifying(q.qualifying_answers || []);
        setFormPriority(q.priority);
        setFormRequired(q.is_required);
        setShowNew(true);
    };

    // Screening Helpers
    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...formOptions];
        newOpts[idx] = val;
        setFormOptions(newOpts);
    };
    const addOption = () => setFormOptions([...formOptions, '']);
    const removeOption = (idx: number) => {
        if (formOptions.length <= 1) return;
        setFormOptions(formOptions.filter((_, i) => i !== idx));
    };
    const toggleQualifying = (ans: string) => {
        if (formQualifying.includes(ans)) setFormQualifying(formQualifying.filter(a => a !== ans));
        else setFormQualifying([...formQualifying, ans]);
    };

    // Custom Fields Logic
    const addCustomFieldRow = () => {
        const targetSection = activeTab === 'professional' ? 'professional_background' : 'personal_details';
        setFields([...fields, { fieldLabel: '', fieldName: '', fieldType: 'text', isRequired: false, section: targetSection }]);
    };
    
    const updateCustomField = (idx: number, key: keyof CustomField, value: any) => {
        const newFields = [...fields];
        if (key === 'fieldLabel') {
            newFields[idx].fieldLabel = value;
            // auto-generate field key
            newFields[idx].fieldName = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        } else {
            newFields[idx][key] = value as never;
        }
        setFields(newFields);
    };

    const removeCustomFieldRow = (idx: number) => {
        setFields(fields.filter((_, i) => i !== idx));
    };

    const handleSaveFields = async () => {
        if (!selectedJob) return;
        
        // Validate
        if (fields.some(f => !f.fieldLabel.trim() || !f.fieldName.trim())) {
            showToast('All fields must clearly defined blank inputs', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/application-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: selectedJob.id, fields })
            });

            if (!res.ok) throw new Error('Save Failed');
            showToast('Form Schema Saved Successfully', 'success');
        } catch {
            showToast('Failed to save fields', 'error');
        } finally {
            setSaving(false);
        }
    };


    if (!selectedJob) {
        return (
            <div className="space-y-8 pb-32">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Application Builder</h1>
                    <p className="text-muted font-light">Select a Job Position to configure its data form and screening questionnaire.</p>
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
            {/* Header with Back Button */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-4 focus:outline-none">
                        <ChevronLeft className="w-4 h-4" /> Back to Jobs
                    </button>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Builder: <span className="text-accent">{selectedJob.title}</span></h1>
                    <p className="text-muted font-light">
                        Configure exactly what information you want from the applicants.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-[#0D0D12] p-1 rounded-xl border border-white/5 w-fit custom-scrollbar overflow-x-auto">
                <button 
                    onClick={() => { setActiveTab('screening'); setShowNew(false); }}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'screening' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    Screening Questions
                </button>
                <button 
                    onClick={() => { setActiveTab('personal'); setShowNew(false); }}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'personal' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    Personal Details (Step 1)
                </button>
                <button 
                    onClick={() => { setActiveTab('professional'); setShowNew(false); }}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'professional' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    Professional Background (Step 2)
                </button>
            </div>

            {toast && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 border ${toast.type === 'success' ? 'bg-[#0D0D12] text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="font-medium text-sm">{toast.message}</span>
                </motion.div>
            )}

            {loadingData ? (
                <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : activeTab === 'screening' ? (
                // ==================== SCREENING TAB ====================
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-[#0D0D12] border border-white/5 p-4 rounded-2xl">
                        <p className="text-sm text-white/50">Questions applicants must answer to pass the initial screening.</p>
                        {!showNew && (
                            <button onClick={() => { resetScreeningForm(); setEditingId(null); setShowNew(true); }} className="btn-primary shadow-lg shadow-accent/20 flex items-center gap-2 px-4 py-2 text-sm">
                                <Plus className="w-4 h-4" /> Add Screening Question
                            </button>
                        )}
                    </div>

                    {showNew ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border-accent/20 p-8 rounded-[2rem] shadow-2xl shadow-accent/5">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingId ? 'Edit Question' : 'New Screening Question'}</h2>
                                <button onClick={() => setShowNew(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 opacity-50" /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Question Text</label>
                                    <input
                                        value={formText}
                                        onChange={e => setFormText(e.target.value)}
                                        className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-white"
                                        placeholder="e.g., Do you have 3+ years of B2B sales experience?"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Format</label>
                                        <select
                                            value={formType}
                                            onChange={e => setFormType(e.target.value as any)}
                                            className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-white appearance-none py-3 h-12"
                                        >
                                            {QUESTION_TYPES.map(qt => <option key={qt.value} value={qt.value} className="bg-[#0D0D12] text-white">{qt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Priority</label>
                                        <select
                                            value={formPriority}
                                            onChange={e => setFormPriority(e.target.value as any)}
                                            className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-white appearance-none h-12"
                                        >
                                            <option value="critical" className="bg-[#0D0D12] text-white">Critical (Auto-Disqualify)</option>
                                            <option value="high" className="bg-[#0D0D12] text-white">High (Flag Profile)</option>
                                            <option value="info" className="bg-[#0D0D12] text-white">Info (Data Collection)</option>
                                        </select>
                                    </div>
                                </div>

                                {formType !== 'text' && (
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><ListTodo className="w-5 h-5 text-accent"/> Answer Key</h3>
                                        {formType === 'yes_no' ? (
                                            <div className="space-y-3">
                                                {['Yes', 'No'].map(opt => (
                                                    <label key={opt} className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${formQualifying.includes(opt) ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0D0D12] border-white/10 hover:border-white/30'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{opt}</span>
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 accent-accent"
                                                                checked={formQualifying.includes(opt)}
                                                                onChange={() => toggleQualifying(opt)}
                                                            />
                                                        </div>
                                                        <span className="text-xs mt-1 text-white/40">{formQualifying.includes(opt) ? 'Marks applicant as Qualified' : 'Triggers Flag/Disqualification'}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {formOptions.map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <input
                                                            value={opt}
                                                            onChange={e => handleOptionChange(i, e.target.value)}
                                                            className="flex-grow bg-[#0D0D12] border border-white/10 rounded-lg px-4 py-2 focus:border-accent focus:outline-none text-sm"
                                                            placeholder={`Option ${i + 1}`}
                                                        />
                                                        <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10">
                                                            <input
                                                                type="checkbox"
                                                                className="accent-accent"
                                                                checked={formQualifying.includes(opt)}
                                                                onChange={() => toggleQualifying(opt)}
                                                            />
                                                            Qualifying
                                                        </label>
                                                        <button onClick={() => removeOption(i)} className="p-2 text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                <button onClick={addOption} className="text-sm text-accent hover:text-accent/80 font-bold">+ Add Option</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                                    <button onClick={() => setShowNew(false)} className="px-6 py-3 font-semibold text-white/60 hover:text-white transition-colors">Cancel</button>
                                    <button
                                        onClick={handleSaveScreening}
                                        disabled={!formText.trim() || saving}
                                        className="btn-primary w-48 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Question
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {questions.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                                    <ClipboardList className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2 opacity-50">No screening questions</h3>
                                    <p className="text-white/40">Add your first question to build the screening gate.</p>
                                </motion.div>
                            ) : (
                                <motion.div className="space-y-4">
                                    {questions.map((q) => {
                                        const prio = PRIORITY_CONFIG[q.priority];
                                        return (
                                            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-6 rounded-2xl glass-panel border border-white/5 flex flex-col md:flex-row gap-6 relative group ${q.is_active ? '' : 'opacity-40 grayscale'}`}>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2.5 py-1 ${prio.bg} ${prio.color} text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-md`}>
                                                            <prio.icon className="w-3.5 h-3.5" /> {prio.label}
                                                        </span>
                                                        <span className="text-xs font-mono text-white/30 uppercase">{q.question_type.replace('_', ' ')}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold tracking-tight pr-12">{q.question_text}</h3>
                                                    {q.qualifying_answers && q.qualifying_answers.length > 0 && (
                                                        <div className="mt-3 text-sm text-white/50 flex flex-wrap gap-2 items-center">
                                                            <span>Passes if answered:</span>
                                                            {q.qualifying_answers.map(ans => (
                                                                <span key={ans} className="bg-white/10 px-2 py-0.5 rounded-md font-mono text-xs">{ans}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-start justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditScreening(q)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-accent transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteScreening(q.id)} className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            ) : (
                // ==================== CUSTOM FIELDS TAB (PERSONAL & PROFESSIONAL) ====================
                <div className="space-y-6">
                    <div className="bg-[#0D0D12] border border-white/5 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg">
                                    {activeTab === 'professional' ? 'Professional Background Fields' : 'Personal Details Fields'}
                                </h3>
                                <p className="text-sm text-white/50">Determine exactly what data applicants supply when applying in this step.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* LOCKED CORE FIELDS */}
                            {activeTab === 'personal' && (
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl opacity-60 relative overflow-hidden">
                                    <div className="absolute right-4 text-[10px] font-bold uppercase text-white/40 tracking-widest border border-white/20 px-2 py-1 rounded">Locked System Base</div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <Type className="w-4 h-4 opacity-50" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">First Name, Last Name, Email, Phone</p>
                                        <p className="text-xs text-white/50">Required for account verification. Cannot be dropped.</p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'professional' && fields.filter(f => f.section === 'professional_background').length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
                                    <h3 className="text-lg font-bold opacity-50 mb-2">No Professional Background Fields</h3>
                                    <p className="text-sm text-white/40">Add your first custom field (like "Work Experience") to collect info in Step 2.</p>
                                </div>
                            )}
                            {activeTab === 'personal' && fields.filter(f => f.section === 'personal_details').length === 0 && (
                                <div className="text-center py-4 opacity-50">
                                    <p className="text-sm">No additional personal details fields added.</p>
                                </div>
                            )}
                            
                            {/* DYNAMIC FIELDS */}
                            {fields.map((field, idx) => {
                                const isCurrentTab = activeTab === 'professional' 
                                    ? field.section === 'professional_background' 
                                    : field.section === 'personal_details';
                                    
                                if (!isCurrentTab) return null;

                                return (
                                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col md:flex-row items-center gap-4 bg-[#0D0D12] border border-white/10 p-4 rounded-xl group relative">
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                        <div>
                                            <label className="text-[10px] font-mono text-white/40 uppercase mb-1 block">Label (Visible to applicant)</label>
                                            <input 
                                                value={field.fieldLabel} 
                                                onChange={e => updateCustomField(idx, 'fieldLabel', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 px-1 py-2 focus:border-accent focus:outline-none text-sm placeholder:text-white/20"
                                                placeholder={activeTab === 'professional' ? "e.g. Work Experience" : "e.g. LinkedIn Profile"}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-mono text-white/40 uppercase mb-1 block">Field Type</label>
                                            <select 
                                                value={field.fieldType}
                                                onChange={e => updateCustomField(idx, 'fieldType', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 px-1 py-2 focus:border-accent focus:outline-none text-sm text-white/80"
                                            >
                                                <option value="text" className="bg-[#0D0D12] text-white">Short Text</option>
                                                <option value="long_text" className="bg-[#0D0D12] text-white">Paragraph</option>
                                                <option value="url" className="bg-[#0D0D12] text-white">Link / URL</option>
                                                <option value="email" className="bg-[#0D0D12] text-white">Email address</option>
                                                <option value="tel" className="bg-[#0D0D12] text-white">Phone number</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <label className="text-[10px] font-mono text-white/40 uppercase block">Required?</label>
                                                <input 
                                                    type="checkbox" 
                                                    checked={field.isRequired}
                                                    onChange={e => updateCustomField(idx, 'isRequired', e.target.checked)}
                                                    className="w-4 h-4 accent-accent cursor-pointer"
                                                />
                                            </div>
                                            <button onClick={() => removeCustomFieldRow(idx)} className="text-red-400/50 hover:text-red-400 p-2"><Trash2 className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-between items-center border-t border-white/10 pt-6">
                            <button onClick={addCustomFieldRow} className="btn-secondary px-6 text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4"/> Add Field
                            </button>

                            <button onClick={handleSaveFields} disabled={saving} className="btn-primary w-40 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                                Save Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
