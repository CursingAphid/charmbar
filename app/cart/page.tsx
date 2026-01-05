'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Navbar from '@/components/Navbar';
import CartItem from '@/components/CartItem';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const cart = useStore((state) => state.cart);
  const getCartTotal = useStore((state) => state.getCartTotal);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start building your perfect charm bracelet!</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Bracelets
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Your Cart
              </h1>
              <p className="text-gray-600 mt-1">
                {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="space-y-6 mb-8">
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CartItem cartItem={item} />
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky bottom-4"
          >
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Subtotal:</span>
                <span className="font-semibold text-gray-900">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-pink-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => router.push('/checkout')}
              fullWidth
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

