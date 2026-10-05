"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { FileText, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TermsPage() {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('platform_settings').select('terms_service_html').single();
                if (data?.terms_service_html) {
                    setHtml(data.terms_service_html);
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
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-luminosity">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <Navbar />

            <main className="max-w-4xl mx-auto w-full flex-grow mb-32 relative z-10">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    <motion.div variants={fadeInUp} className="mb-12">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                            <FileText className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-muted text-lg font-light">
                            The rules of the platform.
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
                                <h2>1. Acceptance of Terms</h2>
                                <p>By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
                                
                                <h2>2. Application Process</h2>
                                <p>All information submitted during the application process must be accurate, true, and complete.</p>
                                
                                <h2>3. Intellectual Property</h2>
                                <p>All content included on this site, such as text, graphics, logos, and images, is the property of OneNetworx or its content suppliers.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}
