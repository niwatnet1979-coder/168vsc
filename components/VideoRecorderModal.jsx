import React, { useState, useRef, useEffect } from 'react'
import { X, Video, StopCircle, RefreshCw, Check, Camera } from 'lucide-react'

export default function VideoRecorderModal({ isOpen, onClose, onSave }) {
    const videoRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [recording, setRecording] = useState(false)
    const [recordedChunks, setRecordedChunks] = useState([])
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewBlob, setPreviewBlob] = useState(null)
    const [duration, setDuration] = useState(0)
    const [facingMode, setFacingMode] = useState('environment') // 'user' or 'environment'
    const timerRef = useRef(null)

    // Clean up on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopStream()
        } else {
            startCamera()
        }
        return () => {
            stopStream()
        }
    }, [isOpen, facingMode])

    const startCamera = async () => {
        stopStream() // Ensure previous stream is closed
        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            }
            const s = await navigator.mediaDevices.getUserMedia(constraints)
            setStream(s)
            if (videoRef.current) {
                videoRef.current.srcObject = s
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            alert("ไม่สามารถเข้าถึงกล้องได้: " + err.message)
            onClose()
        }
    }

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const startRecording = () => {
        setRecordedChunks([])
        setDuration(0)

        try {
            // Prefer mp4/h264 if available for better compatibility, otherwise webm
            // iOS 14.8+ supports video/mp4
            const options = MediaRecorder.isTypeSupported('video/mp4')
                ? { mimeType: 'video/mp4' }
                : (MediaRecorder.isTypeSupported('video/webm;codecs=h264')
                    ? { mimeType: 'video/webm;codecs=h264' }
                    : undefined)

            const recorder = new MediaRecorder(stream, options)

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setRecordedChunks(prev => [...prev, e.data])
                }
            }

            recorder.onstop = () => {
                // Determine mime type used
                // We will assemble blob later in 'retake' or 'save' logic
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setRecording(true)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error("Error starting recording:", err)
            alert("ไม่สามารถบันทึกวิดีโอได้: " + err.message)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop()
            setRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    // Effect to generate preview URL once chunks are ready and recording stopped
    useEffect(() => {
        if (!recording && recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' }) // Force label as mp4 for simplicity, or detect
            setPreviewBlob(blob)
            setPreviewUrl(URL.createObjectURL(blob))
        }
    }, [recording, recordedChunks])


    const handleRetake = () => {
        setPreviewUrl(null)
        setPreviewBlob(null)
        setRecordedChunks([])
        setDuration(0)
        startCamera()
    }

    const handleConfirm = () => {
        if (previewBlob) {
            // Convert to File object
            const file = new File([previewBlob], `video_${Date.now()}.mp4`, { type: 'video/mp4' })
            onSave(file)
            onClose()
        }
    }

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            {/* Header / Close */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent text-white">
                <div className="text-sm font-medium">
                    {recording ? (
                        <span className="flex items-center gap-2 text-red-500">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            {formatTime(duration)}
                        </span>
                    ) : (
                        <span>กล้องวิดีโอ HD (720p)</span>
                    )}
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
                    <X size={24} />
                </button>
            </div>

            {/* Viewport */}
            <div className="w-full h-full relative flex items-center justify-center bg-black">
                {previewUrl ? (
                    <video
                        src={previewUrl}
                        controls
                        className="max-w-full max-h-full"
                        playsInline
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 w-full p-8 flex justify-center items-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
                {previewUrl ? (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100"
                        >
                            <div className="p-3 rounded-full bg-gray-700">
                                <RefreshCw size={24} />
                            </div>
                            <span className="text-xs">ถ่ายใหม่</span>
                        </button>

                        <button
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-1 text-white hover:scale-105 transition-transform"
                        >
                            <div className="p-4 rounded-full bg-primary-600 shadow-lg shadow-primary-600/30">
                                <Check size={32} />
                            </div>
                            <span className="text-xs font-bold">ใช้คลิปนี้</span>
                        </button>
                    </>
                ) : (
                    <>
                        {!recording && (
                            <button
                                onClick={switchCamera}
                                className="absolute left-8 text-white opacity-80 hover:opacity-100"
                            >
                                <RefreshCw size={24} />
                            </button>
                        )}

                        <button
                            onClick={recording ? stopRecording : startRecording}
                            className={`p-1 rounded-full border-4 border-white transition-all duration-200 ${recording ? 'bg-red-500 scale-110' : 'bg-transparent hover:bg-white/20'
                                }`}
                        >
                            <div className={`transition-all duration-200 ${recording
                                    ? 'w-6 h-6 rounded bg-white m-3'
                                    : 'w-14 h-14 rounded-full bg-red-500 m-1'
                                }`}></div>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
