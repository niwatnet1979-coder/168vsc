import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'loading') return

        // Not authenticated
        if (!session) {
            router.push('/auth/signin')
            return
        }

        // Check role if specified
        if (allowedRoles.length > 0 && session.user?.role) {
            if (!allowedRoles.includes(session.user.role)) {
                router.push('/unauthorized')
                return
            }
        }
    }, [session, status, router, allowedRoles])

    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary-600">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        )
    }

    // Not authenticated
    if (!session) {
        return null
    }

    // Check role
    if (allowedRoles.length > 0 && session.user?.role) {
        if (!allowedRoles.includes(session.user.role)) {
            return null
        }
    }

    return <>{children}</>
}
