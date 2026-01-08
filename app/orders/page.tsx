import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersList from '@/components/OrdersList'

export default async function OrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
        return (
            <div className="min-h-screen pt-24 px-4 flex justify-center text-red-500">
                Failed to load orders.
            </div>
        )
    }

    // Cast the json items to any to bypass strict type check for now, 
    // the component will validate structure
    return <OrdersList orders={orders as any[]} />
}
