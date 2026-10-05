"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Briefcase, TrendingUp } from 'lucide-react';

/* ============================================================
   CARD 1 — "Diagnostic Shuffler"
   3 overlapping cards cycle vertically every 3s
   with spring-bounce transition
   ============================================================ */
function DiagnosticShuffler() {
    const labels = [
        { title: "Direct Commission", desc: "Per-sale earnings with no cap" },
        { title: "Residual Income", desc: "Ongoing revenue from renewals" },
        { title: "Referral Bonuses", desc: "Earn from your network growth" },
    ];

    const [order, setOrder] = useState([0, 1, 2]);

    useEffect(() => {
        const interval = setInterval(() => {
            setOrder(prev => {
                const newOrder = [...prev];
                const last = newOrder.pop()!;
                newOrder.unshift(last);
                return newOrder;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div id="feature-card-shuffler" className="glass-panel p-10 rounded-[2rem] border border-white/5 shadow-2xl hover:border-accent/30 transition-colors group h-full flex flex-col">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Multiple Income Streams</h3>
            <p className="text-muted text-sm mb-8 leading-relaxed">&quot;Pwedeng kitain.&quot; Unlock uncapped commissions and diverse revenue streams.</p>

            {/* Shuffler Stack */}
            <div className="relative flex-grow min-h-[160px]">
                {order.map((idx, stackPos) => {
                    const label = labels[idx];
                    const isTop = stackPos === 0;
                    return (
                        <motion.div
                            key={idx}
                            layout
                            animate={{
                                y: stackPos * 12,
                                scale: 1 - stackPos * 0.04,
                                opacity: 1 - stackPos * 0.2,
                                zIndex: 3 - stackPos,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            }}
                            className={`absolute inset-x-0 top-0 bg-[#1a1a24] border ${isTop ? 'border-accent/30' : 'border-white/10'} rounded-2xl p-5 shadow-xl cursor-default`}
                        >
                            <p className="font-bold text-white tracking-tight">{label.title}</p>
                            <p className="text-sm text-white/50 mt-1">{label.desc}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* ============================================================
   CARD 2 — "Telemetry Typewriter"
   Monospace live-text feed with blinking cursor
   ============================================================ */
function TelemetryTypewriter() {
    const messages = [
        "// Agent deployed to pipeline...",
        "> Running orientation module: COMPLETE",
        "> Sales strategy: HIGH_TICKET loaded",
        "// Earnings syncing: ₱28,500 credited",
        "> Client conversion: 3x target achieved",
        "// Boss mode: ACTIVATED",
    ];

    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [currentLineIdx, setCurrentLineIdx] = useState(0);
    const [currentCharIdx, setCurrentCharIdx] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTyping) return;

        const currentMessage = messages[currentLineIdx];
        if (currentCharIdx < currentMessage.length) {
            const timer = setTimeout(() => {
                setDisplayedLines(prev => {
                    const lines = [...prev];
                    lines[currentLineIdx] = currentMessage.substring(0, currentCharIdx + 1);
                    return lines;
                });
                setCurrentCharIdx(prev => prev + 1);
            }, 30 + Math.random() * 40);
            return () => clearTimeout(timer);
        } else {
            // Line complete, move to next after a pause
            const timer = setTimeout(() => {
                const nextIdx = (currentLineIdx + 1) % messages.length;
                if (nextIdx === 0) {
                    // Reset all lines
                    setDisplayedLines([]);
                }
                setCurrentLineIdx(nextIdx);
                setCurrentCharIdx(0);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [currentCharIdx, currentLineIdx, isTyping]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayedLines]);

    return (
        <div id="feature-card-typewriter" className="glass-panel p-10 rounded-[2rem] border border-white/5 shadow-2xl hover:border-accent/30 transition-colors group h-full flex flex-col bg-[#1a1a24]">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                <Briefcase className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Be Your Own Boss</h3>
            <p className="text-muted text-sm mb-6 leading-relaxed">Take control of your schedule and build your empire.</p>

            {/* Live Feed Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-mono text-accent uppercase tracking-widest font-bold">Live Feed</span>
            </div>

            {/* Typewriter Console */}
            <div ref={containerRef} className="bg-black/40 rounded-xl p-4 flex-grow overflow-hidden border border-white/5 min-h-[140px] max-h-[180px]">
                {displayedLines.map((line, i) => (
                    <p key={i} className="font-mono text-xs text-green-400/80 leading-relaxed">
                        {line}
                        {i === displayedLines.length - 1 && (
                            <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" />
                        )}
                    </p>
                ))}
                {displayedLines.length === 0 && (
                    <p className="font-mono text-xs text-white/20">
                        <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" />
                    </p>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   CARD 3 — "Cursor Protocol Scheduler"
   Weekly grid with animated SVG cursor interaction
   ============================================================ */
function CursorProtocolScheduler() {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const [activeDays, setActiveDays] = useState<number[]>([]);
    const [cursorPos, setCursorPos] = useState<number>(-1);
    const [showSaved, setShowSaved] = useState(false);
    const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animate the cursor through days
    const runAnimation = useCallback(() => {
        const sequence = [1, 3, 5]; // Mon, Wed, Fri
        let step = 0;

        const animate = () => {
            if (step < sequence.length) {
                setCursorPos(sequence[step]);
                animTimerRef.current = setTimeout(() => {
                    setActiveDays(prev => [...prev, sequence[step]]);
                    step++;
                    animTimerRef.current = setTimeout(animate, 500);
                }, 600);
            } else {
                // Move to "Save" button
                setCursorPos(7); // 7 = save button
                animTimerRef.current = setTimeout(() => {
                    setShowSaved(true);
                    setCursorPos(-1);
                    // Reset after a pause
                    animTimerRef.current = setTimeout(() => {
                        setActiveDays([]);
                        setShowSaved(false);
                        runAnimation();
                    }, 2500);
                }, 800);
            }
        };

        animTimerRef.current = setTimeout(animate, 1000);
    }, []);

    useEffect(() => {
        runAnimation();
        return () => {
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
        };
    }, [runAnimation]);

    return (
        <div id="feature-card-scheduler" className="glass-panel p-10 rounded-[2rem] border border-white/5 shadow-2xl hover:border-accent/30 transition-colors group h-full flex flex-col">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">High-Impact Experience</h3>
            <p className="text-muted text-sm mb-8 leading-relaxed">Gain sales experience. Grow from Orientation to Apex Tier.</p>

            {/* Weekly Grid */}
            <div className="bg-[#0D0D12]/60 rounded-xl p-5 border border-white/5 flex-grow">
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {days.map((day, i) => (
                        <div key={i} className="text-center">
                            <span className="text-xs font-mono text-white/30 mb-2 block">{day}</span>
                            <motion.div
                                animate={{
                                    scale: cursorPos === i ? 0.95 : 1,
                                    backgroundColor: activeDays.includes(i) ? 'rgba(201, 168, 76, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                    borderColor: activeDays.includes(i) ? 'rgba(201, 168, 76, 0.5)' : cursorPos === i ? 'rgba(201, 168, 76, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                }}
                                transition={{ duration: 0.2 }}
                                className="w-full aspect-square rounded-lg border flex items-center justify-center"
                            >
                                {activeDays.includes(i) && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 bg-accent rounded-full"
                                    />
                                )}
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <motion.div
                    animate={{
                        scale: cursorPos === 7 ? 0.95 : 1,
                        borderColor: cursorPos === 7 ? 'rgba(201, 168, 76, 0.5)' : showSaved ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: showSaved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    }}
                    className="w-full py-2.5 rounded-lg border text-center text-xs font-bold uppercase tracking-widest"
                >
                    <span className={showSaved ? 'text-green-400' : 'text-white/40'}>
                        {showSaved ? '✓ Schedule Saved' : 'Save Schedule'}
                    </span>
                </motion.div>
            </div>
        </div>
    );
}

/* ============================================================
   MAIN EXPORT — Feature Cards Section
   ============================================================ */
export function FeatureCards() {
    return (
        <section id="feature-cards-section" className="py-40 px-8 md:px-16 bg-[#0a0a0f] relative z-20">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                }}
                className="max-w-7xl mx-auto"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                        <DiagnosticShuffler />
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                        <TelemetryTypewriter />
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                        <CursorProtocolScheduler />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}
