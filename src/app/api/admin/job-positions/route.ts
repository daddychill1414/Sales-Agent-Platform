import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/job-positions
 * List all job positions with applicant counts.
 */
export async function GET() {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const { data, error } = await db
            .from('job_positions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Count applicants per position
        const enriched = await Promise.all(
            (data || []).map(async (pos) => {
                const { count } = await db
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('applied_position_id', pos.id);

                return { ...pos, applicantCount: count || 0 };
            })
        );

        return NextResponse.json({ positions: enriched });
    } catch (err) {
        console.error('Job positions fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}

/**
 * POST /api/admin/job-positions
 * Create a new job position.
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { title, department, location, type, description, requirements, benefits, salary_range } = body;

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('job_positions')
            .insert({
                title, department, location, type, description,
                requirements: requirements || [],
                benefits: benefits || [],
                salary_range: salary_range || null,
                active: true,
                created_by: auth.userId,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await db.from('activity_log').insert({
            actor_id: auth.userId,
            action: 'job_position_created',
            target_type: 'job_position',
            target_id: data.id,
            metadata: { title },
        });

        return NextResponse.json({ success: true, position: data });
    } catch (err) {
        console.error('Job position create error:', err);
        return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/job-positions
 * Update a job position. Body: { id, ...fields }
 */
export async function PUT(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Position id required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('job_positions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, position: data });
    } catch (err) {
        console.error('Job position update error:', err);
        return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/job-positions
 * Delete a job position. Body: { id }
 */
export async function DELETE(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Position id required' }, { status: 400 });
        }

        const { error } = await db.from('job_positions').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Job position delete error:', err);
        return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
    }
}
