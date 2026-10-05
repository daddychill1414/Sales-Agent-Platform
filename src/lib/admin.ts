import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Creates a Supabase admin client using the service role key.
 * Bypasses all RLS policies — use only in trusted server-side API routes.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });
}

/**
 * Verifies the current request is from an admin user.
 * Returns the user ID if admin, or a 401/403 NextResponse if not.
 */
export async function verifyAdmin(allowedRoles: string[] = ['super_admin', 'hr_admin', 'screener']): Promise<{ userId: string } | NextResponse> {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !allowedRoles.includes(profile.role)) {
        return NextResponse.json({ error: `Forbidden: Requires one of ${allowedRoles.join(', ')}` }, { status: 403 });
    }

    return { userId: user.id };
}
