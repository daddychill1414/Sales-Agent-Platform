"use client";

import { Navbar } from '@/components/Navbar';
import { ApplicationForm } from '@/components/ApplicationForm';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function ApplyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const positionId = searchParams.get('position');
    const [positionTitle, setPositionTitle] = useState<string>('');

    useEffect(() => {
        if (!positionId) {
            router.push('/careers');
            return;
        }

        async function fetchPosition() {
            try {
                const res = await fetch('/api/job-positions');
                if (res.ok) {
                    const data = await res.json();
                    const position = (data.positions || []).find((p: { id: string }) => p.id === positionId);
                    if (position) setPositionTitle(position.title);
                }
            } catch (err) {
                console.error(err);
            }
        }
        fetchPosition();
    }, [positionId, router]);

    if (!positionId) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-40 px-8 md:px-16 selection:bg-accent selection:text-black">
            <Navbar />

            <main className="max-w-4xl mx-auto w-full flex-grow mb-32">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mb-16">
                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold mb-8 heading-sans tracking-tight">
                        Start your <span className="text-accent heading-serif italic font-normal tracking-wide pr-2">journey.</span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-muted text-2xl font-light">
                        {positionTitle
                            ? `Apply for the ${positionTitle} position at OneNetworx.`
                            : 'Complete your application below to become a Sales Agent at OneNetworx.'}
                    </motion.p>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                    <ApplicationForm positionId={positionId || undefined} />
                </motion.div>
            </main>
        </div>
    );
}

export default function Apply() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ApplyContent />
        </Suspense>
    );
}
