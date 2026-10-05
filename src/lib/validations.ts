import { z } from 'zod';

/**
 * Application Form validation schemas using Zod.
 * Per vibecodesecurity: input validation, XSS protection.
 * 
 * Updated for delayed-login architecture:
 * - No password field (account created later via magic link)
 * - Added screening and legal consent validation
 */

// Sanitize input: strip HTML tags
const sanitize = (val: string) => val.replace(/<[^>]*>/g, '').trim();

/**
 * Step 1: Personal Details (no password)
 */
export const step1Schema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name too long')
        .transform(sanitize),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name too long')
        .transform(sanitize),
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .max(100, 'Email too long'),
    phone: z.string()
        .min(1, 'Phone is required')
        .max(20, 'Phone number too long')
        .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format'),
});

/**
 * Step 2: Professional Background
 */
export const step2Schema = z.object({
    // Fully dynamic Professional Background Step - validation is handled in ApplicationForm.tsx
});

/**
 * Step 3: Resume Upload
 */
export const step3Schema = z.object({
    resume: z.instanceof(File, { message: 'Please upload your resume in PDF format' })
        .refine(f => f.type === 'application/pdf', 'Only PDF files are allowed')
        .refine(f => f.size <= 5 * 1024 * 1024, 'File must be under 5MB'),
});

/**
 * Step 4: Legal Consent
 */
export const step4Schema = z.object({
    termsAccepted: z.boolean().refine(v => v === true, 'You must accept the Terms of Service'),
    privacyAccepted: z.boolean().refine(v => v === true, 'You must accept the Data Privacy Policy'),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
