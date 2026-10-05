"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Use server-side API to check role (bypasses RLS issues)
            try {
                const res = await fetch('/api/user-role');
                const { role } = await res.json();
                router.push(role === 'admin' ? '/admin' : '/dashboard');
            } catch {
                router.push('/dashboard');
            }
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 selection:bg-accent selection:text-black relative">
            {/* Premium Aesthetic Back Button */}
            <Link 
                href="/" 
                className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 text-white/60 hover:text-white transition-all duration-500 text-xs font-bold uppercase tracking-[0.2em] group bg-[#0a0a0f]/80 border border-white/5 hover:border-white/20 hover:bg-white/5 px-6 py-3.5 rounded-full backdrop-blur-xl shadow-2xl"
            >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300 relative z-10" />
                </div>
                Return
            </Link>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-10 md:p-14 rounded-[3rem] w-full max-w-lg border border-white/5 shadow-2xl relative overflow-hidden bg-[#0D0D12]"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                        <Lock className="w-8 h-8 text-accent" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Agent Portal</h1>
                    <p className="text-muted font-light mb-8">Secure access to the OneNetworx sales environment.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 mb-6 text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form id="login-form" onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-mono text-white/50 font-bold ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@onenetworx.com"
                                    required
                                    autoComplete="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent focus:bg-white/10 transition-colors text-white placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-mono text-white/50 font-bold ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent focus:bg-white/10 transition-colors text-white placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-3 shadow-xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Authenticate <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-sm text-white/40">Not an agent yet? <a href="/apply" className="text-accent hover:text-white transition-colors">Apply here</a></p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
