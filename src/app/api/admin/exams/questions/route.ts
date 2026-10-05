import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

/**
 * GET /api/admin/exams/questions?examId=xxx
 * Returns all questions for a given exam.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();
    const examId = new URL(request.url).searchParams.get('examId');

    if (!examId) {
        return NextResponse.json({ error: 'examId required' }, { status: 400 });
    }

    try {
        const { data, error } = await db
            .from('exam_questions')
            .select('*')
            .eq('exam_id', examId)
            .order('order_index', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ questions: data || [] });
    } catch (err) {
        console.error('Questions fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

/**
 * POST /api/admin/exams/questions
 * Add or update questions for an exam.
 * Body: { examId, questions: [{ id?, question_text, options, order_index }] }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { examId, questions } = body;

        if (!examId || !questions) {
            return NextResponse.json({ error: 'examId and questions required' }, { status: 400 });
        }

        // Separate new questions from updates
        const toInsert = questions
            .filter((q: { id?: string }) => !q.id)
            .map((q: { question_text: string; options: unknown; order_index?: number }, i: number) => ({
                exam_id: examId,
                question_text: q.question_text,
                options: q.options,
                order_index: q.order_index ?? i,
            }));

        const toUpdate = questions.filter((q: { id?: string }) => q.id);

        // Insert new questions
        if (toInsert.length > 0) {
            const { error } = await db.from('exam_questions').insert(toInsert);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        // Update existing questions
        for (const q of toUpdate) {
            await db
                .from('exam_questions')
                .update({
                    question_text: q.question_text,
                    options: q.options,
                    order_index: q.order_index,
                })
                .eq('id', q.id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Questions update error:', err);
        return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/exams/questions
 * Delete a question. Body: { questionId }
 */
export async function DELETE(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { questionId } = body;

        if (!questionId) {
            return NextResponse.json({ error: 'questionId required' }, { status: 400 });
        }

        const { error } = await db.from('exam_questions').delete().eq('id', questionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Question delete error:', err);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
