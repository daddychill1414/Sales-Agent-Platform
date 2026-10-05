"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Briefcase, Loader2, Save, MapPin, Clock, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    benefits: string[];
    salary_range: string;
    active: boolean;
    applicantCount: number;
    created_at: string;
}

export default function JobPositionsPage() {
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPos, setEditingPos] = useState<JobPosition | null>(null);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('Remote');
    const [type, setType] = useState('Full-Time');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [benefits, setBenefits] = useState('');
    const [salaryRange, setSalaryRange] = useState('');

    const fetchPositions = async () => {
        try {
            const res = await fetch('/api/admin/job-positions');
            if (res.ok) {
                const data = await res.json();
                setPositions(data.positions || []);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchPositions(); }, []);

    const resetForm = () => {
        setShowForm(false); setEditingPos(null);
        setTitle(''); setDepartment(''); setLocation('Remote'); setType('Full-Time');
        setDescription(''); setRequirements(''); setBenefits(''); setSalaryRange('');
    };

    const handleCreate = async () => {
        if (!title || !description) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/job-positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, department, location, type, description,
                    requirements: requirements.split('\n').filter(Boolean),
                    benefits: benefits.split('\n').filter(Boolean),
                    salary_range: salaryRange || null,
                }),
            });
            if (res.ok) { resetForm(); fetchPositions(); }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editingPos) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/job-positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPos.id, title, department, location, type, description,
                    requirements: requirements.split('\n').filter(Boolean),
                    benefits: benefits.split('\n').filter(Boolean),
                    salary_range: salaryRange || null,
                }),
            });
            if (res.ok) { resetForm(); fetchPositions(); }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const toggleActive = async (pos: JobPosition) => {
        try {
            await fetch('/api/admin/job-positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pos.id, active: !pos.active }),
            });
            fetchPositions();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this job position?')) return;
        try {
            await fetch('/api/admin/job-positions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchPositions();
        } catch (err) { console.error(err); }
    };

    const openEdit = (pos: JobPosition) => {
        setEditingPos(pos); setTitle(pos.title); setDepartment(pos.department || '');
        setLocation(pos.location || 'Remote'); setType(pos.type || 'Full-Time');
        setDescription(pos.description || ''); setRequirements((pos.requirements || []).join('\n'));
        setBenefits((pos.benefits || []).join('\n')); setSalaryRange(pos.salary_range || '');
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Job Positions</h1>
                    <p className="text-muted font-light">Create and manage job openings visible on the careers page.</p>
                </div>
                <button onClick={() => { setShowForm(true); resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus className="w-5 h-5" /> New Position
                </button>
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {(showForm || editingPos) && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0D0D12] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl max-h-[85vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold tracking-tight mb-6">{editingPos ? 'Edit' : 'New'} Position</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Title *</label>
                                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" placeholder="e.g. Sales Agent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Department</label>
                                        <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" placeholder="e.g. Sales" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Location</label>
                                        <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" placeholder="Remote" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Type</label>
                                        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent appearance-none cursor-pointer">
                                            <option value="Full-Time" className="bg-[#0D0D12] text-white">Full-Time</option>
                                            <option value="Part-Time" className="bg-[#0D0D12] text-white">Part-Time</option>
                                            <option value="Contract" className="bg-[#0D0D12] text-white">Contract</option>
                                            <option value="Internship" className="bg-[#0D0D12] text-white">Internship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Salary Range</label>
                                        <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" placeholder="e.g. ₱20K-50K" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Description *</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-28 resize-none" placeholder="Job description..." />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Requirements (one per line)</label>
                                    <textarea value={requirements} onChange={e => setRequirements(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-24 resize-none" placeholder="Excellent communication skills&#10;Self-motivated&#10;..." />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Benefits (one per line)</label>
                                    <textarea value={benefits} onChange={e => setBenefits(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-24 resize-none" placeholder="Flexible schedule&#10;Commission-based income&#10;..." />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                                    <button onClick={editingPos ? handleUpdate : handleCreate} disabled={saving || !title || !description} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingPos ? 'Update' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Positions Grid */}
            {positions.length > 0 ? (
                <div className="space-y-6">
                    {positions.map(pos => (
                        <div key={pos.id} className={`glass-panel p-8 rounded-[2rem] border shadow-xl transition-all ${pos.active ? 'border-white/5 bg-[#0D0D12]' : 'border-white/5 bg-[#0D0D12]/50 opacity-60'}`}>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-4 mb-3">
                                        <h3 className="text-2xl font-bold tracking-tight">{pos.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${pos.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                            {pos.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-white/50">
                                        {pos.department && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {pos.department}</span>}
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {pos.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {pos.type}</span>
                                        <span className="flex items-center gap-1"><Users className="w-4 h-4 text-accent" /> {pos.applicantCount} applicants</span>
                                        {pos.salary_range && <span className="text-accent font-medium">{pos.salary_range}</span>}
                                    </div>
                                    <p className="text-muted text-sm font-light leading-relaxed line-clamp-2">{pos.description}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button onClick={() => toggleActive(pos)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title={pos.active ? 'Deactivate' : 'Activate'}>
                                        {pos.active ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6" />}
                                    </button>
                                    <button onClick={() => openEdit(pos)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(pos.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-16 rounded-[2rem] border border-white/5 bg-[#0D0D12] text-center shadow-xl">
                    <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white/60 mb-2">No Job Positions Yet</h3>
                    <p className="text-white/30 mb-6">Create your first job opening. It will appear on the careers page.</p>
                    <button onClick={() => setShowForm(true)} className="btn-primary px-8 py-3 shadow-lg shadow-accent/20">Create Position</button>
                </div>
            )}
        </div>
    );
}
