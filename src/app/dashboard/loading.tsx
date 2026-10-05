"use client";

/**
 * Dashboard Loading Skeleton — provides visual feedback while dashboard data loads.
 */
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#0D0D12] text-foreground">
            <div className="max-w-6xl mx-auto py-16 px-8 animate-pulse">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="h-10 bg-white/5 rounded-2xl w-72 mb-3" />
                        <div className="h-5 bg-white/5 rounded-xl w-48" />
                    </div>
                    <div className="h-12 bg-white/5 rounded-full w-32" />
                </div>

                {/* Pipeline Progress */}
                <div className="glass-panel p-8 rounded-[2rem] border border-white/5 mb-8">
                    <div className="h-6 bg-white/5 rounded-xl w-48 mb-6" />
                    <div className="flex items-center gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/5" />
                                <div className="h-3 bg-white/5 rounded-lg w-20" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-panel p-8 rounded-[2rem] border border-white/5">
                            <div className="h-6 bg-white/5 rounded-xl w-40 mb-6" />
                            <div className="space-y-4">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="flex items-center gap-4 p-3 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl bg-white/5" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-white/5 rounded-lg w-32 mb-2" />
                                            <div className="h-3 bg-white/5 rounded-lg w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
