'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import CartItem from '@/components/CartItem';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const cart = useStore((state) => state.cart);
  const getCartTotal = useStore((state) => state.getCartTotal);
  const { t } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
            <p className="text-gray-600 mb-8">{t('cart.empty.description')}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('cart.browse')}
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Bottom padding on mobile so the fixed checkout bar never covers content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] bg-clip-text text-transparent">
                {t('cart.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {cart.length} {t('cart.items_count')}
              </p>
            </div>
            <Link href="/charms">
              <Button size="sm" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('cart.empty.button')}
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
            className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm sm:sticky sm:bottom-4 z-30"
          >
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">{t('cart.subtotal')}:</span>
                <span className="font-semibold text-gray-900">€{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('cart.shipping')}:</span>
                <span>{t('cart.shipping.calculated')}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="text-xl font-bold text-gray-900">{t('cart.total')}:</span>
                <span className="text-xl font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">
                  €{getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => router.push('/checkout')}
              fullWidth
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              {t('cart.checkout')}
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Mobile fixed checkout bar (keeps CTA reachable) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">€{getCartTotal().toFixed(2)}</p>
            <p className="text-xs text-gray-600 truncate">{t('cart.total')}</p>
          </div>
          <Button
            onClick={() => router.push('/checkout')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {t('cart.checkout')}
            <ShoppingBag className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

