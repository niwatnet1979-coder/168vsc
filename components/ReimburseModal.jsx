
import { useState, useRef } from 'react'
import { X, Upload, Calendar, Send, Loader2 } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { showSuccess, showError } from '../lib/sweetAlert'

export default function ReimburseModal({ isOpen, onClose, poData, onSuccess }) {
    const [reimbursedDate, setReimbursedDate] = useState(new Date().toISOString().slice(0, 10))
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    if (!isOpen || !poData) return null

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async () => {
        if (!reimbursedDate) {
            showError({ title: 'Error', text: 'Please select a date' })
            return
        }

        setIsSubmitting(true)
        try {
            let slipUrl = null

            // Upload Slip if selected
            if (selectedFile) {
                slipUrl = await DataManager.uploadReimbursementSlip(selectedFile, poData.id)
                if (!slipUrl) {
                    throw new Error('Upload failed')
                }
            }

            // Update PO
            const success = await DataManager.updatePurchaseOrderPayment(poData.id, {
                is_reimbursed: true,
                reimbursed_date: reimbursedDate,
                reimbursed_slip_url: slipUrl
            })

            if (success) {
                await showSuccess({
                    title: 'Success',
                    text: 'Reimbursement recorded successfully'
                })
                onSuccess()
                onClose()
            } else {
                throw new Error('Update failed')
            }
        } catch (error) {
            console.error(error)
            console.error(error)
            showError({ title: 'Error', text: error.message || 'Failed to record reimbursement' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-lg text-gray-800">Confirm Reimbursement</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                        Refund for: <span className="font-semibold">{poData.payer || poData.payer_name}</span>
                        <br />
                        Amount: <span className="font-semibold">฿{Number(poData.total || poData.amount).toLocaleString()}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reimburse Date (วันที่คืนเงิน)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={reimbursedDate}
                                onChange={e => setReimbursedDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Slip (สลิปโอนเงิน)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {previewUrl ? (
                                <div className="relative">
                                    <img src={previewUrl} alt="Slip Preview" className="max-h-40 mx-auto rounded shadow-sm" />
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
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-sm">Click to upload slip image</span>
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

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Confirm Refund
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
