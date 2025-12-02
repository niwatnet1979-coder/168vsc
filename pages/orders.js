import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
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
    MoreHorizontal
} from 'lucide-react'

export default function OrdersListPage() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Load data from LocalStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('orders_data')
        if (savedData) {
            setOrders(JSON.parse(savedData))
        }
    }, [])

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'all' || (order.status && order.status.toLowerCase() === statusFilter.toLowerCase())

        return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date desc

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
        if (confirm('คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?')) {
            const updatedOrders = orders.filter(o => o.id !== orderId)
            setOrders(updatedOrders)
            localStorage.setItem('orders_data', JSON.stringify(updatedOrders))
        }
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
            case 'ติดตั้ง': return 'bg-danger-50 text-danger-700 border-danger-100'
            case 'ส่งของ': return 'bg-warning-50 text-warning-700 border-warning-100'
            default: return 'bg-primary-50 text-primary-700 border-primary-100'
        }
    }

    const getJobTypeIcon = (type) => {
        switch (type) {
            case 'ติดตั้ง': return <Wrench size={14} className="mr-1" />
            case 'ส่งของ': return <Truck size={14} className="mr-1" />
            default: return <Package size={14} className="mr-1" />
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>รายการคำสั่งซื้อ - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <FileText className="text-primary-600" size={32} />
                            รายการคำสั่งซื้อ
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการคำสั่งซื้อทั้งหมด {orders.length} รายการ</p>
                    </div>
                    <button
                        onClick={() => router.push('/order')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                    >
                        <Plus size={18} />
                        สร้างคำสั่งซื้อใหม่
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setStatusFilter('all')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${statusFilter === 'all' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-secondary-500 text-sm font-medium">ทั้งหมด</span>
                            <div className="p-2 bg-secondary-50 rounded-lg text-secondary-600">
                                <FileText size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-secondary-900">{stats.total}</div>
                    </div>

                    <div
                        onClick={() => setStatusFilter('pending')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${statusFilter === 'pending' ? 'border-secondary-500 ring-1 ring-secondary-500' : 'border-secondary-200 hover:border-secondary-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-secondary-500 text-sm font-medium">รอดำเนินการ</span>
                            <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-secondary-900">{stats.pending}</div>
                    </div>

                    <div
                        onClick={() => setStatusFilter('processing')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${statusFilter === 'processing' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 hover:border-primary-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-primary-600 text-sm font-medium">กำลังดำเนินการ</span>
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Wrench size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-primary-700">{stats.processing}</div>
                    </div>

                    <div
                        onClick={() => setStatusFilter('completed')}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${statusFilter === 'completed' ? 'border-success-500 ring-1 ring-success-500' : 'border-secondary-200 hover:border-success-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-success-600 text-sm font-medium">เสร็จสิ้น</span>
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-success-700">{stats.completed}</div>
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันที่</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ลูกค้า</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">รายการ</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ยอดรวม</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">มัดจำ</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">ประเภทงาน</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-secondary-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/order?id=${order.id}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                    {order.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                                {order.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-secondary-900">{order.customer}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-600">
                                                {Array.isArray(order.items) ? order.items.length : order.items}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-bold text-primary-700">฿{(order.total || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-secondary-600">฿{(order.deposit || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getJobTypeColor(order.jobType)}`}>
                                                    {getJobTypeIcon(order.jobType)}
                                                    {order.jobType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/order?id=${order.id}`}>
                                                        <button className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="ดูรายละเอียด">
                                                            <Eye size={18} />
                                                        </button>
                                                    </Link>
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
                                        <td colSpan="9" className="px-6 py-12 text-center text-secondary-500">
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
        </AppLayout>
    )
}
