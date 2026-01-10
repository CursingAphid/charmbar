'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const requestedNext = formData.get('next') as string | null
    const next = requestedNext && requestedNext.startsWith('/') ? requestedNext : '/orders'

    console.log(`🔑 Login action: email="${email}", requestedNext="${requestedNext}", next="${next}"`)

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.log(`❌ Login failed: ${error.message}`)
        return { error: error.message }
    }

    console.log(`✅ Login successful, redirecting to: ${next}`)
    revalidatePath('/', 'layout')
    redirect(next)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const h = await headers()
    const origin = h.get('origin')
    const xfProto = h.get('x-forwarded-proto')
    const xfHost = h.get('x-forwarded-host')
    const derivedOrigin = origin ?? (xfProto && xfHost ? `${xfProto}://${xfHost}` : undefined)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? derivedOrigin

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const requestedNext = formData.get('next') as string | null
    const next = requestedNext && requestedNext.startsWith('/') ? requestedNext : '/orders'

    console.log(`✨ Signup action: next is "${next}" (requested: "${requestedNext}")`)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` : undefined,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.session) {
        revalidatePath('/', 'layout')
        redirect(next)
    }

    // Note: If email confirmation is enabled, the user won't be logged in yet.
    // Ideally, we'd show a "Check your email" message. 
    // For now, we'll just redirect to login if successful or let the UI handle the success state.
    return { success: true }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signInWithGoogle(next?: string) {
    const supabase = await createClient()
    const h = await headers()
    const origin = h.get('origin')
    const xfProto = h.get('x-forwarded-proto')
    const xfHost = h.get('x-forwarded-host')
    const derivedOrigin = origin ?? (xfProto && xfHost ? `${xfProto}://${xfHost}` : undefined)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? derivedOrigin
    const safeNext = next && next.startsWith('/') ? next : '/orders'
    const redirectTo = siteUrl ? `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}` : undefined

    if (!redirectTo) {
        return { error: 'Missing site URL for OAuth redirect. Set NEXT_PUBLIC_SITE_URL or ensure request origin headers are present.' }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}
