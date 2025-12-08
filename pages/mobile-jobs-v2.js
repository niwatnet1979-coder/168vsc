import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    Wrench,
    Truck,
    MapPin,
    Calendar,
    Clock,
    User,
    Phone,
    UserCheck
} from 'lucide-react'
import { MOCK_CUSTOMERS_DATA, MOCK_PRODUCTS_DATA } from '../lib/mockData'

export default function MobileJobsV2() {
    const router = useRouter()
    const { data: session } = useSession()
    const [selectedTeam, setSelectedTeam] = useState('ทั้งหมด')
    const [availableTeams, setAvailableTeams] = useState([])
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)

    // Get user role and team
    const userRole = session?.user?.role
    const userTeam = session?.user?.team

    // Auto-seed data for demo if empty
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const jobsData = localStorage.getItem('jobs_data')
                const hasJobs = jobsData && JSON.parse(jobsData).length > 0
                if (!hasJobs) {
                    console.log('Seeding mock data for demo...')

                    // Seed Customers
                    if (!localStorage.getItem('customers_data')) {
                        localStorage.setItem('customers_data', JSON.stringify(MOCK_CUSTOMERS_DATA))
                    }

                    // Seed Products
                    if (!localStorage.getItem('products_data_v3')) {
                        localStorage.setItem('products_data_v3', JSON.stringify(MOCK_PRODUCTS_DATA))
                    }

                    // Seed Orders & Jobs
                    const mockOrders = []
                    const mockJobs = []
                    const teams = ['ทีม A', 'ทีม B', 'ทีม C', 'ทีมช่าง 1']

                    for (let i = 0; i < 5; i++) {
                        const customer = MOCK_CUSTOMERS_DATA[i % MOCK_CUSTOMERS_DATA.length]
                        const product = MOCK_PRODUCTS_DATA[i % MOCK_PRODUCTS_DATA.length]
                        const orderId = `OD${20230001 + i}`
                        const jobId = `JB${20230001 + i}`

                        mockOrders.push({
                            id: orderId,
                            customerId: customer.id,
                            orderDate: '2023-12-01',
                            status: 'confirmed',
                            items: [{ productId: product.id, quantity: 1, price: product.price }]
                        })

                        mockJobs.push({
                            id: jobId,
                            orderId: orderId,
                            customerId: customer.id,
                            productId: product.id,
                            jobType: i % 2 === 0 ? 'ติดตั้ง' : 'ขนส่ง',
                            jobDate: new Date().toISOString().split('T')[0],
                            jobTime: `${9 + i}:00`,
                            address: customer.addresses?.[0]?.address || 'กรุงเทพฯ',
                            assignedTeam: teams[i % teams.length],
                            status: 'pending',
                            notes: 'Demonstration job data',
                            customerName: customer.name,
                            productName: product.name
                        })
                    }

                    localStorage.setItem('orders_data', JSON.stringify(mockOrders))
                    localStorage.setItem('jobs_data', JSON.stringify(mockJobs))

                    // Update state immediately to reflect changes without reload
                    console.log('Seeding complete. Updating state...')
                    setJobs(mockJobs) // Note: This might be overwritten by loadJobs, so we should trigger loadJobs

                    // Allow loadJobs to run naturally via dependency update or manual call if needed
                    // But since selectedTeam/userRole didn't change, we might need to force it
                    // Actually, setting state here is temporary. loadJobs will fetch from LS.
                    // Let's call loadJobs() explicitly after a short delay or just let the next render cycle handle it?
                    // Better: just trigger a reload of jobs.
                    setTimeout(() => loadJobs(), 100)
                }
            } catch (error) {
                console.error('Seeding error:', error)
            }
        }
    }, [])

    useEffect(() => {
        if (userTeam) {
            setSelectedTeam(userTeam)
        }
    }, [userTeam])

    useEffect(() => {
        loadJobs()
    }, [selectedTeam, userRole]) // Reload when filter changes

    const loadJobs = () => {
        try {
            // Get fresh orders to check for orphans
            const savedOrders = localStorage.getItem('orders_data')
            const orders = savedOrders ? JSON.parse(savedOrders) : []
            const orderIds = new Set(orders.map(o => o.id))

            // Get all jobs from DataManager
            const allJobs = DataManager.getJobs()

            // Extract unique teams for filter
            const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()
            setAvailableTeams(['ทั้งหมด', ...teams])

            // Filter orphans first - RELAXED for debugging/demo
            // let validJobs = allJobs.filter(job => orderIds.has(job.orderId))
            let validJobs = allJobs // Show all jobs even if order is missing

            // Filter by role/selection
            let filteredJobs = validJobs

            // If logged in as non-admin, restrict to their team (unless they are admin, who can see all)
            // But if NOT logged in (session is null), allow selecting any team
            if (userRole && userRole !== 'admin') {
                filteredJobs = validJobs.filter(job => job.assignedTeam === userTeam)
            } else {
                // Admin or Public User: Filter by selectedTeam
                if (selectedTeam !== 'ทั้งหมด') {
                    filteredJobs = validJobs.filter(job => job.assignedTeam === selectedTeam)
                }
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
        if (!date) return '-'
        const d = new Date(date)
        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year} ${time || ''}`
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

    // Header logic needs update too
    const showTeamSelector = !userRole || userRole === 'admin'

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-secondary-600">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <Head>
                <title>Mobile Jobs - 168VSC System</title>
            </Head>

            <div className="space-y-4 pb-20">
                {/* Header */}
                <div className="sticky top-0 bg-secondary-50 z-10 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900">Mobile Jobs</h1>
                            <p className="text-sm text-secondary-500">
                                {loading ? '...' : `${jobs.length} งาน`}
                            </p>
                        </div>

                        {/* Team Selector for Public/Admin */}
                        {showTeamSelector && (
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="text-sm border-secondary-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                {availableTeams.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Job Cards */}
                <div className="space-y-3">
                    {jobs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-secondary-500">ไม่มีงานในขณะนี้</p>
                        </div>
                    ) : (
                        jobs.map((job) => {
                            const displayAddress = job.address ||
                                job.order?.address ||
                                job.customer?.address ||
                                (job.customer?.addresses?.[0]?.address) ||
                                '-'
                            const location = getLocation(displayAddress)
                            const distance = getDistance(displayAddress)

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
                                                className="w-20 h-20 rounded object-cover border border-secondary-200"
                                                style={{ width: '2cm', height: '2cm' }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Row 1: Job Type, Date, Customer, Inspector */}
                                            <div className="flex items-center gap-2 text-xs text-secondary-900 mb-1 flex-wrap">
                                                {/* Job Icon */}
                                                {getJobIcon(job.jobType)}

                                                {/* Date */}
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span className="font-medium">{formatDateTime(job.jobDate, job.jobTime)}</span>
                                                </div>

                                                {/* Customer Phone */}
                                                {job.customer?.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={12} />
                                                        <a href={`tel:${job.customer.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{job.customer.phone}</a>
                                                    </div>
                                                )}

                                                {/* Customer Name */}
                                                <div className="flex items-center gap-1">
                                                    <User size={12} />
                                                    <span className="truncate max-w-[100px]">{job.customerName}</span>
                                                </div>

                                                {/* Inspector (Try to find) */}
                                                {(() => {
                                                    const addr = job.customer?.addresses?.find(a => a.address === displayAddress)
                                                    const inspector = addr?.inspector1
                                                    if (inspector?.name) {
                                                        return (
                                                            <div className="flex items-center gap-1 text-secondary-600 border-l border-secondary-300 pl-2 ml-1">
                                                                <Phone size={12} />
                                                                {inspector.phone && (
                                                                    <a href={`tel:${inspector.phone}`} className="hover:underline mr-1" onClick={(e) => e.stopPropagation()}>{inspector.phone}</a>
                                                                )}
                                                                <UserCheck size={12} />
                                                                <span>{inspector.name}</span>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>

                                            {/* Row 2: Location, Distance */}
                                            <div className="flex items-center gap-2 text-xs text-secondary-600 mb-1">
                                                <MapPin size={12} className="flex-shrink-0" />
                                                <span className="truncate">{displayAddress}</span>
                                                <span className="flex-shrink-0 text-primary-600 font-medium whitespace-nowrap">
                                                    {distance} กม.
                                                </span>
                                            </div>

                                            {/* Row 3: Product Details */}
                                            <div className="text-xs text-secondary-700 leading-tight space-y-1 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-secondary-900 truncate">{job.productName}</span>
                                                    <span className="text-[10px] font-mono text-secondary-500 bg-secondary-100 px-1.5 py-0.5 rounded border border-secondary-200 flex-shrink-0">
                                                        {job.productId}
                                                    </span>
                                                </div>

                                                {/* Specs Combined Line */}
                                                <div className="text-secondary-600 truncate">
                                                    <span>{job.product?.category || '-'}</span>
                                                    {(job.product?.width || job.product?.length || job.product?.height) && (
                                                        <span> • {job.product.width || '-'}x{job.product.length || '-'}x{job.product.height || '-'} cm</span>
                                                    )}
                                                    {job.product?.material && <span> • {job.product.material}</span>}
                                                    {job.product?.color && <span> • {job.product.color}</span>}
                                                </div>
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
    )
}


