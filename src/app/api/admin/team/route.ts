import { NextResponse } from 'next/server';
import { verifyAdmin, createAdminClient } from '@/lib/admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('search');

        // Only super_admin can view the specific team configuration board
        const authCheck = await verifyAdmin(['super_admin']);
        if (authCheck instanceof NextResponse) return authCheck;

        const adminDb = createAdminClient();
        
        let query = adminDb
            .from('profiles')
            .select('id, email, first_name, last_name, role, created_at')
            .order('created_at', { ascending: false });

        if (searchQuery) {
            // If searching, allow retrieving standard users (applicant, agent) to promote them
            query = query.ilike('email', `%${searchQuery}%`).limit(10);
        } else {
            // Default view: only show staff roles
            query = query.in('role', ['super_admin', 'hr_admin', 'screener']);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ team: data });
    } catch (error: any) {
        console.error('API /admin/team GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const authCheck = await verifyAdmin(['super_admin']);
        if (authCheck instanceof NextResponse) return authCheck;

        const body = await req.json();
        const { userId, newRole } = body;

        if (!userId || !newRole) {
            return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 });
        }

        // Validate allowed roles
        const validRoles = ['applicant', 'agent', 'screener', 'hr_admin', 'super_admin'];
        if (!validRoles.includes(newRole)) {
            return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
        }

        const adminDb = createAdminClient();

        // Optional safety check: Prevent demoting the last super_admin
        if (newRole !== 'super_admin') {
            const { data: supers } = await adminDb.from('profiles').select('id').eq('role', 'super_admin');
            if (supers && supers.length === 1 && supers[0].id === userId) {
                return NextResponse.json({ error: 'Cannot demote the last remaining super_admin' }, { status: 403 });
            }
        }

        // Apply new role via service role
        const { error } = await adminDb
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        // Log the action dynamically assuming the current user performs it
        const currentAdminId = authCheck.userId;
        await adminDb.from('audit_logs').insert({
            actor_id: currentAdminId,
            action: 'USER_ROLE_CHANGED',
            target_id: userId,
            details: { newRole }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API /admin/team PATCH error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
