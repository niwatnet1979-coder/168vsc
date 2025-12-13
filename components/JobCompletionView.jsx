import React, { useState, useRef, useEffect } from 'react'
import { Camera, MapPin, X, Star, Save, Upload, Video } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import DataManager from '../lib/dataManager'

export default function JobCompletionView({ job, onSave }) {
    const [mediaItems, setMediaItems] = useState([])
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const sigCanvas = useRef({})

    // Load existing completion data if any (from notes)
    useEffect(() => {
        if (job?.notes && job.notes.includes('[COMPLETION_REPORT]')) {
            try {
                // Extract JSON from notes
                const reportMatch = job.notes.match(/\[COMPLETION_REPORT\]\s*(\{.*\})/)
                if (reportMatch && reportMatch[1]) {
                    const report = JSON.parse(reportMatch[1])
                    setRating(report.rating || 5)
                    setComment(report.comment || '')
                    setMediaItems(report.media || [])
                }
            } catch (e) {
                console.error('Error parsing completion report', e)
            }
        }
    }, [job])

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setIsSubmitting(true) // Show loading state while processing initial file read

        // Get current location once for this batch (or per file if needed, but batch is faster)
        let location = null
        try {
            location = await new Promise((resolve, reject) => {
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
            file, // Raw file to upload later or now? Better upload on Save to avoid junk? 
            // Request: "save as file in storage supabase". 
            // If we don't upload now, we can't show "real" preview if it's video easily without URL object.
            // URL.createObjectURL works for preview.
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
            // 1. Upload Signature if changed (or existing)
            let signatureUrl = job.signatureImage // Keep existing
            if (!sigCanvas.current.isEmpty()) {
                // Upload signature
                const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
                // Convert DataURL to Blob
                const res = await fetch(sigDataUrl)
                const blob = await res.blob()
                const file = new File([blob], 'signature.png', { type: 'image/png' })

                // Use generic file upload or slip? Creating a consistent one.
                // Re-using uploadPaymentSlip logic or the new uploadJobMedia? 
                // Let's use uploadJobMedia for consistency but it goes to 'job-media' bucket.
                // Usually signature goes to 'signature_image_url' column, so we just need a URL.
                signatureUrl = await DataManager.uploadJobMedia(file, job.id)
            }

            // 2. Upload Media Items
            const uploadedMedia = await Promise.all(mediaItems.map(async (item) => {
                if (item.url) return item // Already uploaded

                // Upload file
                const url = await DataManager.uploadJobMedia(item.file, job.id)
                return {
                    url,
                    type: item.type,
                    note: item.note,
                    location: item.location,
                    timestamp: new Date().toISOString()
                }
            }))

            // 3. Construct Report Data
            const completionReport = {
                rating,
                comment,
                media: uploadedMedia,
                inspector_timestamp: new Date().toISOString()
            }

            // 4. Save to DB
            // We append to notes because we don't have a specific column yet
            // Format: [COMPLETION_REPORT] { JSON }
            // First remove old report if any
            let newNotes = job.notes || ''
            newNotes = newNotes.replace(/\[COMPLETION_REPORT\]\s*\{.*\}/s, '').trim()
            newNotes = `${newNotes}\n\n[COMPLETION_REPORT] ${JSON.stringify(completionReport)}`

            const success = await DataManager.saveJob({
                ...job,
                notes: newNotes,
                signatureImage: signatureUrl, // Updates the column
                status: 'Done' // Auto complete? Or just save? Request says "บันทึกงาน" (Record Job), implying completion.
                // Let's keep status update optional or separate. 
                // User request "บันทึกงาน" usually means "Save Record".
            })

            if (success) {
                alert('บันทึกข้อมูลเรียบร้อยแล้ว')
                if (onSave) onSave()
            } else {
                throw new Error('Database save failed')
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
                                    <video src={item.preview} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={item.preview} alt="Work" className="w-full h-full object-contain" />
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
                    {isSubmitting ? (
                        <>กำลังบันทึก...</>
                    ) : (
                        <>
                            <Save size={20} />
                            บันทึกงาน
                        </>
                    )}
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
