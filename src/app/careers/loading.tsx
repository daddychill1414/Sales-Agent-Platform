"use client";

/**
 * Careers Page Loading Skeleton.
 */
export default function CareersLoading() {
    return (
        <div className="min-h-screen bg-[#0D0D12] text-foreground pt-32 px-8 animate-pulse">
            <div className="max-w-6xl mx-auto">
                <div className="h-12 bg-white/5 rounded-2xl w-80 mb-6" />
                <div className="h-6 bg-white/5 rounded-xl w-96 mb-16" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-panel p-8 rounded-[2rem] border border-white/5">
                            <div className="h-6 bg-white/5 rounded-xl w-44 mb-4" />
                            <div className="h-4 bg-white/5 rounded-lg w-full mb-2" />
                            <div className="h-4 bg-white/5 rounded-lg w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
