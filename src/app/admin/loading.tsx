"use client";

/**
 * Admin Dashboard Loading Skeleton — per vibecodesecurity rule #10: Loading states.
 * Provides visual feedback while the admin page content loads.
 */
export default function AdminLoading() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header skeleton */}
            <div>
                <div className="h-10 bg-white/5 rounded-2xl w-72 mb-3" />
                <div className="h-5 bg-white/5 rounded-xl w-96" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#0D0D12]">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 mb-4" />
                        <div className="h-10 bg-white/5 rounded-xl w-20 mb-2" />
                        <div className="h-4 bg-white/5 rounded-lg w-32 mb-4" />
                        <div className="h-3 bg-white/5 rounded-lg w-24" />
                    </div>
                ))}
            </div>

            {/* Content grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border border-white/5 bg-[#0D0D12]">
                    <div className="h-7 bg-white/5 rounded-xl w-48 mb-8" />
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
                                <div className="w-12 h-12 rounded-xl bg-white/5" />
                                <div className="flex-1">
                                    <div className="h-5 bg-white/5 rounded-lg w-36 mb-2" />
                                    <div className="h-3 bg-white/5 rounded-lg w-24" />
                                </div>
                                <div className="h-6 bg-white/5 rounded-full w-24" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-[#0D0D12]">
                    <div className="h-7 bg-white/5 rounded-xl w-36 mb-8" />
                    <div className="space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-2">
                                    <div className="h-4 bg-white/5 rounded-lg w-24" />
                                    <div className="h-4 bg-white/5 rounded-lg w-8" />
                                </div>
                                <div className="h-2 bg-white/5 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
