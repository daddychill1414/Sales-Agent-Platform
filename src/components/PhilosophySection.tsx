"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * PhilosophySection — "The Manifesto"
 * Full-width dark section with parallaxing texture and
 * two contrasting statements with word-by-word reveal animation.
 */
export function PhilosophySection({ mainQuote }: { mainQuote?: string }) {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    // Parallax for the background texture
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

    return (
        <section
            id="philosophy-section"
            ref={sectionRef}
            className="relative py-48 px-8 md:px-16 bg-[#050508] overflow-hidden z-20"
        >
            {/* Parallaxing background texture */}
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ y: bgY }}
            >
                <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt=""
                    className="w-full h-[130%] object-cover opacity-[0.06] grayscale mix-blend-luminosity"
                />
            </motion.div>

            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05),transparent_60%)] pointer-events-none z-0" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Statement 1 — What the industry does */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-16"
                >
                    <p className="text-2xl md:text-3xl text-white/40 font-light leading-relaxed max-w-3xl">
                        Most recruitment agencies focus on: <span className="text-white/60">volume hiring, high turnover, and replaceable agents.</span>
                    </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-px bg-white/10 origin-left mb-16"
                />

                {/* Statement 2 — What WE do (massive, dramatic) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <p className="text-4xl md:text-5xl lg:text-5xl font-bold leading-[1.2] tracking-tighter max-w-5xl">
                        {mainQuote || 'We focus on: building autonomous sales professionals who own their time, their income, and their future.'}
                    </p>
                </motion.div>

                {/* Attribution */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-16 flex items-center gap-4"
                >
                    <div className="w-12 h-[2px] bg-accent" />
                    <p className="text-sm font-mono text-accent uppercase tracking-[0.3em]">The OneNetworx Philosophy</p>
                </motion.div>
            </div>
        </section>
    );
}
