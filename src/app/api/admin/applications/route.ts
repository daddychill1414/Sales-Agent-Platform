import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';

/**
 * GET /api/admin/applications — Fetch all applications (admin view, from `applications` table)
 * PATCH /api/admin/applications — Update application stage
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Server error' }, { status: 500 });

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        // Check staff role
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const stage = searchParams.get('stage');
        const search = searchParams.get('search');
        const id = searchParams.get('id');

        // Single application detail
        if (id) {
            const { data: app, error } = await supabaseAdmin
                .from('applications')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
            return NextResponse.json({ application: app });
        }

        // List applications
        let query = supabaseAdmin
            .from('applications')
            .select('id, tracking_code, first_name, last_name, email, phone, stage, screening_qualified, screening_flags, resume_url, applied_position_id, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (stage && stage !== 'All') {
            query = query.eq('stage', stage);
        }

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tracking_code.ilike.%${search}%`);
        }

        const { data: applications, error } = await query;

        if (error) {
            console.error('Fetch applications error:', error);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        return NextResponse.json({ applications: applications || [] });
    } catch (err) {
        console.error('Admin applications GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Server error' }, { status: 500 });

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        const { data: profile } = await supabaseAdmin.from('profiles').select('role, first_name, last_name').eq('id', user.id).single();
        if (!profile || !['super_admin', 'hr_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden — only admins can update applications' }, { status: 403 });
        }

        const body = await request.json();
        const { applicationId, stage } = body;

        if (!applicationId || !stage) {
            return NextResponse.json({ error: 'applicationId and stage required' }, { status: 400 });
        }

        // Fetch current application for audit
        const { data: currentApp } = await supabaseAdmin
            .from('applications')
            .select('stage, first_name, last_name, email')
            .eq('id', applicationId)
            .single();

        const { error: updateError } = await supabaseAdmin
            .from('applications')
            .update({ stage })
            .eq('id', applicationId);

        if (updateError) {
            console.error('Update application error:', updateError);
            return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
        }

        // Log audit event
        await logAuditEvent({
            userId: user.id,
            userEmail: user.email || undefined,
            userRole: profile.role,
            action: 'stage_change',
            description: `${profile.first_name} ${profile.last_name} changed ${currentApp?.first_name} ${currentApp?.last_name}'s stage from "${currentApp?.stage}" to "${stage}"`,
            targetType: 'application',
            targetId: applicationId,
            metadata: { from_stage: currentApp?.stage, to_stage: stage },
        });

        // Auto-add a system note
        await supabaseAdmin.from('evaluation_notes').insert({
            application_id: applicationId,
            author_id: user.id,
            content: `Stage changed from "${currentApp?.stage}" to "${stage}"`,
            note_type: 'system',
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin applications PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
