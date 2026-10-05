import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

/**
 * POST /api/admin/exams/assign
 * Assign an exam to an applicant.
 * Body: { applicantId, examId }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { applicantId, examId } = body;

        if (!applicantId || !examId) {
            return NextResponse.json({ error: 'applicantId and examId required' }, { status: 400 });
        }

        // Check if already assigned
        const { data: existing } = await db
            .from('applicant_exams')
            .select('id')
            .eq('applicant_id', applicantId)
            .eq('exam_id', examId)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Exam already assigned to this applicant' }, { status: 409 });
        }

        const { data, error } = await db
            .from('applicant_exams')
            .insert({
                applicant_id: applicantId,
                exam_id: examId,
                status: 'Assigned',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update applicant stage to "Exam Scheduled"
        await db
            .from('profiles')
            .update({ stage: 'Exam Scheduled' })
            .eq('id', applicantId);

        // Log activity
        await db.from('activity_log').insert({
            actor_id: auth.userId,
            action: 'exam_assigned',
            target_type: 'applicant_exam',
            target_id: data.id,
            metadata: { applicant_id: applicantId, exam_id: examId },
        });

        // Notify applicant
        await db.from('notifications').insert({
            user_id: applicantId,
            title: 'Exam Assigned',
            message: 'You have been assigned a new assessment. Please complete it at your earliest convenience.',
            type: 'action',
            link: '/exam',
        });

        // Try to email
        try {
            const { data: applicant } = await db
                .from('profiles')
                .select('email, first_name, full_name')
                .eq('id', applicantId)
                .single();

            const { data: exam } = await db
                .from('exams')
                .select('title')
                .eq('id', examId)
                .single();

            if (applicant?.email) {
                await fetch(new URL('/api/send-email', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: applicant.email,
                        subject: `OneNetworx — Assessment Assigned: ${exam?.title || 'New Exam'}`,
                        html: `
                            <h2>Hello ${applicant.first_name || applicant.full_name || 'Applicant'},</h2>
                            <p>You have been assigned a new assessment: <strong>${exam?.title || 'Assessment'}</strong></p>
                            <p>Please log in to your dashboard and complete it at your earliest convenience.</p>
                            <p>— The OneNetworx Team</p>
                        `,
                    }),
                });
            }
        } catch (emailErr) {
            console.warn('Email notification failed (non-blocking):', emailErr);
        }

        return NextResponse.json({ success: true, assignment: data });
    } catch (err) {
        console.error('Exam assign error:', err);
        return NextResponse.json({ error: 'Failed to assign exam' }, { status: 500 });
    }
}
