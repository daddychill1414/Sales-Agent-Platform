import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, applicationReceivedEmail } from '@/lib/email';

/**
 * Generates a tracking code: ONX-YYYY-NNNN
 */
function generateTrackingCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ONX-${year}-${random}`;
}

/**
 * Evaluate screening responses against the screening questions.
 * Returns { qualified, flags } where flags list the reasons for disqualification.
 */
function evaluateScreening(
    responses: Record<string, string>,
    questions: Array<{
        id: string;
        question_text: string;
        qualifying_answers: string[];
        priority: string;
    }>
): { qualified: boolean; flags: Array<{ questionId: string; question: string; answer: string; priority: string }> } {
    const flags: Array<{ questionId: string; question: string; answer: string; priority: string }> = [];
    let qualified = true;

    for (const q of questions) {
        const answer = responses[q.id];
        if (!answer) continue;

        // If qualifying_answers is empty, it's an INFO question — no filtering
        if (!q.qualifying_answers || q.qualifying_answers.length === 0) continue;

        const isQualifying = q.qualifying_answers.includes(answer);
        if (!isQualifying) {
            flags.push({
                questionId: q.id,
                question: q.question_text,
                answer,
                priority: q.priority,
            });

            // Only CRITICAL flags auto-disqualify
            if (q.priority === 'critical') {
                qualified = false;
            }
        }
    }

    return { qualified, flags };
}

/**
 * POST /api/applications — Submit a new application (no auth required)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            firstName,
            lastName,
            email,
            phone,
            workExperience,
            salesBackground,
            screeningResponses,
            appliedPositionId,
            termsAccepted,
            privacyAccepted,
            customData,
            resumeUrl,
        } = body;

        // Basic validation
        if (!firstName || !lastName || !email) {
            return NextResponse.json(
                { error: 'First name, last name, and email are required' },
                { status: 400 }
            );
        }

        if (!termsAccepted || !privacyAccepted) {
            return NextResponse.json(
                { error: 'You must accept the Terms of Service and Privacy Policy' },
                { status: 400 }
            );
        }

        // Create admin Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        // Generate unique tracking code
        let trackingCode = generateTrackingCode();
        let attempts = 0;
        while (attempts < 10) {
            const { data: existing } = await supabase
                .from('applications')
                .select('id')
                .eq('tracking_code', trackingCode)
                .single();

            if (!existing) break;
            trackingCode = generateTrackingCode();
            attempts++;
        }

        // Evaluate screening responses
        let screeningQualified: boolean | null = null;
        let screeningFlags: Array<{ questionId: string; question: string; answer: string; priority: string }> = [];

        if (screeningResponses && Object.keys(screeningResponses).length > 0) {
            // Fetch the screening questions to evaluate against
            const { data: questions } = await supabase
                .from('screening_questions')
                .select('id, question_text, qualifying_answers, priority')
                .eq('is_active', true);

            if (questions) {
                const evaluation = evaluateScreening(screeningResponses, questions);
                screeningQualified = evaluation.qualified;
                screeningFlags = evaluation.flags;
            }
        }

        // Insert the application
        const { data: application, error: insertError } = await supabase
            .from('applications')
            .insert({
                tracking_code: trackingCode,
                first_name: firstName,
                last_name: lastName,
                email,
                phone: phone || null,
                work_experience: workExperience || null,
                sales_background: salesBackground || null,
                resume_url: resumeUrl || null,
                screening_responses: screeningResponses || {},
                custom_data: customData || {},
                screening_qualified: screeningQualified,
                screening_flags: screeningFlags,
                applied_position_id: appliedPositionId || null,
                terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
                privacy_accepted_at: privacyAccepted ? new Date().toISOString() : null,
                stage: 'New',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Application insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to submit application' },
                { status: 500 }
            );
        }

        // Fetch job title if applicable
        let positionTitle = 'General Position';
        if (appliedPositionId) {
            const { data: jobInfo } = await supabase
                .from('job_positions')
                .select('title')
                .eq('id', appliedPositionId)
                .single();
            if (jobInfo) {
                positionTitle = jobInfo.title;
            }
        }

        // Send confirmation email (non-blocking)
        const emailTemplate = applicationReceivedEmail(`${firstName} ${lastName}`, trackingCode, positionTitle);
        emailTemplate.to = email;
        sendEmail(emailTemplate).catch(err => console.error('[Email] Failed:', err));

        return NextResponse.json({
            success: true,
            trackingCode,
            applicationId: application.id,
        });
    } catch (err) {
        console.error('Application route error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/applications — Fetch applications (with optional tracking code/email query for public tracking)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const trackingCode = searchParams.get('trackingCode');
        const email = searchParams.get('email');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        // Public tracking: return limited data only
        if (trackingCode || email) {
            let query = supabase
                .from('applications')
                .select('tracking_code, first_name, stage, created_at, applied_position_id');

            if (trackingCode) {
                query = query.eq('tracking_code', trackingCode.toUpperCase());
            } else if (email) {
                query = query.eq('email', email.toLowerCase());
            }

            const { data, error } = await query;

            if (error) {
                return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
            }

            // Only return safe, public-facing fields
            return NextResponse.json({
                applications: (data || []).map(app => ({
                    trackingCode: app.tracking_code,
                    name: app.first_name,
                    stage: app.stage,
                    appliedAt: app.created_at,
                })),
            });
        }

        // No public query — reject
        return NextResponse.json(
            { error: 'Please provide a tracking code or email' },
            { status: 400 }
        );
    } catch (err) {
        console.error('Applications GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
