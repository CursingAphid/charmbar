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

    // #region agent log (H4,H5)
    fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H4', location: 'app/actions/orders.ts:placeOrder', message: 'placeOrder called', data: { userPresent: !!user, itemsCount: Array.isArray(items) ? items.length : -1, itemsWithPreviewImage: Array.isArray(items) ? items.filter((it) => !!it?.previewImage).length : -1, totalAmount }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion

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
        // #region agent log (H4,H5)
        fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H5', location: 'app/actions/orders.ts:placeOrder', message: 'placeOrder insert failed', data: { hasError: !!error, errorCode: (error as any)?.code, errorMessage: (error as any)?.message }, timestamp: Date.now() }) }).catch(() => { });
        // #endregion
        return { error: 'Failed to place order. Please try again.' }
    }

    // 3. Revalidate and Redirect
    revalidatePath('/orders')

    // #region agent log (H4,H5)
    fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H5', location: 'app/actions/orders.ts:placeOrder', message: 'placeOrder insert ok', data: { orderIdPrefix: String(data?.id || '').slice(0, 8) }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion

    return { success: true, orderId: data.id }
}
