import nodemailer from 'nodemailer';

/**
 * Email utility using Nodemailer + Gmail SMTP.
 * Configure via .env.local:
 *   GMAIL_USER=your-email@gmail.com
 *   GMAIL_APP_PASSWORD=your-app-password
 * 
 * To get an App Password:
 * 1. Go to myaccount.google.com → Security
 * 2. Enable 2-Step Verification
 * 3. Go to App passwords → Generate one for "Mail"
 */

function getTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Send an email via Gmail SMTP.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('[Email] Gmail credentials not configured. Email not sent.');
            return { success: false, error: 'Email not configured' };
        }

        const transporter = getTransporter();
        await transporter.sendMail({
            from: `"OneNetworx" <${process.env.GMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        return { success: true };
    } catch (err) {
        console.error('[Email] Send failed:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

// ── Pre-built Email Templates ──────────────────────────────

/**
 * Application received confirmation email.
 */
export function applicationReceivedEmail(name: string, trackingCode: string, positionTitle: string = 'General Position'): EmailOptions {
    return {
        to: '', // caller sets this
        subject: `Application Received — ${positionTitle}`,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0D12; color: #FAF8F5; padding: 48px 32px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 28px; font-weight: 700; margin: 0;">One<span style="color: #C9A84C; font-style: italic;">Networx</span></h1>
                    <p style="color: #827C75; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Agent Portal</p>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
                <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Application Received ✓</h2>
                <p style="color: #b0ada8; line-height: 1.8; font-size: 15px;">
                    Hi <strong style="color: #FAF8F5;">${name}</strong>,<br/><br/>
                    Thank you for applying for the <strong style="color: #C9A84C;">${positionTitle}</strong> role at OneNetworx! We've received your application and our team will review it shortly.
                </p>
                <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                    <p style="color: #827C75; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px 0;">Your Tracking Code</p>
                    <p style="font-size: 28px; font-weight: 700; color: #C9A84C; margin: 0; letter-spacing: 2px;">${trackingCode}</p>
                </div>
                <p style="color: #827C75; font-size: 13px; line-height: 1.8;">
                    Save this tracking code — you can use it to check your application status anytime.
                </p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
                <p style="color: #555; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} OneNetworx. All rights reserved.
                </p>
            </div>
        `,
        text: `Hi ${name}, your application for the ${positionTitle} role has been received. Your tracking code is: ${trackingCode}`,
    };
}

/**
 * Account invitation (magic link placeholder).
 */
export function accountInviteEmail(name: string, inviteUrl: string): EmailOptions {
    return {
        to: '',
        subject: 'You\'re Invited — Create Your OneNetworx Account',
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0D12; color: #FAF8F5; padding: 48px 32px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 28px; font-weight: 700; margin: 0;">One<span style="color: #C9A84C; font-style: italic;">Networx</span></h1>
                    <p style="color: #827C75; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Agent Portal</p>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
                <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Congratulations, ${name}!</h2>
                <p style="color: #b0ada8; line-height: 1.8; font-size: 15px;">
                    Your application has been reviewed and approved. Click the button below to create your account and continue the process.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: #C9A84C; color: #000; font-weight: 700; padding: 16px 40px; border-radius: 100px; text-decoration: none; font-size: 15px;">
                        Create My Account
                    </a>
                </div>
                <p style="color: #827C75; font-size: 13px; line-height: 1.8;">
                    This link will expire in 48 hours. If you didn't apply to OneNetworx, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
                <p style="color: #555; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} OneNetworx. All rights reserved.
                </p>
            </div>
        `,
        text: `Hi ${name}, congratulations! Create your account here: ${inviteUrl}`,
    };
}

/**
 * Stage advancement notification.
 */
export function stageUpdateEmail(name: string, newStage: string): EmailOptions {
    return {
        to: '',
        subject: `Application Update — ${newStage}`,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0D12; color: #FAF8F5; padding: 48px 32px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 28px; font-weight: 700; margin: 0;">One<span style="color: #C9A84C; font-style: italic;">Networx</span></h1>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
                <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Application Update</h2>
                <p style="color: #b0ada8; line-height: 1.8; font-size: 15px;">
                    Hi <strong style="color: #FAF8F5;">${name}</strong>,<br/><br/>
                    Your application status has been updated to:
                </p>
                <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                    <p style="font-size: 22px; font-weight: 700; color: #C9A84C; margin: 0;">${newStage}</p>
                </div>
                <p style="color: #827C75; font-size: 13px;">Our team will reach out if any further action is required from your end.</p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
                <p style="color: #555; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} OneNetworx</p>
            </div>
        `,
        text: `Hi ${name}, your application has been updated to: ${newStage}`,
    };
}
