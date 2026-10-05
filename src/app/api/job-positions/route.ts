import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/job-positions
 * Public endpoint — returns all active job positions for the careers page.
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('job_positions')
            .select('id, title, department, location, type, description, requirements, benefits, salary_range, created_at')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ positions: data || [] });
    } catch (err) {
        console.error('Public job positions error:', err);
        return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}
