"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Loader2, Save, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Article {
    id: string;
    title: string;
    content: string;
    authorName: string;
    created_at: string;
    updated_at: string;
}

export default function KnowledgePage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/admin/articles');
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchArticles(); }, []);

    const handleCreate = async () => {
        if (!formTitle || !formContent) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: formTitle, content: formContent }),
            });
            if (res.ok) {
                resetForm();
                fetchArticles();
            }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editingArticle) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/articles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingArticle.id, title: formTitle, content: formContent }),
            });
            if (res.ok) {
                resetForm();
                fetchArticles();
            }
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this article?')) return;
        try {
            await fetch('/api/admin/articles', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchArticles();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingArticle(null);
        setFormTitle('');
        setFormContent('');
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">HR Knowledge Base</h1>
                    <p className="text-muted font-light">Manage articles, policies, and company resources.</p>
                </div>
                <button onClick={() => { setShowForm(true); setFormTitle(''); setFormContent(''); }} className="btn-primary flex items-center gap-2 shadow-lg shadow-accent/20">
                    <Plus className="w-5 h-5" /> New Article
                </button>
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {(showForm || editingArticle) && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0D0D12] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl">
                            <h2 className="text-2xl font-bold tracking-tight mb-6">{editingArticle ? 'Edit' : 'New'} Article</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Title</label>
                                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" placeholder="Article title..." />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Content</label>
                                    <textarea value={formContent} onChange={e => setFormContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-48 resize-none" placeholder="Write article content..." />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                                    <button onClick={editingArticle ? handleUpdate : handleCreate} disabled={saving || !formTitle || !formContent} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingArticle ? 'Update' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Articles Grid */}
            {articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map(article => (
                        <div key={article.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-[#0D0D12] shadow-xl group hover:border-white/10 transition-all flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-accent transition-colors">{article.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed line-clamp-4 mb-4">{article.content}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-xs text-white/30 font-mono">{article.authorName}</p>
                                    <p className="text-xs text-white/20">{formatDate(article.created_at)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingArticle(article); setFormTitle(article.title); setFormContent(article.content); }} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(article.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-16 rounded-[2rem] border border-white/5 bg-[#0D0D12] text-center shadow-xl">
                    <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white/60 mb-2">No Articles Yet</h3>
                    <p className="text-white/30 mb-6">Start building your knowledge base with HR resources and policies.</p>
                    <button onClick={() => setShowForm(true)} className="btn-primary px-8 py-3 shadow-lg shadow-accent/20">Create First Article</button>
                </div>
            )}
        </div>
    );
}
