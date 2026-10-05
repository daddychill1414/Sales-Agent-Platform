"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, CheckCircle, Mail, Phone, Calendar, X, Download, FileText, User, Loader2, ChevronDown, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PIPELINE_STAGES, getStageBadgeClass } from '@/lib/permissions';
import { downloadCSV } from '@/lib/export';

interface Applicant {
    id: string;
    name: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    stage: string;
    resume_url: string;
    tracking_code: string;
    screening_qualified: boolean | null;
    created_at: string;
}

const STAGES = ['All Candidates', ...PIPELINE_STAGES];

const NEXT_STAGES: Record<string, string> = {
    'New': 'Screening Review',
    'Screening Review': 'Qualified',
    'Qualified': 'Account Invited',
    'Account Invited': 'Exam Assigned',
    'Exam Assigned': 'Interview Scheduled',
    'Interview Scheduled': 'Offer Extended',
    'Offer Extended': 'Hired',
};

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Candidates');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<Applicant | null>(null);
    const [advancing, setAdvancing] = useState(false);

    const fetchApplicants = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'All Candidates') params.set('stage', activeTab);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/applicants?${params}`);
            if (res.ok) {
                const data = await res.json();
                setApplicants(data.applicants || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchQuery]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => fetchApplicants(), 300);
        return () => clearTimeout(timer);
    }, [fetchApplicants]);

    const handleExport = () => {
        if (!applicants.length) return;
        const exportData = applicants.map(a => ({
            ID: a.id,
            TrackingCode: a.tracking_code,
            Name: a.name,
            Email: a.email,
            Phone: a.phone || '',
            Stage: a.stage,
            Qualified: a.screening_qualified ? 'Yes' : 'No',
            AppliedDate: new Date(a.created_at).toLocaleDateString()
        }));
        downloadCSV(exportData, `applicants_${activeTab.replace(/\s+/g, '_')}_export`);
    };

    const handleAdvanceStage = async (applicantId: string, currentStage: string) => {
        const nextStage = NEXT_STAGES[currentStage];
        if (!nextStage) return;

        setAdvancing(true);
        try {
            const res = await fetch('/api/admin/applicants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId, stage: nextStage }),
            });
            if (res.ok) {
                fetchApplicants();
                if (selectedCandidate?.id === applicantId) {
                    setSelectedCandidate(prev => prev ? { ...prev, stage: nextStage } : null);
                }
            }
        } catch (err) {
            console.error('Advance error:', err);
        } finally {
            setAdvancing(false);
        }
    };

    const handleReject = async (applicantId: string) => {
        if (!confirm('Are you sure you want to reject this applicant?')) return;
        setAdvancing(true);
        try {
            const res = await fetch('/api/admin/applicants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId, stage: 'Rejected' }),
            });
            if (res.ok) {
                fetchApplicants();
                setSelectedCandidate(null);
            }
        } catch (err) {
            console.error('Reject error:', err);
        } finally {
            setAdvancing(false);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Applicants</h1>
                    <p className="text-muted font-light">Manage and review candidates across all pipeline stages.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleExport} disabled={loading || applicants.length === 0} className="btn-secondary py-2.5 px-6 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stage Tabs */}
            <div className="flex items-center border-b border-white/5 overflow-x-auto pb-4 shrink-0 hide-scrollbar gap-8">
                {STAGES.map(stage => {
                    const count = stage === 'All Candidates'
                        ? applicants.length
                        : applicants.filter(a => a.stage === stage).length;

                    return (
                        <button
                            key={stage}
                            onClick={() => setActiveTab(stage)}
                            className={`whitespace-nowrap font-medium text-sm transition-colors relative pb-4 ${activeTab === stage ? 'text-accent' : 'text-white/40 hover:text-white/80'}`}
                        >
                            {stage}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === stage ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/50'}`}>{count}</span>
                            {activeTab === stage && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent rounded-t-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List & Controls */}
            <div className="glass-panel border-white/5 bg-[#0D0D12] rounded-[2rem] flex flex-col flex-grow overflow-hidden relative shadow-xl">
                {/* Search Bar */}
                <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0 bg-[#0a0a0f]/50">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent focus:bg-white/10 transition-colors text-sm"
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-10 py-4 border-b border-white/5 text-xs font-bold uppercase tracking-widest text-white/40 shrink-0 bg-[#050508]/30">
                    <div className="col-span-4">Candidate</div>
                    <div className="col-span-3">Stage & Score</div>
                    <div className="col-span-3">Applied</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="overflow-y-auto flex-grow p-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        </div>
                    ) : applicants.length > 0 ? applicants.map((app) => (
                        <div key={app.id} className="grid grid-cols-12 gap-4 px-6 py-5 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all items-center group">
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/50 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                                    {app.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white tracking-tight">{app.name}</h4>
                                    <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {app.email || 'No email'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 flex flex-col justify-center">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${app.stage.includes('Hired') ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                        app.stage.includes('Rejected') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        app.stage.includes('Review') || app.stage.includes('Submitted') ? 'bg-accent/10 text-accent border border-accent/20' :
                                        app.stage.includes('Exam') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        app.stage.includes('Interview') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                        'bg-white/5 text-white/60 border border-white/10'
                                    }`}>
                                        {app.stage}
                                    </span>
                                </div>
                                {app.screening_qualified !== null && (
                                    <span className={`text-xs mt-2 font-mono ${app.screening_qualified ? 'text-green-400' : 'text-red-400'}`}>
                                        Screening: {app.screening_qualified ? 'Qualified' : 'Disqualified'}
                                    </span>
                                )}
                            </div>

                            <div className="col-span-3 flex items-center text-sm tracking-tight text-white/60 font-medium">
                                {formatTimeAgo(app.created_at)}
                                {app.tracking_code && <span className="ml-2 text-xs text-accent font-mono">• {app.tracking_code}</span>}
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-2 relative z-10">
                                {NEXT_STAGES[app.stage] && (
                                    <button
                                        onClick={() => handleAdvanceStage(app.id, app.stage)}
                                        disabled={advancing}
                                        className="p-2 hover:bg-accent/20 rounded-lg text-white/40 hover:text-accent transition-colors"
                                        title={`Advance to ${NEXT_STAGES[app.stage]}`}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedCandidate(app)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                    title="View Candidate"
                                >
                                    <User className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-white/30">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg">No candidates found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CANDIDATE SLIDE-OVER */}
            <AnimatePresence>
                {selectedCandidate && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#0a0a0f] border-l border-white/10 z-50 shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-[#0D0D12] shrink-0 sticky top-0 z-10">
                                <button
                                    onClick={() => setSelectedCandidate(null)}
                                    className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-2xl text-accent shadow-[0_0_30px_rgba(201,168,76,0.15)]">
                                        {selectedCandidate.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">{selectedCandidate.name}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono text-accent">{selectedCandidate.tracking_code || 'Applicant'}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                            <span className="text-sm text-white/60">{formatTimeAgo(selectedCandidate.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {NEXT_STAGES[selectedCandidate.stage] && (
                                        <button
                                            onClick={() => handleAdvanceStage(selectedCandidate.id, selectedCandidate.stage)}
                                            disabled={advancing}
                                            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                                        >
                                            {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Advance to {NEXT_STAGES[selectedCandidate.stage]}
                                        </button>
                                    )}
                                    {selectedCandidate.stage !== 'Rejected' && selectedCandidate.stage !== 'Hired' && (
                                        <button
                                            onClick={() => handleReject(selectedCandidate.id)}
                                            className="btn-outline py-3 px-6 flex items-center justify-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        >
                                            <AlertTriangle className="w-4 h-4" /> Reject
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-8 flex-grow overflow-y-auto space-y-8 pb-32">
                                {/* Current Stage */}
                                <section>
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Pipeline Status
                                    </h3>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg font-bold text-white">{selectedCandidate.stage}</span>
                                            {selectedCandidate.screening_qualified !== null && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedCandidate.screening_qualified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                    {selectedCandidate.screening_qualified ? 'Screening Passed' : 'Screening Failed'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Contact Details */}
                                <section>
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center text-white/40"><Mail className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs text-white/40 font-mono mb-0.5">Email Address</p>
                                                <p className="text-sm font-medium text-white">{selectedCandidate.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center text-white/40"><Phone className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs text-white/40 font-mono mb-0.5">Phone Number</p>
                                                <p className="text-sm font-medium text-white">{selectedCandidate.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Background */}
                                {selectedCandidate.tracking_code && (
                                    <section>
                                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Application Info
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-xs text-white/40 font-mono mb-2">Tracking Code</p>
                                                <p className="text-sm text-white/80 font-mono">{selectedCandidate.tracking_code}</p>
                                            </div>
                                            <Link
                                                href={`/admin/applicants/${selectedCandidate.id}`}
                                                className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center gap-2 text-accent font-bold text-sm hover:bg-accent/10 transition-colors"
                                            >
                                                View Full 360° Profile →
                                            </Link>
                                        </div>
                                    </section>
                                )}

                                {/* Resume */}
                                <section>
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Documents
                                    </h3>
                                    {selectedCandidate.resume_url ? (
                                        <a
                                            href={selectedCandidate.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-accent transition-colors">Resume</p>
                                                    <p className="text-xs text-white/40 font-mono">Click to download</p>
                                                </div>
                                            </div>
                                            <Download className="w-5 h-5 text-white/40" />
                                        </a>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm text-center">
                                            No resume uploaded
                                        </div>
                                    )}
                                </section>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
