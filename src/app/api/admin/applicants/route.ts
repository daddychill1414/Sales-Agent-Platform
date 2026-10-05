import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/applicants
 * Returns all applications from the `applications` table.
 * Supports ?search= and ?stage= query params.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || '';

    try {
        let query = db
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (stage && stage !== 'All Candidates') {
            query = query.eq('stage', stage);
        }

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tracking_code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Applicants query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const applicants = (data || []).map(a => ({
            ...a,
            name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown',
            full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown',
        }));

        return NextResponse.json({ applicants });
    } catch (err) {
        console.error('Applicants error:', err);
        return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/applicants
 * Update an applicant's stage or other fields.
 * Body: { applicantId, stage?, notes? }
 */
export async function PATCH(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { applicantId, stage } = body;

        if (!applicantId) {
            return NextResponse.json({ error: 'applicantId required' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};
        if (stage) updates.stage = stage;

        const { data, error } = await db
            .from('applications')
            .update(updates)
            .eq('id', applicantId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get admin info for audit
        const { data: adminProfile } = await db
            .from('profiles')
            .select('role, first_name, last_name, email')
            .eq('id', (auth as { userId: string }).userId)
            .single();

        // Log audit event
        await logAuditEvent({
            userId: (auth as { userId: string }).userId,
            userEmail: adminProfile?.email,
            userRole: adminProfile?.role || 'unknown',
            action: 'stage_change',
            description: `${adminProfile?.first_name || 'Admin'} moved ${data.first_name} ${data.last_name} to stage: ${stage}`,
            targetType: 'application',
            targetId: applicantId,
            metadata: { new_stage: stage, old_stage: body.oldStage },
        });

        // Create notification if user_id exists
        if (data.user_id && stage) {
            try {
                await db.from('notifications').insert({
                    user_id: data.user_id,
                    title: 'Application Status Updated',
                    message: `Your application status has been updated to: ${stage}`,
                    type: stage === 'Rejected' || stage === 'Disqualified' ? 'warning' : 'success',
                    link: '/dashboard',
                });
            } catch { /* Notification insert is non-critical */ }
        }

        // Try sending email notification
        try {
            if (data.email) {
                await fetch(new URL('/api/send-email', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: data.email,
                        subject: `OneNetworx — Application Update: ${stage}`,
                        html: `
                            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                                <h2 style="font-size: 24px; font-weight: 700; color: #1a1a24;">Hello ${data.first_name || 'Applicant'},</h2>
                                <p style="font-size: 16px; color: #555; line-height: 1.6;">Your application status at OneNetworx has been updated to: <strong>${stage}</strong></p>
                                <p style="font-size: 14px; color: #888; margin-top: 20px;">Tracking Code: <strong>${data.tracking_code || 'N/A'}</strong></p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                                <p style="font-size: 12px; color: #aaa;">— The OneNetworx Team</p>
                            </div>
                        `,
                    }),
                });
            }
        } catch (emailErr) {
            console.warn('Email notification failed (non-blocking):', emailErr);
        }

        return NextResponse.json({ success: true, application: data });
    } catch (err) {
        console.error('Applicant update error:', err);
        return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 });
    }
}
