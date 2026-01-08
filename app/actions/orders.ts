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

    // 2. Insert order
    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            items: items,
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
