"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import {
    ArrowLeft, Mail, Phone, FileText, User, Calendar, CheckCircle2, AlertTriangle, Info,
    Send, Loader2, ChevronDown, MessageSquare, Clock, Shield, Activity, Download, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getStageBadgeClass, PIPELINE_STAGES } from '@/lib/permissions';

interface Application {
    id: string;
    tracking_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    work_experience: string | null;
    sales_background: string | null;
    resume_url: string;
    custom_data: Record<string, string>;
    screening_responses: Record<string, string>;
    screening_qualified: boolean | null;
    screening_flags: Array<{ questionId: string; question: string; answer: string; priority: string }>;
    applied_position_id: string;
    terms_accepted_at: string;
    privacy_accepted_at: string;
    stage: string;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

interface Note {
    id: string;
    content: string;
    note_type: string;
    created_at: string;
    authorName: string;
}

type TabKey = 'overview' | 'screening' | 'notes' | 'documents';

export default function ApplicantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const [app, setApp] = useState<Application | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [newNote, setNewNote] = useState('');
    const [sending, setSending] = useState(false);
    const [stageChanging, setStageChanging] = useState(false);
    const [showStageDropdown, setShowStageDropdown] = useState(false);

    const fetchApp = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/applications?id=${applicationId}`);
            if (res.ok) {
                const data = await res.json();
                setApp(data.application);
            }
        } catch (err) {
            console.error('Fetch application error:', err);
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    const fetchNotes = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/notes?applicationId=${applicationId}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes || []);
            }
        } catch (err) {
            console.error('Fetch notes error:', err);
        }
    }, [applicationId]);

    useEffect(() => { fetchApp(); fetchNotes(); }, [fetchApp, fetchNotes]);

    const handleStageChange = async (newStage: string) => {
        if (!app || app.stage === newStage) return;
        setStageChanging(true);
        setShowStageDropdown(false);
        try {
            const res = await fetch('/api/admin/applications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, stage: newStage }),
            });
            if (res.ok) {
                setApp(prev => prev ? { ...prev, stage: newStage } : null);
                fetchNotes(); // Refresh to include system note
            }
        } catch (err) {
            console.error('Stage change error:', err);
        } finally {
            setStageChanging(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setSending(true);
        try {
            const res = await fetch('/api/admin/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, content: newNote.trim(), noteType: 'general' }),
            });
            if (res.ok) {
                setNewNote('');
                fetchNotes();
            }
        } catch (err) {
            console.error('Add note error:', err);
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="text-center py-20">
                <p className="text-xl font-bold mb-2">Application Not Found</p>
                <Link href="/admin/applicants" className="text-accent hover:underline">← Back to Applicants</Link>
            </div>
        );
    }

    const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
        { key: 'overview', label: 'Overview', icon: User },
        { key: 'screening', label: 'Screening', icon: Shield },
        { key: 'notes', label: 'Notes', icon: MessageSquare },
        { key: 'documents', label: 'Documents', icon: FileText },
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-8">
            {/* Back Button */}
            <Link href="/admin/applicants" className="inline-flex items-center gap-2 text-white/40 hover:text-accent text-sm font-mono uppercase tracking-widest transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Applicants
            </Link>

            {/* Header Card */}
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
                            {app.first_name[0]}{app.last_name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{app.first_name} {app.last_name}</h1>
                            <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
                                <span className="font-mono text-accent">{app.tracking_code}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(app.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-sm text-white/40"><Mail className="w-3 h-3" /> {app.email}</span>
                                {app.phone && (
                                    <>
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        <span className="flex items-center gap-1 text-sm text-white/40"><Phone className="w-3 h-3" /> {app.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stage Changer */}
                    <div className="flex items-center gap-4 shrink-0">
                        {app.screening_qualified === false && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                        )}
                        {app.screening_qualified === true && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Qualified
                            </span>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setShowStageDropdown(!showStageDropdown)}
                                disabled={stageChanging}
                                className={`px-5 py-3 rounded-xl text-sm font-bold border flex items-center gap-2 transition-all cursor-pointer ${getStageBadgeClass(app.stage)}`}
                            >
                                {stageChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                {app.stage}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                                {showStageDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-[#0D0D12] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2"
                                    >
                                        {PIPELINE_STAGES.map((stage) => (
                                            <button
                                                key={stage}
                                                onClick={() => handleStageChange(stage)}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                                                    app.stage === stage ? 'bg-accent/10 text-accent font-bold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                {stage}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-white/5 gap-8">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative cursor-pointer ${
                                activeTab === tab.key ? 'text-accent' : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                            {tab.key === 'notes' && notes.length > 0 && (
                                <span className="bg-accent/20 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notes.length}</span>
                            )}
                            {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent rounded-t-full" />}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Legacy Support: Work Experience */}
                        {app.work_experience && (
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Work Experience
                                </h3>
                                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{app.work_experience}</p>
                            </div>
                        )}

                        {/* Legacy Support: Sales Background */}
                        {app.sales_background && (
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Sales Background
                                </h3>
                                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{app.sales_background}</p>
                            </div>
                        )}

                        {/* Dynamic Custom Data (All custom fields from all steps) */}
                        {app.custom_data && Object.keys(app.custom_data).length > 0 && (
                            <div className="md:col-span-2 space-y-6">
                                {Object.entries(app.custom_data).map(([key, val]) => (
                                    <div key={key} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
                                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </h3>
                                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{val || 'Not provided'}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Legal Consent */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3 md:col-span-2">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Legal Consent
                            </h3>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                    {app.terms_accepted_at ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                                    Terms of Service: {app.terms_accepted_at ? formatDate(app.terms_accepted_at) : 'Not accepted'}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {app.privacy_accepted_at ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                                    Privacy Policy: {app.privacy_accepted_at ? formatDate(app.privacy_accepted_at) : 'Not accepted'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Screening Tab */}
                {activeTab === 'screening' && (
                    <motion.div key="screening" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        {/* Qualification Status */}
                        <div className={`p-6 rounded-2xl border ${
                            app.screening_qualified === true ? 'bg-green-500/5 border-green-500/20' :
                            app.screening_qualified === false ? 'bg-red-500/5 border-red-500/20' :
                            'bg-white/[0.02] border-white/10'
                        }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {app.screening_qualified === true && <CheckCircle2 className="w-6 h-6 text-green-400" />}
                                {app.screening_qualified === false && <AlertTriangle className="w-6 h-6 text-red-400" />}
                                {app.screening_qualified === null && <Info className="w-6 h-6 text-white/40" />}
                                <span className="text-lg font-bold">
                                    {app.screening_qualified === true ? 'Passed Screening' :
                                     app.screening_qualified === false ? 'Flagged — Did Not Pass Screening' :
                                     'No Screening Data'}
                                </span>
                            </div>
                        </div>

