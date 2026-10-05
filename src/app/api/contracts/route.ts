import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/contracts — List contract templates
 * POST /api/contracts — Create new template
 * PUT /api/contracts — Update template
 * DELETE /api/contracts?id=xxx — Delete template
 */

async function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing env vars');
    return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

async function checkAdminRole(userId: string) {
    const admin = await getAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single();
    return profile && ['super_admin', 'hr_admin'].includes(profile.role);
}

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!(await checkAdminRole(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const admin = await getAdminClient();
        const { data: templates } = await admin
            .from('contract_templates')
            .select('*')
            .order('created_at', { ascending: false });

        return NextResponse.json({ templates: templates || [] });
    } catch (err) {
        console.error('Contracts GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!(await checkAdminRole(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        if (!body.title || !body.content) return NextResponse.json({ error: 'title and content required' }, { status: 400 });

        const admin = await getAdminClient();
        const { data: template, error } = await admin
            .from('contract_templates')
            .insert({ title: body.title, content: body.content, created_by: user.id })
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
        return NextResponse.json({ template });
    } catch (err) {
        console.error('Contracts POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!(await checkAdminRole(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const admin = await getAdminClient();
        const updateData: Record<string, unknown> = {};
        if (body.title) updateData.title = body.title;
        if (body.content) updateData.content = body.content;
        if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;

        const { error } = await admin.from('contract_templates').update(updateData).eq('id', body.id);
        if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Contracts PUT error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!(await checkAdminRole(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const admin = await getAdminClient();
        await admin.from('contract_templates').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Contracts DELETE error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
