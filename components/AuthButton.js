import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LogOut, User } from 'lucide-react'

export default function AuthButton({ className = '' }) {
    const { data: session, status } = useSession()
    const router = useRouter()

    if (status === 'loading') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-8 h-8 rounded-full bg-secondary-200 animate-pulse"></div>
            </div>
        )
    }

    if (session) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="flex items-center gap-2">
                    {session.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User size={16} className="text-primary-600" />
                        </div>
                    )}
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-secondary-900">{session.user?.name}</p>
                        <p className="text-xs text-secondary-500">{session.user?.role || 'User'}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    title="ออกจากระบบ"
                >
                    <LogOut size={18} className="text-secondary-600" />
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn('google')}
            className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium ${className}`}
        >
            เข้าสู่ระบบ
        </button>
    )
}
