import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/screening — Fetch screening questions
 * Public: returns only active questions with limited fields
 * Admin (?includeInactive=true): returns ALL questions with full fields
 */export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
        }

        // If admin mode, verify the calling user is staff
        if (includeInactive) {
            const supabase = await createServerClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            // Return ALL questions with full data for admins for this job
            const { data: questions, error } = await supabaseAdmin
                .from('screening_questions')
                .select('*')
                .eq('job_id', jobId)
                .order('order_index', { ascending: true });

            if (error) {
                console.error('Fetch screening questions (admin) error:', error);
                return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
            }

            return NextResponse.json({ questions: questions || [] });
        }

        // Public mode: stripped fields for this job
        const { data: questions, error } = await supabaseAdmin
            .from('screening_questions')
            .select('id, question_text, question_type, options, is_required, order_index')
            .eq('is_active', true)
            .eq('job_id', jobId)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Fetch screening questions error:', error);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // NOTE: We do NOT return qualifying_answers or priority to the public
        // Those are internal — used by the server to evaluate silently
        return NextResponse.json({ questions: questions || [] });
    } catch (err) {
        console.error('Screening route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/screening — Create a new screening question (admin/screener only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check role
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const { data: question, error } = await supabaseAdmin
            .from('screening_questions')
            .insert({
                job_id: body.jobId,
                question_text: body.questionText,
                question_type: body.questionType || 'yes_no',
                options: body.options || [],
                qualifying_answers: body.qualifyingAnswers || [],
                priority: body.priority || 'info',
                is_required: body.isRequired ?? true,
                order_index: body.orderIndex ?? 0,
                is_active: true,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Create screening question error:', error);
            return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
        }

        return NextResponse.json({ question });
    } catch (err) {
        console.error('Screening POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/screening — Update a screening question (admin/screener only)
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('screening_questions')
            .update({
                question_text: body.questionText,
                question_type: body.questionType,
                options: body.options,
                qualifying_answers: body.qualifyingAnswers,
                priority: body.priority,
                is_required: body.isRequired,
                order_index: body.orderIndex,
                is_active: body.isActive,
            })
            .eq('id', body.id);

        if (error) {
            console.error('Update screening question error:', error);
            return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Screening PUT error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/screening — Soft-delete a screening question (set is_active = false)
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const questionId = searchParams.get('id');

        if (!questionId) {
            return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('screening_questions')
            .update({ is_active: false })
            .eq('id', questionId);

        if (error) {
            console.error('Delete screening question error:', error);
            return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Screening DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
