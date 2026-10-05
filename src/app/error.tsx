"use client";

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Custom error boundary — catches runtime errors in Next.js App Router.
 * Matches the OneNetworx design system with recovery actions.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console (could be forwarded to a logging service)
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 selection:bg-accent selection:text-black relative">
            {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 text-center max-w-xl">
                <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Something went wrong
                </h1>

                <p className="text-lg text-muted font-light leading-relaxed mb-4">
                    An unexpected error occurred. Our system has logged this issue automatically.
                </p>

                {error.digest && (
                    <p className="text-xs font-mono text-white/30 mb-8">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <button
                        id="error-cta-retry"
                        onClick={reset}
                        className="btn-primary px-10 py-4 text-lg shadow-2xl shadow-accent/20"
                    >
                        <span className="btn-slide" />
                        Try Again
                    </button>
                    <a
                        id="error-cta-home"
                        href="/"
                        className="btn-outline px-10 py-4 text-lg"
                    >
                        <span className="btn-slide" />
                        <span>Back to Home</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
