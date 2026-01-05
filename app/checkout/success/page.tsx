'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

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
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4"
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
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Shop More
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

