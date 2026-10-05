"use client";

import { useState, useEffect } from 'react';
import { FolderOpen, Download, Trash2, Loader2, FileText, Search } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    fullPath: string;
    size: number;
    type: string;
    createdAt: string;
    ownerName: string;
    ownerId: string;
    downloadUrl: string;
    jobTitle: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/admin/documents');
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleDelete = async (fullPath: string) => {
        if (!confirm('Delete this document permanently?')) return;
        try {
            await fetch('/api/admin/documents', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullPath }),
            });
            fetchDocuments();
        } catch (err) { console.error(err); }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const filtered = documents.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group documents by jobTitle
    const grouped = filtered.reduce((acc, doc) => {
        if (!acc[doc.jobTitle]) acc[doc.jobTitle] = [];
        acc[doc.jobTitle].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2 tracking-tight">Documents</h1>
                <p className="text-muted font-light">View and manage uploaded resumes and files.</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search by file name or owner..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent transition-colors text-sm"
                />
            </div>

            {/* Document List */}
            <div className="space-y-6">
                {Object.keys(grouped).length > 0 ? (
                    Object.entries(grouped).map(([jobTitle, docs]) => (
                        <div key={jobTitle} className="glass-panel rounded-[2rem] border border-white/5 bg-[#0D0D12] shadow-xl overflow-hidden mb-8">
                            {/* Group Header */}
                            <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-bold text-white tracking-tight">{jobTitle}</h2>
                                <span className="ml-auto text-xs font-mono text-white/40">{docs.length} Document{docs.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 text-xs font-bold uppercase tracking-widest text-white/40">
                                <div className="col-span-6">File</div>
                                <div className="col-span-4">Applicant Owner</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {docs.map(doc => (
                                    <div key={doc.id} className="grid grid-cols-12 gap-4 px-8 py-5 hover:bg-white/5 transition-colors items-center group">
                                        <div className="col-span-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm truncate">{doc.name}</p>
                                                <p className="text-xs text-white/30 font-mono">{doc.type}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <p className="text-sm text-white/70">{doc.ownerName}</p>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2">
                                            <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent/20 text-white/40 hover:text-accent transition-colors" title="Download">
                                                <Download className="w-5 h-5" />
                                            </a>
                                            {/* We disabled direct delete via Resume storage since now they are strictly bound directly to the applications */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-panel rounded-[2rem] border border-white/5 bg-[#0D0D12] py-16 text-center text-white/30">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No documents found.</p>
                        <p className="text-sm text-white/20 mt-2">Uploaded resumes will appear here, grouped by Job Position.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
