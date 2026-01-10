'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';

export default function GetStartedContent({ next }: { next: string }) {
    const { t } = useLanguage();
    const loginUrl = `/login?next=${encodeURIComponent(next)}`;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-stone-50">
            {/* Background decorative elements matching login page style */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-red-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full max-w-lg px-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                        <Sparkles className="w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-bold text-stone-800 mb-4">
                        {t('getStarted.title')}
                    </h1>

                    <div className="space-y-4 text-stone-600 mb-8">
                        <p className="text-lg leading-relaxed">
                            {t('getStarted.description')}
                        </p>
                        <p className="font-medium text-amber-800 bg-amber-50 py-2 px-4 rounded-lg inline-block">
                            {t('getStarted.subtitle')}
                        </p>
                    </div>

                    <Link href={loginUrl} className="block w-full">
                        <Button fullWidth className="flex items-center justify-center gap-3 py-4">
                            <span>{t('getStarted.button')}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>

                    <p className="mt-6 text-sm text-stone-400">
                        {t('getStarted.loginLink')}
                    </p>
                </div>
            </div>
        </div>
    );
}
