import React, { useState, useRef, useEffect } from 'react'
import { Camera, MapPin, X, Star, Save, Upload, Video, Calendar, Smartphone, FileText, Image } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { DataManager } from '../lib/dataManager'
import VideoRecorderModal from './VideoRecorderModal'

export default function JobCompletionView({ job, onSave }) {
    const [mediaItems, setMediaItems] = useState([])
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showVideoRecorder, setShowVideoRecorder] = useState(false)
    const sigCanvas = useRef({})

    // ... (rest of the existing useEffect code) ...
    // Note: I need to be careful with replace_file_content not to overwrite the middle. 
    // The previous tool call output shows the full file content was ~302 lines.
    // I should probably use `view_file` again to make sure I have the latest line numbers or structure.
    // BUT I can see previous `replace_file_content` outputs.
    // I will rewrite the top imports and state, and the method to add the file.

    // Actually, simply adding the import at top and the Modal at bottom + Button in render is enough.
    // I will use `replace_file_content` on specific blocks.
    // Load existing completion data from job_completions table
    useEffect(() => {
        const loadCompletionData = async () => {
            if (!job?.id) return
            const data = await DataManager.getJobCompletion(job.id)
            if (data) {
                setRating(data.rating || 5)
                setComment(data.comment || '')
                // Assign unique IDs to loaded media items since invalid/missing IDs cause React key duplication and bulk delete issues
                const loadedMedia = (data.media || []).map(item => ({
                    ...item,
                    id: item.id || (Date.now() + Math.random().toString(36).substr(2, 9))
                }))
                setMediaItems(loadedMedia)
            } else {
                // Backward compatibility: check notes
                if (job?.notes && job.notes.includes('[COMPLETION_REPORT]')) {
                    try {
                        const reportMatch = job.notes.match(/\[COMPLETION_REPORT\]\s*(\{.*\})/)
                        if (reportMatch && reportMatch[1]) {
                            const report = JSON.parse(reportMatch[1])
                            setRating(report.rating || 5)
                            setComment(report.comment || '')
                            // Assign unique IDs here too
                            const loadedMedia = (report.media || []).map(item => ({
                                ...item,
                                id: item.id || (Date.now() + Math.random().toString(36).substr(2, 9))
                            }))
                            setMediaItems(loadedMedia)
                        }
                    } catch (e) {
                        console.error('Error parsing legacy completion report', e)
                    }
                }
            }
        }
        loadCompletionData()
    }, [job])

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

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

        const newItems = await Promise.all(files.map(async (file) => {
            const preview = URL.createObjectURL(file)
            const type = file.type.startsWith('video') ? 'video' : 'image'
            let meta = ''

            if (type === 'video') {
                try {
                    meta = await new Promise((resolve) => {
                        const video = document.createElement('video')
                        video.preload = 'metadata'
                        video.onloadedmetadata = () => {
                            resolve(`${video.videoWidth}x${video.videoHeight}`)
                        }
                        video.onerror = () => resolve('')
                        video.src = preview
                    })
                } catch (e) {
                    console.error('Error getting video meta', e)
                }
            } else if (type === 'image') {
                try {
                    meta = await new Promise((resolve) => {
                        const img = new Image()
                        img.onload = () => resolve(`${img.width}x${img.height}`)
                        img.onerror = () => resolve('')
                        img.src = preview
                    })
                } catch (e) { }
            }

            return {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                file,
                preview,
                type,
                note: '',
                location: location,
                resolution: meta,
                size: formatFileSize(file.size),
                status: 'pending', // pending, uploading, success
                timestamp: new Date().toISOString()
            }
        }))

        setMediaItems(prev => [...prev, ...newItems])
        setIsSubmitting(false)
    }

    const handleVideoSave = async (file) => {
        if (!file) return

        // Similar logic to handleFileUpload but for single file
        let location = null
        try {
            location = await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => resolve(null),
                    { enableHighAccuracy: true, timeout: 5000 }
                )
            })
        } catch (err) { }

        const preview = URL.createObjectURL(file)
        let meta = ''
        try {
            meta = await new Promise((resolve) => {
                const video = document.createElement('video')
                video.preload = 'metadata'
                video.onloadedmetadata = () => {
                    resolve(`${video.videoWidth}x${video.videoHeight}`)
                }
                video.onerror = () => resolve('')
                video.src = preview
            })
        } catch (e) { }

        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            file,
            preview,
            type: 'video',
            note: '',
            location: location,
            resolution: meta,
            size: formatFileSize(file.size),
            status: 'pending',
            timestamp: new Date().toISOString()
        }

        setMediaItems(prev => [...prev, newItem])
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
            if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                // Use toDataURL directly to avoid trim_canvas dependency issues
                const sigDataUrl = sigCanvas.current.toDataURL('image/png')
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

            // 2. Upload Media Items with Progress
            // We clone items to result array to keep track
            const finalMediaItems = []

            for (const item of mediaItems) {
                if (item.url) {
                    finalMediaItems.push(item)
                    continue
                }

                // Update status to uploading
                setMediaItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'uploading' } : p))

                try {
                    const url = await DataManager.uploadJobMedia(item.file, job.id)
                    if (!url) throw new Error('Upload failed')

                    // Update status to success
                    setMediaItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'success' } : p))

                    finalMediaItems.push({
                        url,
                        type: item.type,
                        note: item.note,
                        location: item.location,
                        timestamp: new Date().toISOString(),
                        resolution: item.resolution,
                        size: item.size
                    })
                } catch (error) {
                    console.error('Upload error', error)
                    setMediaItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' } : p))
                    // If one fails, should we stop? or continue?
                    // For now, allow partial save or throw?
                    // Request implies knowing "when finished".
                    // If error, we throw to abort save?
                    throw new Error(`ไม่สามารถอัพโหลดไฟล์ (${item.type}) ได้`)
                }
            }

            // 3. Save to job_completions table
            const completionData = {
                job_id: job.id,
                signature_url: signatureUrl || job.signatureImage, // Fallback to job's existing sig if not redrawn
                rating,
                comment,
                media: finalMediaItems
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-secondary-900 font-bold text-lg">
                        <Image className="text-primary-600" size={24} />
                        <span>รูปภาพและวิดีโอ</span>
                    </div>

                    <div className="flex gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => setShowVideoRecorder(true)}
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                            <Video size={18} />
                            ถ่ายวิดีโอ (HD)
                        </button>

                        <label className="flex items-center gap-1 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-100 transition-colors">
                            <Camera size={18} />
                            เพิ่มรูป/วิดีโอ
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                </div>

                <VideoRecorderModal
                    isOpen={showVideoRecorder}
                    onClose={() => setShowVideoRecorder(false)}
                    onSave={handleVideoSave}
                />

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
                                    <video src={item.preview || item.url} controls playsInline preload="auto" className="w-full h-full object-contain" />
                                ) : (
                                    <img src={item.preview || item.url} alt="Work" className="w-full h-full object-contain" />
                                )}
                                <button
                                    onClick={() => removeMedia(item.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                                {/* Upload Status Overlay */}
                                {item.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                                        <span className="text-xs font-medium">กำลังอัปโหลด...</span>
                                    </div>
                                )}
                                {item.status === 'success' && (
                                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                        <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                                            <Save size={20} />
                                        </div>
                                    </div>
                                )}
                                {!item.status && item.url && (
                                    /* Saved items */
                                    null
                                )}
                            </div>

                            {/* Media Info Row */}
                            <div className="px-3 pt-2 flex flex-wrap gap-2 items-center text-[10px] text-gray-500">
                                {/* 1. Date/Time */}
                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                    <Calendar size={10} className="text-gray-400" />
                                    <span>
                                        {new Date(item.timestamp || new Date()).toLocaleString('th-TH', {
                                            day: '2-digit', month: '2-digit', year: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {/* 2. GPS Location */}
                                {item.location && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full truncate max-w-[140px] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MapPin size={10} className="text-gray-400" />
                                        <span>{item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}</span>
                                    </a>
                                )}

                                {/* 3. Resolution */}
                                {item.resolution && (
                                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                                        <Smartphone size={10} className="text-gray-400" />
                                        <span>{item.resolution}</span>
                                    </div>
                                )}

                                {/* 4. File Size */}
                                {item.size && (
                                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                                        <FileText size={10} className="text-gray-400" />
                                        <span>{item.size}</span>
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
