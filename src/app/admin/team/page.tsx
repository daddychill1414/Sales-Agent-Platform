"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { ShieldAlert, Loader2, Search, User, Shield, RefreshCw, Briefcase, Mail } from 'lucide-react';

interface TeamMember {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    created_at: string;
}

const AVAILABLE_ROLES = [
    { value: 'applicant', label: 'Applicant' },
    { value: 'agent', label: 'Agent' },
    { value: 'screener', label: 'Screener' },
    { value: 'hr_admin', label: 'HR Admin' },
    { value: 'super_admin', label: 'Super Admin' },
];

export default function TeamManagementPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchTeam = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim() !== '') {
                params.set('search', searchQuery.trim());
            }
            const res = await fetch(`/api/admin/team?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data.team || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => fetchTeam(), 400);
        return () => clearTimeout(timer);
    }, [fetchTeam]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        
        setUpdatingId(userId);
        setMessage({ type: '', text: '' });
        
        try {
            const res = await fetch('/api/admin/team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRole })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: 'success', text: 'Role successfully updated.' });
                fetchTeam(); // Refresh
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update role.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setUpdatingId(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            case 'hr_admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'screener': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'agent': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Team Management</h1>
                    <p className="text-muted font-light">
                        Elevate users to staff roles and manage administrative access levels.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search email to promote..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0D0D12] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent w-64 text-white placeholder:text-white/20 font-mono transition-colors"
                        />
                    </div>
                </div>
            </div>

            {message.text && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border font-mono text-sm tracking-widest uppercase ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                    {message.text}
                </motion.div>
            )}

            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="glass-panel border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-10 py-5 border-b border-white/5 text-xs font-bold uppercase tracking-widest text-white/40 bg-[#050508]/30">
                    <div className="col-span-5">Identity</div>
                    <div className="col-span-4">Role Assignment</div>
                    <div className="col-span-3 text-right">Joined</div>
                </div>

                {/* Table Body */}
                <div className="p-4 flex-grow relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-b-[2rem]">
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        </div>
                    ) : team.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-white/30 text-center">
                            <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-mono text-sm uppercase tracking-widest">No users found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {team.map((member) => (
                                <motion.div 
                                    variants={fadeInUp} 
                                    key={member.id} 
                                    className="grid grid-cols-12 gap-4 px-6 py-5 rounded-2xl border border-transparent hover:border-white/10 hover:bg-[#0D0D12] transition-colors items-center group"
                                >
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/50 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                                            {member.first_name ? member.first_name[0].toUpperCase() : <User className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white tracking-tight flex items-center gap-2">
                                                {member.first_name || ''} {member.last_name || 'System User'}
                                                {member.role === 'super_admin' && <Shield className="w-3.5 h-3.5 text-cyan-400" />}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-white/40 mt-1 font-mono">
                                                <Mail className="w-3 h-3" /> {member.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${getRoleBadgeColor(member.role)}`}>
                                            {member.role.replace('_', ' ')}
                                        </div>
                                        
                                        <div className="relative">
                                            {updatingId === member.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-accent ml-2" />
                                            ) : (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                    className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white/50 focus:outline-none focus:border-accent hover:border-white/30 transition-colors cursor-pointer appearance-none ml-2"
                                                >
                                                    {AVAILABLE_ROLES.map((role) => (
                                                        <option key={role.value} value={role.value} className="bg-[#0D0D12] text-white">
                                                            Modify to {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <span className="text-xs font-mono text-white/30">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
