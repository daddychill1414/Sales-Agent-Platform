"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Home, Users, CheckSquare, Calendar, FolderOpen, BookOpen, Settings, Loader2, ShieldAlert, Menu, X, Briefcase, ClipboardList, Activity, GraduationCap, FileSignature, Columns3 } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { SignOutButton } from '@/components/SignOutButton';
import { type UserRole, getRoleLabel, getRoleBadgeClass, isStaffRole } from '@/lib/permissions';

/**
 * Admin Layout — Protected admin area with responsive sidebar navigation.
 * Enforces role-based access control: super_admin, hr_admin, screener can access.
 * Screeners see reduced navigation. Super admins see audit logs.
 * Mobile: sidebar collapses to hamburger menu overlay.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>('applicant');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        async function checkAdminAccess() {
            try {
                const supabase = createClient();
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    router.push('/login');
                    return;
                }

                const response = await fetch('/api/user-role');
                const data = await response.json();

                if (!isStaffRole(data.role)) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                setUserRole(data.role as UserRole);
                setAuthorized(true);
            } catch (err) {
                console.error('Admin access check failed:', err);
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        }
        checkAdminAccess();
    }, [router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Prevent body scroll when sidebar open (mobile)
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050508] text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-muted font-mono text-sm uppercase tracking-widest">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-[#050508] text-foreground flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <ShieldAlert className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Access Denied</h1>
                    <p className="text-muted font-light mb-8">You do not have admin privileges to access this area.</p>
                    <Link href="/dashboard" className="btn-primary px-8 py-3">
                        <span className="btn-slide" />
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const navLinks = [
        { href: '/admin', label: 'Dashboard', icon: Home, section: 'main', roles: ['super_admin', 'hr_admin', 'screener'] },
        { href: '/admin/applicants', label: 'Applicants', icon: Users, section: 'main', roles: ['super_admin', 'hr_admin', 'screener'] },
        { href: '/admin/pipeline', label: 'Pipeline', icon: Columns3, section: 'main', roles: ['super_admin', 'hr_admin', 'screener'] },
        { href: '/admin/screening', label: 'Application Builder', icon: ClipboardList, section: 'main', roles: ['super_admin', 'hr_admin', 'screener'] },
        { href: '/admin/exams', label: 'Exams', icon: CheckSquare, section: 'main', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/interviews', label: 'Interviews', icon: Calendar, section: 'main', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/job-positions', label: 'Job Positions', icon: Briefcase, section: 'main', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/contracts', label: 'Contracts', icon: FileSignature, section: 'main', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/training', label: 'Training', icon: GraduationCap, section: 'resources', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/documents', label: 'Documents', icon: FolderOpen, section: 'resources', roles: ['super_admin', 'hr_admin'] },
        { href: '/admin/knowledge', label: 'HR Knowledge', icon: BookOpen, section: 'resources', roles: ['super_admin', 'hr_admin', 'screener'] },
        { href: '/admin/audit', label: 'Audit Log', icon: Activity, section: 'system', roles: ['super_admin'] },
        { href: '/admin/settings', label: 'Settings', icon: Settings, section: 'system', roles: ['super_admin'] },
        { href: '/admin/team', label: 'Team', icon: ShieldAlert, section: 'system', roles: ['super_admin'] },
    ].filter(link => link.roles.includes(userRole));

    const SidebarContent = () => (
        <>
            <div className="p-6 lg:p-8 border-b border-white/5">
                <Link id="admin-logo" href="/admin" className="block text-xl lg:text-2xl font-bold tracking-tight">
                    One<span className="text-accent heading-serif italic font-normal">Networx</span>
                </Link>
                <p className="text-xs text-muted uppercase tracking-widest mt-2 font-mono">Agent Portal</p>
            </div>

            <nav className="flex-grow p-4 lg:p-6 space-y-1.5 overflow-y-auto">
                <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3 px-4 font-mono">Main Menu</div>
                {navLinks.filter(l => l.section === 'main').map((link) => (
                    <Link
                        key={link.href}
                        id={`admin-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        href={link.href}
                        className={`flex items-center gap-3 lg:gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${pathname === link.href
                            ? 'text-accent bg-accent/10 border border-accent/20'
                            : 'text-white/70 hover:text-accent hover:bg-accent/10'
                            }`}
                    >
                        <link.icon className="w-5 h-5" /> {link.label}
                    </Link>
                ))}

                {navLinks.filter(l => l.section === 'resources').length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3 mt-6 px-4 font-mono">Resources</div>
                        {navLinks.filter(l => l.section === 'resources').map((link) => (
                            <Link
                                key={link.href}
                                id={`admin-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                                href={link.href}
                                className={`flex items-center gap-3 lg:gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${pathname === link.href
                                    ? 'text-accent bg-accent/10 border border-accent/20'
                                    : 'text-white/70 hover:text-accent hover:bg-accent/10'
                                    }`}
                            >
                                <link.icon className="w-5 h-5" /> {link.label}
                            </Link>
                        ))}
                    </>
                )}

                {navLinks.filter(l => l.section === 'system').length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3 mt-6 px-4 font-mono">System</div>
                        {navLinks.filter(l => l.section === 'system').map((link) => (
                            <Link
                                key={link.href}
                                id={`admin-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                                href={link.href}
                                className={`flex items-center gap-3 lg:gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${pathname === link.href
                                    ? 'text-accent bg-accent/10 border border-accent/20'
                                    : 'text-white/70 hover:text-accent hover:bg-accent/10'
                                    }`}
                            >
                                <link.icon className="w-5 h-5" /> {link.label}
                            </Link>
                        ))}
                    </>
                )}
            </nav>

            <div className="p-4 lg:p-6 border-t border-white/5 space-y-1.5">
                <Link
                    id="admin-nav-settings"
                    href="/admin/settings"
                    className="flex items-center gap-3 lg:gap-4 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
                >
                    <Settings className="w-5 h-5" /> Settings
                </Link>
                <SignOutButton />
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-[#050508] text-foreground font-sans selection:bg-accent selection:text-black">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside id="admin-sidebar" className="hidden lg:flex w-72 bg-[#0D0D12] border-r border-white/5 flex-col fixed inset-y-0 left-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Sidebar Panel */}
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0D0D12] border-r border-white/5 flex flex-col z-10 shadow-2xl">
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                id="admin-sidebar-close"
                                onClick={() => setSidebarOpen(false)}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-accent/20 hover:text-accent transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow lg:pl-72">
                <header id="admin-header" className="h-16 lg:h-20 border-b border-white/5 bg-[#0D0D12]/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 lg:px-10">
                    {/* Mobile hamburger */}
                    <button
                        id="admin-sidebar-toggle"
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-accent/20 hover:text-accent transition-colors"
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <h1 className="text-lg lg:text-xl font-medium tracking-tight hidden lg:block">Overview</h1>

                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationBell />
                        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 pr-3 lg:pr-4 rounded-full transition-colors border border-transparent hover:border-white/10">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold border border-accent/20 text-xs lg:text-sm">
                                {getRoleLabel(userRole).split(' ').map(w => w[0]).join('')}
                            </div>
                            <div className="text-sm hidden sm:block">
                                <p className="font-medium text-white">{getRoleLabel(userRole)}</p>
                                <p className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getRoleBadgeClass(userRole)}`}>{userRole.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
