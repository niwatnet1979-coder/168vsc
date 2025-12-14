import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { useJobs } from '../hooks/useJobs'
import {
    Calendar,
    CheckCircle,
    Clock,
    MapPin,
    Package,
    Filter,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Wrench,
    Truck,
    Search,
    User,
    Menu
} from 'lucide-react'

export default function JobQueuePage() {
    const { jobs: allJobs, loading } = useJobs() // Hook
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all') // all, pending-install, pending-delivery, completed
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Sync allJobs to local formatted state and apply filters
    useEffect(() => {
        // 1. Map Data
        const formattedJobs = allJobs.map(job => {
            // Address Formatting Logic
            let shortAddress = job.address || '-'
            try {
                // Try to get structured data from order delivery info
                let deliveryInfo = job.order?.delivery_address_info
                if (typeof deliveryInfo === 'string') {
                    deliveryInfo = JSON.parse(deliveryInfo)
                }

                if (deliveryInfo && typeof deliveryInfo === 'object') {
                    const parts = []
                    if (deliveryInfo.label) parts.push(deliveryInfo.label)

                    // Simple District/Province
                    const district = deliveryInfo.addrAmphoe || deliveryInfo.amphoe
                    const province = deliveryInfo.province || deliveryInfo.addrProvince

                    if (district) parts.push(`อ.${district}`)
                    if (province) parts.push(`จ.${province}`)

                    if (parts.length > 0) {
                        shortAddress = parts.join(' ')
                    }
                }
            } catch (e) {
                console.error('Address parsing error', e)
            }

            // Date Formatting Logic
            let aptDate = '-'
            if (job.jobDate) {
                // Check if it's already a full ISO string (e.g. from Supabase timestamptz)
                if (job.jobDate.includes('T')) {
                    aptDate = job.jobDate
                } else {
                    aptDate = `${job.jobDate}T${job.jobTime || '09:00'}`
                }
            }

            return {
                uniqueId: job.id,
                orderId: job.orderId,
                customer: job.customerName,
                product: {
                    id: job.productId,
                    name: job.productName || 'สินค้าไม่ระบุ',
                    image: job.productImage || null
                },
                jobType: job.jobType,
                rawJobType: job.rawJobType || (job.jobType === 'ติดตั้ง' ? 'installation' : 'delivery'),
                assignedTeam: job.assignedTeam, // Needed for filtering
                appointmentDate: aptDate,
                team: job.assignedTeam === 'ทีม A' ? '-' : (job.assignedTeam || '-'),
                inspector: job.inspectorName || '-',
                address: shortAddress, // Updated to use short address
                fullAddress: job.address, // Keep full address for tooltip if needed
                status: job.status === 'Completed' ? 'เสร็จสิ้น' :
                    job.status === 'Processing' ? 'กำลังดำเนินการ' : 'รอดำเนินการ',
                priority: job.priority || 'Medium'
            }
        })

        // 2. Sort by appointment date
        formattedJobs.sort((a, b) => {
            if (a.appointmentDate === '-') return 1
            if (b.appointmentDate === '-') return -1
            return new Date(a.appointmentDate) - new Date(b.appointmentDate)
        })

        // 3. Filter Logic
        const filteredDocs = formattedJobs.filter(job => {
            // Search filter
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                (job.uniqueId && job.uniqueId.toLowerCase().includes(searchLower)) ||
                (job.orderId && job.orderId.toLowerCase().includes(searchLower)) ||
                (job.customer && job.customer.toLowerCase().includes(searchLower)) ||
                (job.product.name && job.product.name.toLowerCase().includes(searchLower)) ||
                (job.assignedTeam && job.assignedTeam.toLowerCase().includes(searchLower)) ||
                (job.address && job.address.toLowerCase().includes(searchLower)) ||
                (job.inspector && job.inspector.toLowerCase().includes(searchLower))

            if (!matchesSearch) return false

            // Status/Type filter
            switch (filter) {
                case 'pending-install':
                    return job.rawJobType === 'installation' && job.status !== 'เสร็จสิ้น'
                case 'pending-delivery':
                    return job.rawJobType === 'delivery' && job.status !== 'เสร็จสิ้น'
                case 'completed':
                    return job.status === 'เสร็จสิ้น'
                case 'all':
                default:
                    return true
            }
        })

        setJobs(filteredDocs)
    }, [allJobs, filter, searchTerm]) // Re-run when realtime data, filter, or search changes

    // No need for separate filteredJobs logic since we set it to 'jobs' state above
    // But pagination below relies on 'filteredJobs' variable name from previous code.
    // Let's alias state 'jobs' as 'filteredJobs' for compatibility with pagination code below
    const filteredJobs = jobs

    // Pagination
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Count statistics
    const stats = {
        pendingInstall: jobs.filter(j => j.rawJobType === 'installation' && j.status !== 'เสร็จสิ้น').length,
        pendingDelivery: jobs.filter(j => j.rawJobType === 'delivery' && j.status !== 'เสร็จสิ้น').length,
        completed: jobs.filter(j => j.status === 'เสร็จสิ้น').length,
        total: jobs.length
    }

    const getJobTypeColor = (type) => {
        switch (type) {
            case 'installation': return 'bg-danger-50 text-danger-700 border-danger-100'
            case 'delivery': return 'bg-warning-50 text-warning-700 border-warning-100'
            default: return 'bg-secondary-50 text-secondary-700 border-secondary-100'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'เสร็จสิ้น': return 'bg-success-100 text-success-700'
            case 'กำลังดำเนินการ': return 'bg-primary-100 text-primary-700'
            default: return 'bg-secondary-100 text-secondary-700'
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-'
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '-'
        // DD/MM/YYYY HH:MM (Gregorian Year)
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                    <Briefcase className="text-primary-600" size={28} />
                                    คิวงานติดตั้งและจัดส่ง
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">จัดการคิวงานทั้งหมด {jobs.length} รายการ</p>
                            </div>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>คิวงานติดตั้งและจัดส่ง - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Stats Cards - Compact Horizontal Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                        onClick={() => setFilter('pending-install')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${filter === 'pending-install' ? 'border-danger-500 ring-1 ring-danger-500' : 'border-secondary-200 hover:border-danger-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                                <Wrench size={20} />
                            </div>
                            <span className="text-danger-700 font-medium">คิวติดตั้งที่เหลือ</span>
                        </div>
                        <span className="text-2xl font-bold text-danger-700">{stats.pendingInstall}</span>
                    </div>

                    <div
                        onClick={() => setFilter('pending-delivery')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${filter === 'pending-delivery' ? 'border-warning-500 ring-1 ring-warning-500' : 'border-secondary-200 hover:border-warning-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-50 rounded-lg text-warning-600">
                                <Truck size={20} />
                            </div>
                            <span className="text-warning-700 font-medium">คิวจัดส่งที่เหลือ</span>
                        </div>
                        <span className="text-2xl font-bold text-warning-700">{stats.pendingDelivery}</span>
                    </div>

                    <div
                        onClick={() => setFilter('completed')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${filter === 'completed' ? 'border-success-500 ring-1 ring-success-500' : 'border-secondary-200 hover:border-success-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-success-700 font-medium">งานที่เสร็จแล้ว</span>
                        </div>
                        <span className="text-2xl font-bold text-success-700">{stats.completed}</span>
                    </div>

                    <div
                        onClick={() => setFilter('all')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${filter === 'all' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-50 rounded-lg text-secondary-600">
                                <Briefcase size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">งานทั้งหมด</span>
                        </div>
                        <span className="text-2xl font-bold text-secondary-900">{stats.total}</span>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหา Job ID, Order ID, ลูกค้า, สินค้า, ทีม..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg border border-secondary-200 text-secondary-600 text-sm font-medium">
                            <Filter size={16} />
                            <span>ตัวกรอง: {
                                filter === 'all' ? 'ทั้งหมด' :
                                    filter === 'pending-install' ? 'งานติดตั้ง' :
                                        filter === 'pending-delivery' ? 'งานส่งของ' : 'เสร็จสิ้น'
                            }</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันที่นัดหมาย</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ลูกค้า</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สินค้า</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">ทีม/ประเภทงาน</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานที่ติดตั้ง / ขนส่ง</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">รหัสงาน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedJobs.length > 0 ? (
                                    paginatedJobs.map((job, i) => (
                                        <tr key={i} className="hover:bg-secondary-50 transition-colors">
                                            {/* Date - Moved to First */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/job?id=${job.uniqueId}`} className="group flex items-center gap-2 text-sm text-secondary-600 font-mono hover:text-primary-600">
                                                    <Calendar size={14} className="text-secondary-400 group-hover:text-primary-500 transition-colors" />
                                                    {formatDate(job.appointmentDate).replace(',', '')}
                                                </Link>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-secondary-900">{job.customer}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
                                                        {job.product.image ? (
                                                            <img src={job.product.image} alt={job.product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={16} className="text-secondary-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-secondary-900 line-clamp-1">{job.product.name}</div>
                                                        <div className="text-xs text-secondary-500 font-mono">{job.product.id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Job Type (Team) - Updated */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    {job.rawJobType === 'installation' ? (
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-danger-50 text-danger-700 rounded-md border border-danger-100">
                                                            <Wrench size={14} />
                                                            <span className="font-medium text-xs">{job.assignedTeam || 'ไม่ระบุทีม'}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-warning-50 text-warning-700 rounded-md border border-warning-100">
                                                            <Truck size={14} />
                                                            <span className="font-medium text-xs">{job.assignedTeam || 'ไม่ระบุทีม'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={14} className="text-secondary-400 mt-1 flex-shrink-0" />
                                                    <div className="text-sm text-secondary-600 leading-relaxed max-w-xs line-clamp-2">
                                                        {job.address || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>

                                            {/* Job ID - Moved to Last */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Link href={`/job?id=${job.uniqueId}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                    {job.uniqueId}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Briefcase size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลคิวงาน</p>
                                                <p className="text-sm text-secondary-500 mt-1">ลองเปลี่ยนตัวกรอง หรือค้นหาใหม่</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between bg-secondary-50">
                            <div className="text-sm text-secondary-600">
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} จาก {filteredJobs.length} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium text-secondary-700 px-2">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
