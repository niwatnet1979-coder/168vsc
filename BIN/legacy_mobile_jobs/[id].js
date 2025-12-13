import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    Phone,
    Package,
    Wrench,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    Camera,
    Edit3,
    Save,
    X,
    DollarSign,
    FileText
} from 'lucide-react'

// Dynamic imports to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { ssr: false })
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false })

export default function MobileJobDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [signature, setSignature] = useState(null)
    const [photos, setPhotos] = useState([])
    const [problems, setProblems] = useState('')
    const [showProblemInput, setShowProblemInput] = useState(false)
    const [status, setStatus] = useState('')
    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const signatureRef = useRef(null)

    useEffect(() => {
        if (!id) return
        loadJobDetails()
    }, [id])

    const loadJobDetails = () => {
        const savedOrders = localStorage.getItem('orders_data')
        if (savedOrders) {
            const orders = JSON.parse(savedOrders)
            let foundJob = null

            for (const order of orders) {
                if (order.items && order.items.length > 0) {
                    for (let i = 0; i < order.items.length; i++) {
                        const item = order.items[i]
                        let uniqueId = item.subJob?.jobId

                        if (!uniqueId) {
                            const orderIdNum = parseInt(order.id.replace(/\D/g, '') || '0', 10)
                            const jobNum = (orderIdNum * 100) + (i + 1)
                            uniqueId = `JB${jobNum.toString().padStart(7, '0')}`
                        }

                        if (uniqueId === id) {
                            const hasSubJob = item.subJob && item.subJob.jobType
                            const jobSource = hasSubJob ? item.subJob : order.jobInfo

                            let customerName = 'Unknown'
                            let customerPhone = '-'
                            if (order.customer) {
                                if (typeof order.customer === 'object') {
                                    customerName = order.customer.name || 'Unknown'
                                    customerPhone = order.customer.phone || '-'
                                } else {
                                    customerName = order.customer
                                }
                            }

                            foundJob = {
                                uniqueId,
                                orderId: order.id,
                                customer: {
                                    name: customerName,
                                    phone: customerPhone,
                                    address: jobSource?.installAddress || jobSource?.installLocationName || '-',
                                    googleMapLink: jobSource?.googleMapLink || ''
                                },
                                product: item,
                                jobType: jobSource?.jobType || jobSource?.type || 'Unknown',
                                appointmentDate: jobSource?.appointmentDate || jobSource?.dateTime || '-',
                                team: jobSource?.team || '-',
                                inspector: jobSource?.inspector1?.name || '-',
                                description: jobSource?.description || '-',
                                status: order.status || 'รอดำเนินการ',
                                completion: item.completion || null,
                                // Payment info
                                totalAmount: parseInt(item.price) || 0,
                                paidAmount: order.paidAmount || 0
                            }

                            // Load existing completion data
                            if (foundJob.completion) {
                                setSignature(foundJob.completion.signature)
                                setPhotos(foundJob.completion.photos || [])
                                setProblems(foundJob.completion.problems || '')
                            }
                            setStatus(foundJob.status)
                            break
                        }
                    }
                }
                if (foundJob) break
            }

            setJob(foundJob)
            setLoading(false)
        }
    }

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files)
        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result])
            }
            reader.readAsDataURL(file)
        })
    }

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSaveSignature = () => {
        if (signatureRef.current) {
            const signatureData = signatureRef.current.toDataURL()
            setSignature(signatureData)
            setShowSignaturePad(false)
        }
    }

    const handleClearSignature = () => {
        if (signatureRef.current) {
            signatureRef.current.clear()
        }
    }

    const handleRemoveSignature = () => {
        setSignature(null)
    }

    const handleSaveCompletion = () => {
        if (!job) return

        const completionData = {
            signature,
            photos,
            problems,
            completedAt: new Date().toISOString(),
            completedBy: 'user@gmail.com' // TODO: Get from auth
        }

        // Update localStorage
        const savedOrders = localStorage.getItem('orders_data')
        if (savedOrders) {
            const orders = JSON.parse(savedOrders)

            for (const order of orders) {
                if (order.items) {
                    for (let i = 0; i < order.items.length; i++) {
                        const item = order.items[i]
                        let uniqueId = item.subJob?.jobId

                        if (!uniqueId) {
                            const orderIdNum = parseInt(order.id.replace(/\D/g, '') || '0', 10)
                            const jobNum = (orderIdNum * 100) + (i + 1)
                            uniqueId = `JB${jobNum.toString().padStart(7, '0')}`
                        }

                        if (uniqueId === id) {
                            item.completion = completionData
                            order.status = status
                            break
                        }
                    }
                }
            }

            localStorage.setItem('orders_data', JSON.stringify(orders))
            alert('บันทึกข้อมูลเรียบร้อย')
            router.push('/mobile-jobs')
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            'รอดำเนินการ': { bg: 'bg-warning-100', text: 'text-warning-700', icon: <Clock size={20} /> },
            'กำลังทำ': { bg: 'bg-primary-100', text: 'text-primary-700', icon: <AlertCircle size={20} /> },
            'เสร็จสิ้น': { bg: 'bg-success-100', text: 'text-success-700', icon: <CheckCircle size={20} /> }
        }
        const badge = badges[status] || badges['รอดำเนินการ']
        return (
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${badge.bg} ${badge.text}`}>
                {badge.icon}
                {status}
            </span>
        )
    }

    const getJobTypeIcon = (type) => {
        if (type === 'installation') return <Wrench size={24} className="text-danger-600" />
        if (type === 'delivery') return <Truck size={24} className="text-warning-600" />
        return <Package size={24} />
    }

    const getJobTypeLabel = (type) => {
        if (type === 'installation') return 'งานติดตั้ง'
        if (type === 'delivery') return 'งานส่งของ'
        return type
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const outstandingBalance = job ? job.totalAmount - job.paidAmount : 0

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center p-4">
                <AlertCircle size={64} className="text-secondary-300 mb-4" />
                <h1 className="text-2xl font-bold text-secondary-900 mb-2">ไม่พบข้อมูลงาน</h1>
                <p className="text-secondary-500 mb-6">ไม่พบรหัสงาน {id} ในระบบ</p>
                <button
                    onClick={() => router.push('/mobile-jobs')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium"
                >
                    กลับไปหน้างาน
                </button>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>งาน {job.uniqueId} - 168VSC Mobile</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            </Head>

            <div className="min-h-screen bg-secondary-50 pb-24">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white sticky top-0 z-10 shadow-lg">
                    <div className="px-4 py-4">
                        <button
                            onClick={() => router.push('/mobile-jobs')}
                            className="flex items-center gap-2 text-white mb-3 active:opacity-70"
                        >
                            <ArrowLeft size={20} />
                            <span>กลับ</span>
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold mb-1">{job.uniqueId}</h1>
                                <div className="flex items-center gap-2 text-primary-100 text-sm">
                                    {getJobTypeIcon(job.jobType)}
                                    <span>{getJobTypeLabel(job.jobType)}</span>
                                </div>
                            </div>
                            {getStatusBadge(status)}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-4 space-y-4">
                    {/* Appointment Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <Calendar size={20} className="text-primary-600" />
                            การนัดหมาย
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-secondary-500">วันที่และเวลา</p>
                                <p className="font-medium text-secondary-900">{formatDateTime(job.appointmentDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-secondary-500">ทีมปฏิบัติงาน</p>
                                <p className="font-medium text-secondary-900">{job.team}</p>
                            </div>
                            <div>
                                <p className="text-xs text-secondary-500">ผู้ตรวจงาน</p>
                                <p className="font-medium text-secondary-900">{job.inspector}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <User size={20} className="text-primary-600" />
                            ข้อมูลลูกค้า
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-secondary-500">ชื่อลูกค้า</p>
                                <p className="font-medium text-secondary-900">{job.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-secondary-500">เบอร์โทรศัพท์</p>
                                <a href={`tel:${job.customer.phone}`} className="flex items-center gap-2 text-primary-600 font-medium">
                                    <Phone size={16} />
                                    {job.customer.phone}
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-secondary-500">สถานที่</p>
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-secondary-400 mt-1 flex-shrink-0" />
                                    <p className="text-secondary-900">{job.customer.address}</p>
                                </div>
                                {job.customer.googleMapLink && (
                                    <a
                                        href={job.customer.googleMapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-sm text-primary-600 underline"
                                    >
                                        เปิด Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <Package size={20} className="text-primary-600" />
                            สินค้า
                        </h2>
                        <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-lg bg-secondary-50 border border-secondary-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {job.product.image ? (
                                    <img src={job.product.image} alt={job.product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={32} className="text-secondary-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-secondary-900 mb-1">{job.product.name}</h3>
                                <p className="text-xs text-secondary-500 font-mono mb-2">{job.product.id}</p>
                                <p className="text-lg font-bold text-primary-600">฿{job.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    {outstandingBalance > 0 && (
                        <div className="bg-warning-50 border-2 border-warning-200 rounded-xl p-4">
                            <h2 className="font-bold text-warning-900 mb-3 flex items-center gap-2">
                                <DollarSign size={20} />
                                ยอดคงค้าง
                            </h2>
                            <div className="text-center py-4">
                                <p className="text-sm text-warning-700 mb-2">ยอดที่ต้องชำระ</p>
                                <p className="text-4xl font-bold text-warning-900 mb-4">
                                    ฿{outstandingBalance.toLocaleString()}
                                </p>
                                {/* QR Code for Payment */}
                                <div className="bg-white rounded-lg p-4 inline-block shadow-md">
                                    {typeof window !== 'undefined' && (
                                        <QRCode
                                            value={`Payment for Job ${job.uniqueId}: ฿${outstandingBalance}`}
                                            size={192}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                    <p className="text-xs text-secondary-500 mt-2">สแกนเพื่อชำระเงิน</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Update */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3">อัปเดตสถานะงาน</h2>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setStatus('รอดำเนินการ')}
                                className={`py-3 rounded-lg font-medium text-sm transition-all ${status === 'รอดำเนินการ'
                                    ? 'bg-warning-600 text-white shadow-lg'
                                    : 'bg-warning-50 text-warning-700 border border-warning-200'
                                    }`}
                            >
                                รอดำเนินการ
                            </button>
                            <button
                                onClick={() => setStatus('กำลังทำ')}
                                className={`py-3 rounded-lg font-medium text-sm transition-all ${status === 'กำลังทำ'
                                    ? 'bg-primary-600 text-white shadow-lg'
                                    : 'bg-primary-50 text-primary-700 border border-primary-200'
                                    }`}
                            >
                                กำลังทำ
                            </button>
                            <button
                                onClick={() => setStatus('เสร็จสิ้น')}
                                className={`py-3 rounded-lg font-medium text-sm transition-all ${status === 'เสร็จสิ้น'
                                    ? 'bg-success-600 text-white shadow-lg'
                                    : 'bg-success-50 text-success-700 border border-success-200'
                                    }`}
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </div>

                    {/* Signature Pad */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <Edit3 size={20} className="text-primary-600" />
                            ลายเซ็นผู้ตรวจงาน
                        </h2>

                        {signature ? (
                            <div className="space-y-3">
                                <div className="border-2 border-success-200 rounded-lg p-2 bg-success-50">
                                    <img src={signature} alt="Signature" className="w-full h-auto" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowSignaturePad(true)}
                                        className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium"
                                    >
                                        เซ็นใหม่
                                    </button>
                                    <button
                                        onClick={handleRemoveSignature}
                                        className="px-4 py-2 bg-danger-600 text-white rounded-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSignaturePad(true)}
                                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                <Edit3 size={20} />
                                เซ็นชื่อ
                            </button>
                        )}
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <Camera size={20} className="text-primary-600" />
                            รูปภาพงาน
                        </h2>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-secondary-200">
                                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="absolute top-1 right-1 bg-danger-600 text-white rounded-full p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <label className="block w-full py-3 bg-primary-600 text-white text-center rounded-lg font-medium cursor-pointer active:bg-primary-700">
                            <Camera size={20} className="inline mr-2" />
                            ถ่ายรูป / เลือกรูป
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Problem Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
                        <h2 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <FileText size={20} className="text-primary-600" />
                            บันทึกปัญหา / หมายเหตุ
                        </h2>
                        <textarea
                            value={problems}
                            onChange={(e) => setProblems(e.target.value)}
                            placeholder="บันทึกปัญหาหรือหมายเหตุที่พบระหว่างทำงาน..."
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                        />
                    </div>
                </div>

                {/* Fixed Bottom Button */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 p-4 shadow-lg">
                    <button
                        onClick={handleSaveCompletion}
                        className="w-full py-4 bg-success-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:bg-success-700 shadow-lg"
                    >
                        <Save size={24} />
                        บันทึกข้อมูล
                    </button>
                </div>

                {/* Signature Pad Modal */}
                {showSignaturePad && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
                                <h3 className="font-bold text-lg">ลายเซ็นผู้ตรวจงาน</h3>
                                <button
                                    onClick={() => setShowSignaturePad(false)}
                                    className="p-2 hover:bg-secondary-100 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="border-2 border-secondary-300 rounded-lg overflow-hidden bg-white">
                                    {typeof window !== 'undefined' && (
                                        <SignatureCanvas
                                            ref={signatureRef}
                                            canvasProps={{
                                                className: 'w-full h-64',
                                                style: { touchAction: 'none' }
                                            }}
                                            backgroundColor="white"
                                        />
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleClearSignature}
                                        className="flex-1 py-3 border border-secondary-300 text-secondary-700 rounded-lg font-medium"
                                    >
                                        ล้าง
                                    </button>
                                    <button
                                        onClick={handleSaveSignature}
                                        className="flex-1 py-3 bg-success-600 text-white rounded-lg font-medium"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
