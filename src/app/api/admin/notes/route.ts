import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/notes?applicationId=xxx — Fetch notes for an application
 * POST /api/admin/notes — Add a new note
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
        const applicationId = searchParams.get('applicationId');
        if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 });

        const { data: notes, error } = await supabaseAdmin
            .from('evaluation_notes')
            .select('id, content, note_type, created_at, author_id')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });

        // Enrich with author names
        const authorIds = [...new Set((notes || []).map(n => n.author_id).filter(Boolean))];
        let authorMap: Record<string, string> = {};
        if (authorIds.length > 0) {
            const { data: authors } = await supabaseAdmin
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', authorIds);
            if (authors) {
                authorMap = Object.fromEntries(authors.map(a => [a.id, `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Staff']));
            }
        }

        return NextResponse.json({
            notes: (notes || []).map(n => ({
                ...n,
                authorName: n.author_id ? (authorMap[n.author_id] || 'Staff') : 'System',
            })),
        });
    } catch (err) {
        console.error('Notes GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Server error' }, { status: 500 });

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !['super_admin', 'hr_admin', 'screener'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        if (!body.applicationId || !body.content) {
            return NextResponse.json({ error: 'applicationId and content required' }, { status: 400 });
        }

        const { data: note, error } = await supabaseAdmin
            .from('evaluation_notes')
            .insert({
                application_id: body.applicationId,
                author_id: user.id,
                content: body.content,
                note_type: body.noteType || 'general',
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });

        return NextResponse.json({ note });
    } catch (err) {
        console.error('Notes POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
