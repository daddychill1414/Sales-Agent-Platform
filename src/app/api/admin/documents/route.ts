import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

/**
 * GET /api/admin/documents
 * Pulls all resumes tied to applications and groups them by job position.
 */
export async function GET() {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        // Query applications that have a resume
        const { data: apps, error: appError } = await db
            .from('applications')
            .select('id, first_name, last_name, resume_url, created_at, applied_position_id')
            .not('resume_url', 'is', null)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('App fetch error:', appError);
            return NextResponse.json({ error: appError.message }, { status: 500 });
        }

        // Manually fetch job titles to avoid missing foreign key relation errors
        const positionIds = [...new Set((apps || []).map(a => a.applied_position_id).filter(Boolean))];
        const { data: jobs } = await db
            .from('job_positions')
            .select('id, title')
            .in('id', positionIds);

        const jobMap: Record<string, string> = {};
        if (jobs) {
            jobs.forEach(j => { jobMap[j.id] = j.title; });
        }

        const documents = (apps || []).map(app => ({
            id: app.id,
            name: `${app.first_name} ${app.last_name} - Resume.pdf`,
            fullPath: app.resume_url, // For this usage, the download URL is the full path
            size: 0, 
            type: 'application/pdf',
            createdAt: app.created_at,
            ownerName: `${app.first_name} ${app.last_name}`.trim(),
            ownerId: app.id,
            downloadUrl: app.resume_url,
            jobTitle: app.applied_position_id ? (jobMap[app.applied_position_id] || 'Unknown Job Position') : 'General Application',
        }));

        return NextResponse.json({ documents });
    } catch (err) {
        console.error('Documents fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/documents
 * Delete a file from storage. Body: { fullPath }
 */
export async function DELETE(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { fullPath } = body;

        if (!fullPath) {
            return NextResponse.json({ error: 'fullPath required' }, { status: 400 });
        }

        const { error } = await db.storage
            .from('resumes')
            .remove([fullPath]);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Document delete error:', err);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
