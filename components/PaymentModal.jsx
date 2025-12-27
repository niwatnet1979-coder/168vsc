import { useState, useRef } from 'react'
import { X, Upload, Calendar, Send, Loader2, DollarSign } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { showSuccess, showError } from '../lib/sweetAlert'

export default function PaymentModal({ isOpen, onClose, poData, onSuccess }) {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
    const [paymentType, setPaymentType] = useState('full') // full, deposit
    const [amount, setAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
    const [isAdvanced, setIsAdvanced] = useState(false)
    const [payerName, setPayerName] = useState('')
    const [employeeOptions, setEmployeeOptions] = useState([])

    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    // Reset/Init state when poData changes
    useState(() => {
        if (poData) {
            setAmount(poData.outstanding || 0)
        }
    }, [poData])

    // Load active employees
    useState(() => {
        DataManager.getActiveEmployees().then(emps => {
            setEmployeeOptions(emps || [])
        })
    }, [])

    // Update amount when payment type changes
    const handlePaymentTypeChange = (type) => {
        setPaymentType(type)
        if (type === 'full') {
            setAmount(poData.outstanding || 0)
        } else {
            setAmount(0) // Let user enter deposit amount
        }
    }

    if (!isOpen || !poData) return null

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async () => {
        if (!paymentDate) {
            showError({ text: 'Please select a date' })
            return
        }
        if (amount <= 0) {
            showError({ text: 'Amount must be greater than 0' })
            return
        }
        if (isAdvanced && !payerName) {
            showError({ text: 'Please enter Payer Name' })
            return
        }

        setIsSubmitting(true)
        try {
            let slipUrl = null

            if (selectedFile) {
                slipUrl = await DataManager.uploadPaymentSlip(selectedFile, poData.id)
                if (!slipUrl) throw new Error('Upload failed')
            }

            // Calculate new status and total paid
            const currentPaid = poData.paid || 0
            const newTotalPaid = Number(currentPaid) + Number(amount)
            const totalCost = poData.total || 0

            let newStatus = 'partial'
            if (paymentType === 'full' || newTotalPaid >= totalCost) {
                newStatus = 'paid'
            }

            const updatePayload = {
                payment_status: newStatus,
                payment_date: paymentDate,
                payment_slip_url: slipUrl,
                paid_amount: newTotalPaid,
                payment_method: paymentMethod,
                // Advanced Payment Logic
                ...(isAdvanced && {
                    payer_name: payerName,
                    is_reimbursed: false // Pending reimbursement
                })
            }

            const success = await DataManager.updatePurchaseOrderPayment(poData.id, updatePayload)

            if (success) {
                await showSuccess({
                    title: 'Saved!',
                    text: 'Payment recorded successfully',
                    showConfirmButton: false,
                    timer: 1500
                })
                onSuccess()
                onClose()
            } else {
                throw new Error('Update failed')
            }
        } catch (error) {
            console.error(error)
            showError({
                title: 'Failed',
                text: error.message || 'Failed to record payment'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-primary-600" size={20} />
                        Record Payment
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-primary-50 p-3 rounded-lg text-sm text-primary-800">
                        <div className="flex justify-between">
                            <span>Pay to: {poData.supplier || poData.supplier_name}</span>
                            <span className="font-bold">Total: ฿{Number(poData.total || poData.total_landed_cost).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-primary-600">
                            <span>Outstanding:</span>
                            <span className="font-bold">฿{Number(poData.outstanding).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type (ประเภทการจ่าย)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handlePaymentTypeChange('full')}
                                className={`py-2 rounded-lg text-sm font-medium border transition-all ${paymentType === 'full'
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Full Payment (จ่ายเต็ม)
                            </button>
                            <button
                                onClick={() => handlePaymentTypeChange('deposit')}
                                className={`py-2 rounded-lg text-sm font-medium border transition-all ${paymentType === 'deposit'
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Deposit (มัดจำ/บางส่วน)
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ยอดเงินที่จ่าย)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">฿</span>
                            <input
                                type="number"
                                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${paymentType === 'full' ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300'
                                    }`}
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                readOnly={paymentType === 'full'}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Channel (ช่องทางการจ่าย)</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        >
                            <option value="Bank Transfer">Bank Transfer (โอนเงิน)</option>
                            <option value="Cash">Cash (เงินสด)</option>
                            <option value="Alipay">Alipay</option>
                            <option value="WeChat Pay">WeChat Pay</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    {/* Advanced Payment */}
                    <div className="border hover:border-amber-400 rounded-lg p-3 transition-colors cursor-pointer" onClick={() => setIsAdvanced(!isAdvanced)}>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                checked={isAdvanced}
                                onChange={e => setIsAdvanced(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-700">Advanced Payment (สำรองจ่าย)</span>
                        </label>

                        {isAdvanced && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 cursor-auto" onClick={(e) => e.stopPropagation()}>
                                <label className="block text-xs font-medium text-amber-700 mb-1">Payer Name (ชื่อผู้สำรองจ่าย) *</label>
                                <select
                                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
                                    value={payerName}
                                    onChange={e => setPayerName(e.target.value)}
                                >
                                    <option value="">-- เลือกผู้สำรองจ่าย --</option>
                                    {employeeOptions.map(emp => (
                                        <option key={emp.id} value={emp.nickname}>{emp.nickname} ({emp.fullname})</option>
                                    ))}
                                    {/* Fallback for existing data not in list */}
                                    {payerName && !employeeOptions.find(e => e.nickname === payerName) && (
                                        <option value={payerName}>{payerName}</option>
                                    )}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date (วันที่ชำระเงิน)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Slip */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Slip (สลิปโอนเงิน)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {previewUrl ? (
                                <div className="relative">
                                    <img src={previewUrl} alt="Slip Preview" className="max-h-32 mx-auto rounded shadow-sm" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedFile(null)
                                            setPreviewUrl(null)
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <Upload size={20} />
                                    <span className="text-xs">Click to upload</span>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
