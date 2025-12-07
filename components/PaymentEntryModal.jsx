import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { currency } from '../lib/utils'

export default function PaymentEntryModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    payment = null,
    remainingBalance = 0,
    isEditing = false
}) {
    const [formData, setFormData] = useState({
        date: '',
        amountMode: 'percent',
        percentValue: 50,
        amount: '',
        paymentMethod: 'โอน',
        slip: null,
        receiverSignature: null,
        payerSignature: null
    })

    const receiverSigRef = useRef(null)
    const payerSigRef = useRef(null)

    useEffect(() => {
        if (payment) {
            setFormData(payment)
        } else {
            setFormData({
                date: '',
                amountMode: 'percent',
                percentValue: 50,
                amount: '',
                paymentMethod: 'โอน',
                slip: null,
                receiverSignature: null,
                payerSignature: null
            })
        }
    }, [payment, isOpen])

    const handleSave = () => {
        if (!formData.date || (!formData.amount && formData.amountMode === 'amount')) {
            alert('กรุณากรอกวันที่และยอดชำระ')
            return
        }

        // Get signature data
        const receiverSig = receiverSigRef.current?.toDataURL()
        const payerSig = payerSigRef.current?.toDataURL()

        onSave({
            ...formData,
            receiverSignature: receiverSig,
            payerSignature: payerSig
        })
        onClose()
    }

    const calculatedAmount = formData.amountMode === 'percent'
        ? (remainingBalance * (parseFloat(formData.percentValue) || 0)) / 100
        : parseFloat(formData.amount) || 0

    const calculatedRemaining = remainingBalance - calculatedAmount

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-secondary-900">
                        {isEditing ? 'แก้ไขการชำระเงิน' : 'เพิ่มการชำระเงิน'}
                    </h2>
                    <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                            วันที่ชำระ <span className="text-danger-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white font-medium text-secondary-900 appearance-none text-sm min-w-0 max-w-full h-[42px]"
                        />
                    </div>

                    {/* Amount Mode Toggle & Value */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">
                                ประเภท
                            </label>
                            <select
                                value={formData.amountMode}
                                onChange={(e) => setFormData({ ...formData, amountMode: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="percent">เปอร์เซ็นต์ (%)</option>
                                <option value="amount">ยอดเงิน (฿)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">
                                {formData.amountMode === 'percent' ? 'เปอร์เซ็นต์' : 'ยอดเงิน'}
                            </label>
                            <input
                                type="number"
                                value={formData.amountMode === 'percent' ? formData.percentValue : formData.amount}
                                onChange={(e) => {
                                    if (formData.amountMode === 'percent') {
                                        setFormData({ ...formData, percentValue: e.target.value })
                                    } else {
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                }}
                                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right"
                                placeholder={formData.amountMode === 'percent' ? '50' : '0.00'}
                            />
                        </div>
                    </div>

                    {/* Calculated Amount & Remaining */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">ยอดชำระ</label>
                            <div className="px-3 py-2 text-sm bg-primary-50 border border-primary-300 rounded-lg text-right font-bold text-primary-700">
                                {currency(calculatedAmount)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">คงค้าง</label>
                            <div className="px-3 py-2 text-sm bg-secondary-50 border border-secondary-300 rounded-lg text-right font-bold text-secondary-900">
                                {currency(calculatedRemaining)}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">ชำระโดย</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="โอน">โอน</option>
                            <option value="บัตรเครดิต">บัตรเครดิต</option>
                            <option value="เงินสด">เงินสด</option>
                        </select>
                    </div>

                    {/* Slip Upload */}
                    <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">สลิป</label>
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
                            className={`w-full px-3 py-2 text-sm border-2 border-dashed rounded-lg ${formData.slip
                                ? 'border-success-500 bg-success-50 text-success-700'
                                : 'border-secondary-300 hover:border-secondary-400'
                                }`}
                        >
                            {formData.slip ? formData.slip.name || 'มีรูปสลิปแล้ว' : 'อัพโหลดสลิป'}
                        </button>
                    </div>

                    {/* Signature Pads */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Receiver Signature */}
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">ลายเซ็นพนักงาน</label>
                            <div className="border-2 border-secondary-300 rounded-lg overflow-hidden">
                                <SignatureCanvas
                                    ref={receiverSigRef}
                                    canvasProps={{
                                        className: 'w-full h-24 bg-white'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => receiverSigRef.current?.clear()}
                                className="mt-1 text-xs text-danger-500 hover:text-danger-700"
                            >
                                ล้าง
                            </button>
                        </div>

                        {/* Payer Signature */}
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">ลายเซ็นลูกค้า</label>
                            <div className="border-2 border-secondary-300 rounded-lg overflow-hidden">
                                <SignatureCanvas
                                    ref={payerSigRef}
                                    canvasProps={{
                                        className: 'w-full h-24 bg-white'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => payerSigRef.current?.clear()}
                                className="mt-1 text-xs text-danger-500 hover:text-danger-700"
                            >
                                ล้าง
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-4 py-3 flex gap-2 justify-between">
                    <div>
                        {isEditing && onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm('ต้องการลบรายการนี้?')) {
                                        onDelete()
                                        onClose()
                                    }
                                }}
                                className="px-4 py-2 text-sm border border-danger-500 text-danger-500 rounded-lg hover:bg-danger-50 font-medium flex items-center gap-1"
                            >
                                <Trash2 size={16} />
                                ลบ
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-secondary-300 rounded-lg hover:bg-secondary-50 font-medium"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
