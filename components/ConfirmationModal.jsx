import React from 'react'

export default function ConfirmationModal({
    isOpen,
    onConfirm,
    onCancel,
    title = 'ยืนยันการดำเนินการ',
    message = 'คุณต้องการดำเนินการต่อหรือไม่?',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก'
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium shadow-lg shadow-primary-500/30 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
