"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function PrivacyPage() {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('platform_settings').select('privacy_policy_html').single();
                if (data?.privacy_policy_html) {
                    setHtml(data.privacy_policy_html);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-32 px-8 md:px-16 selection:bg-accent selection:text-black relative">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-luminosity">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <Navbar />

            <main className="max-w-4xl mx-auto w-full flex-grow mb-32 relative z-10">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    <motion.div variants={fadeInUp} className="mb-12">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                            <Shield className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-muted text-lg font-light">
                            How we protect your data.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="glass-panel p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-2xl relative">
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                            </div>
                        ) : html ? (
                            <div 
                                className="prose prose-invert prose-accent max-w-none text-white/70 leading-relaxed font-light"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        ) : (
                            <div className="prose prose-invert prose-accent max-w-none text-white/70 leading-relaxed font-light">
                                <h2>1. Information We Collect</h2>
                                <p>We collect information you provide directly to us when you apply for a position, create an account, or complete an assessment.</p>
                                
                                <h2>2. How We Use Information</h2>
                                <p>We use the information we collect to evaluate candidates, communicate regarding applications, and improve our platform.</p>
                                
                                <h2>3. Data Security</h2>
                                <p>We implement appropriate technical and organizational security measures to protect your personal information.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}
