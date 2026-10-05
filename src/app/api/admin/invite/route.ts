import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';

/**
 * POST /api/admin/invite — Send a magic link invitation to an applicant.
 * This creates a Supabase auth invite, which sends an email with a
 * one-time login link. When the applicant clicks it, they get an account
 * and their application is linked via user_id.
 *
 * Body: { applicationId, email }
 * Security: super_admin and hr_admin only
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        // Check admin role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', user.id)
            .single();

        if (!profile || !['super_admin', 'hr_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden — only admins can send invites' }, { status: 403 });
        }

        const body = await request.json();
        const { applicationId, email } = body;

        if (!applicationId || !email) {
            return NextResponse.json({ error: 'applicationId and email are required' }, { status: 400 });
        }

        // Verify application exists
        const { data: application } = await supabaseAdmin
            .from('applications')
            .select('id, tracking_code, first_name, last_name, email, stage, user_id')
            .eq('id', applicationId)
            .single();

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Don't re-invite if already linked to a user
        if (application.user_id) {
            return NextResponse.json({ error: 'This applicant already has an account' }, { status: 400 });
        }

        // Use Supabase Admin API to invite the user by email
        // This sends a magic link email through Supabase's built-in email system
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                application_id: applicationId,
                first_name: application.first_name,
                last_name: application.last_name,
                role: 'applicant',
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
        });

        if (inviteError) {
            console.error('Invite error:', inviteError);

            // If user already exists in auth, try magic link instead
            if (inviteError.message?.includes('already been registered') || inviteError.message?.includes('already exists')) {
                const { error: magicError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
                    },
                });

                if (magicError) {
                    console.error('Magic link fallback error:', magicError);
                    return NextResponse.json({ error: 'Failed to send invitation. User may already exist.' }, { status: 500 });
                }
            } else {
                return NextResponse.json({ error: `Failed to send invitation: ${inviteError.message}` }, { status: 500 });
            }
        }

        // Update application stage to "Account Invited"
        await supabaseAdmin
            .from('applications')
            .update({ stage: 'Account Invited' })
            .eq('id', applicationId);

        // If invite created a new user, link it to the application
        if (inviteData?.user?.id) {
            await supabaseAdmin
                .from('applications')
                .update({ user_id: inviteData.user.id })
                .eq('id', applicationId);

            // Create/update their profile
            await supabaseAdmin.from('profiles').upsert({
                id: inviteData.user.id,
                first_name: application.first_name,
                last_name: application.last_name,
                email: application.email,
                role: 'applicant',
            });
        }

        // Log audit event
        await logAuditEvent({
            userId: user.id,
            userEmail: user.email || undefined,
            userRole: profile.role,
            action: 'invite_sent',
            description: `${profile.first_name} ${profile.last_name} sent a magic link invite to ${application.first_name} ${application.last_name} (${email})`,
            targetType: 'application',
            targetId: applicationId,
            metadata: { email, applicantName: `${application.first_name} ${application.last_name}` },
        });

        // Also send a notification email via our SMTP if configured
        try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: 'OneNetworx — You\'re Invited to Create Your Account',
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a24; margin-bottom: 20px;">
                                Welcome to OneNetworx, ${application.first_name}!
                            </h1>
                            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                                Great news — your application has been reviewed and you've been approved to move forward in our process.
                            </p>
                            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                                Please check your email for a separate sign-in link from OneNetworx. Click it to create your account and access your dashboard where you can:
                            </p>
                            <ul style="font-size: 14px; color: #555; line-height: 1.8; margin-bottom: 30px;">
                                <li>View your application status</li>
                                <li>Take assigned exams</li>
                                <li>Access training materials</li>
                                <li>Sign your employment contract</li>
                            </ul>
                            <p style="font-size: 14px; color: #888; margin-top: 30px;">
                                Your tracking code: <strong>${application.tracking_code || 'N/A'}</strong>
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #aaa;">
                                OneNetworx Agent Platform — This is an automated message.
                            </p>
                        </div>
                    `,
                }),
            });
        } catch (emailErr) {
            console.error('Supplemental email failed (non-critical):', emailErr);
        }

        return NextResponse.json({ success: true, message: 'Invitation sent successfully' });
    } catch (err) {
        console.error('Invite POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
