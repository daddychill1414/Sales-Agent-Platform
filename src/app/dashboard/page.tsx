"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import {
    User, FileText, BookOpen, Calendar, CheckCircle2,
    Clock, ArrowRight, LogOut, Loader2, Edit2, Save, X,
    GraduationCap, FileSignature
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

/** Stage configuration with visual styling */
const STAGE_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string }> = {
    'New': { color: 'text-accent', bgColor: 'bg-accent/10', borderColor: 'border-accent/20' },
    'Screening Review': { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    'Qualified': { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
    'Account Invited': { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
    'Exam Assigned': { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    'Interview Scheduled': { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    'Offer Extended': { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
    'Hired': { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
    'Rejected': { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    'Disqualified': { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    'Withdrawn': { color: 'text-white/40', bgColor: 'bg-white/5', borderColor: 'border-white/10' },
};

const PIPELINE_STAGES = [
    'New',
    'Screening Review',
    'Qualified',
    'Account Invited',
    'Exam Assigned',
    'Interview Scheduled',
    'Offer Extended',
    'Hired',
];

interface Profile {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    stage: string;
    created_at: string;
    role: string;
}

interface ApplicantExam {
    id: string;
    status: string;
    score: number | null;
    exam: { title: string; description: string | null } | null;
}

interface Interview {
    id: string;
    scheduled_at: string;
    status: string;
    meeting_link: string | null;
}

/**
 * Applicant Dashboard — Agent-facing portal.
 * Shows application status, pipeline progress, assigned exams,
 * and scheduled interviews.
 */
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [exams, setExams] = useState<ApplicantExam[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Check if user is authenticated
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push('/login');
                    return;
                }

                // First, check role via server-side API (bypasses RLS issues)
                const roleRes = await fetch('/api/user-role');
                const { role } = await roleRes.json();

                // Redirect admins to admin dashboard immediately
                if (role === 'admin') {
                    router.push('/admin');
                    return;
                }

                // Fetch profile for display — .single() returns PGRST116 if no row exists
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, job_positions(title)')
                    .eq('id', user.id)
                    .single();

                // Suppress profile fetch errors since the fallback below handles new users flawlessly.

                if (profileData) {
                    setProfile(profileData);
                } else {
                    // Fallback for new users who don't have a profile row yet
                    setProfile({
                        id: user.id,
                        full_name: user.email?.split('@')[0] || null,
                        first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || null,
                        last_name: user.user_metadata?.last_name || null,
                        phone: user.user_metadata?.phone || null,
                        stage: 'New',
                        created_at: user.created_at,
                        role: role || 'applicant',
                    });
                }

                // Fetch assigned exams
                const { data: examData } = await supabase
                    .from('applicant_exams')
                    .select('id, status, score, exam:exams(title, description)')
                    .eq('applicant_id', user.id);

                if (examData) setExams(examData as unknown as ApplicantExam[]);

                // Fetch interviews
                const { data: interviewData } = await supabase
                    .from('interviews')
                    .select('id, scheduled_at, status, meeting_link')
                    .eq('applicant_id', user.id)
                    .order('scheduled_at', { ascending: true });

                if (interviewData) setInterviews(interviewData);
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const handleEditSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: editForm.firstName,
                    last_name: editForm.lastName,
                    phone: editForm.phone
                })
                .eq('id', profile.id);

            if (!error) {
                setProfile({ ...profile, first_name: editForm.firstName, last_name: editForm.lastName, phone: editForm.phone });
                setIsEditing(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    // Get current stage index for progress bar
    const currentStageIndex = profile ? PIPELINE_STAGES.indexOf(profile.stage) : 0;
    const stageStyle = profile ? (STAGE_CONFIG[profile.stage] || STAGE_CONFIG['Application Submitted']) : STAGE_CONFIG['Application Submitted'];

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Navbar />
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-muted font-mono text-sm uppercase tracking-widest">Loading dashboard...</p>
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
                    <motion.div variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                                Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}.
                            </h1>
                            <p className="text-muted text-lg font-light">
                                Track your OneNetworx application progress.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <button
                                id="dashboard-sign-out"
                                onClick={handleSignOut}
                                className="btn-outline px-6 py-3 flex items-center gap-2 text-sm"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Status Card */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 md:p-10 rounded-[2rem] border border-white/5 shadow-2xl mb-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">Current Status</p>
                                <span className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${stageStyle.bgColor} ${stageStyle.color} ${stageStyle.borderColor} border`}>
                                    {profile?.stage || 'Unknown'}
                                </span>
                            </div>
                            <p className="text-sm text-white/40 font-mono">
                                Applied: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </p>
                        </div>

                        {/* Pipeline Progress */}
                        <div className="relative">
                            <div className="flex items-center justify-between relative">
                                {/* Background track */}
                                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/5 rounded-full z-0" />
                                {/* Active track */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full z-0 transition-all duration-1000"
                                    style={{ width: `${Math.max(0, (currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100)}%` }}
                                />

                                {PIPELINE_STAGES.map((stage, i) => (
                                    <div key={stage} className="relative z-10 flex flex-col items-center" title={stage}>
                                        <div className={`w-4 h-4 rounded-full border-2 transition-colors ${i <= currentStageIndex
                                                ? 'bg-accent border-accent'
                                                : 'bg-[#1a1a24] border-white/20'
                                            }`} />
                                        <span className={`text-[10px] font-mono mt-3 max-w-[60px] text-center leading-tight hidden md:block ${i <= currentStageIndex ? 'text-accent' : 'text-white/20'
                                            }`}>
                                            {stage.replace('Application ', '').replace('Interview ', 'Int. ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Profile Summary */}
                        <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                                    <User className="w-5 h-5 text-accent" /> Profile Summary
                                </h2>
                                {!isEditing ? (
                                    <button onClick={() => {
                                        setEditForm({ firstName: profile?.first_name || '', lastName: profile?.last_name || '', phone: profile?.phone || '' });
                                        setIsEditing(true);
                                    }} className="text-white/50 hover:text-white transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={editForm.firstName} onChange={e => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} placeholder="First Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent" />
                                        <input type="text" value={editForm.lastName} onChange={e => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Last Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent" />
                                    <button onClick={handleEditSave} disabled={saving} className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-white/50 text-sm">Full Name</span>
                                        <span className="font-medium">{profile?.first_name} {profile?.last_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-white/50 text-sm">Phone</span>
                                        <span className="font-medium font-mono">{profile?.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-white/50 text-sm">Applied For</span>
                                        <span className="font-medium text-accent">{profile?.job_positions?.title || 'Open Application'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-white/50 text-sm">Resume</span>
                                        <span className="text-accent text-sm font-bold">
                                            <FileText className="w-4 h-4 inline-block mr-1" /> Uploaded
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Assigned Exams */}
                        <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl">
                            <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-accent" /> Assigned Exams
                            </h2>
                            {exams.length > 0 ? (
                                <div className="space-y-4">
                                    {exams.map((exam) => (
                                        <div key={exam.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/20 transition-colors">
                                            <div>
                                                <p className="font-medium">{typeof exam.exam === 'object' && exam.exam !== null ? exam.exam.title : 'Exam'}</p>
                                                <p className="text-xs text-white/40 font-mono uppercase">{exam.status}</p>
                                            </div>
                                            {exam.status === 'Assigned' ? (
                                                <Link
                                                    href="/exam"
                                                    id={`dashboard-exam-${exam.id}`}
                                                    className="text-accent text-sm font-bold flex items-center gap-1 hover:text-white transition-colors"
                                                >
                                                    Take Exam <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-green-400 text-sm flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" />{exam.score !== null ? `${exam.score}%` : 'Done'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-white/20">
                                    <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No exams assigned yet</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Quick Actions: Training & Contracts */}
                        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href="/dashboard/training" className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/20 transition-all group cursor-pointer flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                                    <GraduationCap className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-0.5">Training Portal</h3>
                                    <p className="text-sm text-white/40">Complete your required training modules</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href="/dashboard/contract" className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/20 transition-all group cursor-pointer flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                                    <FileSignature className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-0.5">Contracts</h3>
                                    <p className="text-sm text-white/40">Review and sign your employment contract</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>

                        {/* Scheduled Interviews */}
                        <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl lg:col-span-2">
                            <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-accent" /> Scheduled Interviews
                            </h2>
                            {interviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {interviews.map((interview) => (
                                        <div key={interview.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {new Date(interview.scheduled_at).toLocaleDateString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-white/40 font-mono">
                                                        {new Date(interview.scheduled_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })} • {interview.status}
                                                    </p>
                                                </div>
                                            </div>
                                            {interview.meeting_link && interview.status === 'Scheduled' && (
                                                <a
                                                    href={interview.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-primary px-5 py-2.5 text-xs"
                                                >
                                                    <span className="btn-slide" />
                                                    Join Meeting
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-white/20">
                                    <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No interviews scheduled yet</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
