"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Navbar } from '@/components/Navbar';
import {
    FileSignature, CheckCircle2, Loader2, ArrowLeft, Clock,
    AlertTriangle, Download, Eye
} from 'lucide-react';
import Link from 'next/link';

interface Contract {
    id: string;
    template_id: string;
    rendered_content: string;
    status: 'pending' | 'signed' | 'expired';
    signed_at: string | null;
    created_at: string;
    contract_templates?: {
        name: string;
    };
}

export default function AgentContractPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingContract, setViewingContract] = useState<Contract | null>(null);
    const [signing, setSigning] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchContracts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data } = await supabase
                .from('contracts')
                .select('*, contract_templates(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setContracts(data);
        } catch (err) {
            console.error('Contract fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [router, supabase]);

    useEffect(() => { fetchContracts(); }, [fetchContracts]);

    const handleSign = async (contractId: string) => {
        setSigning(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('contracts')
                .update({
                    status: 'signed',
                    signed_at: new Date().toISOString(),
                    signature_ip: 'client',
                })
                .eq('id', contractId)
                .eq('user_id', user.id);

            if (!error) {
                setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'signed', signed_at: new Date().toISOString() } : c));
                setViewingContract(null);
                setAgreed(false);
            }
        } catch (err) {
            console.error('Sign contract error:', err);
        } finally {
            setSigning(false);
        }
    };

    const pendingContracts = contracts.filter(c => c.status === 'pending');
    const signedContracts = contracts.filter(c => c.status === 'signed');

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Navbar />
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-muted font-mono text-sm uppercase tracking-widest">Loading contracts...</p>
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
                    <motion.div variants={fadeInUp} className="mb-10">
                        <Link href="/dashboard" className="text-accent text-sm font-bold mb-4 inline-flex items-center gap-1 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                            Contracts
                        </h1>
                        <p className="text-muted text-lg font-light">
                            Review and sign your employment contracts.
                        </p>
                    </motion.div>

                    {/* Contract Viewer Modal */}
                    {viewingContract && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-[#0a0a0f] border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
                            >
                                {/* Modal Header */}
                                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div>
                                        <h3 className="text-lg font-bold">{viewingContract.contract_templates?.name || 'Employment Contract'}</h3>
                                        <p className="text-xs text-white/40 font-mono mt-1">
                                            Issued: {new Date(viewingContract.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setViewingContract(null); setAgreed(false); }}
                                        className="btn-outline px-4 py-2 text-sm"
                                    >
                                        Close
                                    </button>
                                </div>

                                {/* Contract Content */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    <div className="prose prose-invert max-w-none bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                                        <div
                                            className="text-sm text-white/80 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: viewingContract.rendered_content.replace(/\n/g, '<br/>') }}
                                        />
                                    </div>
                                </div>

                                {/* Sign Section */}
                                {viewingContract.status === 'pending' && (
                                    <div className="p-6 border-t border-white/5 shrink-0 space-y-4">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={agreed}
                                                onChange={(e) => setAgreed(e.target.checked)}
                                                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent cursor-pointer"
                                            />
                                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                                                I have read and agree to the terms outlined in this contract. I understand that by clicking &quot;Sign Contract&quot; below, I am providing my electronic signature, which is legally binding.
                                            </span>
                                        </label>
                                        <button
                                            onClick={() => handleSign(viewingContract.id)}
                                            disabled={!agreed || signing}
                                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSignature className="w-5 h-5" />}
                                            Sign Contract
                                        </button>
                                    </div>
                                )}

                                {viewingContract.status === 'signed' && (
                                    <div className="p-6 border-t border-white/5 shrink-0">
                                        <div className="flex items-center justify-center gap-2 text-green-400 font-bold py-3">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Signed on {new Date(viewingContract.signed_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Pending Contracts */}
                    {pendingContracts.length > 0 && (
                        <motion.div variants={fadeInUp} className="mb-10">
                            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" /> Action Required
                            </h2>
                            <div className="space-y-4">
                                {pendingContracts.map(contract => (
                                    <div
                                        key={contract.id}
                                        className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-all cursor-pointer group"
                                        onClick={() => setViewingContract(contract)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                                <FileSignature className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white mb-1">
                                                    {contract.contract_templates?.name || 'Employment Contract'}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-white/40">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Issued {new Date(contract.created_at).toLocaleDateString()}</span>
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-widest">Pending Signature</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="w-5 h-5" />
                                                <span className="text-sm font-bold">Review & Sign</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Signed Contracts */}
                    {signedContracts.length > 0 && (
                        <motion.div variants={fadeInUp}>
                            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" /> Signed Contracts
                            </h2>
                            <div className="space-y-3">
                                {signedContracts.map(contract => (
                                    <div
                                        key={contract.id}
                                        className="glass-panel p-5 rounded-2xl border border-green-500/10 flex items-center gap-5 cursor-pointer hover:bg-white/[0.02] transition-all"
                                        onClick={() => setViewingContract(contract)}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{contract.contract_templates?.name || 'Employment Contract'}</h3>
                                            <p className="text-xs text-white/40">
                                                Signed {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                        <Download className="w-5 h-5 text-white/20 hover:text-white transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {contracts.length === 0 && (
                        <motion.div variants={fadeInUp} className="glass-panel p-16 rounded-[2rem] border border-white/5 text-center">
                            <FileSignature className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-xl font-bold mb-2">No Contracts Yet</p>
                            <p className="text-white/40 font-light mb-6">Your contracts will appear here once they&apos;re ready for review.</p>
                            <Link href="/dashboard" className="btn-outline px-6 py-3">
                                Back to Dashboard
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
