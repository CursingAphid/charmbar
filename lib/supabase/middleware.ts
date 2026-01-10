import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Refresh auth session cookies if needed
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    // Protect editor + purchase flows: only authenticated users can access these routes
    const pathname = request.nextUrl.pathname
    const isProtected =
        pathname.startsWith('/charms') ||
        pathname.startsWith('/cart') ||
        pathname.startsWith('/checkout')

    if (isProtected && !user) {
        const redirectUrl = request.nextUrl.clone()

        // Special interstitial for editor flow
        if (pathname.startsWith('/charms')) {
            redirectUrl.pathname = '/get-started'
            redirectUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        } else {
            // Standard redirect to login for other protected routes
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        }

        return NextResponse.redirect(redirectUrl)
    }

    return response
}
