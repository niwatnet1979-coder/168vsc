import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import {
    Search,
    Wrench,
    Truck,
    CheckCircle,
    Calendar,
    User,
    MapPin,
    Package,
    Filter,
    ChevronLeft,
    ChevronRight,
    Briefcase
} from 'lucide-react'

export default function JobQueuePage() {
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all') // all, pending-install, pending-delivery, completed
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Load data from localStorage
    useEffect(() => {
        const loadJobs = () => {
            const savedOrders = localStorage.getItem('orders_data')
            if (savedOrders) {
                const orders = JSON.parse(savedOrders)
                const allJobs = []

                orders.forEach(order => {
                    if (order.items && order.items.length > 0) {
                        order.items.forEach((item, index) => {
                            // Determine job details: use subJob if available, otherwise fallback to master job
                            const hasSubJob = item.subJob && item.subJob.jobType;
                            const jobSource = hasSubJob ? item.subJob : order.jobInfo;

                            // If no job info found at all, skip (or use defaults)
                            if (!jobSource) return;

                            // Determine status
                            let status = order.status || 'Pending';

                            // Map job type to display label
                            const jobTypeLabel = jobSource.jobType === 'installation' ? 'ติดตั้ง' :
                                jobSource.jobType === 'delivery' ? 'ส่งของ' :
                                    jobSource.type === 'installation' ? 'ติดตั้ง' : // Fallback for master job structure
                                        jobSource.type === 'delivery' ? 'ส่งของ' :
                                            jobSource.jobType || jobSource.type || '-';

                            // Handle customer name (could be object or string)
                            let customerName = 'Unknown';
                            if (order.customer) {
                                if (typeof order.customer === 'object') {
                                    customerName = order.customer.name || 'Unknown';
                                } else {
                                    customerName = order.customer;
                                }
                            }

                            // Use persistent Job ID if available, otherwise fallback to generated (safety)
                            let jobId = item.subJob?.jobId;

                            if (!jobId) {
                                // Fallback logic for old data without Job IDs
                                const orderIdNum = parseInt(order.id.replace(/\D/g, '') || '0', 10);
                                const jobNum = (orderIdNum * 100) + (index + 1);
                                jobId = `JB${jobNum.toString().padStart(7, '0')}`;
                            }

                            allJobs.push({
                                uniqueId: jobId,
                                orderId: order.id,
                                customer: customerName,
                                product: item,
                                jobType: jobTypeLabel,
                                rawJobType: jobSource.jobType || jobSource.type,
                                appointmentDate: jobSource.appointmentDate || jobSource.dateTime || '-',
                                team: jobSource.team || '-',
                                inspector: jobSource.inspector1?.name || '-',
                                address: jobSource.installAddress || jobSource.installLocationName || '-',
                                status: status,
                                priority: 'Medium'
                            })
                        })
                    }
                })

                // Sort by appointment date
                allJobs.sort((a, b) => {
                    if (a.appointmentDate === '-') return 1;
                    if (b.appointmentDate === '-') return -1;
                    return new Date(a.appointmentDate) - new Date(b.appointmentDate);
                })

                setJobs(allJobs)
            }
        }

        loadJobs()
        window.addEventListener('storage', loadJobs)
        return () => window.removeEventListener('storage', loadJobs)
    }, [])

    // Filter logic
    const filteredJobs = jobs.filter(job => {
        // Search filter
        const matchesSearch =
            job.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.product.name && job.product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.team && job.team.toLowerCase().includes(searchTerm.toLowerCase()))

        if (!matchesSearch) return false

        // Status/Type filter
        switch (filter) {
            case 'pending-install':
                return job.rawJobType === 'installation' && job.status !== 'Completed'
            case 'pending-delivery':
                return job.rawJobType === 'delivery' && job.status !== 'Completed'
            case 'completed':
                return job.status === 'Completed'
            case 'all':
            default:
                return true
        }
    })

    // Pagination
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Count statistics
    const stats = {
        pendingInstall: jobs.filter(j => j.rawJobType === 'installation' && j.status !== 'Completed').length,
        pendingDelivery: jobs.filter(j => j.rawJobType === 'delivery' && j.status !== 'Completed').length,
        completed: jobs.filter(j => j.status === 'Completed').length,
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
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-success-100 text-success-700'
            case 'processing': return 'bg-primary-100 text-primary-700'
            default: return 'bg-secondary-100 text-secondary-700'
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>คิวงานติดตั้งและจัดส่ง - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Briefcase className="text-primary-600" size={32} />
                            คิวงานติดตั้งและจัดส่ง
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการคิวงานทั้งหมด {jobs.length} รายการ</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setFilter('pending-install')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${filter === 'pending-install' ? 'border-danger-500 ring-1 ring-danger-500' : 'border-secondary-200 hover:border-danger-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-danger-600 text-sm font-medium">คิวติดตั้งที่เหลือ</span>
                            <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                                <Wrench size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-danger-700">{stats.pendingInstall}</div>
                    </div>

                    <div
                        onClick={() => setFilter('pending-delivery')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${filter === 'pending-delivery' ? 'border-warning-500 ring-1 ring-warning-500' : 'border-secondary-200 hover:border-warning-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-warning-600 text-sm font-medium">คิวจัดส่งที่เหลือ</span>
                            <div className="p-2 bg-warning-50 rounded-lg text-warning-600">
                                <Truck size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-warning-700">{stats.pendingDelivery}</div>
                    </div>

                    <div
                        onClick={() => setFilter('completed')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${filter === 'completed' ? 'border-success-500 ring-1 ring-success-500' : 'border-secondary-200 hover:border-success-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-success-600 text-sm font-medium">งานที่เสร็จแล้ว</span>
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-success-700">{stats.completed}</div>
                    </div>

                    <div
                        onClick={() => setFilter('all')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${filter === 'all' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-secondary-500 text-sm font-medium">งานทั้งหมด</span>
                            <div className="p-2 bg-secondary-50 rounded-lg text-secondary-600">
                                <Briefcase size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-secondary-900">{stats.total}</div>
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">JOB ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ลูกค้า</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สินค้า</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">ประเภทงาน</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันที่นัดหมาย</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ทีมช่าง</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ผู้ตรวจงาน</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedJobs.length > 0 ? (
                                    paginatedJobs.map((job, i) => (
                                        <tr key={i} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/job?id=${job.uniqueId}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                    {job.uniqueId}
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
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getJobTypeColor(job.rawJobType)}`}>
                                                    {job.rawJobType === 'installation' ? <Wrench size={12} className="mr-1" /> :
                                                        job.rawJobType === 'delivery' ? <Truck size={12} className="mr-1" /> : null}
                                                    {job.jobType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-secondary-600">
                                                    <Calendar size={14} className="text-secondary-400" />
                                                    {job.appointmentDate !== '-' ? new Date(job.appointmentDate).toLocaleString('th-TH', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    }) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-secondary-600">
                                                    <User size={14} className="text-secondary-400" />
                                                    {job.team}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">{job.inspector}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-secondary-500">
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
