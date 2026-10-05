import { createClient } from '@supabase/supabase-js';

/**
 * Log an audit event. Called from API routes on every admin action.
 * Uses service role key to bypass RLS.
 */
export interface AuditEventOptions {
    userId: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    description: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}

export async function logAuditEvent(options: AuditEventOptions): Promise<void> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.warn('[Audit] Missing env vars, skipping audit log.');
            return;
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        await supabaseAdmin.from('audit_log').insert({
            user_id: options.userId,
            user_email: options.userEmail || null,
            user_role: options.userRole || null,
            action: options.action,
            description: options.description,
            target_type: options.targetType || null,
            target_id: options.targetId || null,
            metadata: options.metadata || {},
            ip_address: options.ipAddress || null,
        });
    } catch (err) {
        // Never let audit logging crash the main request
        console.error('[Audit] Failed to log event:', err);
    }
}
