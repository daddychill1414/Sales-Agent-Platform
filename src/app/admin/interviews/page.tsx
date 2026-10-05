"use client";

import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, Video, Save, X, Clock, User, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Interview {
    id: string;
    applicantName: string;
    applicantEmail: string;
    interviewerName: string;
    scheduled_at: string;
    status: string;
    meeting_link: string;
    notes: string;
    applicant_id: string;
}

interface Applicant {
    id: string;
    name: string;
    email: string;
    stage: string;
}

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSchedule, setShowSchedule] = useState(false);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [saving, setSaving] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [notes, setNotes] = useState('');

    const fetchInterviews = async () => {
        try {
            const res = await fetch('/api/admin/interviews');
            if (res.ok) {
                const data = await res.json();
                setInterviews(data.interviews || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInterviews(); }, []);

    const openScheduleModal = async () => {
        setShowSchedule(true);
        setSelectedApplicant(''); setDateTime(''); setMeetingLink(''); setNotes('');
        try {
            const res = await fetch('/api/admin/applicants');
            if (res.ok) {
                const data = await res.json();
                setApplicants(data.applicants || []);
            }
        } catch (err) { console.error(err); }
    };

    const handleSchedule = async () => {
        if (!selectedApplicant || !dateTime) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantId: selectedApplicant,
                    scheduledAt: new Date(dateTime).toISOString(),
                    meetingLink,
                    notes,
                }),
            });
            if (res.ok) {
                setShowSchedule(false);
                fetchInterviews();
            }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await fetch('/api/admin/interviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            fetchInterviews();
        } catch (err) { console.error(err); }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
    }

    const upcoming = interviews.filter(i => i.status === 'Scheduled' && new Date(i.scheduled_at) >= new Date());
    const past = interviews.filter(i => i.status !== 'Scheduled' || new Date(i.scheduled_at) < new Date());

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Interviews</h1>
                    <p className="text-muted font-light">Schedule and manage applicant interviews.</p>
                </div>
                <button onClick={openScheduleModal} className="btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus className="w-5 h-5" /> Schedule Interview
                </button>
            </div>

            {/* Schedule Modal */}
            <AnimatePresence>
                {showSchedule && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSchedule(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0D0D12] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl">
                            <h2 className="text-2xl font-bold tracking-tight mb-6">Schedule Interview</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Applicant</label>
                                    <select value={selectedApplicant} onChange={e => setSelectedApplicant(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors">
                                        <option value="">Select an applicant...</option>
                                        {applicants.filter(a => a.stage !== 'Rejected' && a.stage !== 'Hired').map(a => (
                                            <option key={a.id} value={a.id}>{a.name} — {a.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Date & Time</label>
                                    <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Meeting Link (optional)</label>
                                    <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" placeholder="https://meet.google.com/..." />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Notes (optional)</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors h-20 resize-none" placeholder="Interview notes..." />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowSchedule(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                                    <button onClick={handleSchedule} disabled={saving || !selectedApplicant || !dateTime} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Schedule
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Upcoming Interviews */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-3"><Calendar className="w-5 h-5 text-accent" /> Upcoming ({upcoming.length})</h2>
                <div className="space-y-4">
                    {upcoming.length > 0 ? upcoming.map(interview => (
                        <div key={interview.id} className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0D0D12] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                                    {interview.applicantName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{interview.applicantName}</h3>
                                    <p className="text-sm text-white/40">{interview.applicantEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-sm font-bold">{formatDate(interview.scheduled_at)}</p>
                                    <p className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(interview.scheduled_at)}</p>
                                </div>
                                {interview.meeting_link && (
                                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                        <Video className="w-5 h-5" />
                                    </a>
                                )}
                                <button onClick={() => handleUpdateStatus(interview.id, 'Completed')} className="px-4 py-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Complete
                                </button>
                                <button onClick={() => handleUpdateStatus(interview.id, 'Canceled')} className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-[#0D0D12] text-center text-white/30">
                            No upcoming interviews scheduled.
                        </div>
                    )}
                </div>
            </div>

            {/* Past Interviews */}
            {past.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white/50"><Clock className="w-5 h-5" /> Past ({past.length})</h2>
                    <div className="space-y-3">
                        {past.map(interview => (
                            <div key={interview.id} className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0D0D12]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-bold text-sm">
                                        {interview.applicantName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{interview.applicantName}</h3>
                                        <p className="text-xs text-white/30">{formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${interview.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : interview.status === 'Canceled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                    {interview.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
