import React from 'react'
import { useRouter } from 'next/router'
import { Menu, FileEdit, Printer, Save } from 'lucide-react'

/**
 * OrderHeader Component
 * Displays the header for Order page with navigation and save button
 */
export default function OrderHeader({
    orderNumber,
    onSave,
    isSaving = false
}) {
    const router = useRouter()

    const formatOrderId = (id) => {
        if (!id) return ''
        if (String(id).length > 20) return `#${String(id).slice(-6)}`
        return `#${id}`
    }

    const idToDisplay = orderNumber || router.query.id
    const isEditing = !!router.query.id
    const title = isEditing
        ? `แก้ไขออเดอร์ ${formatOrderId(idToDisplay)}`
        : `สร้างออเดอร์ใหม่ ${formatOrderId(orderNumber)}`

    return ({ setIsSidebarOpen }) => (
        <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
            <div className="flex items-center justify-between">
                {/* Left: Menu + Title */}
                <div className="flex items-center gap-3">
                    <button
                        className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <FileEdit className="text-primary-600 hidden sm:block" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="text-xs sm:text-sm text-secondary-500 hidden sm:block">
                            กรอกข้อมูลให้ครบถ้วนเพื่อสร้างใบเสนอราคา/ออเดอร์
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Print Envelope Button (only when editing) */}
                    {isEditing && (
                        <button
                            onClick={() => window.open(`/print/envelope?orderId=${router.query.id}`, '_blank')}
                            className="p-2 sm:px-3 sm:py-2 text-secondary-600 hover:bg-secondary-50 hover:text-primary-600 rounded-lg font-medium transition-colors flex items-center gap-2"
                            title="พิมพ์ซองจดหมาย"
                        >
                            <Printer size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline text-sm">พิมพ์ซอง</span>
                        </button>
                    )}

                    {/* Cancel Button */}
                    <button
                        onClick={() => router.push('/orders')}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-secondary-600 hover:bg-secondary-50 rounded-lg font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={() => {
                            // CRITICAL FIX: Prevent rapid clicks
                            // Disable button immediately on first click
                            if (isSaving) return
                            onSave()
                        }}
                        disabled={isSaving}
                        className="px-4 py-1.5 sm:px-6 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </header>
    )
}
