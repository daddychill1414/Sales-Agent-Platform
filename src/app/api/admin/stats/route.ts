import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';
import { PIPELINE_STAGES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Returns real-time dashboard statistics from the `applications` table.
 */
export async function GET() {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        // Total applications
        const { count: totalApplications } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true });

        // New (pending initial review)
        const { count: newCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('stage', 'New');

        // Screening Review
        const { count: reviewCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('stage', 'Screening Review');

        // Qualified
        const { count: qualifiedCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('stage', 'Qualified');

        // Hired
        const { count: hiredCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('stage', 'Hired');

        // Rejected + Disqualified
        const { count: rejectedCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('stage', ['Rejected', 'Disqualified', 'Withdrawn']);

        // Interview stage
        const { count: interviewCount } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('stage', ['Interview Scheduled', 'Interview Completed']);

        // Screening qualified rate
        const { count: qualifiedScreening } = await db
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('screening_qualified', true);

        // Pipeline data per stage
        const pipeline: Record<string, number> = {};
        for (const stage of PIPELINE_STAGES) {
            const { count } = await db
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('stage', stage);
            pipeline[stage] = count || 0;
        }

        // Recent applications (last 10)
        const { data: recentApplicants } = await db
            .from('applications')
            .select('id, tracking_code, first_name, last_name, email, stage, screening_qualified, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        // Recent audit log entries (last 10)
        const { data: recentActivity } = await db
            .from('audit_log')
            .select('id, user_email, action, description, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        const total = totalApplications || 0;

        return NextResponse.json({
            totalApplicants: total,
            pendingReview: (newCount || 0) + (reviewCount || 0),
            qualified: qualifiedCount || 0,
            hiredAgents: hiredCount || 0,
            rejected: rejectedCount || 0,
            interviewStage: interviewCount || 0,
            screeningPassRate: total > 0
                ? ((qualifiedScreening || 0) / total * 100).toFixed(1)
                : '0.0',
            conversionRate: total > 0
                ? ((hiredCount || 0) / total * 100).toFixed(1)
                : '0.0',
            recentApplicants: (recentApplicants || []).map(a => ({
                ...a,
                name: `${a.first_name} ${a.last_name}`,
                full_name: `${a.first_name} ${a.last_name}`,
            })),
            pipeline,
            recentActivity: recentActivity || [],
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
