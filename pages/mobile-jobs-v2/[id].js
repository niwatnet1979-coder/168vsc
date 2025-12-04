import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import ProtectedRoute from '../../components/ProtectedRoute'
import AppLayout from '../../components/AppLayout'
import { DataManager } from '../../lib/dataManager'
import {
    ArrowLeft,
    User,
    Package,
    CreditCard,
    FileText,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Wrench,
    Truck,
    Camera,
    Upload
} from 'lucide-react'

export default function MobileJobDetail() {
    const router = useRouter()
    const { id } = router.query
    const { data: session } = useSession()

    const [job, setJob] = useState(null)
    const [customer, setCustomer] = useState(null)
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('customer')

    useEffect(() => {
        if (!id) return

        const loadJobDetails = () => {
            try {
                // Get job from jobs_data
                const jobs = DataManager.getJobs()
                const foundJob = jobs.find(j => j.id === id)

                if (!foundJob) {
                    setLoading(false)
                    return
                }

                setJob(foundJob)

                // Get customer details
                const customersData = localStorage.getItem('customers_data')
                if (customersData) {
                    const customers = JSON.parse(customersData)
                    const foundCustomer = customers.find(c => c.id === foundJob.customerId)
                    setCustomer(foundCustomer)
                }

                // Get product details
                const productsData = localStorage.getItem('products_data_v3')
                if (productsData) {
                    const products = JSON.parse(productsData)
                    const foundProduct = products.find(p => p.code === foundJob.productId)
                    setProduct(foundProduct)
                }

                setLoading(false)
            } catch (error) {
                console.error('Error loading job details:', error)
                setLoading(false)
            }
        }

        loadJobDetails()
    }, [id])

    if (loading) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    if (!job) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="text-center py-12">
                        <p className="text-secondary-500">ไม่พบข้อมูลงาน</p>
                        <Link href="/mobile-jobs-v2" className="mt-4 inline-block text-primary-600 hover:underline">
                            กลับไปหน้า Mobile Jobs
                        </Link>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    const tabs = [
        { id: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
        { id: 'product', label: 'ข้อมูลสินค้า', icon: Package },
        { id: 'payment', label: 'การชำระเงิน', icon: CreditCard },
        { id: 'other', label: 'อื่นๆ', icon: FileText }
    ]

    return (
        <ProtectedRoute>
            <AppLayout>
                <Head>
                    <title>Job {job.id} - Mobile Jobs</title>
                </Head>

                <div className="space-y-4 pb-20">
                    {/* Header */}
                    <div className="sticky top-0 bg-secondary-50 z-10 pb-4">
                        <Link href="/mobile-jobs-v2" className="inline-flex items-center text-secondary-500 hover:text-primary-600 mb-2">
                            <ArrowLeft size={20} className="mr-2" />
                            กลับ
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900">{job.id}</h1>
                                <p className="text-sm text-secondary-500">Order: {job.orderId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {job.rawJobType === 'installation' ? (
                                    <Wrench size={20} className="text-primary-600" />
                                ) : (
                                    <Truck size={20} className="text-warning-600" />
                                )}
                                <span className="text-sm font-medium">{job.jobType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'border-primary-600 text-primary-600 bg-primary-50'
                                            : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Icon size={16} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                            {/* Tab 1: Customer Details */}
                            {activeTab === 'customer' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-secondary-900 mb-4">ข้อมูลลูกค้า</h2>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">ชื่อลูกค้า</label>
                                            <div className="text-base font-medium text-secondary-900">{job.customerName}</div>
                                        </div>

                                        {customer && (
                                            <>
                                                {customer.phone && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">เบอร์โทรศัพท์</label>
                                                        <div className="flex items-center gap-2 text-secondary-900">
                                                            <Phone size={16} className="text-secondary-400" />
                                                            <a href={`tel:${customer.phone}`} className="text-primary-600 hover:underline">
                                                                {customer.phone}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    <MapPin className="text-secondary-400 mt-0.5 flex-shrink-0" size={18} />
                                                    <div>
                                                        <label className="block text-xs font-medium text-secondary-500 uppercase mb-0.5">ที่อยู่ติดตั้ง/จัดส่ง</label>
                                                        <div className="text-secondary-900">
                                                            {(() => {
                                                                if (job.address && job.address !== '-') return job.address
                                                                if (job.order?.address && job.order.address !== '-') return job.order.address
                                                                if (job.customer?.address && job.customer.address !== '-') return job.customer.address
                                                                if (job.customer?.addresses?.length > 0) return job.customer.addresses[0].address
                                                                return '-'
                                                            })()}
                                                        </div>
                                                        {/* Google Maps Link */}
                                                        {(() => {
                                                            const addr = job.address && job.address !== '-' ? job.address :
                                                                (job.order?.address && job.order.address !== '-' ? job.order.address :
                                                                    (job.customer?.address && job.customer.address !== '-' ? job.customer.address :
                                                                        (job.customer?.addresses?.length > 0 ? job.customer.addresses[0].address : null)))

                                                            if (!addr) return null

                                                            return (
                                                                <a
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-primary-600 mt-1 hover:underline"
                                                                >
                                                                    เปิดในแผนที่
                                                                </a>
                                                            )
                                                        })()}
                                                    </div>
                                                </div>

                                                {customer.email && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">อีเมล</label>
                                                        <div className="text-secondary-900">{customer.email}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">วันที่นัดหมาย</label>
                                                <div className="flex items-center gap-2 text-secondary-900">
                                                    <Calendar size={16} className="text-secondary-400" />
                                                    <span>{job.jobDate || '-'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">เวลา</label>
                                                <div className="flex items-center gap-2 text-secondary-900">
                                                    <Clock size={16} className="text-secondary-400" />
                                                    <span>{job.jobTime || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">ทีมงาน</label>
                                            <div className="text-secondary-900">{job.assignedTeam === 'ทีม A' ? '-' : (job.assignedTeam || '-')}</div>
                                        </div>

                                        {/* Additional Customer Info */}
                                        {customer && (
                                            <div className="bg-secondary-50 rounded-xl p-4 space-y-3 border border-secondary-100 mt-4">
                                                <h3 className="text-sm font-semibold text-secondary-900 mb-2">ข้อมูลเพิ่มเติม</h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">ประเภทลูกค้า</span>
                                                        <span className="text-secondary-900 font-medium">{customer.customerType || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">เลขผู้เสียภาษี</span>
                                                        <span className="text-secondary-900 font-medium">{customer.taxId || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">ผู้ติดต่อ</span>
                                                        <span className="text-secondary-900 font-medium">{customer.contactPerson || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">Line ID</span>
                                                        <span className="text-secondary-900 font-medium">{customer.lineId || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Product Details */}
                            {activeTab === 'product' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-secondary-900">ข้อมูลสินค้า</h2>

                                    {/* Main Info */}
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex-shrink-0">
                                            {job.productImage ? (
                                                <img src={job.productImage} alt={job.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={32} className="text-secondary-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-secondary-900 mb-1">{job.productName}</h3>
                                            <p className="text-sm text-secondary-500 font-mono mb-2">{job.productId}</p>
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {product?.category || 'ไม่ระบุหมวดหมู่'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Specs */}
                                    {(() => {
                                        const displayProduct = product || { name: job.productName, id: job.productId }
                                        return (
                                            <div className="bg-secondary-50 rounded-xl p-4 space-y-3 border border-secondary-100">
                                                <h3 className="text-sm font-semibold text-secondary-900 mb-2">คุณสมบัติสินค้า</h3>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">หมวดหมู่ย่อย</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.subcategory || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">ราคา</span>
                                                        <span className="text-secondary-900 font-medium">฿{displayProduct.price?.toLocaleString() || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">ขนาด (กxยxส)</span>
                                                        <span className="text-secondary-900 font-medium">
                                                            {(displayProduct.width || displayProduct.length || displayProduct.height)
                                                                ? `${displayProduct.width || '-'} x ${displayProduct.length || '-'} x ${displayProduct.height || '-'} cm`
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">วัสดุ</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.material || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">สีโครงสร้าง</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.color || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">สีคริสตัล</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.crystalColor || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">ประเภทหลอดไฟ</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.bulbType || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-secondary-500 text-xs mb-1">แสงไฟ</span>
                                                        <span className="text-secondary-900 font-medium">{displayProduct.light || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    {/* Description */}
                                    {(job.product?.description || product?.description) && (
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">รายละเอียดเพิ่มเติม</label>
                                            <div className="text-sm text-secondary-700 leading-relaxed bg-white p-3 rounded-lg border border-secondary-200">
                                                {product?.description || job.product?.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Job Notes */}
                                    {job.notes && (
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 uppercase mb-1">หมายเหตุงาน</label>
                                            <div className="p-3 bg-warning-50 rounded-lg text-warning-800 border border-warning-100 text-sm">
                                                {job.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Payment & Photos */}
                            {activeTab === 'payment' && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-secondary-900">การชำระเงิน & อัพโหลดรูป</h2>

                                    {/* Pending Jobs */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-secondary-700 mb-2">งานค้างชำระของลูกค้านี้</h3>
                                        <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                                            <p className="text-sm text-secondary-600">ยังไม่มีข้อมูล</p>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-secondary-700 mb-2">QR Code รับชำระเงิน</h3>
                                        <div className="bg-white rounded-lg p-4 border border-secondary-200 text-center">
                                            <div className="w-48 h-48 mx-auto bg-secondary-100 rounded-lg flex items-center justify-center">
                                                <p className="text-secondary-500 text-sm">QR Code</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Slip Upload */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-secondary-700 mb-2">อัพโหลดสลิปจ่ายเงิน</h3>
                                        <button className="w-full py-3 px-4 border-2 border-dashed border-secondary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                                            <div className="flex flex-col items-center gap-2 text-secondary-600">
                                                <Camera size={24} />
                                                <span className="text-sm">ถ่ายรูป / เลือกรูป</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Installation Photos Upload */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-secondary-700 mb-2">รูปงานติดตั้ง/ขนส่ง</h3>
                                        <button className="w-full py-3 px-4 border-2 border-dashed border-secondary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                                            <div className="flex flex-col items-center gap-2 text-secondary-600">
                                                <Upload size={24} />
                                                <span className="text-sm">อัพโหลดรูปงาน</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Other */}
                            {activeTab === 'other' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-secondary-900 mb-4">ข้อมูลอื่นๆ</h2>
                                    <div className="text-center py-8 text-secondary-500">
                                        <p>ยังไม่มีข้อมูล</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
