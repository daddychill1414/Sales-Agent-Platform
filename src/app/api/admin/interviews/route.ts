import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/interviews
 * Lists all interviews with applicant profile info.
 */
export async function GET() {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const { data, error } = await db
            .from('interviews')
            .select(`
                *,
                applicant:profiles!applicant_id(id, full_name, first_name, last_name, email, stage),
                interviewer:profiles!interviewer_id(id, full_name, first_name, last_name)
            `)
            .order('scheduled_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const interviews = (data || []).map(i => ({
            ...i,
            applicantName: i.applicant?.full_name || `${i.applicant?.first_name || ''} ${i.applicant?.last_name || ''}`.trim() || 'Unknown',
            applicantEmail: i.applicant?.email || '',
            interviewerName: i.interviewer?.full_name || `${i.interviewer?.first_name || ''} ${i.interviewer?.last_name || ''}`.trim() || 'Unassigned',
        }));

        return NextResponse.json({ interviews });
    } catch (err) {
        console.error('Interviews fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
    }
}

/**
 * POST /api/admin/interviews
 * Schedule a new interview.
 * Body: { applicantId, scheduledAt, meetingLink?, notes?, interviewerId? }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { applicantId, scheduledAt, meetingLink, notes, interviewerId } = body;

        if (!applicantId || !scheduledAt) {
            return NextResponse.json({ error: 'applicantId and scheduledAt required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('interviews')
            .insert({
                applicant_id: applicantId,
                interviewer_id: interviewerId || auth.userId,
                scheduled_at: scheduledAt,
                meeting_link: meetingLink || null,
                notes: notes || null,
                status: 'Scheduled',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update applicant stage
        await db
            .from('profiles')
            .update({ stage: 'Interview Scheduled' })
            .eq('id', applicantId);

        // Log activity
        await db.from('activity_log').insert({
            actor_id: auth.userId,
            action: 'interview_scheduled',
            target_type: 'interview',
            target_id: data.id,
            metadata: { applicant_id: applicantId, scheduled_at: scheduledAt },
        });

        // Notify applicant
        const scheduledDate = new Date(scheduledAt).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        await db.from('notifications').insert({
            user_id: applicantId,
            title: 'Interview Scheduled',
            message: `Your interview has been scheduled for ${scheduledDate}.`,
            type: 'action',
            link: '/dashboard',
        });

        // Try email
        try {
            const { data: applicant } = await db
                .from('profiles')
                .select('email, first_name, full_name')
                .eq('id', applicantId)
                .single();

            if (applicant?.email) {
                await fetch(new URL('/api/send-email', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: applicant.email,
                        subject: `OneNetworx — Interview Scheduled: ${scheduledDate}`,
                        html: `
                            <h2>Hello ${applicant.first_name || applicant.full_name || 'Applicant'},</h2>
                            <p>Your interview has been scheduled for: <strong>${scheduledDate}</strong></p>
                            ${meetingLink ? `<p>Meeting link: <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
                            <p>Please log in to your dashboard for more details.</p>
                            <p>— The OneNetworx Team</p>
                        `,
                    }),
                });
            }
        } catch (emailErr) {
            console.warn('Email notification failed (non-blocking):', emailErr);
        }

        return NextResponse.json({ success: true, interview: data });
    } catch (err) {
        console.error('Interview schedule error:', err);
        return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/interviews
 * Update interview status/notes.
 * Body: { id, status?, notes?, meetingLink? }
 */
export async function PATCH(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Interview id required' }, { status: 400 });
        }

        // Map camelCase to snake_case
        const dbUpdates: Record<string, unknown> = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.meetingLink !== undefined) dbUpdates.meeting_link = updates.meetingLink;

        const { data, error } = await db
            .from('interviews')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, applicant:profiles!applicant_id(id)')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update applicant stage if interview completed
        if (updates.status === 'Completed' && data?.applicant?.id) {
            await db
                .from('profiles')
                .update({ stage: 'Interview Completed' })
                .eq('id', data.applicant.id);
        }

        return NextResponse.json({ success: true, interview: data });
    } catch (err) {
        console.error('Interview update error:', err);
        return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
    }
}
