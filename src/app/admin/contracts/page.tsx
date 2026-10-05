"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Plus, Edit3, Trash2, FileSignature, Save, X, Loader2, Eye, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

interface ContractTemplate {
    id: string;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const TEMPLATE_VARIABLES = [
    { var: '{{FULL_NAME}}', desc: 'Applicant full name' },
    { var: '{{FIRST_NAME}}', desc: 'Applicant first name' },
    { var: '{{LAST_NAME}}', desc: 'Applicant last name' },
    { var: '{{EMAIL}}', desc: 'Applicant email' },
    { var: '{{POSITION}}', desc: 'Job position title' },
    { var: '{{DATE}}', desc: 'Current date' },
    { var: '{{START_DATE}}', desc: 'Start date' },
    { var: '{{COMPANY}}', desc: 'OneNetworx' },
];

export default function ContractsPage() {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<ContractTemplate | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/contracts');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch {
            console.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    const resetForm = () => {
        setFormTitle('');
        setFormContent('');
        setEditing(null);
        setShowNew(false);
        setShowPreview(false);
    };

    const startEdit = (t: ContractTemplate) => {
        setEditing(t);
        setFormTitle(t.title);
        setFormContent(t.content);
        setShowNew(false);
    };

    const startNew = () => {
        resetForm();
        setShowNew(true);
        setFormContent(DEFAULT_CONTRACT_TEMPLATE);
    };

    const handleSave = async () => {
        if (!formTitle.trim() || !formContent.trim()) return;
        setSaving(true);
        try {
            const body = { title: formTitle.trim(), content: formContent };
            const method = editing ? 'PUT' : 'POST';
            if (editing) Object.assign(body, { id: editing.id });

            const res = await fetch('/api/contracts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                resetForm();
                fetchTemplates();
            }
        } catch {
            console.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this contract template?')) return;
        try {
            await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
            fetchTemplates();
        } catch {
            console.error('Delete failed');
        }
    };

    const insertVariable = (v: string) => {
        setFormContent(prev => prev + v);
    };

    const previewContent = formContent
        .replace(/\{\{FULL_NAME\}\}/g, 'Juan Dela Cruz')
        .replace(/\{\{FIRST_NAME\}\}/g, 'Juan')
        .replace(/\{\{LAST_NAME\}\}/g, 'Dela Cruz')
        .replace(/\{\{EMAIL\}\}/g, 'juan@example.com')
        .replace(/\{\{POSITION\}\}/g, 'Sales Agent')
        .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
        .replace(/\{\{START_DATE\}\}/g, 'TBD')
        .replace(/\{\{COMPANY\}\}/g, 'OneNetworx');

    const isEditorOpen = showNew || !!editing;

    return (
        <div>
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Contract Templates</h1>
                        <p className="text-white/50 mt-2 text-lg font-light">Build and manage e-contract templates with dynamic variables.</p>
                    </div>
                    {!isEditorOpen && (
                        <button onClick={startNew} className="btn-primary px-6 py-3 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> New Template
                        </button>
                    )}
                </div>

                {/* Editor */}
                <AnimatePresence>
                    {isEditorOpen && (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="glass-panel p-8 rounded-[2rem] border border-accent/20 bg-accent/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold">{editing ? 'Edit Template' : 'New Contract Template'}</h3>
                                    <button onClick={resetForm} className="text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                                </div>

                                {/* Title */}
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Template name, e.g. 'Agent Employment Contract'"
                                    className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent transition-colors text-lg font-bold"
                                />

                                {/* Variable Chips */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Insert Variable</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TEMPLATE_VARIABLES.map(v => (
                                            <button
                                                key={v.var}
                                                type="button"
                                                onClick={() => insertVariable(v.var)}
                                                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-mono border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer flex items-center gap-1"
                                                title={v.desc}
                                            >
                                                <Copy className="w-3 h-3" /> {v.var}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggle: Edit / Preview */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${!showPreview ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                    >
                                        <Edit3 className="w-4 h-4 inline mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${showPreview ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                    >
                                        <Eye className="w-4 h-4 inline mr-1" /> Preview
                                    </button>
                                </div>

                                {/* Content */}
                                {showPreview ? (
                                    <div className="bg-white text-black rounded-2xl p-10 min-h-[400px] prose prose-sm max-w-none font-serif leading-relaxed whitespace-pre-wrap">
                                        {previewContent}
                                    </div>
                                ) : (
                                    <textarea
                                        value={formContent}
                                        onChange={(e) => setFormContent(e.target.value)}
                                        placeholder="Write your contract content here. Use {{VARIABLES}} for dynamic fields."
                                        rows={20}
                                        className="w-full bg-[#0D0D12]/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-accent transition-colors font-mono text-sm leading-relaxed resize-none"
                                    />
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button onClick={resetForm} className="btn-outline px-6 py-3">Cancel</button>
                                    <button onClick={handleSave} disabled={saving || !formTitle.trim()} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editing ? 'Update' : 'Save Template'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Template List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : templates.length === 0 && !isEditorOpen ? (
                    <div className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                        <FileSignature className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-xl font-bold mb-2">No Contract Templates</p>
                        <p className="text-white/40 font-light mb-6">Create your first template to start generating e-contracts.</p>
                        <button onClick={startNew} className="btn-primary px-6 py-3">Create Template</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {templates.map((t) => (
                            <div key={t.id} className={`glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all ${!t.is_active ? 'opacity-40' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                        <FileSignature className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{t.title}</h3>
                                        <p className="text-xs text-white/40 font-mono mt-1">
                                            Updated {new Date(t.updated_at).toLocaleDateString()} · {t.content.length} chars
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(t)} className="p-2.5 rounded-xl bg-white/5 hover:bg-accent/20 hover:text-accent text-white/40 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

const DEFAULT_CONTRACT_TEMPLATE = `EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is entered into on {{DATE}} between:

EMPLOYER: {{COMPANY}}
EMPLOYEE: {{FULL_NAME}}
EMAIL: {{EMAIL}}
POSITION: {{POSITION}}
START DATE: {{START_DATE}}

1. SCOPE OF WORK
The Employee agrees to perform the duties and responsibilities associated with the position of {{POSITION}} as assigned by the Employer.

2. COMPENSATION
The Employee shall be compensated on a commission-based structure as outlined in the compensation schedule provided separately.

3. TERM
This Contract shall commence on {{START_DATE}} and shall continue until terminated by either party with 30 days written notice.

4. CONFIDENTIALITY
The Employee agrees to maintain the confidentiality of all proprietary information, trade secrets, and business strategies of the Employer.

5. TERMINATION
Either party may terminate this agreement with 30 days written notice. The Employer reserves the right to terminate immediately for cause.

6. ACKNOWLEDGMENT
By signing below, both parties acknowledge that they have read, understood, and agree to the terms of this Contract.


_________________________          _________________________
{{FULL_NAME}}                      Authorized Representative
Employee                           {{COMPANY}}

Date: {{DATE}}                     Date: {{DATE}}
`;
