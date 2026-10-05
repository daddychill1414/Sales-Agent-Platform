"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import Link from 'next/link';
import {
    Loader2, User, ChevronRight, Mail, Phone, AlertTriangle, CheckCircle2,
    Clock, Send, Search, RefreshCw, ExternalLink, Download
} from 'lucide-react';
import { PIPELINE_STAGES, getStageBadgeClass } from '@/lib/permissions';
import { downloadCSV } from '@/lib/export';

interface PipelineApp {
    id: string;
    tracking_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    stage: string;
    screening_qualified: boolean | null;
    resume_url: string;
    created_at: string;
}

// Stages to show as Kanban columns
const KANBAN_STAGES = [
    'New',
    'Screening Review',
    'Qualified',
    'Account Invited',
    'Exam Assigned',
    'Interview Scheduled',
    'Offer Extended',
    'Hired',
] as const;

const REJECT_STAGES = ['Disqualified', 'Rejected', 'Withdrawn'] as const;

export default function PipelinePage() {
    const [apps, setApps] = useState<PipelineApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchApps = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            const res = await fetch(`/api/admin/applications?${params}`);
            if (res.ok) {
                const data = await res.json();
                setApps(data.applications || []);
            }
        } catch { /* empty */ } finally { setLoading(false); }
    }, [search]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => fetchApps(), 300);
        return () => clearTimeout(timer);
    }, [fetchApps]);

    const moveToStage = async (applicationId: string, newStage: string) => {
        try {
            const res = await fetch('/api/admin/applications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, stage: newStage }),
            });
            if (res.ok) {
                setApps(prev => prev.map(a => a.id === applicationId ? { ...a, stage: newStage } : a));
                showToast(`Moved to ${newStage}`, 'success');
            } else {
                showToast('Failed to move applicant', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    };

    const sendMagicLink = async (applicationId: string, email: string) => {
        setInvitingId(applicationId);
        try {
            const res = await fetch('/api/admin/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, email }),
            });
            if (res.ok) {
                showToast('Magic link sent! Applicant can now create their account.', 'success');
                moveToStage(applicationId, 'Account Invited');
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to send invite', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setInvitingId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) moveToStage(id, stage);
        setDraggingId(null);
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const getStageApps = (stage: string) => apps.filter(a => a.stage === stage);
    const rejectedApps = apps.filter(a => REJECT_STAGES.includes(a.stage as typeof REJECT_STAGES[number]));

    const handleExport = () => {
        if (!apps.length) return;
        const exportData = apps.map(a => ({
            ID: a.id,
            TrackingCode: a.tracking_code,
            FirstName: a.first_name,
            LastName: a.last_name,
            Email: a.email,
            Phone: a.phone || '',
            Stage: a.stage,
            Qualified: a.screening_qualified ? 'Yes' : 'No',
            AppliedDate: new Date(a.created_at).toLocaleDateString()
        }));
        downloadCSV(exportData, 'pipeline_board_export');
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl text-sm font-bold border shadow-2xl ${
                            toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Pipeline Board</h1>
                        <p className="text-white/50 mt-1 text-lg font-light">Drag applicants across stages. Send magic link invites when qualified.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} disabled={loading || apps.length === 0} className="btn-secondary py-2.5 px-6 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent w-48"
                            />
                        </div>
                        <button onClick={() => { setLoading(true); fetchApps(); }} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-accent/10 hover:text-accent text-white/40 transition-colors cursor-pointer">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar pb-2">
                    {KANBAN_STAGES.map(stage => {
                        const count = getStageApps(stage).length;
                        return (
                            <div key={stage} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${getStageBadgeClass(stage)} ${count > 0 ? '' : 'opacity-40'}`}>
                                {stage} <span className="ml-1.5 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
                            </div>
                        );
                    })}
                    {rejectedApps.length > 0 && (
                        <div className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border bg-red-500/10 text-red-400 border-red-500/20">
                            Rejected/DQ <span className="ml-1.5 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{rejectedApps.length}</span>
                        </div>
                    )}
                </div>

                {/* Kanban Board */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar" style={{ minHeight: '60vh' }}>
                        {KANBAN_STAGES.map(stage => {
                            const stageApps = getStageApps(stage);
                            const isQualified = stage === 'Qualified';

                            return (
                                <div
                                    key={stage}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage)}
                                    className={`shrink-0 w-72 rounded-2xl border transition-all flex flex-col ${
                                        draggingId ? 'border-accent/30 bg-accent/[0.02]' : 'border-white/5 bg-[#0a0a0f]/50'
                                    }`}
                                >
                                    {/* Column Header */}
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                stage === 'New' ? 'bg-accent' :
                                                stage === 'Hired' ? 'bg-green-400' :
                                                stage === 'Qualified' ? 'bg-blue-400' :
                                                'bg-white/30'
                                            }`} />
                                            <span className="text-xs font-bold uppercase tracking-widest text-white/60">{stage}</span>
                                        </div>
                                        <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">{stageApps.length}</span>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[55vh]">
                                        {stageApps.length === 0 ? (
                                            <div className="text-center py-10 text-white/20 text-xs font-mono">
                                                No applicants
                                            </div>
                                        ) : (
                                            stageApps.map((app) => (
                                                <motion.div
                                                    key={app.id}
                                                    layout
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, app.id)}
                                                    onDragEnd={() => setDraggingId(null)}
                                                    className={`p-4 rounded-xl border bg-[#0D0D12] cursor-grab active:cursor-grabbing transition-all hover:border-white/20 group ${
                                                        draggingId === app.id ? 'border-accent/40 shadow-lg shadow-accent/10 opacity-60' : 'border-white/10'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                                                {app.first_name[0]}{app.last_name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white leading-tight">{app.first_name} {app.last_name}</p>
                                                            </div>
                                                        </div>
                                                        <Link href={`/admin/applicants/${app.id}`} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-accent transition-all">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[10px] text-white/40 mb-2">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate">{app.email}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            {app.screening_qualified === false && (
                                                                <span className="flex items-center gap-0.5 text-[10px] text-red-400"><AlertTriangle className="w-3 h-3" /> DQ</span>
                                                            )}
                                                            {app.screening_qualified === true && (
                                                                <span className="flex items-center gap-0.5 text-[10px] text-green-400"><CheckCircle2 className="w-3 h-3" /> OK</span>
                                                            )}
                                                            {app.resume_url && (
                                                                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">CV</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-white/30 font-mono flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(app.created_at)}
                                                        </span>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    {isQualified && !app.screening_qualified === false && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); sendMagicLink(app.id, app.email); }}
                                                            disabled={invitingId === app.id}
                                                            className="mt-3 w-full py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
                                                        >
                                                            {invitingId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                            Send Magic Link
                                                        </button>
                                                    )}

                                                    {/* Quick advance for other stages */}
                                                    {!isQualified && stage !== 'Hired' && (
                                                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {(() => {
                                                                const idx = KANBAN_STAGES.indexOf(stage);
                                                                const nextStage = idx < KANBAN_STAGES.length - 1 ? KANBAN_STAGES[idx + 1] : null;
                                                                if (!nextStage) return null;
                                                                return (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); moveToStage(app.id, nextStage); }}
                                                                        className="w-full py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                                                    >
                                                                        <ChevronRight className="w-3 h-3" /> {nextStage}
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Rejected Column */}
                        {rejectedApps.length > 0 && (
                            <div className="shrink-0 w-72 rounded-2xl border border-red-500/10 bg-red-500/[0.02] flex flex-col">
                                <div className="p-4 border-b border-red-500/10 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-red-400/60">Rejected / DQ</span>
                                    </div>
                                    <span className="text-xs font-mono text-red-400/30 bg-red-500/10 px-2 py-0.5 rounded">{rejectedApps.length}</span>
                                </div>
                                <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[55vh]">
                                    {rejectedApps.map((app) => (
                                        <div key={app.id} className="p-4 rounded-xl border border-red-500/10 bg-[#0D0D12] opacity-60">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-400">
                                                    {app.first_name[0]}{app.last_name[0]}
                                                </div>
                                                <p className="text-sm font-bold text-white/60">{app.first_name} {app.last_name}</p>
                                            </div>
                                            <span className="text-[10px] text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded uppercase font-bold">{app.stage}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
