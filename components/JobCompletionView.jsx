import React, { useState, useRef, useEffect } from 'react'
import { Camera, MapPin, X, Star, Save, Upload, Video } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { DataManager } from '../lib/dataManager'

export default function JobCompletionView({ job, onSave }) {
    const [mediaItems, setMediaItems] = useState([])
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const sigCanvas = useRef({})

    // Load existing completion data from job_completions table
    useEffect(() => {
        const loadCompletionData = async () => {
            if (!job?.id) return
            const data = await DataManager.getJobCompletion(job.id)
            if (data) {
                setRating(data.rating || 5)
                setComment(data.comment || '')
                setMediaItems(data.media || [])
                // Signature: we can't easily load signature back into canvas to edit, 
                // but we could show a preview if needed. 
                // For now, canvas stays empty for new signature or we assume if signed, it's done.
            } else {
                // Backward compatibility: check notes
                if (job?.notes && job.notes.includes('[COMPLETION_REPORT]')) {
                    try {
                        const reportMatch = job.notes.match(/\[COMPLETION_REPORT\]\s*(\{.*\})/)
                        if (reportMatch && reportMatch[1]) {
                            const report = JSON.parse(reportMatch[1])
                            setRating(report.rating || 5)
                            setComment(report.comment || '')
                            setMediaItems(report.media || [])
                        }
                    } catch (e) {
                        console.error('Error parsing legacy completion report', e)
                    }
                }
            }
        }
        loadCompletionData()
    }, [job])

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setIsSubmitting(true)

        let location = null
        try {
            location = await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => {
                        console.warn('GPS Error', err)
                        resolve(null)
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                )
            })
        } catch (err) {
            console.warn('GPS specific error', err)
        }

        const newItems = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image',
            note: '',
            location: location
        }))

        setMediaItems(prev => [...prev, ...newItems])
        setIsSubmitting(false)
    }

    const removeMedia = (id) => {
        setMediaItems(prev => prev.filter(item => item.id !== id))
    }

    const updateMediaNote = (id, note) => {
        setMediaItems(prev => prev.map(item => item.id === id ? { ...item, note } : item))
    }

    const handleSave = async () => {
        if (!confirm('ยืนยันการบันทึกงาน? ข้อมูลจะถูกส่งเข้าระบบ')) return

        setIsSubmitting(true)
        try {
            // 1. Upload Signature if drawn
            let signatureUrl = null
            if (!sigCanvas.current.isEmpty()) {
                const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
                const res = await fetch(sigDataUrl)
                const blob = await res.blob()
                const file = new File([blob], 'signature.png', { type: 'image/png' })
                signatureUrl = await DataManager.uploadJobMedia(file, job.id)
            } else {
                // If not signed now, maybe use existing from DB? 
                // We'll rely on what's passed or fetch fresh? 
                // For simplicity: if new signature drawn, update it. If not, keep old (if we fetched it).
                // But we didn't fetch url to state.
            }

            // 2. Upload Media Items
            const uploadedMedia = await Promise.all(mediaItems.map(async (item) => {
                if (item.url) return item // Already uploaded

                const url = await DataManager.uploadJobMedia(item.file, job.id)
                return {
                    url,
                    type: item.type,
                    note: item.note,
                    location: item.location,
                    timestamp: new Date().toISOString()
                }
            }))

            // 3. Save to job_completions table
            const completionData = {
                job_id: job.id,
                signature_url: signatureUrl || job.signatureImage, // Fallback to job's existing sig if not redrawn
                rating,
                comment,
                media: uploadedMedia
            }

            const successCompletion = await DataManager.saveJobCompletion(completionData)
            if (!successCompletion) throw new Error('Failed to save completion data')

            // 4. Update Job Status & Legacy Signature Column
            const successJob = await DataManager.saveJob({
                ...job,
                status: 'Done',
                signatureImage: completionData.signature_url,
                // We don't append to notes anymore! Cleaner.
            })

            if (successJob) {
                alert('บันทึกข้อมูลเรียบร้อยแล้ว')
                if (onSave) onSave()
            } else {
                throw new Error('Failed to update job status')
            }

        } catch (error) {
            console.error('Error saving job completion:', error)
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Inspector Section */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                <h3 className="font-bold text-lg text-secondary-900 mb-4">ผู้ตรวจงาน (Inspector)</h3>

                {/* Signature */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">ลายเซ็นลูกค้า / ผู้ตรวจงาน</label>
                    <div className="border border-secondary-300 rounded-lg overflow-hidden bg-gray-50 h-40 relative">
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

            {/* Media Section */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                <h3 className="font-bold text-lg text-secondary-900 mb-4 flex justify-between items-center">
                    <span>รูปภาพ / วีดีโอการทำงาน</span>
                    <label className="flex items-center gap-1 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-100">
                        <Camera size={18} />
                        เพิ่มรูป/วีดีโอ
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                </h3>

                <div className="space-y-4">
                    {mediaItems.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            ยังไม่มีรูปภาพหรือวีดีโอ
                        </div>
                    )}

                    {mediaItems.map((item, index) => (
                        <div key={item.id} className="border border-secondary-200 rounded-lg overflow-hidden bg-gray-50">
                            {/* Media Preview */}
                            <div className="relative aspect-video bg-black">
                                {item.type === 'video' ? (
                                    <video src={item.preview || item.url} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={item.preview || item.url} alt="Work" className="w-full h-full object-contain" />
                                )}
                                <button
                                    onClick={() => removeMedia(item.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                                {item.location && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded flex items-center gap-1">
                                        <MapPin size={12} />
                                        {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
                                    </div>
                                )}
                            </div>

                            {/* Note Input */}
                            <div className="p-3">
                                <input
                                    type="text"
                                    value={item.note}
                                    onChange={(e) => updateMediaNote(item.id, e.target.value)}
                                    placeholder="คำอธิบายรูปภาพ..."
                                    className="w-full p-2 border border-secondary-300 rounded text-sm focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Bottom Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-secondary-200 shadow-lg z-20 md:hidden">
                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกงาน'}
                </button>
            </div>

            {/* Desktop Button (if viewed on desktop) */}
            <div className="hidden md:block">
                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกงาน'}
                </button>
            </div>
        </div>
    )
}
