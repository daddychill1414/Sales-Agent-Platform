"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Plus, Edit3, Trash2, GraduationCap, Save, X, Loader2, Video, FileText, ToggleRight, ToggleLeft, GripVertical, ExternalLink } from 'lucide-react';

interface TrainingModule {
    id: string;
    title: string;
    description: string;
    content: string;
    video_url: string;
    order_index: number;
    is_required: boolean;
    is_active: boolean;
    created_at: string;
}

export default function TrainingPage() {
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<TrainingModule | null>(null);
    const [showNew, setShowNew] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formVideo, setFormVideo] = useState('');
    const [formRequired, setFormRequired] = useState(true);

    const fetchModules = useCallback(async () => {
        try {
            const res = await fetch('/api/training');
            if (res.ok) {
                const data = await res.json();
                setModules((data.modules || []).sort((a: TrainingModule, b: TrainingModule) => a.order_index - b.order_index));
            }
        } catch { /* empty */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchModules(); }, [fetchModules]);

    const resetForm = () => {
        setFormTitle(''); setFormDesc(''); setFormContent(''); setFormVideo('');
        setFormRequired(true); setEditing(null); setShowNew(false);
    };

    const startEdit = (m: TrainingModule) => {
        setEditing(m); setShowNew(false);
        setFormTitle(m.title); setFormDesc(m.description || '');
        setFormContent(m.content || ''); setFormVideo(m.video_url || '');
        setFormRequired(m.is_required);
    };

    const handleSave = async () => {
        if (!formTitle.trim()) return;
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                title: formTitle.trim(),
                description: formDesc.trim(),
                content: formContent,
                videoUrl: formVideo.trim(),
                isRequired: formRequired,
            };

            if (editing) {
                body.id = editing.id;
                await fetch('/api/training', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            } else {
                body.orderIndex = modules.length + 1;
                await fetch('/api/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            }

            resetForm();
            fetchModules();
        } catch { /* empty */ } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this training module?')) return;
        await fetch(`/api/training?id=${id}`, { method: 'DELETE' });
        fetchModules();
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
    };

    const isEditorOpen = showNew || !!editing;

    return (
        <div>
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Training Modules</h1>
                        <p className="text-white/50 mt-2 text-lg font-light">Create and manage training content for agents (video + text).</p>
                    </div>
                    {!isEditorOpen && (
                        <button onClick={() => { resetForm(); setShowNew(true); }} className="btn-primary px-6 py-3 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> New Module
                        </button>
                    )}
                </div>

                {/* Editor */}
                <AnimatePresence>
                    {isEditorOpen && (
                        <motion.div key="editor" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="glass-panel p-8 rounded-[2rem] border border-accent/20 bg-accent/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold">{editing ? 'Edit Module' : 'New Training Module'}</h3>
                                    <button onClick={resetForm} className="text-white/40 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Module Title</label>
                                        <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Company Overview" className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Video URL (YouTube/Vimeo)</label>
                                        <input type="url" value={formVideo} onChange={(e) => setFormVideo(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Short Description</label>
                                    <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief overview of this module" className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Lesson Content (Text/Instructions)</label>
                                    <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={10} placeholder="Write the training material here..." className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent resize-none text-sm leading-relaxed" />
                                </div>

                                {/* Video Preview */}
                                {formVideo && getEmbedUrl(formVideo) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Video Preview</label>
                                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                                            <iframe src={getEmbedUrl(formVideo)!} className="w-full h-full" allowFullScreen title="Video Preview" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setFormRequired(!formRequired)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center gap-2 ${formRequired ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                        {formRequired ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        {formRequired ? 'Required Module' : 'Optional Module'}
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={resetForm} className="btn-outline px-6 py-3">Cancel</button>
                                        <button onClick={handleSave} disabled={saving || !formTitle.trim()} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {editing ? 'Update' : 'Save Module'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Module List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : modules.length === 0 && !isEditorOpen ? (
                    <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                        <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-xl font-bold mb-2">No Training Modules</p>
                        <p className="text-white/40 font-light mb-6">Create modules with video content and text lessons for your agents.</p>
                        <button onClick={() => { resetForm(); setShowNew(true); }} className="btn-primary px-6 py-3">Create Module</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {modules.map((m, i) => (
                            <div key={m.id} className={`glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-all ${!m.is_active ? 'opacity-40' : ''}`}>
                                <GripVertical className="w-5 h-5 text-white/20 shrink-0" />
                                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold font-mono text-sm shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-white truncate">{m.title}</h3>
                                        {m.is_required && <span className="text-accent text-xs font-bold px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">Required</span>}
                                        {m.video_url && <span title="Has video"><Video className="w-4 h-4 text-blue-400" /></span>}
                                        {m.content && <span title="Has text content"><FileText className="w-4 h-4 text-green-400" /></span>}
                                    </div>
                                    {m.description && <p className="text-sm text-white/40 truncate">{m.description}</p>}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {m.video_url && (
                                        <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-white/40 transition-colors"><ExternalLink className="w-4 h-4" /></a>
                                    )}
                                    <button onClick={() => startEdit(m)} className="p-2.5 rounded-xl bg-white/5 hover:bg-accent/20 hover:text-accent text-white/40 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(m.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
