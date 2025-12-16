import { useState } from 'react'
import { X, Calendar, Clock } from 'lucide-react'

export default function LeaveBookingModal({ isOpen, onClose, onSave, userInfo }) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFullDay, setIsFullDay] = useState(true)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')
    const [reason, setReason] = useState('พักผ่อน')
    const [customReason, setCustomReason] = useState('')
    const [saving, setSaving] = useState(false)

    const reasons = ['พักผ่อน', 'ป่วย', 'ติดงาน', 'อื่นๆ']

    const handleSave = async () => {
        // Validate user info
        if (!userInfo || !userInfo.name) {
            alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่')
            return
        }

        if (!startDate || !endDate) {
            alert('กรุณาเลือกวันที่')
            return
        }

        if (!isFullDay && (!startTime || !endTime)) {
            alert('กรุณาเลือกเวลา')
            return
        }

        if (reason === 'อื่นๆ' && !customReason.trim()) {
            alert('กรุณาระบุเหตุผล')
            return
        }

        setSaving(true)
        try {
            const leaveData = {
                user_id: userInfo.id || null,
                user_name: userInfo.name,
                user_team: userInfo.team || null,
                start_date: startDate,
                end_date: endDate,
                is_full_day: isFullDay,
                start_time: isFullDay ? null : startTime,
                end_time: isFullDay ? null : endTime,
                reason: reason,
                custom_reason: reason === 'อื่นๆ' ? customReason : null,
                status: 'pending'
            }

            console.log('Saving leave data:', leaveData)
            await onSave(leaveData)

            // Reset form
            setStartDate('')
            setEndDate('')
            setIsFullDay(true)
            setStartTime('09:00')
            setEndTime('17:00')
            setReason('พักผ่อน')
            setCustomReason('')

            onClose()
        } catch (error) {
            console.error('Error saving leave:', error)
            alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-secondary-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        <Calendar size={20} className="text-purple-600" />
                        จองวันหยุด
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                วันที่เริ่มต้น <span className="text-danger-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                วันที่สิ้นสุด <span className="text-danger-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Full Day Toggle */}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <input
                            type="checkbox"
                            id="fullDay"
                            checked={isFullDay}
                            onChange={(e) => setIsFullDay(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-secondary-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="fullDay" className="text-sm font-medium text-secondary-900 cursor-pointer">
                            ลาทั้งวัน
                        </label>
                    </div>

                    {/* Time Range (if not full day) */}
                    {!isFullDay && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-1">
                                    <Clock size={14} />
                                    เวลาเริ่มต้น
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-1">
                                    <Clock size={14} />
                                    เวลาสิ้นสุด
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            เหตุผลการลา <span className="text-danger-500">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {reasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Reason */}
                    {reason === 'อื่นๆ' && (
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                ระบุเหตุผล <span className="text-danger-500">*</span>
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="กรุณาระบุเหตุผลการลา..."
                                rows={3}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-secondary-200 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 font-medium transition-colors"
                        disabled={saving}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    )
}
