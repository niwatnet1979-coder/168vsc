import React from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * ConfirmDialog Component
 * Custom confirmation dialog to replace window.confirm()
 * Prevents rapid multiple calls and provides better UX
 */
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <AlertCircle className="text-primary-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">{title}</h2>
                </div>

                {/* Message */}
                <p className="text-secondary-700 mb-6">{message}</p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 transition-colors"
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    )
}
