import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, QrCode } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { currency } from '../lib/utils'
import { DataManager } from '../lib/dataManager'
import Card from './Card'
import DataSourceTooltip from './DataSourceTooltip'

export default function PaymentEntryModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    payment = null,
    remainingBalance = 0,
    isEditing = false,
    promptpayQr = '' // Added prop
}) {
    const initialForm = {
        date: '',
        amountMode: 'percent',
        percentValue: 50,
        amount: '',
        paymentMethod: 'โอน',
        slip: null,
        receiverSignature: null,
        payerSignature: null
    }

    const [formData, setFormData] = useState(initialForm)
    const [qrUrl, setQrUrl] = useState(promptpayQr)
    const [showQrPopup, setShowQrPopup] = useState(false)

    const receiverSigRef = useRef(null)
    const payerSigRef = useRef(null)

    const normalizeDateForInput = (val) => {
        if (!val) return ''
        try {
            // If already in YYYY-MM-DD format return as-is; if ISO or datetime string, convert
            const d = new Date(val)
            if (isNaN(d.getTime())) return ''
            return d.toISOString().slice(0, 10) // input type=date expects YYYY-MM-DD
        } catch (e) {
            return ''
        }
    }

    useEffect(() => {
        if (!isOpen) return

        // Fetch QR if not provided
        if (!qrUrl && !promptpayQr) {
            DataManager.getSettings().then(settings => {
                if (settings?.promptpayQr) setQrUrl(settings.promptpayQr)
            })
        } else if (promptpayQr) {
            setQrUrl(promptpayQr)
        }

        if (payment) {
            // Normalize date to YYYY-MM-DD for date input
            const populated = {
                ...payment,
                date: normalizeDateForInput(payment.date) || (payment.date === '' ? '' : payment.date)
            }
            setFormData(populated)

            // Load signatures into canvases if available
            setTimeout(() => {
                try {
                    receiverSigRef.current?.clear()
                    payerSigRef.current?.clear()
                    if (payment.receiverSignature && receiverSigRef.current?.fromDataURL) {
                        receiverSigRef.current.fromDataURL(payment.receiverSignature)
                    }
                    if (payment.payerSignature && payerSigRef.current?.fromDataURL) {
                        payerSigRef.current.fromDataURL(payment.payerSignature)
                    }
                } catch (err) {
                    // ignore
                }
            }, 0)
        } else {
            setFormData(initialForm)

            // Clear signatures and file input when creating a new payment
            setTimeout(() => {
                try {
                    receiverSigRef.current?.clear()
                    payerSigRef.current?.clear()
                    const slipInput = document.getElementById('slip-upload')
                    if (slipInput) slipInput.value = ''
                } catch (err) {
                    // ignore
                }
            }, 0)
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all scale-100">
                {/* Header */}
                <div className="flex-none bg-white border-b border-secondary-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        {isEditing ? (
                            <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block"></span>
                        ) : (
                            <span className="w-1.5 h-6 bg-success-600 rounded-full inline-block"></span>
                        )}
                        {isEditing ? 'แก้ไขการชำระเงิน' : 'เพิ่มการชำระเงิน'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-secondary-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            วันที่ชำระ <span className="text-danger-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-all font-medium text-secondary-900"
                        />
                    </div>

                    {/* Amount Section */}
                    <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">
                                    ประเภท
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.amountMode}
                                        onChange={(e) => setFormData({ ...formData, amountMode: e.target.value })}
                                        className="w-full px-3 py-2 text-sm font-medium border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white appearance-none"
                                    >
                                        <option value="percent">เปอร์เซ็นต์ (%)</option>
                                        <option value="amount">ยอดเงิน (฿)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-500">
                                        ▼
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">
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
                                    className="w-full px-3 py-2 text-sm font-bold border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right bg-white"
                                    placeholder={formData.amountMode === 'percent' ? '50' : '0.00'}
                                />
                            </div>
                        </div>

                        {/* Calculated Results */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-secondary-200 border-dashed">
                            <div>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ยอดชำระจริง</label>
                                <div className="text-lg font-bold text-primary-600">
                                    <DataSourceTooltip isRealtime={false} source="calculated">
                                        {currency(calculatedAmount)}
                                    </DataSourceTooltip>
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">คงเหลือหลังชำระ</label>
                                <div className="text-lg font-medium text-secondary-900">
                                    <DataSourceTooltip isRealtime={false} source="calculated">
                                        {currency(calculatedRemaining)}
                                    </DataSourceTooltip>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">ช่องทางชำระ</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['โอน', 'บัตรเครดิต', 'เงินสด'].map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                    className={`py-2.5 px-3 rounded-xl border text-sm font-bold transition-all ${formData.paymentMethod === method
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200'
                                        : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300 hover:bg-secondary-50'
                                        }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slip Upload */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">หลักฐานการโอน</label>
                        <input
                            type="file"
                            accept="image/*"
                            id="slip-upload"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    setFormData({ ...formData, slip: file })
                                }
                            }}
                        />

                        {formData.slip ? (
                            <div className="relative rounded-xl overflow-hidden border border-secondary-200 group">
                                <img
                                    src={typeof formData.slip === 'string' ? formData.slip : URL.createObjectURL(formData.slip)}
                                    alt="Payment Slip"
                                    className="w-full h-48 object-cover cursor-pointer transition-transform group-hover:scale-105"
                                    onClick={() => document.getElementById('slip-upload').click()}
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm text-white text-xs py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    คลิกเพื่อเปลี่ยนรูป
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData({ ...formData, slip: null })
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-danger-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => document.getElementById('slip-upload').click()}
                                className="border-2 border-dashed border-secondary-300 rounded-xl p-6 flex flex-col items-center justify-center text-secondary-400 hover:border-primary-500 hover:bg-primary-50/50 hover:text-primary-500 transition-all cursor-pointer gap-2"
                            >
                                <div className="p-3 bg-secondary-100 rounded-full group-hover:bg-primary-100 transition-colors">
                                    <Trash2 size={24} className="hidden" /> {/* Dummy icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                </div>
                                <span className="font-medium text-sm">อัพโหลดรูปสลิป</span>
                            </div>
                        )}
                    </div>

                    {/* Signature Pads */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'ลายเซ็นพนักงาน', ref: receiverSigRef, key: 'receiverSignature' },
                            { label: 'ลายเซ็นลูกค้า', ref: payerSigRef, key: 'payerSignature' }
                        ].map((sig) => (
                            <div key={sig.key} className="flex flex-col">
                                <label className="block text-xs font-bold text-secondary-600 mb-2 uppercase tracking-wider">{sig.label}</label>
                                <div className="border border-secondary-300 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
                                    <SignatureCanvas
                                        ref={sig.ref}
                                        canvasProps={{
                                            className: 'w-full h-24 bg-white'
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => sig.ref.current?.clear()}
                                    className="self-end mt-1 text-xs text-secondary-400 hover:text-danger-500 font-medium transition-colors"
                                >
                                    ล้างลายเซ็น
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none bg-white border-t border-secondary-100 px-6 py-4 flex gap-3 justify-between items-center rounded-b-2xl z-10">
                    <div>
                        {isEditing && onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm('ต้องการลบรายการนี้?')) {
                                        onDelete()
                                        onClose()
                                    }
                                }}
                                className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors flex items-center gap-1"
                                title="ลบรายการ"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* QR Code Button */}
                    <div className="flex-1 flex justify-center sm:justify-start">
                        {qrUrl && (
                            <button
                                onClick={() => setShowQrPopup(true)}
                                className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors relative group"
                                title="สแกน QR Code"
                            >
                                <QrCode size={24} />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                                    สแกนจ่าย
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-5 py-2 text-sm border border-secondary-300 rounded-lg hover:bg-secondary-50 font-bold text-secondary-700 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 sm:flex-none px-8 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5"
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code Popup */}
            {showQrPopup && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowQrPopup(false)}
                >
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-auto relative animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowQrPopup(false)}
                            className="absolute -top-3 -right-3 p-2 bg-white text-secondary-500 hover:text-danger-500 rounded-full shadow-lg border border-secondary-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-secondary-900 mb-1">สแกนเพื่อชำระเงิน</h3>
                            <p className="text-secondary-500 text-sm mb-4">รองรับแอพธนาคารทุกธนาคาร</p>

                            <div className="bg-white p-2 rounded-xl border border-secondary-200 shadow-inner inline-block">
                                <img
                                    src={qrUrl}
                                    alt="PromptPay QR"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>

                            <div className="mt-4 pt-4 border-t border-secondary-100">
                                <p className="text-secondary-500 text-sm mb-1">ยอดที่ต้องชำระ</p>
                                <div className="text-3xl font-bold text-primary-600">
                                    {currency(calculatedAmount)}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-2 text-success-600 font-medium text-sm bg-success-50 py-2 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-success-600 animate-pulse"></span>
                                พร้อมรับชำระ
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