                        {/* Flags */}
                        {app.screening_flags && app.screening_flags.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Disqualification Flags</h3>
                                {app.screening_flags.map((flag, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                                        flag.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
                                    }`}>
                                        {flag.priority === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                                        <div>
                                            <p className="text-sm font-medium text-white">{flag.question}</p>
                                            <p className={`text-xs mt-1 ${flag.priority === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                                Answer: &quot;{flag.answer}&quot; — <span className="uppercase font-bold">{flag.priority}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* All Screening Responses */}
                        {Object.keys(app.screening_responses || {}).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">All Responses</h3>
                                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                    <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono">
                                        {JSON.stringify(app.screening_responses, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                    <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        {/* Add Note */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <div className="flex gap-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add an internal note..."
                                    rows={3}
                                    className="flex-1 bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent transition-colors resize-none text-sm"
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={sending || !newNote.trim()}
                                    className="btn-primary px-6 self-end disabled:opacity-50 flex items-center gap-2"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Notes List */}
                        {notes.length === 0 ? (
                            <div className="text-center py-10 text-white/30">
                                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p>No notes yet. Be the first to add one.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map((note) => (
                                    <div key={note.id} className={`p-5 rounded-2xl border ${
                                        note.note_type === 'system' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/[0.02] border-white/5'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white/70">{note.authorName}</span>
                                            <div className="flex items-center gap-2 text-xs text-white/30">
                                                {note.note_type !== 'general' && (
                                                    <span className="uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">{note.note_type}</span>
                                                )}
                                                <Clock className="w-3 h-3" />
                                                {formatDate(note.created_at)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-white/60 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        {app.resume_url ? (
                            <>
                                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Resume / CV</p>
                                            <p className="text-xs text-white/40 font-mono">PDF Document</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                            className="btn-outline px-4 py-2 flex items-center gap-2 text-sm">
                                            <ExternalLink className="w-4 h-4" /> View
                                        </a>
                                        <a href={app.resume_url} download
                                            className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </div>
                                </div>

                                {/* Embedded PDF Viewer */}
                                <div className="w-full h-[600px] rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 relative shadow-2xl">
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono text-white/70 border border-white/10 z-10 pointer-events-none uppercase tracking-widest font-bold">
                                        Resume Preview
                                    </div>
                                    <iframe
                                        src={`${app.resume_url}#toolbar=0&navpanes=0`}
                                        className="w-full h-full border-none"
                                        title="Resume Preview"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="text-lg font-bold mb-1">No Documents</p>
                                <p className="text-white/40 font-light">This applicant has not uploaded any documents.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
