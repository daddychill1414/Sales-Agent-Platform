import Link from 'next/link';

/**
 * Custom 404 page — matches the OneNetworx design system.
 * Premium dark UI with accent gold highlights.
 */
export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 selection:bg-accent selection:text-black relative">
            {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 text-center max-w-xl">
                <p className="text-accent font-mono text-sm uppercase tracking-[0.3em] mb-6 flex items-center justify-center gap-3">
                    <span className="w-8 h-[2px] bg-accent" />
                    Error 404
                    <span className="w-8 h-[2px] bg-accent" />
                </p>

                <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6 heading-sans">
                    4<span className="text-accent heading-serif italic font-normal">0</span>4
                </h1>

                <p className="text-xl text-muted font-light leading-relaxed mb-12">
                    This page doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        id="404-cta-home"
                        href="/"
                        className="btn-primary px-10 py-4 text-lg shadow-2xl shadow-accent/20"
                    >
                        <span className="btn-slide" />
                        Back to Home
                    </Link>
                    <Link
                        id="404-cta-apply"
                        href="/apply"
                        className="btn-outline px-10 py-4 text-lg"
                    >
                        <span className="btn-slide" />
                        <span>Apply Now</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
