"use client";

import Link from 'next/link';

export function Footer() {
    return (
        <footer id="site-footer" className="bg-[#0D0D12] rounded-t-[4rem] pt-20 pb-10 px-8 border-t border-white/5 relative overflow-hidden z-40 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="flex flex-col gap-4">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-3 group">
                        <div className="w-3.5 h-3.5 bg-accent rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        OneNetworx
                    </Link>
                    <p className="text-muted text-sm font-light max-w-xs">
                        Empowering independent sales agents with unmatched opportunities and enterprise-grade tools.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-10 sm:gap-24">
                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-bold tracking-widest text-xs uppercase mb-2">Platform</h4>
                        <Link href="/careers" className="text-muted hover:text-accent transition-colors text-sm">Careers</Link>
                        <Link href="/apply" className="text-muted hover:text-accent transition-colors text-sm">Apply Now</Link>
                        <Link href="/news" className="text-muted hover:text-accent transition-colors text-sm">News & Articles</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-bold tracking-widest text-xs uppercase mb-2">Legal</h4>
                        <Link href="#" className="text-muted hover:text-accent transition-colors text-sm">Privacy Policy</Link>
                        <Link href="#" className="text-muted hover:text-accent transition-colors text-sm">Terms of Service</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-muted text-xs">
                    &copy; {new Date().getFullYear()} OneNetworx. All rights reserved.
                </p>

                {/* System Operational Status from original prompt */}
                <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-2.5 border border-white/10 shadow-lg cursor-default hover:bg-white/10 transition-colors">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-mono text-white/80 uppercase tracking-widest">System Operational</span>
                </div>
            </div>
        </footer>
    );
}
