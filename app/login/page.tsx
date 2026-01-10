import { AuthForm } from '@/components/auth/AuthForm'

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
    const params = await searchParams
    const next = params?.next
    return (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-red-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full">
                <AuthForm next={next} />
            </div>
        </div>
    )
}
