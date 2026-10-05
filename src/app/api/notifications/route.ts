import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/notifications
 * Returns the current user's notifications.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const unreadCount = (data || []).filter(n => !n.read).length;

        return NextResponse.json({ notifications: data || [], unreadCount });
    } catch (err) {
        console.error('Notifications fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read. Body: { id } or { all: true }
 */
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (body.all) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);
        } else if (body.id) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', body.id)
                .eq('user_id', user.id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Notifications update error:', err);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
