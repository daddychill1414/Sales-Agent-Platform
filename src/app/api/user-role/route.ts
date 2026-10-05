import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/user-role
 * Returns the authenticated user's role from the profiles table.
 * Uses the service role key to bypass RLS.
 * 
 * Auto-promotes the SUPER_ADMIN_EMAIL to 'super_admin' on first login.
 */
export async function GET() {
    try {
        // Get current auth user via the regular server client
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ role: null }, { status: 401 });
        }

        // Use admin client (service role) to read profile — bypasses RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            return NextResponse.json({ role: profile?.role || 'applicant' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const currentRole = profile?.role || 'applicant';

        // Auto-promote SUPER_ADMIN_EMAIL to super_admin on first access
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        if (
            superAdminEmail &&
            user.email?.toLowerCase() === superAdminEmail.toLowerCase() &&
            currentRole === 'applicant'
        ) {
            await supabaseAdmin
                .from('profiles')
                .update({ role: 'super_admin' })
                .eq('id', user.id);

            return NextResponse.json({ role: 'super_admin' });
        }

        return NextResponse.json({ role: currentRole });
    } catch (err) {
        console.error('User role check error:', err);
        return NextResponse.json({ role: 'applicant' }, { status: 500 });
    }
}
