import React, { useState, useRef, useEffect } from 'react'
import { Star, Image, X } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { DataManager } from '../lib/dataManager'

const JobInspectorView = React.forwardRef(({ job, onSave }, ref) => {
    const [mediaItems, setMediaItems] = useState([]) // Keep media state to preserve it on save
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [existingSignature, setExistingSignature] = useState(null)
    const sigCanvas = useRef({})

    React.useImperativeHandle(ref, () => ({
        triggerSave: () => handleSave()
    }))

    // Load existing completion data
    useEffect(() => {
        const loadCompletionData = async () => {
            if (!job?.id) return
            const data = await DataManager.getJobCompletion(job.id)
            if (data) {
                setRating(data.rating || 5)
                setComment(data.comment || '')
                setExistingSignature(data.signature_url || null)
                // Load media to preserve it
                const loadedMedia = (data.media || []).map(item => ({
                    ...item,
                    id: item.id || (Date.now() + Math.random().toString(36).substr(2, 9))
                }))
                setMediaItems(loadedMedia)
            } else {
                // Backward compatibility
                if (job?.notes && job.notes.includes('[COMPLETION_REPORT]')) {
                    try {
                        const reportMatch = job.notes.match(/\[COMPLETION_REPORT\]\s*(\{.*\})/)
                        if (reportMatch && reportMatch[1]) {
                            const report = JSON.parse(reportMatch[1])
                            setRating(report.rating || 5)
                            setComment(report.comment || '')
                            setMediaItems(report.media || [])
                        }
                    } catch (e) { }
                }
            }
        }
        loadCompletionData()
    }, [job])

    const handleSave = async () => {
        if (!confirm('ยืนยันการบันทึกการตรวจรับงาน?')) return

        setIsSubmitting(true)
        try {
            // 1. Upload Signature if drawn
            let signatureUrl = null
            if (sigCanvas.current && sigCanvas.current.isEmpty && !sigCanvas.current.isEmpty()) {
                const sigDataUrl = sigCanvas.current.toDataURL('image/png')
                const res = await fetch(sigDataUrl)
                const blob = await res.blob()
                const file = new File([blob], 'signature.png', { type: 'image/png' })
                signatureUrl = await DataManager.uploadJobMedia(file, job.id)
            }

            // 2. Save to job_completions table (Preserving existing media)
            const completionData = {
                job_id: job.id,
                signature_url: signatureUrl || existingSignature || job.signatureImage, // Fallback to existing
                rating,
                comment,
                media: mediaItems // Preserve existing media
            }

            const successCompletion = await DataManager.saveJobCompletion(completionData)
            if (!successCompletion) throw new Error('Failed to save completion data')

            // 3. Update Job Status
            const result = await DataManager.saveJob({
                ...job,
                status: 'Done',
                signatureImage: completionData.signature_url,
            })

            if (result.success) {
                alert('บันทึกการตรวจรับงานเรียบร้อยแล้ว')
                if (onSave) onSave()
            } else {
                throw new Error('Failed to update job status: ' + result.error)
            }

        } catch (error) {
            console.error('Error saving inspector view:', error)
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Inspector Section */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold text-lg text-secondary-900 mb-4">ผู้ตรวจงาน (Inspector)</h3>

                {/* Signature */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">ลายเซ็นลูกค้า / ผู้ตรวจงาน</label>
                    <div className="border border-secondary-300 rounded-lg overflow-hidden bg-gray-50 h-40 relative">
                        {existingSignature ? (
                            <div className="w-full h-full relative group bg-white">
                                <img
                                    src={existingSignature}
                                    className="w-full h-full object-contain p-2"
                                    alt="Signature"
                                />
                                <button
                                    onClick={() => setExistingSignature(null)}
                                    className="absolute top-2 right-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-100 text-xs font-medium flex items-center gap-1 hover:bg-red-100 transition-colors"
                                >
                                    <X size={14} /> เซ็นใหม่
                                </button>
                            </div>
                        ) : (
                            <>
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    canvasProps={{
                                        className: 'sigCanvas w-full h-full',
                                        style: { width: '100%', height: '100%' }
                                    }}
                                    backgroundColor="rgba(249, 250, 251, 1)"
                                />
                                <button
                                    onClick={() => sigCanvas.current.clear()}
                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-gray-200 text-xs text-gray-500"
                                >
                                    ล้าง
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">ให้คะแนนความพึงพอใจ</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`p-1 transition-transform active:scale-95 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star fill={rating >= star ? "currentColor" : "none"} size={32} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div className="mb-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">ความคิดเห็นเพิ่มเติม</label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="ข้อความถึงช่างหรือพนักงานขนส่ง..."
                        className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm h-24"
                    />
                </div>
            </div>

            {/* Hint about media */}
            <div className="text-center text-xs text-gray-400">
                * รูปภาพและวิดีโอถูกจัดการในแท็บ "บันทึกงาน"
            </div>
        </div>
    )
})

export default JobInspectorView
