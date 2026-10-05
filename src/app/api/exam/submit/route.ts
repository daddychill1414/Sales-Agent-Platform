import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/lib/admin';

/**
 * POST /api/exam/submit
 * Applicant submits exam answers. Auto-calculates score.
 * Body: { examId, applicantExamId, answers: { questionId: selectedOptionText } }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { examId, applicantExamId, answers } = body;

        if (!examId || !answers) {
            return NextResponse.json({ error: 'examId and answers required' }, { status: 400 });
        }

        const db = createAdminClient();

        // Fetch questions for this exam
        const { data: questions, error: qError } = await db
            .from('exam_questions')
            .select('id, options')
            .eq('exam_id', examId);

        if (qError || !questions) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Calculate score
        let correct = 0;
        const total = questions.length;

        for (const question of questions) {
            const userAnswer = answers[question.id];
            if (!userAnswer) continue;

            // Find the correct option
            const options = question.options as Array<{ text: string; isCorrect?: boolean }>;
            const correctOption = options.find(o => o.isCorrect);
            
            if (correctOption && userAnswer === correctOption.text) {
                correct++;
            }
        }

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        const passed = score >= 70; // 70% passing threshold

        // Update applicant_exams record
        const targetId = applicantExamId || undefined;
        let updateQuery;

        if (targetId) {
            updateQuery = db
                .from('applicant_exams')
                .update({
                    score,
                    status: passed ? 'Passed' : 'Failed',
                    answers,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', targetId);
        } else {
            updateQuery = db
                .from('applicant_exams')
                .update({
                    score,
                    status: passed ? 'Passed' : 'Failed',
                    answers,
                    completed_at: new Date().toISOString(),
                })
                .eq('applicant_id', user.id)
                .eq('exam_id', examId);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
            console.error('Exam update error:', updateError);
            return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
        }

        // Update applicant stage
        await db
            .from('profiles')
            .update({ stage: 'Exam Completed' })
            .eq('id', user.id);

        // Create notification
        await db.from('notifications').insert({
            user_id: user.id,
            title: passed ? 'Exam Passed! 🎉' : 'Exam Results Available',
            message: `You scored ${score}% on your assessment. ${passed ? 'Congratulations!' : 'Please contact our team for next steps.'}`,
            type: passed ? 'success' : 'info',
            link: '/dashboard',
        });

        return NextResponse.json({
            success: true,
            score,
            passed,
            correct,
            total,
        });
    } catch (err) {
        console.error('Exam submit error:', err);
        return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
    }
}
