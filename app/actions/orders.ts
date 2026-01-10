'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function placeOrder(items: any[], totalAmount: number) {
    const supabase = await createClient()

    // 1. Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to place an order.' }
    }

    const orderPreviewUrl =
        Array.isArray(items)
            ? (items.find((it) => typeof it?.previewImage === 'string' && it.previewImage.length > 0)?.previewImage ?? null)
            : null

    // Store a minimal, stable snapshot in `orders.items`:
    // - keep bracelet + charms
    // - drop previewImage + charmPositions (preview is stored in orders.preview_url)
    const orderItemsSnapshot =
        Array.isArray(items)
            ? items.map((it) => ({
                id: it?.id,
                bracelet: it?.bracelet,
                charms: it?.charms,
            }))
            : []

    // 2. Insert order (store order-level preview_url + keep legacy `items` snapshot)
    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            items: orderItemsSnapshot,
            preview_url: orderPreviewUrl,
            total_amount: totalAmount,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        console.error('Error placing order:', error)
        return { error: 'Failed to place order. Please try again.' }
    }

    // 3. Revalidate and Redirect
    revalidatePath('/orders')

    return { success: true, orderId: data.id }
}
