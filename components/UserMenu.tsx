'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, LogOut, Package, ChevronDown, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { signout } from '@/app/actions/auth'
import { useLanguage } from '@/contexts/LanguageContext'
import { useStore } from '@/store/useStore'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserMenuProps {
    user: SupabaseUser
}

export function UserMenu({ user }: UserMenuProps) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const clearSelection = useStore((state) => state.clearSelection)
    const clearCart = useStore((state) => state.clearCart)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-stone-200/50 hover:bg-white/80 transition-all group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-900 shadow-sm">
                    {user.user_metadata?.full_name ? (
                        <span className="text-xs font-bold">
                            {user.user_metadata.full_name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <User className="w-4 h-4" />
                    )}
                </div>
                <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900 hidden sm:block max-w-[100px] truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden z-50 p-1"
                    >
                        <div className="px-4 py-3 border-b border-stone-100">
                            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Signed in as</p>
                            <p className="text-sm text-stone-800 font-medium truncate">{user.email}</p>
                        </div>

                        <div className="py-1">
                            <Link
                                href="/orders"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {t('menu.orders')}
                            </Link>
                        </div>

                        <div className="border-t border-stone-100 pt-1 mt-1">
                            <button
                                onClick={async () => {
                                    setIsOpen(false)
                                    // Clear client-side state before signing out
                                    clearSelection()
                                    clearCart()
                                    await signout()
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                {t('menu.signout')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
