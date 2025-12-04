import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import ProtectedRoute from '../components/ProtectedRoute'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    Wrench,
    Truck,
    MapPin,
    Calendar,
    Clock,
    User
} from 'lucide-react'

export default function MobileJobsV2() {
    const router = useRouter()
    const { data: session } = useSession()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)

    // Get user role and team
    const userRole = session?.user?.role || 'user'
    const userTeam = session?.user?.team || 'ทีม A'

    useEffect(() => {
        loadJobs()
    }, [])

    const loadJobs = () => {
        try {
            // Get fresh orders to check for orphans
            const savedOrders = localStorage.getItem('orders_data')
            const orders = savedOrders ? JSON.parse(savedOrders) : []
            const orderIds = new Set(orders.map(o => o.id))

            // Get all jobs from DataManager
            const allJobs = DataManager.getJobs()

            // Filter orphans first
            let validJobs = allJobs.filter(job => orderIds.has(job.orderId))

            // Filter by role
            let filteredJobs = validJobs
            if (userRole !== 'admin') {
                // Non-admin users only see their team's jobs
                filteredJobs = validJobs.filter(job => job.assignedTeam === userTeam)
            }

            // Sort by date (nearest first)
            filteredJobs.sort((a, b) => {
                const dateA = new Date(`${a.jobDate}T${a.jobTime}`)
                const dateB = new Date(`${b.jobDate}T${b.jobTime}`)
                return dateA - dateB
            })

            setJobs(filteredJobs)
            setLoading(false)
        } catch (error) {
            console.error('Error loading jobs:', error)
            setJobs([])
            setLoading(false)
        }
    }

    // Determine card color based on completion status
    const getCardColor = (job) => {
        const hasCompletionDate = job.completionDate != null
        const hasSignature = job.signatureImage != null

        if (hasCompletionDate && hasSignature) {
            return 'bg-green-50 border-green-200'
        }
        return 'bg-white border-secondary-200'
    }

    // Get job type icon
    const getJobIcon = (jobType) => {
        if (jobType === 'ติดตั้ง' || jobType === 'installation') {
            return <Wrench size={20} className="text-primary-600" />
        }
        return <Truck size={20} className="text-warning-600" />
    }

    // Format date/time
    const formatDateTime = (date, time) => {
        const d = new Date(date)
        const day = d.getDate()
        const month = d.toLocaleDateString('th-TH', { month: 'short' })
        return `${day} ${month} | ${time}`
    }

    // Calculate distance (placeholder - will use actual calculation)
    const getDistance = (address) => {
        // TODO: Implement actual distance calculation using SHOP_LAT, SHOP_LON
        return Math.floor(Math.random() * 30) + 5 // Mock: 5-35 km
    }

    // Extract district and province from address
    const getLocation = (address) => {
        // Simple extraction - can be improved
        const parts = address.split(' ')
        const province = parts.find(p => p.includes('จังหวัด'))?.replace('จังหวัด', '') || 'กรุงเทพฯ'
        const district = parts.find(p => p.includes('อำเภอ'))?.replace('อำเภอ', '') || parts.find(p => p.includes('เขต'))?.replace('เขต', '') || '-'
        return { district, province }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-4 text-secondary-600">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <AppLayout>
                <Head>
                    <title>Mobile Jobs - 168VSC System</title>
                </Head>

                <div className="space-y-4 pb-20">
                    {/* Header */}
                    <div className="sticky top-0 bg-secondary-50 z-10 pb-4">
                        <h1 className="text-2xl font-bold text-secondary-900">Mobile Jobs</h1>
                        <p className="text-sm text-secondary-500">
                            {userRole === 'admin' ? 'ทั้งหมด' : userTeam} • {jobs.length} งาน
                        </p>
                    </div>

                    {/* Job Cards */}
                    <div className="space-y-3">
                        {jobs.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-secondary-500">ไม่มีงานในขณะนี้</p>
                            </div>
                        ) : (
                            jobs.map((job) => {
                                const location = getLocation(job.address)
                                const distance = getDistance(job.address)

                                return (
                                    <Link
                                        key={job.id}
                                        href={`/mobile-jobs-v2/${job.id}`}
                                        className={`block p-3 rounded-lg border-2 transition-all hover:shadow-md ${getCardColor(job)}`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Product Image */}
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={job.productImage || 'https://images.unsplash.com/photo-1513506003013-d5316327a3d8?auto=format&fit=crop&q=80&w=60&h=60'}
                                                    alt={job.productName}
                                                    className="w-14 h-14 rounded object-cover border border-secondary-200"
                                                    style={{ width: '1.5cm', height: '1.5cm' }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Line 1: Date/Time, Location, Distance */}
                                                <div className="flex items-center gap-2 text-xs text-secondary-600 mb-1">
                                                    <div className="flex items-center gap-1">
                                                        {getJobIcon(job.jobType)}
                                                        <Calendar size={12} />
                                                        <span className="font-medium">{formatDateTime(job.jobDate, job.jobTime)}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        <span>{location.district}, {location.province}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span className="text-primary-600 font-medium">{distance} กม.</span>
                                                </div>

                                                {/* Line 2: Customer Name */}
                                                <div className="flex items-center gap-1 text-sm font-medium text-secondary-900 mb-1">
                                                    <User size={14} />
                                                    <span className="truncate">{job.customerName}</span>
                                                </div>

                                                {/* Line 3-4: Product Details */}
                                                <div className="text-xs text-secondary-700 leading-tight space-y-1 mt-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-secondary-900 truncate">{job.productName}</span>
                                                        <span className="text-[10px] font-mono text-secondary-500 bg-secondary-100 px-1.5 py-0.5 rounded border border-secondary-200 flex-shrink-0">
                                                            {job.productId}
                                                        </span>
                                                    </div>

                                                    {/* Specs Line 1 */}
                                                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-secondary-600">
                                                        {job.product?.category && <span>{job.product.category}</span>}
                                                        {job.product?.subcategory && <span>• {job.product.subcategory}</span>}
                                                        {(job.product?.width || job.product?.length || job.product?.height) && (
                                                            <span>• {job.product.width || '-'}x{job.product.length || '-'}x{job.product.height || '-'} cm</span>
                                                        )}
                                                    </div>

                                                    {/* Specs Line 2 */}
                                                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-secondary-500">
                                                        {job.product?.material && <span>{job.product.material}</span>}
                                                        {job.product?.color && <span>• สี{job.product.color}</span>}
                                                        {job.product?.bulbType && <span>• {job.product.bulbType}</span>}
                                                    </div>

                                                    {/* Description */}
                                                    {job.product?.description && (
                                                        <p className="line-clamp-2 text-secondary-500 mt-1 italic">
                                                            {job.product.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
