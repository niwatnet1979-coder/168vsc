import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Chrome, AlertCircle } from 'lucide-react'

export default function SignIn() {
    const router = useRouter()
    const { error } = router.query

    const handleGoogleSignIn = async () => {
        await signIn('google', { callbackUrl: '/' })
    }

    return (
        <>
            <Head>
                <title>เข้าสู่ระบบ - 168VSC System</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        {/* Logo */}
                        <img
                            src="/logo-192.png"
                            alt="168VSC Logo"
                            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
                        />
                        <h1 className="text-3xl font-bold text-white mb-2">168VSC System</h1>
                        <p className="text-primary-100">ระบบจัดการงานติดตั้งและขนส่ง</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <h2 className="text-2xl font-bold text-secondary-900 text-center mb-6">
                            เข้าสู่ระบบ
                        </h2>

                        {error && (
                            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3">
                                <AlertCircle size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-danger-900">เกิดข้อผิดพลาด</p>
                                    <p className="text-sm text-danger-700">
                                        {error === 'OAuthSignin' && 'ไม่สามารถเชื่อมต่อกับ Google ได้'}
                                        {error === 'OAuthCallback' && 'การยืนยันตัวตนล้มเหลว'}
                                        {error === 'OAuthCreateAccount' && 'ไม่สามารถสร้างบัญชีได้'}
                                        {error === 'EmailCreateAccount' && 'ไม่สามารถสร้างบัญชีได้'}
                                        {error === 'Callback' && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'}
                                        {error === 'OAuthAccountNotLinked' && 'บัญชีนี้ถูกใช้งานแล้ว'}
                                        {error === 'EmailSignin' && 'ไม่สามารถส่งอีเมลได้'}
                                        {error === 'CredentialsSignin' && 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง'}
                                        {error === 'SessionRequired' && 'กรุณาเข้าสู่ระบบ'}
                                        {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-secondary-300 rounded-xl font-medium text-secondary-700 hover:bg-secondary-50 hover:border-secondary-400 transition-all shadow-sm hover:shadow-md active:scale-98"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-lg">เข้าสู่ระบบด้วย Google</span>
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-secondary-500">
                                โดยการเข้าสู่ระบบ คุณยอมรับ
                                <br />
                                <a href="#" className="text-primary-600 hover:underline">เงื่อนไขการใช้งาน</a>
                                {' และ '}
                                <a href="#" className="text-primary-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-primary-100 text-sm">
                            © 2024 168VSC. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
