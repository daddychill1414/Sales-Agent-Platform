import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/exams
 * Returns all exams with question counts and completion stats.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const db = createAdminClient();

    try {
        const { data: exams, error } = await db
            .from('exams')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get question counts and completion stats per exam
        const enriched = await Promise.all(
            (exams || []).map(async (exam) => {
                const { count: questionCount } = await db
                    .from('exam_questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('exam_id', exam.id);

                const { count: completions } = await db
                    .from('applicant_exams')
                    .select('*', { count: 'exact', head: true })
                    .eq('exam_id', exam.id)
                    .in('status', ['Completed', 'Passed', 'Failed']);

                const { data: scores } = await db
                    .from('applicant_exams')
                    .select('score')
                    .eq('exam_id', exam.id)
                    .not('score', 'is', null);

                const avgScore = scores && scores.length > 0
                    ? Math.round(scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length)
                    : 0;

                return {
                    ...exam,
                    questions: questionCount || 0,
                    completions: completions || 0,
                    avgScore,
                };
            })
        );

        return NextResponse.json({ exams: enriched });
    } catch (err) {
        console.error('Exams fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
    }
}

/**
 * POST /api/admin/exams
 * Create a new exam.
 * Body: { title, description, questions?: [{ question_text, options, order_index }] }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { title, description, questions, jobId } = body;

        if (!title || !jobId) {
            return NextResponse.json({ error: 'Title and jobId are required' }, { status: 400 });
        }

        // Create the exam
        const { data: exam, error } = await db
            .from('exams')
            .insert({ title, description, active: true, job_id: jobId })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add questions if provided
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const questionsToInsert = questions.map((q: { question_text: string; options: unknown; order_index?: number }, i: number) => ({
                exam_id: exam.id,
                question_text: q.question_text,
                options: q.options,
                order_index: q.order_index ?? i,
            }));

            const { error: qError } = await db
                .from('exam_questions')
                .insert(questionsToInsert);

            if (qError) {
                console.error('Questions insert error:', qError);
            }
        }

        // Log activity
        await db.from('activity_log').insert({
            actor_id: auth.userId,
            action: 'exam_created',
            target_type: 'exam',
            target_id: exam.id,
            metadata: { title },
        });

        return NextResponse.json({ success: true, exam });
    } catch (err) {
        console.error('Exam create error:', err);
        return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/exams
 * Update an exam. Body: { id, title?, description?, active? }
 */
export async function PUT(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id, jobId, ...updates } = body;
        if (jobId) {
            updates.job_id = jobId;
        }

        if (!id) {
            return NextResponse.json({ error: 'Exam id required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('exams')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, exam: data });
    } catch (err) {
        console.error('Exam update error:', err);
        return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/exams
 * Delete an exam. Body: { id }
 */
export async function DELETE(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Exam id required' }, { status: 400 });
        }

        const { error } = await db.from('exams').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Exam delete error:', err);
        return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
    }
}
