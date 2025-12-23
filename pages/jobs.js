import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { useJobs } from '../hooks/useJobs'
import LeaveBookingModal from '../components/LeaveBookingModal'
import LeaveApprovalModal from '../components/LeaveApprovalModal'
import {
    Calendar,
    CheckCircle,
    Truck,
    Wrench,
    Filter,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Search,
    Menu,
    MapPin,
    Package,
    CalendarX,
    ClipboardCheck,
    AlertCircle
} from 'lucide-react'

export default function JobQueuePage() {
    const { jobs: allJobs, loading } = useJobs()
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all') // all, pending-install, pending-delivery, completed
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
    const [isLeaveApprovalOpen, setIsLeaveApprovalOpen] = useState(false)

    const itemsPerPage = 15

    // Sync and Filter Jobs
    useEffect(() => {
        if (!allJobs) return

        let processed = [...allJobs]

        // 1. Sort by appointment date
        processed.sort((a, b) => {
            const dateA = a.appointmentDate ? new Date(a.appointmentDate) : new Date('9999-12-31')
            const dateB = b.appointmentDate ? new Date(b.appointmentDate) : new Date('9999-12-31')
            return dateA - dateB
        })

        // 2. Filter Logic
        processed = processed.filter(job => {
            // Search filter
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                (job.id && job.id.toLowerCase().includes(searchLower)) ||
                (job.orderId && job.orderId.toLowerCase().includes(searchLower)) ||
                (job.orderNumber && job.orderNumber.toLowerCase().includes(searchLower)) ||
                (job.customerName && job.customerName.toLowerCase().includes(searchLower)) ||
                (job.productName && job.productName.toLowerCase().includes(searchLower)) ||
                (job.assignedTeam && job.assignedTeam.toLowerCase().includes(searchLower)) ||
                (job.address && job.address.toLowerCase().includes(searchLower)) ||
                (job.inspectorName && job.inspectorName.toLowerCase().includes(searchLower))

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

        setJobs(processed)
        setCurrentPage(1) // Reset page on filter change
    }, [allJobs, filter, searchTerm])

    // Pagination
    const totalPages = Math.ceil(jobs.length / itemsPerPage)
    const paginatedJobs = jobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Statistics
    const stats = {
        pendingInstall: allJobs ? allJobs.filter(j => j.rawJobType === 'installation' && j.status !== 'เสร็จสิ้น').length : 0,
        pendingDelivery: allJobs ? allJobs.filter(j => j.rawJobType === 'delivery' && j.status !== 'เสร็จสิ้น').length : 0,
        completed: allJobs ? allJobs.filter(j => j.status === 'เสร็จสิ้น').length : 0,
        total: allJobs ? allJobs.length : 0
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'เสร็จสิ้น': return 'bg-success-100 text-success-700'
            case 'กำลังดำเนินการ': return 'bg-primary-100 text-primary-700'
            case 'ยกเลิก': return 'bg-gray-100 text-gray-500' // If cancelled showed up
            default: return 'bg-secondary-100 text-secondary-700'
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-'
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '-'
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
                                <p className="text-sm text-secondary-500 mt-1">จัดการคิวงานทั้งหมด {stats.total} รายการ</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsLeaveModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors shadow-sm text-sm font-medium"
                            >
                                <CalendarX size={18} />
                                <span className="hidden sm:inline">จองวันหยุด</span>
                            </button>
                            <button
                                onClick={() => setIsLeaveApprovalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors shadow-sm text-sm font-medium"
                            >
                                <ClipboardCheck size={18} />
                                <span className="hidden sm:inline">อนุมัติการลา</span>
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>คิวงานติดตั้งและจัดส่ง - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6 pb-20">

                {/* Stats Cards */}
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
                            placeholder="ค้นหา Order ID, ชื่อลูกค้า, สินค้า, ทีม..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg border border-secondary-200 text-secondary-600 text-sm font-medium whitespace-nowrap">
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานที่</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">รหัสงาน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : paginatedJobs.length > 0 ? (
                                    paginatedJobs.map((job, i) => (
                                        <tr key={job.uniqueId || i} className="hover:bg-secondary-50 transition-colors">
                                            {/* Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/job?id=${job.uniqueId}`} className="group flex items-center gap-2 text-sm text-secondary-600 font-mono hover:text-primary-600">
                                                    <Calendar size={14} className="text-secondary-400 group-hover:text-primary-500 transition-colors" />
                                                    {formatDate(job.appointmentDate).replace(',', '')}
                                                </Link>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-secondary-900">{job.customerName}</div>
                                                <div className="text-xs text-secondary-500">{job.customerPhone}</div>
                                            </td>

                                            {/* Product */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex-shrink-0 flex items-center justify-center">
                                                        {job.productImage ? (
                                                            <img src={job.productImage} alt={job.productName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={16} className="text-secondary-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-secondary-900 line-clamp-1">{job.productName}</div>
                                                        <div className="text-xs text-secondary-500 font-mono">{job.productId}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Team */}
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

                                            {/* Address */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={14} className="text-secondary-400 mt-1 flex-shrink-0" />
                                                    <div className="text-sm text-secondary-600 leading-relaxed max-w-xs line-clamp-2">
                                                        {job.address}
                                                        {job.installLocationName && job.installLocationName !== '-' && (
                                                            <div className="text-xs text-secondary-400 mt-0.5">{job.installLocationName}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>

                                            {/* Job ID / Order ID */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end">
                                                    <Link href={`/job?id=${job.uniqueId}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                        {job.uniqueId.slice(0, 8)}...
                                                    </Link>
                                                    {job.orderNumber && (
                                                        <span className="text-xs text-secondary-400 font-mono">
                                                            #{job.orderNumber}
                                                        </span>
                                                    )}
                                                </div>
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
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, jobs.length)} จาก {jobs.length} รายการ
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

                {/* Modals */}
                <LeaveBookingModal
                    isOpen={isLeaveModalOpen}
                    onClose={() => setIsLeaveModalOpen(false)}
                />

                <LeaveApprovalModal
                    isOpen={isLeaveApprovalOpen}
                    onClose={() => setIsLeaveApprovalOpen(false)}
                />

            </div>
        </AppLayout>
    )
}
