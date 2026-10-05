import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing env vars');
    return createClient(url, key, { auth: { persistSession: false } });
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
        const { data: modules } = await admin.from('training_modules').select('*').order('order_index', { ascending: true });
        return NextResponse.json({ modules: modules || [] });
    } catch (err) {
        console.error('Training GET error:', err);
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
        if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 });

        const admin = await getAdminClient();
        const { data: mod, error } = await admin.from('training_modules').insert({
            title: body.title,
            description: body.description || null,
            content: body.content || null,
            video_url: body.videoUrl || null,
            order_index: body.orderIndex || 0,
            is_required: body.isRequired ?? true,
            created_by: user.id,
        }).select().single();

        if (error) return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
        return NextResponse.json({ module: mod });
    } catch (err) {
        console.error('Training POST error:', err);
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
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.videoUrl !== undefined) updateData.video_url = body.videoUrl;
        if (body.isRequired !== undefined) updateData.is_required = body.isRequired;
        if (body.orderIndex !== undefined) updateData.order_index = body.orderIndex;
        if (body.isActive !== undefined) updateData.is_active = body.isActive;

        const { error } = await admin.from('training_modules').update(updateData).eq('id', body.id);
        if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Training PUT error:', err);
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
        await admin.from('training_modules').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Training DELETE error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
