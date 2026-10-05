import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-email
 * Sends an email notification.
 * 
 * If SMTP env vars are configured, sends via nodemailer.
 * Otherwise, logs to console (development mode).
 * 
 * Body: { to, subject, html }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'to, subject, and html required' }, { status: 400 });
        }

        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
            // Development mode — log instead of sending
            console.log('📧 [EMAIL - DEV MODE] Would send email:');
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            console.log(`   Body: ${html.substring(0, 200)}...`);
            return NextResponse.json({
                success: true,
                mode: 'development',
                message: 'Email logged to console (SMTP not configured)',
            });
        }

        // Dynamic import nodemailer only when SMTP is configured
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || smtpUser,
            to,
            subject,
            html,
        });

        return NextResponse.json({ success: true, mode: 'smtp' });
    } catch (err) {
        console.error('Email send error:', err);
        // Non-fatal — don't break the calling workflow
        return NextResponse.json({ 
            success: false, 
            error: 'Email send failed',
            mode: 'error' 
        }, { status: 200 }); // Return 200 so calling code doesn't throw
    }
}
