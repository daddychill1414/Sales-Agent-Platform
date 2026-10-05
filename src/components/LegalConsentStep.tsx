"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Shield, FileText, ExternalLink, X, FileSignature } from 'lucide-react';
import Link from 'next/link';

interface LegalConsentStepProps {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;
    onPrivacyChange: (accepted: boolean) => void;
    onMarketingChange: (accepted: boolean) => void;
    errors: { terms?: string; privacy?: string };
}

export function LegalConsentStep({
    termsAccepted,
    privacyAccepted,
    marketingAccepted,
    onTermsChange,
    onPrivacyChange,
    onMarketingChange,
    errors,
}: LegalConsentStepProps) {
    const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 5;
        if (bottom && !scrolledToBottom) {
            setScrolledToBottom(true);
        }
    };

    const openModal = (type: 'terms' | 'privacy') => {
        setScrolledToBottom(false);
        setActiveModal(type);
    };

    const handleAgree = () => {
        if (activeModal === 'terms') {
            onTermsChange(true);
        } else if (activeModal === 'privacy') {
            onPrivacyChange(true);
        }
        setActiveModal(null);
    };

    return (
        <motion.div
            key="legal"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInUp}
            className="space-y-8"
        >
            <div className="glass-panel p-6 rounded-2xl border border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-white/70 leading-relaxed">
                        Your personal data is protected under our Data Privacy Policy. We only collect information necessary for the recruitment process.
                    </p>
                </div>
            </div>

            {/* Terms of Service */}
            <div className={`p-6 rounded-2xl border transition-colors ${
                termsAccepted 
                    ? 'border-accent/30 bg-accent/5' 
                    : errors.terms 
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-white/10 bg-white/[0.02]'
            }`}>
                <div onClick={() => termsAccepted ? onTermsChange(false) : openModal('terms')} className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            termsAccepted
                                ? 'bg-accent border-accent'
                                : 'border-white/20 group-hover:border-white/40'
                        }`}>
                            {termsAccepted && (
                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-white/40" />
                            Terms of Service
                            <span className="text-accent text-xs">Required</span>
                        </p>
                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                            I have read and agree to the{' '}
                            <span className="text-accent hover:underline inline-flex items-center gap-1">
                                Terms of Service <FileSignature className="w-3 h-3" />
                            </span>
                        </p>
                    </div>
                </div>
                {errors.terms && <p className="text-red-500 text-sm mt-3 ml-10">{errors.terms}</p>}
            </div>

            {/* Data Privacy Policy */}
            <div className={`p-6 rounded-2xl border transition-colors ${
                privacyAccepted 
                    ? 'border-accent/30 bg-accent/5' 
                    : errors.privacy 
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-white/10 bg-white/[0.02]'
            }`}>
                <div onClick={() => privacyAccepted ? onPrivacyChange(false) : openModal('privacy')} className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            privacyAccepted
                                ? 'bg-accent border-accent'
                                : 'border-white/20 group-hover:border-white/40'
                        }`}>
                            {privacyAccepted && (
                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4 text-white/40" />
                            Data Privacy Policy
                            <span className="text-accent text-xs">Required</span>
                        </p>
                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                            I consent to the collection and processing of my personal data as described in the{' '}
                            <span className="text-accent hover:underline inline-flex items-center gap-1">
                                Data Privacy Policy <FileSignature className="w-3 h-3" />
                            </span>
                        </p>
                    </div>
                </div>
                {errors.privacy && <p className="text-red-500 text-sm mt-3 ml-10">{errors.privacy}</p>}
            </div>

            {/* Marketing (optional) */}
            <div className={`p-6 rounded-2xl border transition-colors ${
                marketingAccepted 
                    ? 'border-white/20 bg-white/[0.03]' 
                    : 'border-white/10 bg-white/[0.02]'
            }`}>
                <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                        <input
                            type="checkbox"
                            checked={marketingAccepted}
                            onChange={(e) => onMarketingChange(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            marketingAccepted
                                ? 'bg-accent border-accent'
                                : 'border-white/20 group-hover:border-white/40'
                        }`}>
                            {marketingAccepted && (
                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-medium">
                            Marketing Communications
                            <span className="text-white/30 text-xs ml-2">Optional</span>
                        </p>
                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                            I agree to receive updates, news, and promotional materials from OneNetworx.
                        </p>
                    </div>
                </label>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0D0D12] border border-white/10 w-full max-w-2xl max-h-full rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    {activeModal === 'terms' ? <FileText className="text-accent" /> : <Shield className="text-accent" />}
                                    {activeModal === 'terms' ? 'Terms of Service' : 'Data Privacy Policy'}
                                </h3>
                                <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5 text-white/50" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-4 text-white/70 text-sm leading-relaxed" onScroll={handleScroll}>
                                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-6">Please scroll to the bottom to agree</p>
                                
                                {activeModal === 'terms' ? (
                                    <>
                                        <h4 className="font-bold text-white text-lg">1. Introduction</h4>
                                        <p>Welcome to OneNetworx. By applying for a position, you agree to these Terms of Service. These terms outline the rules and regulations for the use of our recruitment platform.</p>
                                        <p>By accessing this platform, we assume you accept these terms and conditions. Do not continue to apply if you do not agree to take all of the terms and conditions stated on this page.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">2. Application Accuracy</h4>
                                        <p>You agree to provide true, accurate, current, and complete information about yourself as prompted by the application form. We reserve the right to disqualify any applicant found to have provided misleading or false information.</p>
                                        <p>Falsifying professional background, sales history, or relevant experience is grounds for immediate termination from the pipeline or removal post-hire without severance.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">3. Code of Conduct</h4>
                                        <p>During the recruitment, screening, and potential interview phases, you must maintain professional conduct. Any form of harassment towards our HR team or automated agents will result in a permanent ban across our networks.</p>
                                        
                                        <h4 className="font-bold text-white text-lg mt-6">4. Asynchronous Communication</h4>
                                        <p>Since we operate as a remote-first, decentralized network, you accept that much of our communication during this application and subsequent work will be asynchronous.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">5. Intellectual Property</h4>
                                        <p>All materials and workflows shared with you during the screening, evaluation exams, and onboarding process are proprietary to OneNetworx. You may not distribute, duplicate, or share test materials.</p>
                                        
                                        {/* Extra padding to force scroll */}
                                        <div className="h-64" />
                                        <p className="text-center font-mono opacity-50 text-xs">End of document.</p>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-bold text-white text-lg">1. Data Collection</h4>
                                        <p>We collect your personal information provided during the application process, such as your name, contact details, resume, screening answers, and professional history.</p>
                                        <p>We may also collect automated data such as your IP address and browser type for security monitoring.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">2. Use of Information</h4>
                                        <p>Your data is used specifically for evaluating your suitability for employment with OneNetworx. We may use your contact information to schedule interviews, update you on your application status, or send screening exams.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">3. Data Sharing</h4>
                                        <p>We do not sell your personal data to third parties. We may share it strictly with internal decision-makers, external background check services (if applicable and authorized), or integrated legal platforms necessary for recruitment.</p>
                                        
                                        <h4 className="font-bold text-white text-lg mt-6">4. Document Retention</h4>
                                        <p>If you are hired, your application data will form the basis of your personnel file. If unhired or disqualified, your record will be retained for up to 12 months for compliance reporting and future role suitability.</p>

                                        <h4 className="font-bold text-white text-lg mt-6">5. Your Rights</h4>
                                        <p>Under local and international data protection laws, you retain the right to request access to, deletion, or correction of your personal data on our servers by contacting HR.</p>

                                        {/* Extra padding to force scroll */}
                                        <div className="h-64" />
                                        <p className="text-center font-mono opacity-50 text-xs">End of document.</p>
                                    </>
                                )}
                            </div>

                            {/* Footer Action */}
                            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                                <span className={`text-xs font-mono transition-opacity ${scrolledToBottom ? 'opacity-0' : 'opacity-100 text-white/50'}`}>
                                    Scroll to bottom to unlock
                                </span>
                                <button
                                    onClick={handleAgree}
                                    disabled={!scrolledToBottom}
                                    className="btn-primary px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    I Agree & Accept
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
