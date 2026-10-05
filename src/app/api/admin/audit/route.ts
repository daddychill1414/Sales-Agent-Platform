import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/audit — Fetch audit log entries (super_admin only)
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

        // Super admin only
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const action = searchParams.get('action');

        let query = supabaseAdmin
            .from('audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (action) {
            query = query.eq('action', action);
        }

        if (search) {
            query = query.or(`user_email.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: entries, error } = await query;

        if (error) {
            console.error('Audit fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
        }

        return NextResponse.json({ entries: entries || [] });
    } catch (err) {
        console.error('Audit GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
