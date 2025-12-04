
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import ProtectedRoute from '../components/ProtectedRoute'
import { DataManager } from '../lib/dataManager'
import {
    Calendar,
    MapPin,
    User,
    Package,
    Wrench,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    Filter,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    ShoppingCart,
    FileText,
    Settings,
    BarChart3,
    Briefcase,
    Smartphone,
    ChevronRight,
    Users
} from 'lucide-react'
import Link from 'next/link'

export default function MobileJobsPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [jobs, setJobs] = useState([])
    const [filteredJobs, setFilteredJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Order Entry', icon: ShoppingCart, path: '/order' },
        { name: 'Orders List', icon: FileText, path: '/orders' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Customers', icon: Users, path: '/customers' },
        { name: 'Jobs', icon: Briefcase, path: '/jobs' },
        { name: 'Mobile Job', icon: Smartphone, path: '/mobile-jobs' },
        { name: 'Reports', icon: BarChart3, path: '/reports' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ]

    // Get role and team from session
    const userRole = session?.user?.role || 'admin'
    const userTeam = session?.user?.team || 'ทีม A'

    useEffect(() => {
        loadJobs()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [jobs, statusFilter, userRole, userTeam])

    const loadJobs = () => {
        try {
            // Use DataManager to get normalized jobs with joined data
            const allJobs = DataManager.getJobs()

            // Transform to component format
            const formattedJobs = allJobs.map(job => ({
                id: job.id,
                customerName: job.customerName,
                productName: job.productName,
                jobType: job.jobType === 'ติดตั้ง' ? 'installation' :
                    job.jobType === 'ซ่อมแซม' ? 'repair' :
                        job.jobType === 'ตรวจสอบ' ? 'inspection' : 'delivery',
                appointmentDate: `${job.jobDate}T${job.jobTime}:00`, // Reconstruct for consistency
                status: job.status === 'เสร็จสิ้น' ? 'เสร็จสิ้น' :
                    job.status === 'กำลังดำเนินการ' ? 'กำลังทำ' : 'รอดำเนินการ', // Map to Thai status
                location: job.address,
                team: job.assignedTeam,
                productImage: job.productImage || 'https://images.unsplash.com/photo-1513506003013-d5316327a3d8?auto=format&fit=crop&q=80&w=300&h=300',
                notes: job.notes
            }))

            setJobs(formattedJobs)
            setLoading(false)
        } catch (error) {
            console.error('Error loading jobs:', error)
            setJobs([])
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...jobs]

        // Role-based filtering
        if (userRole === 'ช่าง') {
            // Technicians see only their team + installation jobs
            filtered = filtered.filter(job =>
                job.team === userTeam && job.jobType === 'installation'
            )
        } else if (userRole === 'qc') {
            // QC sees their team + installation + delivery
            filtered = filtered.filter(job =>
                job.team === userTeam &&
                (job.jobType === 'installation' || job.jobType === 'delivery')
            )
        }
        // Admin sees all

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(job => job.status === statusFilter)
        }

        // Sort by appointment date
        filtered.sort((a, b) => {
            if (!a.appointmentDate) return 1
            if (!b.appointmentDate) return -1
            return new Date(a.appointmentDate) - new Date(b.appointmentDate)
        })

        setFilteredJobs(filtered)
    }

    const getStatusBadge = (status) => {
        const badges = {
            'รอดำเนินการ': {
                bg: 'bg-warning-100',
                text: 'text-warning-700',
                border: 'border-warning-200',
                icon: <Clock size={16} />
            },
            'กำลังทำ': {
                bg: 'bg-primary-100',
                text: 'text-primary-700',
                border: 'border-primary-200',
                icon: <AlertCircle size={16} />
            },
            'เสร็จสิ้น': {
                bg: 'bg-success-100',
                text: 'text-success-700',
                border: 'border-success-200',
                icon: <CheckCircle size={16} />
            }
        }

        const badge = badges[status] || badges['รอดำเนินการ']

        return (
            <span className={`inline - flex items - center gap - 1.5 px - 3 py - 1.5 rounded - full text - sm font - medium border ${badge.bg} ${badge.text} ${badge.border} `}>
                {badge.icon}
                {status}
            </span>
        )
    }

    const getJobTypeIcon = (type) => {
        if (type === 'installation') return <Wrench size={20} className="text-danger-600" />
        if (type === 'delivery') return <Truck size={20} className="text-warning-600" />
        return <Package size={20} className="text-secondary-400" />
    }

    const getJobTypeLabel = (type) => {
        if (type === 'installation') return 'ติดตั้ง'
        if (type === 'delivery') return 'ขนส่ง'
        return type
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('th-TH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const content = (
        <>
            <Head>
                <title>งานของฉัน - 168VSC Mobile</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            </Head>

            <div className="min-h-screen bg-secondary-50 pb-20">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white sticky top-0 z-10 shadow-lg">
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <Menu size={24} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">งานของฉัน</h1>
                                    <p className="text-primary-100 text-sm">
                                        {userRole === 'admin' ? 'ผู้ดูแลระบบ' : `${userTeam} - ${userRole === 'ช่าง' ? 'ช่างติดตั้ง' : 'QC'} `}
                                    </p>
                                </div>
                            </div>
                            {session && (
                                <div className="flex items-center gap-2">
                                    {session.user?.image && (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px - 4 py - 2 rounded - lg font - medium whitespace - nowrap transition - all ${statusFilter === 'all'
                                ? 'bg-white text-primary-700 shadow-md'
                                : 'bg-primary-500 text-white hover:bg-primary-400'
                                } `}
                        >
                            ทั้งหมด ({jobs.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('รอดำเนินการ')}
                            className={`px - 4 py - 2 rounded - lg font - medium whitespace - nowrap transition - all ${statusFilter === 'รอดำเนินการ'
                                ? 'bg-white text-primary-700 shadow-md'
                                : 'bg-primary-500 text-white hover:bg-primary-400'
                                } `}
                        >
                            รอดำเนินการ
                        </button>
                        <button
                            onClick={() => setStatusFilter('กำลังทำ')}
                            className={`px - 4 py - 2 rounded - lg font - medium whitespace - nowrap transition - all ${statusFilter === 'กำลังทำ'
                                ? 'bg-white text-primary-700 shadow-md'
                                : 'bg-primary-500 text-white hover:bg-primary-400'
                                } `}
                        >
                            กำลังทำ
                        </button>
                        <button
                            onClick={() => setStatusFilter('เสร็จสิ้น')}
                            className={`px - 4 py - 2 rounded - lg font - medium whitespace - nowrap transition - all ${statusFilter === 'เสร็จสิ้น'
                                ? 'bg-white text-primary-700 shadow-md'
                                : 'bg-primary-500 text-white hover:bg-primary-400'
                                } `}
                        >
                            เสร็จสิ้น
                        </button>
                    </div>
                </div>

                {/* Job Cards */}
                <div className="px-4 py-4 space-y-3">
                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-12">
                            <Package size={64} className="mx-auto text-secondary-300 mb-4" />
                            <p className="text-secondary-500 text-lg">ไม่มีงานในขณะนี้</p>
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <div
                                key={job.id}
                                onClick={() => router.push(`/ mobile - jobs / ${job.id} `)}
                                className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden active:scale-98 transition-transform cursor-pointer"
                            >
                                {/* Time Badge */}
                                <div className="bg-primary-50 px-4 py-2 border-b border-primary-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-primary-700">
                                        <Calendar size={16} />
                                        <span className="font-medium text-sm">
                                            {formatDateTime(job.appointmentDate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getJobTypeIcon(job.jobType)}
                                        <span className="text-xs font-medium text-secondary-600">
                                            {getJobTypeLabel(job.jobType)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Job ID & Status */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-xs text-secondary-500 mb-1">รหัสงาน</p>
                                            <p className="font-mono font-bold text-lg text-secondary-900">{job.id}</p>
                                        </div>
                                        {getStatusBadge(job.status)}
                                    </div>

                                    {/* Customer */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 text-secondary-700 mb-1">
                                            <User size={16} className="text-secondary-400" />
                                            <span className="font-medium">{job.customerName}</span>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="mb-3">
                                        <div className="flex items-start gap-2 text-secondary-600">
                                            <MapPin size={16} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm line-clamp-2">{job.location}</span>
                                        </div>
                                    </div>

                                    {/* Product */}
                                    <div className="flex items-center gap-3 pt-3 border-t border-secondary-100">
                                        <div className="w-12 h-12 rounded-lg bg-secondary-50 border border-secondary-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {job.productImage ? (
                                                <img src={job.productImage} alt={job.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={20} className="text-secondary-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-secondary-900 truncate">{job.productName}</p>
                                            <p className="text-xs text-secondary-500">{job.team}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="relative w-64 bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
                        {/* Sidebar Header */}
                        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-100">
                            <span className="font-bold text-xl text-secondary-900">เมนูหลัก</span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-secondary-500 hover:bg-secondary-50 rounded-lg"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`
                                        flex items - center gap - 3 px - 3 py - 3 rounded - lg transition - all
                                        ${router.pathname === item.path
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                        }
`}
                                >
                                    <item.icon size={20} className={router.pathname === item.path ? 'text-primary-600' : 'text-secondary-400'} />
                                    <span className="flex-1">{item.name}</span>
                                    {router.pathname === item.path && <ChevronRight size={16} className="text-primary-400" />}
                                </Link>
                            ))}
                        </div>

                        {/* User Profile */}
                        <div className="p-4 border-t border-secondary-100 bg-secondary-50">
                            <div className="flex items-center gap-3">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="User" className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                        {session?.user?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-secondary-900 truncate">{session?.user?.name || 'User'}</p>
                                    <p className="text-xs text-secondary-500 truncate">{session?.user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    return <ProtectedRoute>{content}</ProtectedRoute>
}
