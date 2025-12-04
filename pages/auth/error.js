import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function AuthError() {
    const router = useRouter()
    const { error } = router.query

    const getErrorMessage = (error) => {
        switch (error) {
            case 'Configuration':
                return 'มีปัญหาในการตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ'
            case 'AccessDenied':
                return 'คุณไม่มีสิทธิ์เข้าถึงระบบนี้'
            case 'Verification':
                return 'ลิงก์ยืนยันตัวตนหมดอายุหรือถูกใช้งานแล้ว'
            default:
                return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง'
        }
    }

    return (
        <>
            <Head>
                <title>เกิดข้อผิดพลาด - 168VSC System</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-danger-600 via-danger-700 to-danger-800 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6">
                            <AlertCircle size={40} className="text-danger-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
                            เกิดข้อผิดพลาด
                        </h1>

                        <p className="text-secondary-600 mb-8">
                            {getErrorMessage(error)}
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/auth/signin"
                                className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                ลองเข้าสู่ระบบอีกครั้ง
                            </Link>

                            <Link
                                href="/"
                                className="block w-full px-6 py-3 border border-secondary-300 text-secondary-700 rounded-lg font-medium hover:bg-secondary-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={20} />
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
