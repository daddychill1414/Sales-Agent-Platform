"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { step1Schema, step2Schema, step3Schema, step4Schema } from '@/lib/validations';
import { applicationLimiter } from '@/lib/rate-limiter';
import { ScreeningStep } from './ScreeningStep';
import { LegalConsentStep } from './LegalConsentStep';
import Link from 'next/link';

/**
 * Steps:
 * 0 = Screening Questions (knockout check — evaluated silently on server)
 * 1 = Personal Details (no password — delayed login)
 * 2 = Professional Background
 * 3 = Resume Upload
 * 4 = Terms & Privacy Agreement
 */
type Step = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = [
    'Screening',
    'Personal Details',
    'Professional Background',
    'Resume Upload',
    'Terms & Agreement',
];

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resume: File | null;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingAccepted: boolean;
}

export function ApplicationForm({ positionId }: { positionId?: string }) {
    const [step, setStep] = useState<Step>(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [trackingCode, setTrackingCode] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [screeningResponses, setScreeningResponses] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resume: null,
        termsAccepted: false,
        privacyAccepted: false,
        marketingAccepted: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);

    // Custom Dynamic Fields
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [customData, setCustomData] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!positionId) return;
        const fetchFields = async () => {
            try {
                const res = await fetch(`/api/application-fields?jobId=${positionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCustomFields(data.fields || []);
                }
            } catch (err) {
                console.error("Failed to load custom fields:", err);
            }
        };
        fetchFields();
    }, [positionId]);

    useEffect(() => {
        if (formData.resume) {
            const url = URL.createObjectURL(formData.resume);
            setResumeUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setResumeUrl(null);
        }
    }, [formData.resume]);

    const updateData = (fields: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...fields }));
        const newErrors = { ...errors };
        Object.keys(fields).forEach((key) => {
            delete newErrors[key];
        });
        setErrors(newErrors);
    };

    const handleScreeningResponse = (questionId: string, answer: string) => {
        setScreeningResponses(prev => ({ ...prev, [questionId]: answer }));
        const newErrors = { ...errors };
        delete newErrors[questionId];
        setErrors(newErrors);
    };

    /** Validate current step */
    const validateStep = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            // Screening: just check that all required questions are answered
            // (We don't validate correctness on client — server does it silently)
            // We'd need to fetch question IDs here, so we allow pass-through
            // The server-side evaluation handles the logic
            return true;
        } else if (step === 1) {
            const result = step1Schema.safeParse(formData);
            if (!result.success) {
                for (const issue of result.error.issues) {
                    const field = issue.path[0] as string;
                    if (!newErrors[field]) newErrors[field] = issue.message;
                }
            }
            
            // Validate custom dynamic fields for Step 1
            customFields.filter(f => f.section === 'personal_details' || !f.section).forEach(field => {
                if (field.is_required && !customData[field.field_name]?.trim()) {
                    newErrors[`custom_${field.field_name}`] = `${field.field_label} is required`;
                }
            });
        } else if (step === 2) {
            // Validate custom dynamic fields for Step 2
            customFields.filter(f => f.section === 'professional_background').forEach(field => {
                if (field.is_required && !customData[field.field_name]?.trim()) {
                    newErrors[`custom_${field.field_name}`] = `${field.field_label} is required`;
                }
            });
        } else if (step === 3) {
            const result = step3Schema.safeParse({ resume: formData.resume });
            if (!result.success) {
                for (const issue of result.error.issues) {
                    newErrors.resume = issue.message;
                }
            }
        } else if (step === 4) {
            const result = step4Schema.safeParse({
                termsAccepted: formData.termsAccepted,
                privacyAccepted: formData.privacyAccepted,
            });
            if (!result.success) {
                for (const issue of result.error.issues) {
                    const field = issue.path[0] as string;
                    if (!newErrors[field]) {
                        newErrors[field === 'termsAccepted' ? 'terms' : 'privacy'] = issue.message;
                    }
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(s => Math.min(s + 1, 4) as Step);
        }
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 0) as Step);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setErrors({ resume: "Only PDF files are allowed" });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ resume: "File must be under 5MB" });
                return;
            }
            updateData({ resume: file });
        }
    };

    const copyTrackingCode = () => {
        navigator.clipboard.writeText(trackingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep() || step !== 4) return;

        // Rate limiting check
        if (!applicationLimiter.canProceed()) {
            const wait = applicationLimiter.getWaitTime();
            setErrors({ terms: `Too many attempts. Please wait ${wait} seconds.` });
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            // 1. Upload resume first (if present)
            let uploadedResumeUrl: string | null = null;
            if (formData.resume) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.resume);
                // Use a temporary ID for the folder since there's no user account yet
                uploadFormData.append('userId', `pending-${Date.now()}`);

                const uploadRes = await fetch('/api/upload-resume', {
                    method: 'POST',
                    body: uploadFormData,
                });

                const uploadResult = await uploadRes.json();
                if (uploadRes.ok && uploadResult.success) {
                    uploadedResumeUrl = uploadResult.resumeUrl;
                }
            }

            // 2. Submit the application
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    resumeUrl: uploadedResumeUrl,
                    screeningResponses,
                    appliedPositionId: positionId || null,
                    termsAccepted: formData.termsAccepted,
                    privacyAccepted: formData.privacyAccepted,
                    customData,
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                setErrors({ terms: result.error || 'Submission failed. Please try again.' });
                setSubmitting(false);
                return;
            }

            setTrackingCode(result.trackingCode);
            setSubmitted(true);
        } catch (err) {
            console.error('Submit error:', err);
            setErrors({ terms: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success Screen ──────────────────────────────────────
    if (submitted) {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-panel p-16 md:p-24 rounded-[3rem] text-center border-accent/30 border shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-accent/5" />
                <div className="relative z-10 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                        className="w-28 h-28 bg-accent/20 flex items-center justify-center rounded-[2rem] mx-auto mb-10 border border-accent/30"
                    >
                        <CheckCircle2 className="w-14 h-14 text-accent" />
                    </motion.div>
                    <h2 className="text-5xl md:text-6xl font-bold mb-6 heading-sans tracking-tight">Application Received</h2>
                    <p className="text-xl text-muted font-light leading-relaxed mb-8">
                        Thank you for applying! Our team will review your application and reach out if you qualify for the next steps.
                    </p>

                    {/* Tracking Code */}
                    <div className="glass-panel p-8 rounded-[2rem] border border-accent/20 bg-accent/5 inline-block mb-10">
                        <p className="text-xs text-muted uppercase tracking-[0.3em] mb-3 font-mono font-bold">Your Tracking Code</p>
                        <div className="flex items-center gap-4 justify-center">
                            <span className="text-4xl md:text-5xl font-bold text-accent tracking-wider font-mono">{trackingCode}</span>
                            <button
                                onClick={copyTrackingCode}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors cursor-pointer"
                                title="Copy tracking code"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-white/40 mt-4 font-mono">Save this code to check your application status</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/track" className="btn-primary px-8 py-4 text-lg">
                            <span className="btn-slide" />
                            Track Application
                            <ExternalLink className="ml-2 w-4 h-4" />
                        </Link>
                        <button onClick={() => window.location.href = '/'} className="btn-outline px-8 py-4 text-lg">
                            <span className="btn-slide" />
                            <span>Return to Homepage</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Form ─────────────────────────────────────────────────
    return (
        <div className="glass-panel p-8 md:p-16 rounded-[3rem] border border-white/5 shadow-2xl relative">
            {/* Progress Indicator — 5 steps now */}
            <div className="mb-12 flex items-center justify-between relative mt-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full z-0 transition-all duration-500"
                    style={{ width: `${(step / 4) * 100}%` }}
                ></div>

                {[0, 1, 2, 3, 4].map((num) => (
                    <div key={num} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${step >= num
                                ? 'bg-accent text-black'
                                : 'bg-[#1a1a24] text-white/40 border border-white/10'
                            }`}>
                            {step > num ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                num + 1
                            )}
                        </div>
                        <span className="absolute -bottom-7 text-[10px] font-mono text-white/30 uppercase tracking-wider whitespace-nowrap hidden md:block">
                            {STEP_LABELS[num]}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mb-12 text-center mt-10">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">
                    {STEP_LABELS[step]}
                </h2>
                <p className="text-muted text-lg font-light">
                    {step === 0 && "Let's start with a few quick questions about your qualifications."}
                    {step === 1 && "Provide your basic contact information."}
                    {step === 2 && "Tell us about your experience in sales and your career goals."}
                    {step === 3 && "Upload your latest resume so we can review your credentials."}
                    {step === 4 && "Review and accept our terms to complete your application."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* Step 0: Screening */}
                    {step === 0 && (
                        <ScreeningStep
                            responses={screeningResponses}
                            onResponseChange={handleScreeningResponse}
                            errors={errors}
                            positionId={positionId}
                        />
                    )}

                    {/* Step 1: Personal Details */}
                    {step === 1 && (
                        <motion.div key="step1" initial="hidden" animate="visible" exit="hidden" variants={fadeInUp} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">First Name</label>
                                    <input type="text" value={formData.firstName} onChange={e => updateData({ firstName: e.target.value })} className={`w-full bg-[#0D0D12]/50 border ${errors.firstName ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} placeholder="John" />
                                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">Last Name</label>
                                    <input type="text" value={formData.lastName} onChange={e => updateData({ lastName: e.target.value })} className={`w-full bg-[#0D0D12]/50 border ${errors.lastName ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} placeholder="Doe" />
                                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">Email Address</label>
                                    <input type="email" value={formData.email} onChange={e => updateData({ email: e.target.value })} className={`w-full bg-[#0D0D12]/50 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} placeholder="john@example.com" />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">Phone Number</label>
                                    <input type="tel" value={formData.phone} onChange={e => updateData({ phone: e.target.value })} className={`w-full bg-[#0D0D12]/50 border ${errors.phone ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} placeholder="+63 917 000 0000" />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            
                            {/* DYNAMIC FIELDS MAP (STEP 1) */}
                            {customFields.filter(f => f.section === 'personal_details' || !f.section).length > 0 && (
                                <div className="pt-6 border-t border-white/5 space-y-8 mt-8">
                                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Additional Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {customFields.filter(f => f.section === 'personal_details' || !f.section).map((field) => (
                                            <div key={field.id || field.field_name} className={`space-y-3 ${field.field_type === 'long_text' ? 'md:col-span-2' : ''}`}>
                                                <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">
                                                    {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                                </label>
                                                {field.field_type === 'long_text' ? (
                                                    <textarea 
                                                        rows={4} 
                                                        value={customData[field.field_name] || ''} 
                                                        onChange={e => {
                                                            setCustomData(prev => ({...prev, [field.field_name]: e.target.value}));
                                                            const newErrs = {...errors};
                                                            delete newErrs[`custom_${field.field_name}`];
                                                            setErrors(newErrs);
                                                        }}
                                                        className={`w-full bg-[#0D0D12]/50 border ${errors[`custom_${field.field_name}`] ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors resize-none text-lg leading-relaxed`} 
                                                    />
                                                ) : (
                                                    <input 
                                                        type={field.field_type === 'email' ? 'email' : field.field_type === 'tel' ? 'tel' : field.field_type === 'url' ? 'url' : 'text'} 
                                                        value={customData[field.field_name] || ''} 
                                                        onChange={e => {
                                                            setCustomData(prev => ({...prev, [field.field_name]: e.target.value}));
                                                            const newErrs = {...errors};
                                                            delete newErrs[`custom_${field.field_name}`];
                                                            setErrors(newErrs);
                                                        }}
                                                        className={`w-full bg-[#0D0D12]/50 border ${errors[`custom_${field.field_name}`] ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} 
                                                    />
                                                )}
                                                {errors[`custom_${field.field_name}`] && <p className="text-red-500 text-sm mt-1">{errors[`custom_${field.field_name}`]}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}

                    {/* Step 2: Professional Background */}
                    {step === 2 && (
                        <motion.div key="step2" initial="hidden" animate="visible" exit="hidden" variants={fadeInUp} className="space-y-8">
                            {customFields.filter(f => f.section === 'professional_background').length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <p>No questions mapped to this section.</p>
                                </div>
                            ) : (
                                customFields.filter(f => f.section === 'professional_background').map((field) => (
                                    <div key={field.id || field.field_name} className="space-y-3">
                                        <label className="text-sm font-medium text-white/80 uppercase tracking-widest block">
                                            {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.field_type === 'long_text' ? (
                                            <textarea 
                                                rows={4} 
                                                value={customData[field.field_name] || ''} 
                                                onChange={e => {
                                                    setCustomData(prev => ({...prev, [field.field_name]: e.target.value}));
                                                    const newErrs = {...errors};
                                                    delete newErrs[`custom_${field.field_name}`];
                                                    setErrors(newErrs);
                                                }}
                                                className={`w-full bg-[#0D0D12]/50 border ${errors[`custom_${field.field_name}`] ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors resize-none text-lg leading-relaxed`} 
                                            />
                                        ) : (
                                            <input 
                                                type={field.field_type === 'email' ? 'email' : field.field_type === 'tel' ? 'tel' : field.field_type === 'url' ? 'url' : 'text'} 
                                                value={customData[field.field_name] || ''} 
                                                onChange={e => {
                                                    setCustomData(prev => ({...prev, [field.field_name]: e.target.value}));
                                                    const newErrs = {...errors};
                                                    delete newErrs[`custom_${field.field_name}`];
                                                    setErrors(newErrs);
                                                }}
                                                className={`w-full bg-[#0D0D12]/50 border ${errors[`custom_${field.field_name}`] ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-5 focus:outline-none focus:border-accent focus:bg-[#0D0D12] transition-colors`} 
                                            />
                                        )}
                                        {errors[`custom_${field.field_name}`] && <p className="text-red-500 text-sm mt-1">{errors[`custom_${field.field_name}`]}</p>}
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Step 3: Resume Upload */}
                    {step === 3 && (
                        <motion.div key="step3" initial="hidden" animate="visible" exit="hidden" variants={fadeInUp} className="space-y-8 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-full max-w-lg">
                                {formData.resume ? (
                                    <div className="space-y-6 w-full">
                                        <div className="glass-panel p-6 rounded-[2rem] border border-accent/30 bg-accent/5 flex items-center justify-between group shadow-xl shadow-accent/5">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-white tracking-tight truncate">{formData.resume.name}</p>
                                                    <p className="text-xs text-white/50 font-mono">{(formData.resume.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                                </div>
                                            </div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-accent cursor-pointer hover:text-white transition-colors shrink-0 ml-4 px-4 py-2 rounded-lg bg-accent/10 hover:bg-white/10">
                                                Replace
                                                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        </div>

                                        {resumeUrl && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="w-full h-[450px] rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 relative shadow-2xl"
                                            >
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono text-white/70 border border-white/10 z-10 pointer-events-none tracking-widest uppercase font-bold">
                                                    Live View
                                                </div>
                                                <iframe
                                                    src={`${resumeUrl}#toolbar=0&navpanes=0`}
                                                    className="w-full h-full border-none"
                                                    title="Resume Preview"
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <label className={`border-2 border-dashed ${errors.resume ? 'border-red-500 bg-red-500/5' : 'border-white/20 hover:border-accent bg-white/5 hover:bg-white/10'} transition-all rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer group`}>
                                        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-accent" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-xl font-medium text-white mb-2">Click to browse or drag PDF here</span>
                                            <span className="block text-muted">Maximum file size 5MB</span>
                                        </div>
                                        <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                                {errors.resume && <p className="text-red-500 text-center mt-6 font-medium bg-red-500/10 py-2 rounded-lg">{errors.resume}</p>}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Legal Consent */}
                    {step === 4 && (
                        <LegalConsentStep
                            termsAccepted={formData.termsAccepted}
                            privacyAccepted={formData.privacyAccepted}
                            marketingAccepted={formData.marketingAccepted}
                            onTermsChange={(v) => updateData({ termsAccepted: v })}
                            onPrivacyChange={(v) => updateData({ privacyAccepted: v })}
                            onMarketingChange={(v) => updateData({ marketingAccepted: v })}
                            errors={{ terms: errors.terms, privacy: errors.privacy }}
                        />
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-12 gap-6">
                    {step > 0 ? (
                        <button type="button" onClick={prevStep} className="btn-outline px-8 py-5 flex items-center gap-3">
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>
                    ) : <div></div>}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="btn-primary px-10 py-5 flex items-center gap-3 ml-auto">
                            Next Step <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary px-12 py-5 shadow-2xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
