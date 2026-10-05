"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Activity, Search, Loader2, Filter, Calendar, User, ChevronDown, Shield } from 'lucide-react';

interface AuditEntry {
    id: string;
    user_email: string;
    user_role: string;
    action: string;
    description: string;
    target_type: string;
    target_id: string;
    created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
    stage_change: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    create: 'bg-green-500/10 text-green-400 border-green-500/20',
    update: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    delete: 'bg-red-500/10 text-red-400 border-red-500/20',
    login: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    email_sent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchAudit = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (actionFilter) params.set('action', actionFilter);

            const res = await fetch(`/api/admin/audit?${params}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
            }
        } catch { /* empty */ } finally { setLoading(false); }
    }, [search, actionFilter]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => fetchAudit(), 300);
        return () => clearTimeout(timer);
    }, [fetchAudit]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-red-400" />
                    <h1 className="text-4xl font-bold tracking-tight">Audit Log</h1>
                </div>
                <p className="text-white/50 text-lg font-light">Every admin action is recorded. Super Admin only.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by email, description..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent text-sm"
                    />
                </div>
                <div className="relative">
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 appearance-none pr-10 text-sm cursor-pointer focus:outline-none focus:border-accent text-white"
                    >
                        <option value="" className="bg-[#0D0D12]">All Actions</option>
                        <option value="stage_change" className="bg-[#0D0D12]">Stage Changes</option>
                        <option value="create" className="bg-[#0D0D12]">Creates</option>
                        <option value="update" className="bg-[#0D0D12]">Updates</option>
                        <option value="delete" className="bg-[#0D0D12]">Deletes</option>
                        <option value="email_sent" className="bg-[#0D0D12]">Emails Sent</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
            </div>

            {/* Log Table */}
            <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 text-xs font-bold uppercase tracking-widest text-white/40 bg-[#050508]/30">
                    <div className="col-span-2">When</div>
                    <div className="col-span-2">Who</div>
                    <div className="col-span-2">Action</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Target</div>
                </div>

                {/* Body */}
                <div className="max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-20 text-white/30">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No audit entries found.</p>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center text-sm">
                                <div className="col-span-2 text-white/50 font-mono text-xs flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> {formatDate(entry.created_at)}
                                </div>
                                <div className="col-span-2 flex items-center gap-2 min-w-0">
                                    <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                    <span className="text-white/70 truncate">{entry.user_email || 'System'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${ACTION_COLORS[entry.action] || 'bg-white/5 text-white/40 border-white/10'}`}>
                                        {entry.action}
                                    </span>
                                </div>
                                <div className="col-span-4 text-white/60 truncate">{entry.description || '—'}</div>
                                <div className="col-span-2 text-white/40 font-mono text-xs">{entry.target_type || '—'}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
