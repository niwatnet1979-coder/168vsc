import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    Search,
    DollarSign,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Filter,
    ChevronLeft,
    ChevronRight,
    Wallet
} from 'lucide-react'

export default function FinancePage() {
    const [payments, setPayments] = useState([])
    const [filter, setFilter] = useState('all') // all, paid, partial, unpaid, overdue
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Load and calculate data from LocalStorage
    // Load and calculate data from Supabase
    useEffect(() => {
        const loadPayments = async () => {
            try {
                const orders = await DataManager.getOrders()

                const calculatedPayments = orders.map(order => {
                    const total = Number(order.totalAmount) || 0
                    const deposit = Number(order.deposit) || 0

                    // Calculate total paid (Deposit + any additional payments)
                    const additionalPaid = Array.isArray(order.payments)
                        ? order.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                        : 0

                    const paid = deposit + additionalPaid
                    const outstanding = total - paid

                    let status = 'Unpaid'
                    if (outstanding <= 0 && total > 0) status = 'Paid'
                    else if (paid > 0) status = 'Partial'

                    // Mock due date (e.g., 7 days after order date)
                    const orderDate = new Date(order.orderDate || order.createdAt)
                    const dueDate = new Date(orderDate)
                    dueDate.setDate(dueDate.getDate() + 7)

                    // Safe date formatting
                    const formatDate = (d) => {
                        if (isNaN(d.getTime())) return '-'
                        return d.toISOString().split('T')[0]
                    }

                    return {
                        id: order.id,
                        date: formatDate(orderDate),
                        customer: order.customerName || 'Unknown',
                        total: total,
                        deposit: deposit,
                        paid: paid,
                        outstanding: Math.max(0, outstanding), // No negative outstanding
                        status: status,
                        dueDate: formatDate(dueDate)
                    }
                })

                // Sort by date desc
                calculatedPayments.sort((a, b) => new Date(b.date) - new Date(a.date))

                setPayments(calculatedPayments)
            } catch (error) {
                console.error("Error loading payments:", error)
            }
        }

        loadPayments()
    }, [])

    // Filter logic
    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.customer.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        const today = new Date()
        const dueDate = new Date(payment.dueDate)
        // Reset time for accurate date comparison
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)

        const isOverdue = payment.outstanding > 0 && dueDate < today

        switch (filter) {
            case 'paid':
                return payment.status === 'Paid'
            case 'partial':
                return payment.status === 'Partial'
            case 'unpaid':
                return payment.status === 'Unpaid'
            case 'overdue':
                return isOverdue
            default:
                return true
        }
    })

    // Pagination
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Calculate stats
    const stats = {
        totalRevenue: payments.reduce((sum, p) => sum + p.total, 0),
        totalPaid: payments.reduce((sum, p) => sum + p.paid, 0),
        totalOutstanding: payments.reduce((sum, p) => sum + p.outstanding, 0),
        totalDeposit: payments.reduce((sum, p) => sum + p.deposit, 0)
    }

    const countByStatus = {
        paid: payments.filter(p => p.status === 'Paid').length,
        partial: payments.filter(p => p.status === 'Partial').length,
        unpaid: payments.filter(p => p.status === 'Unpaid').length,
        overdue: payments.filter(p => {
            const today = new Date()
            const dueDate = new Date(p.dueDate)
            today.setHours(0, 0, 0, 0)
            dueDate.setHours(0, 0, 0, 0)
            return p.outstanding > 0 && dueDate < today
        }).length
    }

    const getStatusColor = (status, isOverdue) => {
        if (isOverdue) return 'bg-danger-100 text-danger-700'
        switch (status) {
            case 'Paid': return 'bg-success-100 text-success-700'
            case 'Partial': return 'bg-warning-100 text-warning-700'
            case 'Unpaid': return 'bg-secondary-100 text-secondary-700'
            default: return 'bg-secondary-100 text-secondary-700'
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>การเงิน - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Wallet className="text-primary-600" size={32} />
                            การเงิน
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการสถานะการชำระเงินและยอดคงค้าง</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white px-4 py-3 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-secondary-600 text-sm font-medium">ยอดรวมทั้งหมด</span>
                        </div>
                        <div className="text-xl font-bold text-secondary-900">฿{stats.totalRevenue.toLocaleString()}</div>
                    </div>

                    <div className="bg-white px-4 py-3 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-secondary-600 text-sm font-medium">รับชำระแล้ว</span>
                        </div>
                        <div className="text-xl font-bold text-success-700">฿{stats.totalPaid.toLocaleString()}</div>
                    </div>

                    <div className="bg-white px-4 py-3 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                                <AlertCircle size={20} />
                            </div>
                            <span className="text-secondary-600 text-sm font-medium">ค้างชำระ</span>
                        </div>
                        <div className="text-xl font-bold text-danger-700">฿{stats.totalOutstanding.toLocaleString()}</div>
                    </div>

                    <div className="bg-white px-4 py-3 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-50 rounded-lg text-warning-600">
                                <CreditCard size={20} />
                            </div>
                            <span className="text-secondary-600 text-sm font-medium">มัดจำรวม</span>
                        </div>
                        <div className="text-xl font-bold text-warning-700">฿{stats.totalDeposit.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-secondary-200 shadow-sm">
                    {[
                        { id: 'all', label: 'ทั้งหมด', count: payments.length, icon: FileText },
                        { id: 'paid', label: 'ชำระครบ', count: countByStatus.paid, icon: CheckCircle },
                        { id: 'partial', label: 'ชำระบางส่วน', count: countByStatus.partial, icon: Clock },
                        { id: 'unpaid', label: 'ยังไม่ชำระ', count: countByStatus.unpaid, icon: AlertCircle },
                        { id: 'overdue', label: 'เกินกำหนด', count: countByStatus.overdue, icon: AlertCircle }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.id
                                ? tab.id === 'overdue'
                                    ? 'bg-danger-100 text-danger-700 shadow-sm'
                                    : 'bg-primary-100 text-primary-700 shadow-sm'
                                : 'text-secondary-600 hover:bg-secondary-50'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${filter === tab.id ? 'bg-white/50' : 'bg-secondary-100'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
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
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ยอดรวม</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">มัดจำ</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ชำระแล้ว</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">คงค้าง</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">กำหนดชำระ</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedPayments.length > 0 ? (
                                    paginatedPayments.map((payment) => {
                                        const today = new Date()
                                        const dueDate = new Date(payment.dueDate)
                                        today.setHours(0, 0, 0, 0)
                                        dueDate.setHours(0, 0, 0, 0)
                                        const isOverdue = payment.outstanding > 0 && dueDate < today

                                        return (
                                            <tr key={payment.id} className={`hover:bg-secondary-50 transition-colors ${isOverdue ? 'bg-danger-50/30' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/order?id=${payment.id}`} className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                                        {payment.id && payment.id.length > 8 ? `OD${payment.id.slice(-6)}` : payment.id}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                                    {payment.date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-secondary-900">{payment.customer}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-secondary-900">฿{payment.total.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-secondary-600">฿{payment.deposit.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-success-700">฿{payment.paid.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-bold ${payment.outstanding > 0 ? 'text-danger-600' : 'text-secondary-400'}`}>
                                                        {payment.outstanding > 0 ? `฿${payment.outstanding.toLocaleString()}` : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-danger-600 font-medium' : 'text-secondary-600'}`}>
                                                        {payment.dueDate}
                                                        {isOverdue && <AlertCircle size={14} />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status, isOverdue)}`}>
                                                        {isOverdue ? 'Overdue' : payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button className="px-3 py-1 bg-success-600 text-white text-xs font-medium rounded hover:bg-success-700 transition-colors shadow-sm">
                                                        บันทึก
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Wallet size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลการเงิน</p>
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
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} จาก {filteredPayments.length} รายการ
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
