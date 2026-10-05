"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ProtocolCards — "Sticky Stacking Archive"
 * 3 full-height stacking cards with unique SVG animations.
 * Uses scroll-based sticky positioning and CSS transforms
 * to create the stacking effect.
 */

/* SVG Animation 1: Rotating geometric motif (concentric circles) */
function RotatingMotif() {
    return (
        <div className="absolute right-8 top-8 opacity-20 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 120 120" className="animate-[spin_20s_linear_infinite]">
                <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent" strokeDasharray="4 4" />
                <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent" />
                <circle cx="60" cy="60" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
                <line x1="60" y1="5" x2="60" y2="115" stroke="currentColor" strokeWidth="0.3" className="text-white/20" />
                <line x1="5" y1="60" x2="115" y2="60" stroke="currentColor" strokeWidth="0.3" className="text-white/20" />
            </svg>
        </div>
    );
}

/* SVG Animation 2: Scanning laser line across a grid */
function ScanningGrid() {
    return (
        <div className="absolute right-8 top-8 opacity-20 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 120 120">
                {/* Dot grid */}
                {Array.from({ length: 6 }).map((_, row) =>
                    Array.from({ length: 6 }).map((_, col) => (
                        <circle
                            key={`${row}-${col}`}
                            cx={15 + col * 20}
                            cy={15 + row * 20}
                            r="1.5"
                            fill="currentColor"
                            className="text-white/30"
                        />
                    ))
                )}
                {/* Scanning line */}
                <line
                    x1="0" y1="0" x2="120" y2="0"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-accent"
                >
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 10; 0 110; 0 10"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </line>
            </svg>
        </div>
    );
}

/* SVG Animation 3: Pulsing EKG-style waveform */
function PulsingWaveform() {
    return (
        <div className="absolute right-8 top-8 opacity-20 pointer-events-none">
            <svg width="140" height="80" viewBox="0 0 140 80">
                <path
                    d="M0 40 L20 40 L30 15 L40 65 L50 30 L60 50 L70 40 L90 40 L100 20 L110 60 L120 35 L130 45 L140 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-accent"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="400"
                    strokeDashoffset="400"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        values="400;0;400"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </path>
            </svg>
        </div>
    );
}

const protocolSteps = [
    {
        step: "01",
        title: "Quality Applicant Review",
        description: "Every application is rigorously screened against our Quality Applicant standards. We evaluate communication skills, motivation, and sales aptitude before moving forward.",
        svg: <RotatingMotif />,
    },
    {
        step: "02",
        title: "Orientation & Intensive Training",
        description: "Accepted candidates enter our structured orientation program. We equip you with actionable sales strategies, product deep-dives, and the mindset to close at scale.",
        svg: <ScanningGrid />,
    },
    {
        step: "03",
        title: "Evaluation & Deployment",
        description: "Targeted situational assessments validate your readiness. Pass the evaluation, complete your final interview, and deploy as a fully-equipped OneNetworx agent.",
        svg: <PulsingWaveform />,
    },
];

function ProtocolCard({ step, index, totalCards }: {
    step: typeof protocolSteps[0];
    index: number;
    totalCards: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start start", "end start"]
    });

    // When card scrolls away, scale down, blur effect via opacity
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.92]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.5]);

    return (
        <motion.div
            ref={cardRef}
            style={{ scale, opacity }}
            className="sticky min-h-[80vh] rounded-[3rem] bg-[#0D0D12] border border-white/5 shadow-2xl overflow-hidden flex flex-col justify-center p-12 md:p-20 relative"
            // Stagger the sticky `top` so cards stack visually
            // Each card stacks lower
        >
            {/* SVG Animation */}
            {step.svg}

            {/* Card Content */}
            <div className="relative z-10 max-w-2xl">
                <span className="text-sm font-mono text-accent/50 tracking-[0.3em] uppercase">{step.step}</span>
                <h3 className="text-4xl md:text-5xl font-bold mt-4 mb-6 tracking-tighter">{step.title}</h3>
                <p className="text-xl text-muted font-light leading-relaxed">{step.description}</p>
            </div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-8 left-12 right-12 flex items-center gap-4">
                <div className="flex-grow h-px bg-white/5" />
                <span className="text-xs font-mono text-white/20 tracking-widest uppercase">Protocol {step.step}</span>
            </div>
        </motion.div>
    );
}

export function ProtocolCards() {
    return (
        <section id="protocol-cards-section" className="relative z-20 px-8 md:px-16 py-20 bg-background">
            {/* Section header */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-7xl mx-auto mb-16 text-center"
            >
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
                    The <span className="heading-serif italic text-accent font-normal tracking-normal">Protocol.</span>
                </h2>
                <p className="text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed">
                    Our precise, three-stage evaluation pipeline ensures only the best talent enters the field.
                </p>
            </motion.div>

            {/* Stacking Cards */}
            <div className="max-w-6xl mx-auto space-y-8">
                {protocolSteps.map((step, index) => (
                    <div
                        key={step.step}
                        style={{ top: `${80 + index * 40}px` }}
                        className="sticky"
                    >
                        <ProtocolCard
                            step={step}
                            index={index}
                            totalCards={protocolSteps.length}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
