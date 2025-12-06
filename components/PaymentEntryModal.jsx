import React, { useState, useEffect } from 'react'
import { X, Camera, Calendar, DollarSign, FileText } from 'lucide-react'
import { currency } from '../lib/utils'

export default function PaymentEntryModal({
    isOpen,
    onClose,
    onSave,
    payment = null,
    remainingBalance = 0
}) {
    const [formData, setFormData] = useState({
        date: '',
        amount: '',
        paymentMethod: 'โอน',
        slip: null,
        signature: null
    })

    useEffect(() => {
        if (payment) {
            setFormData(payment)
        } else {
            setFormData({
                date: '',
                amount: '',
                paymentMethod: 'โอน',
                slip: null,
                signature: null
            })
        }
    }, [payment, isOpen])

    const handleSave = () => {
        if (!formData.date || !formData.amount) {
            alert('กรุณากรอกวันที่และยอดชำระ')
            return
        }
        onSave(formData)
        onClose()
    }

    const calculatedRemaining = remainingBalance - (parseFloat(formData.amount) || 0)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-secondary-900">
                        {payment ? 'แก้ไขการชำระเงิน' : 'เพิ่มการชำระเงิน'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-secondary-500 hover:text-secondary-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Row 1: Date and Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                วันที่ชำระ <span className="text-danger-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                ยอดชำระ <span className="text-danger-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Row 2: Remaining Balance (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            คงค้าง
                        </label>
                        <div className="w-full px-4 py-2 bg-secondary-50 border border-secondary-300 rounded-lg text-right font-bold text-secondary-900">
                            {currency(calculatedRemaining)}
                        </div>
                    </div>

                    {/* Row 3: Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            ชำระโดย
                        </label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="โอน">โอน</option>
                            <option value="บัตรเครดิต">บัตรเครดิต</option>
                            <option value="เงินสด">เงินสด</option>
                        </select>
                    </div>

                    {/* Row 4: Slip Upload */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            สลิป
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            id="slip-upload"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setFormData({ ...formData, slip: file })
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('slip-upload').click()}
                            className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 ${formData.slip
                                    ? 'border-success-500 bg-success-50 text-success-700'
                                    : 'border-secondary-300 hover:border-secondary-400'
                                }`}
                        >
                            <Camera size={20} />
                            <span>{formData.slip ? formData.slip.name || 'มีรูปสลิปแล้ว' : 'อัพโหลดสลิป'}</span>
                        </button>
                    </div>

                    {/* Row 5: Signature Upload */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            ลายเซ็นผู้รับชำระ
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            id="signature-upload"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setFormData({ ...formData, signature: file })
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('signature-upload').click()}
                            className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 ${formData.signature
                                    ? 'border-success-500 bg-success-50 text-success-700'
                                    : 'border-secondary-300 hover:border-secondary-400'
                                }`}
                        >
                            <FileText size={20} />
                            <span>{formData.signature ? formData.signature.name || 'มีลายเซ็นแล้ว' : 'อัพโหลดลายเซ็น'}</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                        บันทึก
                    </button>
                </div>
            </div>
        </div>
    )
}
