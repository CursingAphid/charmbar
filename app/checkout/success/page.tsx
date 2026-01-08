'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen">

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] bg-clip-text text-transparent mb-4"
          >
            Order Confirmed!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 mb-8"
          >
            Thank you for your purchase! Your order has been received and we&apos;ll send you a
            confirmation email shortly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-row gap-2 justify-center"
          >
            <Link href="/">
              <Button variant="primary" size="md" className="flex flex-col items-center gap-1 px-3 py-2 text-sm sm:flex-row sm:gap-2 sm:px-6 sm:py-4 sm:text-base sm:size-lg">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-center sm:text-left">
                  <span className="sm:hidden">Back to<br /></span>
                  <span className="hidden sm:inline">Back to </span>
                  Home
                </span>
              </Button>
            </Link>
            <Link href="/charms">
              <Button variant="outline" size="md" className="flex flex-col items-center gap-1 px-3 py-2 text-sm sm:flex-row sm:gap-2 sm:px-6 sm:py-4 sm:text-base sm:size-lg">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-center sm:text-left">
                  <span className="sm:hidden">Shop<br /></span>
                  <span className="hidden sm:inline">Shop </span>
                  More
                </span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

