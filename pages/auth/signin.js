import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Chrome, AlertCircle } from 'lucide-react'

export default function SignIn() {
    const router = useRouter()
    const { error } = router.query
    const [showForgotPass, setShowForgotPass] = useState(false)
    const [otpStep, setOtpStep] = useState('email') // email, otp
    const [selectedEmail, setSelectedEmail] = useState('')
    const [otpInput, setOtpInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        await signIn('google', {
            callbackUrl: '/',
            prompt: 'select_account' // Force account selection every time
        })
    }

    const [otpHash, setOtpHash] = useState('')

    const handleSendOTP = async () => {
        if (!selectedEmail) {
            alert('กรุณาเลือกอีเมล')
            return
        }
        setIsLoading(true)
        // Simulate sending OTP
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setOtpStep('otp')
        alert(`ส่งรหัส OTP ไปยัง ${selectedEmail} แล้ว (รหัสทดสอบ: 123456)`)
    }

    const handleOTPLogin = async () => {
        if (otpInput.length !== 6) {
            alert('กรุณากรอกรหัส OTP 6 หลัก')
            return
        }
        setIsLoading(true)
        const result = await signIn('credentials', {
            redirect: false,
            email: selectedEmail,
            otp: otpInput,
            callbackUrl: '/'
        })

        if (result.error) {
            setIsLoading(false)
            alert('รหัส OTP ไม่ถูกต้อง')
        } else {
            router.push('/')
        }
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

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => {
                                    setShowForgotPass(true)
                                    setOtpStep('email')
                                    setSelectedEmail('')
                                    setOtpInput('')
                                }}
                                className="text-sm text-secondary-500 hover:text-primary-600 hover:underline"
                            >
                                ลืมรหัสผ่าน / เข้าสู่ระบบด้วย OTP
                            </button>
                        </div>

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

            {/* OTP Modal */}
            {showForgotPass && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-secondary-900">
                                {otpStep === 'email' ? 'ลืมรหัสผ่าน / ขอรหัส OTP' : 'กรอกรหัส OTP'}
                            </h3>
                            <button
                                onClick={() => setShowForgotPass(false)}
                                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-full transition-colors"
                            >
                                <Chrome size={20} className="rotate-45" /> {/* Using Chrome icon as X for now or import X */}
                            </button>
                        </div>

                        {otpStep === 'email' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">เลือกอีเมลของคุณ</label>
                                    <select
                                        value={selectedEmail}
                                        onChange={(e) => setSelectedEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">-- เลือกอีเมล --</option>
                                        <option value="niwatnet1979@gmail.com">niwatnet1979@gmail.com</option>
                                        <option value="saseng1981@gmail.com">saseng1981@gmail.com</option>
                                        <option value="katoon2444@gmail.com">katoon2444@gmail.com</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleSendOTP}
                                    disabled={isLoading}
                                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {isLoading ? 'กำลังส่ง...' : 'ขอรหัส OTP'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-secondary-600">ส่งรหัส OTP ไปยัง</p>
                                    <p className="font-medium text-secondary-900">{selectedEmail}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">รหัส OTP (6 หลัก)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                    />
                                </div>
                                <button
                                    onClick={handleOTPLogin}
                                    disabled={isLoading}
                                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                                </button>
                                <button
                                    onClick={() => setOtpStep('email')}
                                    className="w-full py-2 text-secondary-500 hover:text-secondary-700 text-sm"
                                >
                                    เปลี่ยนอีเมล / ขอรหัสใหม่
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
