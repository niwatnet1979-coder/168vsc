import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    BarChart3,
    TrendingUp,
    Package,
    Users,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    ShoppingBag
} from 'lucide-react'

export default function ReportsPage() {
    const [period, setPeriod] = useState('month') // today, week, month, year, all

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

    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        items: 0,
        average: 0
    })
    const [topProducts, setTopProducts] = useState([])
    const [topCustomers, setTopCustomers] = useState([])
    const [recentOrders, setRecentOrders] = useState([])

    // Load and calculate data from LocalStorage
    const [allOrders, setAllOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Load data from Supabase
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const orders = await DataManager.getOrders()
            setAllOrders(orders)
            setIsLoading(false)
        }
        loadData()
    }, [])

    // Calculate stats when period or data changes
    useEffect(() => {
        const calculateStats = () => {
            if (!allOrders.length) return

            // Filter orders based on period
            const now = new Date()
            const filteredOrders = allOrders.filter(order => {
                const orderDate = new Date(order.orderDate || order.createdAt) // Handle both formats
                // Reset times to compare dates only
                const d1 = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
                const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                switch (period) {
                    case 'today':
                        return d1.getTime() === d2.getTime()
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                        return orderDate >= oneWeekAgo
                    case 'month':
                        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
                    case 'year':
                        return orderDate.getFullYear() === now.getFullYear()
                    case 'all':
                    default:
                        return true
                }
            })

            // Calculate Stats
            const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
            const totalOrders = filteredOrders.length
            const totalItems = filteredOrders.reduce((sum, order) => {
                return sum + (Array.isArray(order.items) ? order.items.reduce((acc, item) => acc + (Number(item.qty) || 1), 0) : 0)
            }, 0)
            const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

            setStats({
                revenue: totalRevenue,
                orders: totalOrders,
                items: totalItems,
                average: averageOrder
            })

            // Calculate Top Products
            const productMap = {}
            filteredOrders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const productName = item.name || 'Unknown Product'
                        if (!productMap[productName]) {
                            productMap[productName] = { name: productName, sold: 0, revenue: 0 }
                        }
                        productMap[productName].sold += (item.qty || 1)
                        productMap[productName].revenue += (item.price || 0) * (item.qty || 1)
                    })
                }
            })
            const sortedProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
            setTopProducts(sortedProducts)

            // Calculate Top Customers
            const customerMap = {}
            filteredOrders.forEach(order => {
                const customerName = order.customerName || 'Unknown Customer'
                if (!customerMap[customerName]) {
                    customerMap[customerName] = { name: customerName, orders: 0, revenue: 0 }
                }
                customerMap[customerName].orders += 1
                customerMap[customerName].revenue += (Number(order.totalAmount) || 0)
            })
            const sortedCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
            setTopCustomers(sortedCustomers)

            // Recent Orders (from filtered set)
            const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt)).slice(0, 5)
            setRecentOrders(sortedOrders)
        }

        calculateStats()
    }, [period, allOrders])

    return (
        <AppLayout>
            <Head>
                <title>รายงานและสถิติ - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <BarChart3 className="text-primary-600" size={32} />
                            รายงานและสถิติ
                        </h1>
                        <p className="text-secondary-500 mt-1">สรุปภาพรวมยอดขายและประสิทธิภาพ</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex bg-white p-1 rounded-lg border border-secondary-200 shadow-sm">
                        {['today', 'week', 'month', 'year', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p
                                    ? 'bg-primary-100 text-primary-700 shadow-sm'
                                    : 'text-secondary-600 hover:bg-secondary-50'
                                    }`}
                            >
                                {p === 'today' ? 'วันนี้' :
                                    p === 'week' ? 'สัปดาห์นี้' :
                                        p === 'month' ? 'เดือนนี้' :
                                            p === 'year' ? 'ปีนี้' : 'ทั้งหมด'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-success-50 text-success-600 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={14} className="mr-1" />
                                Revenue
                            </span>
                        </div>
                        <div className="text-secondary-500 text-sm font-medium mb-1">ยอดขายรวม</div>
                        <div className="text-3xl font-bold text-secondary-900">฿{stats.revenue.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                <ShoppingBag size={24} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                                <TrendingUp size={14} className="mr-1" />
                                Orders
                            </span>
                        </div>
                        <div className="text-secondary-500 text-sm font-medium mb-1">จำนวนออเดอร์</div>
                        <div className="text-3xl font-bold text-secondary-900">{stats.orders}</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-warning-50 text-warning-600 rounded-xl">
                                <Package size={24} />
                            </div>
                            <span className="text-xs font-medium text-secondary-400">Items Sold</span>
                        </div>
                        <div className="text-secondary-500 text-sm font-medium mb-1">รายการสินค้าที่ขาย</div>
                        <div className="text-3xl font-bold text-secondary-900">{stats.items}</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <CreditCard size={24} />
                            </div>
                            <span className="text-xs font-medium text-secondary-400">Avg. Order</span>
                        </div>
                        <div className="text-secondary-500 text-sm font-medium mb-1">เฉลี่ยต่อออเดอร์</div>
                        <div className="text-3xl font-bold text-secondary-900">฿{Math.round(stats.average).toLocaleString()}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                <Package className="text-primary-500" size={20} />
                                สินค้าขายดี
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">สินค้า</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">ขายได้ (ชิ้น)</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-600 uppercase">รายได้</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {topProducts.length > 0 ? (
                                        topProducts.map((product, i) => (
                                            <tr key={i} className="hover:bg-secondary-50">
                                                <td className="px-6 py-4 text-sm font-medium text-secondary-900">{product.name}</td>
                                                <td className="px-6 py-4 text-sm text-secondary-600 text-center">{product.sold}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary-600 text-right">฿{product.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-secondary-500">ไม่มีข้อมูล</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                <Users className="text-primary-500" size={20} />
                                ลูกค้าประจำ
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">ลูกค้า</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">ออเดอร์</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-600 uppercase">รายได้รวม</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {topCustomers.length > 0 ? (
                                        topCustomers.map((customer, i) => (
                                            <tr key={i} className="hover:bg-secondary-50">
                                                <td className="px-6 py-4 text-sm font-medium text-secondary-900">{customer.name}</td>
                                                <td className="px-6 py-4 text-sm text-secondary-600 text-center">{customer.orders}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary-600 text-right">฿{customer.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-secondary-500">ไม่มีข้อมูล</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                            <Calendar className="text-primary-500" size={20} />
                            ออเดอร์ล่าสุด
                        </h2>
                        <Link href="/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                            ดูทั้งหมด
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">วันที่</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">ลูกค้า</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-600 uppercase">ยอดรวม</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-secondary-50">
                                            <td className="px-6 py-4 text-sm font-mono font-medium text-primary-600">
                                                <Link href={`/order?id=${order.id}`} className="hover:underline">
                                                    {String(order.id).length > 20 ? `OD${String(order.id).slice(-6)}` : order.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-secondary-600">{formatDate(order.createdAt || order.orderDate)}</td>
                                            <td className="px-6 py-4 text-sm text-secondary-900">{order.customerName}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-secondary-900 text-right">฿{(order.totalAmount || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Completed' ? 'bg-success-100 text-success-700' :
                                                    order.status === 'Processing' ? 'bg-primary-100 text-primary-700' :
                                                        'bg-secondary-100 text-secondary-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-secondary-500">ไม่มีข้อมูล</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
