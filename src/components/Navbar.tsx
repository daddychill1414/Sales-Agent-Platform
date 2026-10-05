"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { isStaffRole } from '@/lib/permissions';

/**
 * Navbar — "The Floating Island"
 * Fixed pill-shaped container that morphs on scroll.
 * Transparent at hero top → frosted glass when scrolled.
 * Includes mobile hamburger menu for responsive navigation.
 * Auth-aware: shows "Dashboard" when logged in, "Portal Login" when not.
 */
export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check auth state and role on mount via server-side API (bypasses RLS)
    useEffect(() => {
        fetch('/api/user-role')
            .then(res => res.json())
            .then(({ role }) => {
                if (role) {
                    setIsLoggedIn(true);
                    setIsAdmin(isStaffRole(role));
                }
            })
            .catch(() => {
                // Not logged in or error — keep defaults
            });
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    // Determine portal link based on auth state and role
    const portalLink = isLoggedIn
        ? (isAdmin ? { href: '/admin', label: 'Admin Panel' } : { href: '/dashboard', label: 'Dashboard' })
        : { href: '/login', label: 'Portal Login' };

    const navLinks = [
        { href: '/careers', label: 'Careers' },
        { href: '/track', label: 'Track Application' },
        { href: '/news', label: 'News' },
        portalLink,
    ];

    return (
        <>
            <motion.nav
                id="main-navbar"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6 md:py-8'}`}
            >
                <div className={`mx-auto max-w-6xl px-8 py-3.5 rounded-full flex items-center justify-between transition-all duration-500 ${scrolled ? 'bg-[#1a1a24]/90 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-transparent'}`}>
                    {/* Logo */}
                    <Link
                        id="nav-logo"
                        href="/"
                        className="text-2xl font-bold tracking-tight text-white flex items-center gap-3 group"
                    >
                        <div className="w-3.5 h-3.5 bg-accent rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        OneNetworx
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-10 text-sm font-bold tracking-wide text-white/70 uppercase">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                                href={link.href}
                                className={`hover:text-accent transition-colors ${pathname === link.href ? 'text-accent' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <Link
                        id="nav-cta-apply"
                        href="/apply"
                        className="hidden md:inline-flex bg-accent text-black px-7 py-3 rounded-full text-sm font-bold hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(201,168,76,0.4)] transition-all duration-300"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                    >
                        Apply Now
                    </Link>

                    {/* Mobile Hamburger Button */}
                    <button
                        id="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden relative z-[60] w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-accent/20 hover:text-accent transition-colors"
                        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        id="mobile-menu-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[45] bg-[#0D0D12]/95 backdrop-blur-2xl md:hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center justify-center h-full gap-8 px-8"
                        >
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                                >
                                    <Link
                                        id={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                                        href={link.href}
                                        className={`text-3xl font-bold tracking-tight transition-colors ${pathname === link.href ? 'text-accent' : 'text-white hover:text-accent'}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="mt-6"
                            >
                                <Link
                                    id="mobile-nav-cta-apply"
                                    href="/apply"
                                    className="bg-accent text-black px-10 py-4 rounded-full text-lg font-bold shadow-2xl shadow-accent/20"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Apply Now
                                </Link>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
