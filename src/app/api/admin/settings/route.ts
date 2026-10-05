import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { verifyAdmin } from '@/lib/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        // Since settings are public, anyone can read them
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ settings: null }); // No settings yet
            }
            throw error;
        }

        return NextResponse.json({ settings: data });
    } catch (error) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();

        // Only admins can update settings -> in a larger prod environment, verify super_admin specifically
        const adminCheck = await verifyAdmin();
        if (adminCheck instanceof NextResponse) {
            return adminCheck;
        }

        const body = await req.json();

        // Verify if a settings row exists first
        const { data: existing } = await supabase.from('platform_settings').select('id').single();

        let error;
        if (existing) {
            const res = await supabase
                .from('platform_settings')
                .update({ ...body, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('platform_settings')
                .insert([{ ...body }]);
            error = res.error;
        }

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
