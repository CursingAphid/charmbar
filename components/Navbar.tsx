'use client';

import Link from 'next/link';
import { ShoppingCart, Home, Languages } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const cart = useStore((state) => state.cart);
  const cartItemCount = cart.length;
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-2xl"
            >
              ✨
            </motion.div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent truncate max-w-[10.5rem] sm:max-w-none">
              charmbazaar
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/"
              className="h-11 w-11 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 transition-colors"
              title={t('nav.home')}
            >
              <Home className="w-5 h-5" />
            </Link>
            
            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="h-11 w-11 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 transition-colors relative"
                title={t('nav.language')}
                type="button"
              >
                <Languages className="w-5 h-5" />
              </button>
              {showLanguageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setLanguage('nl');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${
                        language === 'nl' ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700'
                      }`}
                      type="button"
                    >
                      🇳🇱 Nederlands
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${
                        language === 'en' ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700'
                      }`}
                      type="button"
                    >
                      🇬🇧 English
                    </button>
                  </motion.div>
                </>
              )}
            </div>
            
            <Link
              href="/cart"
              className="relative h-11 w-11 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 transition-colors"
              title={t('nav.cart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

