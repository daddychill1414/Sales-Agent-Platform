import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
        }

        // Fetch all fields for this job
        const { data: fields, error } = await supabaseAdmin
            .from('custom_application_fields')
            .select('*')
            .eq('job_id', jobId)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Fetch custom fields error:', error);
            return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
        }

        return NextResponse.json({ fields: fields || [] });
    } catch (err) {
        console.error('Custom fields route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false } });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        
        // Ensure the fields are synchronized identically
        // First delete old fields for this job to do a full sync
        await supabaseAdmin.from('custom_application_fields').delete().eq('job_id', body.jobId);

        if (body.fields && body.fields.length > 0) {
            const inserts = body.fields.map((f: any, idx: number) => ({
                job_id: body.jobId,
                field_label: f.fieldLabel,
                field_name: f.fieldName,
                field_type: f.fieldType,
                section: f.section || 'personal_details',
                is_required: f.isRequired ?? false,
                order_index: idx
            }));

            const { error: insertError } = await supabaseAdmin
                .from('custom_application_fields')
                .insert(inserts);

            if (insertError) {
                console.error('Insert fields error:', insertError);
                return NextResponse.json({ error: 'Failed to save fields' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Custom fields POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
