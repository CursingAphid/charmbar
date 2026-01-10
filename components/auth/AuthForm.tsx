'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, signup, signInWithGoogle } from '@/app/actions/auth'
import { Loader2, Mail, Lock, User, Github, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import Button from '@/components/ui/Button'

export function AuthForm({ next }: { next?: string }) {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const safeNext = next && next.startsWith('/') ? next : '/orders'

    const { t } = useLanguage()

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            if (isLogin) {
                const result = await login(formData)
                if (result?.error) {
                    setError(t('auth.error')) // Use translated generic error or backend error if appropriate
                    setIsLoading(false)
                }
            } else {
                const result = await signup(formData)
                if (result?.error) {
                    setError(t('auth.error'))
                    setIsLoading(false)
                } else if (result?.success) {
                    setSuccessMessage(t('auth.success'))
                    setIsLoading(false)
                }
            }
        } catch (e) {
            setError(t('auth.error'))
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        await signInWithGoogle(safeNext)
    }

    return (
        <div className="w-full max-w-md mx-auto p-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-stone-800 mb-2">
                        {isLogin ? t('auth.welcome') : t('auth.join')}
                    </h2>
                    <p className="text-stone-500 font-medium">
                        {isLogin
                            ? t('auth.signin.desc')
                            : t('auth.signup.desc')}
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-700 font-medium py-3 px-4 rounded-xl border border-stone-200 shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="group-hover:text-stone-900">{t('auth.google')}</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-stone-400">{t('auth.or')}</span>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="next" value={safeNext} />
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                            <input
                                name="fullName"
                                type="text"
                                placeholder={t('auth.fullname')}
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-300 text-stone-700 bg-stone-50/50"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                            name="email"
                            type="email"
                            placeholder={t('auth.email')}
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-300 text-stone-700 bg-stone-50/50"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                            name="password"
                            type="password"
                            placeholder={t('auth.password')}
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-300 text-stone-700 bg-stone-50/50"
                        />
                    </div>

                    <AnimatePresence mode='wait'>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-green-50 text-green-600 text-sm p-3 rounded-xl text-center"
                            >
                                {successMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        fullWidth
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLogin ? t('auth.submit.signin') : t('auth.submit.signup')}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError(null)
                            setSuccessMessage(null)
                        }}
                        className="text-stone-500 hover:text-amber-600 text-sm font-medium transition-colors"
                    >
                        {isLogin
                            ? t('auth.toggle.signup')
                            : t('auth.toggle.signin')}
                    </button>
                </div>
            </div>
        </div>
    )
}
