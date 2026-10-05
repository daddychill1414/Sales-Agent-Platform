"use client";

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, TrendingUp, Loader2, ShieldCheck, XCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { getStageBadgeClass } from '@/lib/permissions';

interface StatsData {
    totalApplicants: number;
    pendingReview: number;
    qualified: number;
    hiredAgents: number;
    rejected: number;
    interviewStage: number;
    screeningPassRate: string;
    conversionRate: string;
    recentApplicants: Array<{
        id: string;
        tracking_code: string;
        full_name: string;
        first_name: string;
        last_name: string;
        email: string;
        stage: string;
        screening_qualified: boolean | null;
        created_at: string;
    }>;
    pipeline: Record<string, number>;
    recentActivity: Array<{
        id: string;
        user_email: string;
        action: string;
        description: string;
        created_at: string;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    const statCards = [
        { label: "Total Applications", value: String(stats?.totalApplicants || 0), icon: Users, trend: "All time" },
        { label: "Pending Review", value: String(stats?.pendingReview || 0), icon: FileText, trend: "Requires Action", alert: (stats?.pendingReview || 0) > 0 },
        { label: "Qualified", value: String(stats?.qualified || 0), icon: ShieldCheck, trend: `${stats?.screeningPassRate || '0'}% pass rate` },
        { label: "Hired Agents", value: String(stats?.hiredAgents || 0), icon: TrendingUp, trend: `${stats?.conversionRate || '0'}% conversion` }
    ];

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
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-bold mb-2 tracking-tight">System Dashboard</h1>
                <p className="text-muted text-lg font-light">Real-time overview of the sales agent recruitment pipeline.</p>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className={`glass-panel p-6 rounded-3xl border ${stat.alert ? 'border-accent/40 bg-accent/5' : 'border-white/5 bg-[#0D0D12]'} shadow-xl relative overflow-hidden`}>
                        {stat.alert && <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.alert ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white border border-white/10'}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-bold tracking-tight mb-1">{stat.value}</h3>
                            <p className="text-muted font-medium">{stat.label}</p>
                            <p className={`text-xs mt-4 font-mono uppercase tracking-wider ${stat.alert ? 'text-accent font-bold' : 'text-white/40'}`}>{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* RECENT ACTIVITY & PIPELINE PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl bg-[#0D0D12]">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Recent Applications</h2>
                    </div>
                    <div className="space-y-4">
                        {(stats?.recentApplicants || []).length > 0 ? (
                            stats!.recentApplicants.map((app) => (
                                <Link key={app.id} href={`/admin/applicants/${app.id}`} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white/50 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                            {(app.full_name || `${app.first_name || ''} ${app.last_name || ''}`).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-lg tracking-tight">{app.full_name || `${app.first_name || ''} ${app.last_name || ''}`}</h4>
                                            <p className="text-white/40 text-sm">{app.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <span className="text-sm text-white/30 hidden md:block">{formatTimeAgo(app.created_at)}</span>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${getStageBadgeClass(app.stage)}`}>
                                            {app.stage}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 text-white/30">
                                <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p>No applications yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl bg-[#0D0D12] flex flex-col">
                    <h2 className="text-2xl font-bold tracking-tight mb-8">Pipeline Health</h2>
                    <div className="flex-grow space-y-6">
                        {[
                            { stage: "Total Applications", count: stats?.totalApplicants || 0 },
                            { stage: "Qualified", count: stats?.qualified || 0 },
                            { stage: "Interviews", count: stats?.interviewStage || 0 },
                            { stage: "Hired", count: stats?.hiredAgents || 0 },
                        ].map((stat, i) => {
                            const max = Math.max(stats?.totalApplicants || 1, 1);
                            return (
                                <div key={i} className="last:mb-0">
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-white/70">{stat.stage}</span>
                                        <span className="font-mono">{stat.count}</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-accent h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${(stat.count / max) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-accent mb-1 uppercase tracking-widest font-mono">Conversion Rate</h4>
                            <p className="text-3xl font-bold tracking-tighter">{stats?.conversionRate || '0.0'}%</p>
                            <p className="text-xs text-muted mt-2">Overall hire rate from initial application start.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
