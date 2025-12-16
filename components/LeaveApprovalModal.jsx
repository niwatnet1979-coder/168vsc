import { useState } from 'react'
import { X, Calendar, Clock, User, Users, FileText, CheckCircle, XCircle } from 'lucide-react'

export default function LeaveApprovalModal({ isOpen, onClose, leaveRequest, onApprove, onReject }) {
    const [isRejecting, setIsRejecting] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    if (!isOpen || !leaveRequest) return null

    const handleApprove = async () => {
        setIsProcessing(true)
        try {
            await onApprove(leaveRequest.id)
            onClose()
        } catch (error) {
            console.error('Error approving leave:', error)
            alert('เกิดข้อผิดพลาดในการอนุมัติ')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ')
            return
        }

        setIsProcessing(true)
        try {
            await onReject(leaveRequest.id, rejectionReason)
            onClose()
            setIsRejecting(false)
            setRejectionReason('')
        } catch (error) {
            console.error('Error rejecting leave:', error)
            alert('เกิดข้อผิดพลาดในการปฏิเสธ')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatLeaveDate = () => {
        const { start_date, end_date, is_full_day, start_time, end_time } = leaveRequest

        const start = new Date(start_date)
        const end = new Date(end_date)
        const isSameDay = start.toDateString() === end.toDateString()

        if (isSameDay) {
            if (is_full_day) {
                return `${formatDate(start_date)} (ทั้งวัน)`
            }
            return `${formatDate(start_date)} ${start_time?.substring(0, 5) || ''}-${end_time?.substring(0, 5) || ''}`
        }
        return `${formatDate(start_date)} - ${formatDate(end_date)}`
    }

    const getStatusBadge = () => {
        const badges = {
            pending: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'รออนุมัติ' },
            approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'อนุมัติ' },
            rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'ไม่อนุมัติ' }
        }
        return badges[leaveRequest.status] || badges.pending
    }

    const badge = getStatusBadge()

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-secondary-900">อนุมัติการลา</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-secondary-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-2 text-sm font-bold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                        </span>
                    </div>

                    {/* Employee Info */}
                    <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <User size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary-500">พนักงาน</div>
                                <div className="font-bold text-secondary-900">{leaveRequest.user_name}</div>
                            </div>
                        </div>

                        {leaveRequest.user_team && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <Users size={20} className="text-primary-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-secondary-500">ทีม</div>
                                    <div className="font-medium text-secondary-900">{leaveRequest.user_team}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Leave Details */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Calendar size={20} className="text-primary-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-secondary-500 mb-1">วันที่ลา</div>
                                <div className="font-medium text-secondary-900">{formatLeaveDate()}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FileText size={20} className="text-primary-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-secondary-500 mb-1">เหตุผล</div>
                                <div className="font-medium text-secondary-900">
                                    {leaveRequest.reason}
                                    {leaveRequest.custom_reason && ` - ${leaveRequest.custom_reason}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Input (shown when rejecting) */}
                    {isRejecting && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <label className="block text-sm font-medium text-red-900 mb-2">
                                เหตุผลในการปฏิเสธ *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="ระบุเหตุผลในการปฏิเสธ..."
                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                rows={3}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 rounded-b-2xl">
                    {leaveRequest.status === 'pending' && (
                        <div className="flex gap-3">
                            {!isRejecting ? (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        {isProcessing ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
                                    </button>
                                    <button
                                        onClick={() => setIsRejecting(true)}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={20} />
                                        ปฏิเสธ
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsRejecting(false)
                                            setRejectionReason('')
                                        }}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 px-4 bg-secondary-200 hover:bg-secondary-300 disabled:bg-secondary-100 text-secondary-700 font-bold rounded-xl transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl transition-colors"
                                    >
                                        {isProcessing ? 'กำลังปฏิเสธ...' : 'ยืนยันปฏิเสธ'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {leaveRequest.status !== 'pending' && (
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-secondary-200 hover:bg-secondary-300 text-secondary-700 font-bold rounded-xl transition-colors"
                        >
                            ปิด
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
