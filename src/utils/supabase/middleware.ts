import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Public routes (don't require auth)
    const isPublicRoute = path === '/' ||
        path.startsWith('/careers') ||
        path.startsWith('/apply') ||
        path.startsWith('/news') ||
        path.startsWith('/terms') ||
        path.startsWith('/privacy') ||
        path.startsWith('/login') ||
        path.startsWith('/api/job-positions') ||
        path.startsWith('/api/user-role') ||
        path.startsWith('/api/screening') ||
        path.startsWith('/api/applications') ||
        path.startsWith('/api/upload-resume') ||
        path.startsWith('/api/application-fields') ||
        path.startsWith('/track') ||
        path.startsWith('/api/track');

    // Prevent logged-in users from seeing login
    if (user && path.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/portal'
        return NextResponse.redirect(url)
    }

    // Prevent non-logged-in users from accessing protected portals
    if (!user && !isPublicRoute && !path.startsWith('/_next') && !path.startsWith('/favicon.ico')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
