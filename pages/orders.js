import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import ConfirmDialog from '../components/ConfirmDialog'
import { DataManager } from '../lib/dataManager'
import {
    Search,
    Plus,
    Filter,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    FileText,
    Clock,
    CheckCircle,
    Truck,
    Wrench,
    Package,
    MoreHorizontal,
    RotateCcw,
    Menu,
    ListTree,
    HelpCircle
} from 'lucide-react'

export default function OrdersListPage() {
    // Force rebuild timestamp: 2025-12-21
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [loadError, setLoadError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [orderToDelete, setOrderToDelete] = useState(null)
    const itemsPerPage = 15

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const d = new Date(dateString)
        if (isNaN(d.getTime())) return '-'
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    // Load data from Supabase on mount
    const loadOrders = async () => {
        try {
            setLoadError(null)
            // Use DataManager to get normalized orders with joined customer data
            const allOrders = await DataManager.getOrders()

            // 1. Calculate individual outstanding for each order
            const ordersWithOutstanding = allOrders.map(order => {
                const total = Number(order.totalAmount) || 0
                const paid = Number(order.deposit) || 0
                const outstanding = Math.max(0, total - paid)
                return {
                    ...order,
                    individualOutstanding: outstanding
                }
            })

            // 2. Sum outstanding balance by customer
            const customerDebtMap = {}
            ordersWithOutstanding.forEach(order => {
                // Skip Cancelled orders
                if (order.status && order.status.toLowerCase() === 'cancelled') return

                // Determine key: prioritize customerId, fallback to Name
                const key = order.customerId || order.customerName || 'Unknown'
                if (!customerDebtMap[key]) {
                    customerDebtMap[key] = 0
                }
                customerDebtMap[key] += order.individualOutstanding
            })

            // 3. Attach total customer debt to each order
            const finalOrders = ordersWithOutstanding.map(order => {
                const key = order.customerId || order.customerName || 'Unknown'
                return {
                    ...order,
                    totalCustomerOutstanding: customerDebtMap[key] || 0
                }
            })

            // Sort by date (newest first)
            const sortedOrders = finalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            setOrders(sortedOrders)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
            setLoadError('เชื่อมต่อฐานข้อมูลไม่ได้ชั่วคราว (Supabase/เครือข่าย) กรุณาลองใหม่')
        }
    }

    useEffect(() => {
        loadOrders()

        // Realtime Subscription
        if (DataManager.supabase) {
            const subscription = DataManager.supabase
                .channel('orders_list_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                    console.log('Realtime Order Update:', payload)
                    loadOrders()
                })
                .subscribe()

            return () => {
                DataManager.supabase.removeChannel(subscription)
            }
        }
    }, [])

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.id && String(order.id).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customerName && String(order.customerName).toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'all' || (order.status && String(order.status).toLowerCase() === statusFilter.toLowerCase())

        return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt)) // Sort by date desc

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        processing: orders.filter(o => o.status === 'Processing').length,
        completed: orders.filter(o => o.status === 'Completed').length
    }

    const handleDeleteOrder = (orderId) => {
        setOrderToDelete(orderId)
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!orderToDelete) return

        setShowDeleteConfirm(false)
        const success = await DataManager.deleteOrder(orderToDelete)
        if (success) {
            loadOrders()
        } else {
            alert('เกิดข้อผิดพลาดในการลบ')
        }
        setOrderToDelete(null)
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-secondary-100 text-secondary-700'
            case 'processing': return 'bg-primary-100 text-primary-700'
            case 'completed': return 'bg-success-100 text-success-700'
            case 'cancelled': return 'bg-danger-100 text-danger-700'
            default: return 'bg-secondary-100 text-secondary-700'
        }
    }

    const getJobTypeColor = (type) => {
        switch (type) {
            case 'installation': return 'bg-danger-50 text-danger-700 border-danger-100'
            case 'delivery': return 'bg-warning-50 text-warning-700 border-warning-100'
            case 'separate': return 'bg-info-50 text-info-700 border-info-100'
            case 'mixed': return 'bg-purple-50 text-purple-700 border-purple-100'
            default: return 'bg-secondary-100 text-secondary-500 border-secondary-200'
        }
    }

    const getJobTypeIcon = (type) => {
        switch (type) {
            case 'installation': return <Wrench size={14} />
            case 'delivery': return <Truck size={14} />
            case 'separate': return <ListTree size={14} />
            case 'mixed': return <MoreHorizontal size={14} />
            default: return <HelpCircle size={14} />
        }
    }

    const getJobTypeLabel = (type) => {
        switch (type) {
            case 'installation': return 'งานติดตั้ง'
            case 'delivery': return 'ขนส่ง'
            case 'separate': return 'งานแยก'
            case 'mixed': return 'งานรวม'
            default: return 'ไม่ระบุ'
        }
    }

    const normalizeJobType = (type) => {
        if (!type || type === '-' || type === 'ไม่ระบุ') return null
        const t = String(type).trim().toLowerCase()
        if (t.includes('ติดตั้ง') || t.includes('install')) return 'installation'
        if (t.includes('ขนส่ง') || t.includes('ส่งของ') || t.includes('delivery')) return 'delivery'
        if (t.includes('แยก') || t === 'separate') return 'separate'
        return t
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
                                    <FileText className="text-primary-600" size={28} />
                                    รายการคำสั่งซื้อ
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">จัดการคำสั่งซื้อทั้งหมด {orders.length} รายการ</p>
                            </div>
                        </div>
                        {loadError && (
                            <div className="flex items-center gap-3 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-2 rounded-lg w-full sm:w-auto">
                                <span className="text-sm">{loadError}</span>
                                <button
                                    className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md bg-white border border-danger-200 hover:bg-danger-50"
                                    onClick={loadOrders}
                                    type="button"
                                >
                                    <RotateCcw size={16} />
                                    ลองใหม่
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 w-full sm:w-auto">

                            <button
                                onClick={() => router.push('/order')}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30 text-sm"
                            >
                                <Plus size={18} />
                                สร้างคำสั่งซื้อใหม่
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>รายการคำสั่งซื้อ - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setStatusFilter('all')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${statusFilter === 'all' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-50 rounded-lg text-secondary-600">
                                <FileText size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">ทั้งหมด</span>
                        </div>
                        <span className="text-2xl font-bold text-secondary-900">{stats.total}</span>
                    </div>

                    <div
                        onClick={() => setStatusFilter('pending')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${statusFilter === 'pending' ? 'border-secondary-500 ring-1 ring-secondary-500' : 'border-secondary-200 hover:border-secondary-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
                                <Clock size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">รอดำเนินการ</span>
                        </div>
                        <span className="text-2xl font-bold text-secondary-900">{stats.pending}</span>
                    </div>

                    <div
                        onClick={() => setStatusFilter('processing')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${statusFilter === 'processing' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Wrench size={20} />
                            </div>
                            <span className="text-primary-700 font-medium">กำลังดำเนินการ</span>
                        </div>
                        <span className="text-2xl font-bold text-primary-700">{stats.processing}</span>
                    </div>

                    <div
                        onClick={() => setStatusFilter('completed')}
                        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between ${statusFilter === 'completed' ? 'border-success-500 ring-1 ring-success-500' : 'border-secondary-200 hover:border-success-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-success-700 font-medium">เสร็จสิ้น</span>
                        </div>
                        <span className="text-2xl font-bold text-success-700">{stats.completed}</span>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหา Order ID หรือชื่อลูกค้า..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg border border-secondary-200 text-secondary-600 text-sm font-medium">
                            <Filter size={16} />
                            <span>สถานะ: {statusFilter === 'all' ? 'ทั้งหมด' : statusFilter}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันที่สร้างออเดอร์</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ลูกค้า</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">รายการ</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">จำนวน</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">จำนวนงาน</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ยอดรวม</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ยอดค้างชำระ</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">ประเภทงาน</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-secondary-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/order?id=${order.id}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                    {order.id && String(order.id).length > 20 ? `#${String(order.id).slice(-6)}` : (order.id || '-')}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                                {formatDate(order.createdAt || order.orderDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-secondary-900">{order.customerName || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-600">
                                                {Array.isArray(order.items) ? order.items.length : order.items}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-600">
                                                {Array.isArray(order.items)
                                                    ? order.items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0)
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-600 font-bold text-primary-600">
                                                {Array.isArray(order.items)
                                                    ? order.items.reduce((sum, item) => sum + (item.jobs?.length || 0), 0)
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-bold text-primary-700">฿{(order.totalAmount || order.total || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className={`text-sm ${(order.totalCustomerOutstanding || 0) > 0 ? 'text-warning-600 font-bold' : 'text-success-600'}`}>
                                                    ฿{(order.totalCustomerOutstanding || 0).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-600 font-bold text-primary-600">
                                                {(() => {
                                                    try {
                                                        // Ensure items is an array
                                                        const items = Array.isArray(order.items) ? order.items : []

                                                        // Flatten all job types across all items
                                                        const rawTypes = items.flatMap(item => {
                                                            if (!item || !Array.isArray(item.jobs)) return []
                                                            return item.jobs.map(j => j?.job_type)
                                                        })

                                                        const normalizedTypes = rawTypes.map(normalizeJobType).filter(Boolean)
                                                        const uniqueTypes = [...new Set(normalizedTypes)]

                                                        const displayType = uniqueTypes.length > 1 ? 'mixed' : (uniqueTypes[0] || null)

                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${getJobTypeColor(displayType)}`}>
                                                                {getJobTypeIcon(displayType)}
                                                                {getJobTypeLabel(displayType)}
                                                            </span>
                                                        )
                                                    } catch (err) {
                                                        console.error('Job Type Render Error:', err)
                                                        return <span className="text-xs text-secondary-400">-</span>
                                                    }
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                        title="ลบคำสั่งซื้อ"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลคำสั่งซื้อ</p>
                                                <p className="text-sm text-secondary-500 mt-1">ลองเปลี่ยนคำค้นหา หรือสร้างคำสั่งซื้อใหม่</p>
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
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} จาก {filteredOrders.length} รายการ
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="ยืนยันการลบ"
                message="คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </AppLayout>
    )
}
