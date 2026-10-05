"use client";

import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';

interface Article {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

export default function News() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchArticles = async () => {
            const { data } = await supabase
                .from('news_articles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) setArticles(data);
            setLoading(false);
        };
        fetchArticles();
    }, [supabase]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16 selection:bg-accent selection:text-black">
            <Navbar />

            <main className="max-w-7xl mx-auto w-full flex-grow mb-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mb-24">
                    <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold mb-8 heading-sans tracking-tighter">
                        News & <span className="text-accent heading-serif italic font-normal tracking-wide pr-2">Insights.</span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-2xl text-muted max-w-3xl font-light leading-relaxed">
                        Stay updated with the latest in highly-effective sales strategies, HR updates, and company announcements from OneNetworx.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial="hidden" animate="visible" variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
                >
                    {loading ? (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-white/40">
                            Loading articles...
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-white/40">
                            No active articles found. Check back soon.
                        </div>
                    ) : articles.map((article) => (
                        <motion.div variants={fadeInUp} key={article.id} className="glass-panel p-12 rounded-[2rem] flex flex-col group hover:border-accent/30 transition-colors shadow-2xl">
                            <div className="flex items-center gap-4 text-xs font-mono text-accent mb-8">
                                <span className="bg-accent/10 px-4 py-2 rounded-full border border-accent/20">News</span>
                                <span className="flex items-center gap-2 text-muted"><Clock className="w-4 h-4" /> {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-6 heading-sans group-hover:text-accent transition-colors leading-tight tracking-tight">
                                {article.title}
                            </h2>
                            <p className="text-muted leading-relaxed flex-grow mb-10 text-lg font-light">
                                {article.content.substring(0, 140)}{article.content.length > 140 ? '...' : ''}
                            </p>
                            <Link href={`#`} className="flex items-center text-accent font-bold hover:text-white transition-colors uppercase tracking-widest text-sm">
                                Read Article <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
}
