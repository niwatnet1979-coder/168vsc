import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
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
    Save
} from 'lucide-react'

export default function JobDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        const loadJobDetails = () => {
            const savedOrders = localStorage.getItem('orders_data')
            if (savedOrders) {
                const orders = JSON.parse(savedOrders)
                // Parse Job ID (Format: ORD-XXX-XX)
                // Assuming format is OrderID-Index (padded)
                // We need to find the order that contains this job

                let foundJob = null;

                // Simple search through all orders and items to match the unique ID logic
                for (const order of orders) {
                    if (order.items && order.items.length > 0) {
                        for (let i = 0; i < order.items.length; i++) {
                            const item = order.items[i];

                            // Check persistent Job ID first
                            let uniqueId = item.subJob?.jobId;

                            // Fallback reconstruction if missing
                            if (!uniqueId) {
                                const orderIdNum = parseInt(order.id.replace(/\D/g, '') || '0', 10);
                                const jobNum = (orderIdNum * 100) + (i + 1);
                                uniqueId = `JB${jobNum.toString().padStart(7, '0')}`;
                            }

                            if (uniqueId === id) {
                                // Found the job!
                                const hasSubJob = item.subJob && item.subJob.jobType;
                                const jobSource = hasSubJob ? item.subJob : order.jobInfo;

                                // Handle customer name
                                let customerName = 'Unknown';
                                let customerPhone = '-';
                                let customerAddress = '-';

                                if (order.customer) {
                                    if (typeof order.customer === 'object') {
                                        customerName = order.customer.name || 'Unknown';
                                        customerPhone = order.customer.phone || '-';
                                        // Try to find address from customer data if not in job source
                                    } else {
                                        customerName = order.customer;
                                    }
                                }

                                foundJob = {
                                    uniqueId: uniqueId,
                                    orderId: order.id,
                                    customer: {
                                        name: customerName,
                                        phone: customerPhone,
                                        address: jobSource?.installAddress || jobSource?.installLocationName || '-'
                                    },
                                    product: item,
                                    jobType: jobSource?.jobType || jobSource?.type || 'Unknown',
                                    appointmentDate: jobSource?.appointmentDate || jobSource?.dateTime || '-',
                                    team: jobSource?.team || '-',
                                    inspector: jobSource?.inspector1?.name || '-',
                                    description: jobSource?.description || '-',
                                    status: order.status || 'Pending' // Currently status is at order level, might need job level status later
                                }
                                break;
                            }
                        }
                    }
                    if (foundJob) break;
                }

                setJob(foundJob)
                setLoading(false)
            }
        }

        loadJobDetails()
    }, [id])

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </AppLayout>
        )
    }

    if (!job) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <AlertCircle size={64} className="text-secondary-300 mb-4" />
                    <h1 className="text-2xl font-bold text-secondary-900">ไม่พบข้อมูลงาน</h1>
                    <p className="text-secondary-500 mt-2">ไม่พบรหัสงาน {id} ในระบบ</p>
                    <Link href="/jobs" className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        กลับไปหน้าคิวงาน
                    </Link>
                </div>
            </AppLayout>
        )
    }

    const getJobTypeIcon = (type) => {
        if (type === 'installation') return <Wrench size={24} />
        if (type === 'delivery') return <Truck size={24} />
        return <Package size={24} />
    }

    const getJobTypeLabel = (type) => {
        if (type === 'installation') return 'งานติดตั้ง'
        if (type === 'delivery') return 'งานส่งของ'
        return type
    }

    return (
        <AppLayout>
            <Head>
                <title>รายละเอียดงาน {job.uniqueId} - 168VSC System</title>
            </Head>

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Back Button */}
                <Link href="/jobs" className="inline-flex items-center text-secondary-500 hover:text-primary-600 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    กลับไปหน้าคิวงาน
                </Link>

                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-secondary-900">{job.uniqueId}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${job.jobType === 'installation' ? 'bg-danger-50 text-danger-700 border-danger-100' :
                                    job.jobType === 'delivery' ? 'bg-warning-50 text-warning-700 border-warning-100' :
                                        'bg-secondary-50 text-secondary-700 border-secondary-100'
                                    }`}>
                                    <span className="flex items-center gap-1">
                                        {getJobTypeIcon(job.jobType)}
                                        {getJobTypeLabel(job.jobType)}
                                    </span>
                                </span>
                            </div>
                            <p className="text-secondary-500">
                                Order ID: <Link href={`/order?id=${job.orderId}`} className="text-primary-600 hover:underline font-mono">{job.orderId}</Link>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${job.status === 'Completed' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                                }`}>
                                {job.status === 'Completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                {job.status}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Job & Customer Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Job Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
                                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                    <Calendar size={20} className="text-primary-600" />
                                    ข้อมูลการนัดหมาย
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-500 mb-1">วันที่และเวลา</label>
                                    <div className="text-lg font-medium text-secondary-900">
                                        {job.appointmentDate !== '-' ? new Date(job.appointmentDate).toLocaleString('th-TH', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-500 mb-1">ทีมช่างปฏิบัติงาน</label>
                                    <div className="text-lg font-medium text-secondary-900 flex items-center gap-2">
                                        <User size={18} className="text-secondary-400" />
                                        {job.team}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-500 mb-1">ผู้ตรวจงาน (Inspector)</label>
                                    <div className="text-base text-secondary-900">
                                        {job.inspector}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-500 mb-1">รายละเอียดเพิ่มเติม / หมายเหตุ</label>
                                    <div className="p-3 bg-secondary-50 rounded-lg text-secondary-700 border border-secondary-100 min-h-[80px]">
                                        {job.description}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
                                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                    <Package size={20} className="text-primary-600" />
                                    สินค้าที่ต้องดำเนินการ
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
                                        {job.product.image ? (
                                            <img src={job.product.image} alt={job.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={32} className="text-secondary-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-secondary-900 mb-1">{job.product.name}</h3>
                                        <p className="text-secondary-500 font-mono text-sm mb-2">{job.product.id}</p>
                                        <div className="flex items-center gap-4 text-sm text-secondary-600">
                                            <span className="bg-secondary-100 px-2 py-1 rounded">จำนวน: 1 ชิ้น</span>
                                            <span className="bg-secondary-100 px-2 py-1 rounded">ราคา: ฿{parseInt(job.product.price).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer & Location */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
                                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                    <User size={20} className="text-primary-600" />
                                    ข้อมูลลูกค้า
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">ชื่อลูกค้า</label>
                                    <div className="font-medium text-secondary-900">{job.customer.name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">เบอร์โทรศัพท์</label>
                                    <div className="flex items-center gap-2 text-secondary-900">
                                        <Phone size={16} className="text-secondary-400" />
                                        {job.customer.phone}
                                    </div>
                                </div>
                                <hr className="border-secondary-100" />
                                <div>
                                    <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">สถานที่ติดตั้ง / จัดส่ง</label>
                                    <div className="flex items-start gap-2 text-secondary-900">
                                        <MapPin size={18} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{job.customer.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions (Placeholder for future features) */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
                                <h2 className="text-lg font-bold text-secondary-900">การจัดการ</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <button className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
                                    อัปเดตสถานะงาน
                                </button>
                                <button className="w-full py-2 px-4 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium">
                                    พิมพ์ใบงาน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
