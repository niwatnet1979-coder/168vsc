import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import {
  ShoppingCart,
  Package,
  Users,
  UserSquare2,
  Wrench,
  Banknote,
  FileText,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Menu
} from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    pendingOrders: 0,
    pendingJobs: 0,
    lowStockProducts: 0
  })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadDashboardData = async () => {
      try {
        // 1. Load Orders from Supabase
        const orders = await DataManager.getOrders()

        // Calculate Today's Revenue
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayRevenue = orders
          .filter(o => {
            const d = new Date(o.date)
            d.setHours(0, 0, 0, 0)
            return d.getTime() === today.getTime()
          })
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

        // Calculate Pending Orders
        const pendingOrdersCount = orders.filter(o => o.status === 'Processing' || o.status === 'Pending').length

        // 2. Pending Jobs (derive from orders for now)
        const pendingJobsCount = orders.filter(o =>
          (o.status === 'Processing' || o.status === 'Pending')
        ).length

        // 3. Load Products for Low Stock
        const products = await DataManager.getProducts()
        const lowStockCount = products.filter(p => (p.stock || 0) < 10).length

        setStats({
          todayRevenue,
          pendingOrders: pendingOrdersCount,
          pendingJobs: pendingJobsCount,
          lowStockProducts: lowStockCount
        })

        // Recent Orders
        const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        setRecentOrders(sortedOrders)

      } catch (error) {
        console.error("Error loading dashboard data:", error)
      }
    }

    loadDashboardData()
  }, [mounted])

  const menuItems = [
    {
      title: 'จัดการงานขาย (Sale)',
      description: 'ออเดอร์, สถานะการขาย',
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
      hoverBorder: 'hover:border-blue-500',
      href: '/orders'
    },
    {
      title: 'จัดการสินค้า (Product)',
      description: 'สต็อก, ราคา, รายละเอียด',
      icon: Package,
      color: 'bg-indigo-50 text-indigo-600',
      hoverBorder: 'hover:border-indigo-500',
      href: '/products'
    },
    {
      title: 'จัดการลูกค้า (Customer)',
      description: 'รายชื่อ, ประวัติ, ข้อมูลติดต่อ',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      hoverBorder: 'hover:border-orange-500',
      href: '/customers'
    },
    {
      title: 'จัดการทีม (Team)',
      description: 'พนักงาน, สิทธิ์การใช้งาน',
      icon: UserSquare2,
      color: 'bg-cyan-50 text-cyan-600',
      hoverBorder: 'hover:border-cyan-500',
      href: '/team'
    },
    {
      title: 'งานติดตั้ง (Jobs)',
      description: 'ตารางงาน, สถานะติดตั้ง',
      icon: Wrench,
      color: 'bg-teal-50 text-teal-600',
      hoverBorder: 'hover:border-teal-500',
      href: '/jobs'
    },
    {
      title: 'การเงิน/บิล (Finance)',
      description: 'แจ้งหนี้, ใบเสร็จ, ยอดขาย',
      icon: Banknote,
      color: 'bg-green-50 text-green-600',
      hoverBorder: 'hover:border-green-500',
      href: '/finance'
    },
    {
      title: 'ใบเสนอราคา (Quotation)',
      description: 'สร้างและจัดการใบเสนอราคา',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600',
      hoverBorder: 'hover:border-purple-500',
      href: '/quotation'
    },
    {
      title: 'รายงาน (Reports)',
      description: 'สรุปยอดขาย, สถิติ',
      icon: BarChart3,
      color: 'bg-rose-50 text-rose-600',
      hoverBorder: 'hover:border-rose-500',
      href: '/reports'
    }
  ]

  return (
    <AppLayout
      renderHeader={({ setIsSidebarOpen }) => (
        <header className="bg-white border-b border-secondary-200 px-4 py-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  ยินดีต้อนรับสู่ 168VSC System
                </h1>
                <p className="text-sm text-secondary-500 mt-1">
                  ภาพรวมสถานะร้านค้าของคุณวันนี้
                </p>
              </div>
            </div>
            <Link href="/order" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30 w-full sm:w-auto justify-center">
              <Plus size={18} />
              สร้างออเดอร์ใหม่
            </Link>
          </div>
        </header>
      )}
    >
      <Head>
        <title>Dashboard - 168VSC System</title>
      </Head>

      <div className="space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-secondary-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-success-50 text-success-600 rounded-xl">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">ยอดขายวันนี้</p>
              <h3 className="text-2xl font-bold text-secondary-900">฿{stats.todayRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-secondary-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-warning-50 text-warning-600 rounded-xl">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">ออเดอร์รอจัดการ</p>
              <h3 className="text-2xl font-bold text-secondary-900">{stats.pendingOrders}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-secondary-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">งานติดตั้งรอคิว</p>
              <h3 className="text-2xl font-bold text-secondary-900">{stats.pendingJobs}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-secondary-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-danger-50 text-danger-600 rounded-xl">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">สินค้าใกล้หมด</p>
              <h3 className="text-2xl font-bold text-secondary-900">{stats.lowStockProducts}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-secondary-900">ออเดอร์ล่าสุด</h2>
              <Link href="/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Order ID</th>
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
                          <Link href={`/order?id=${order.id}`}>
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-900">{order.customer}</td>
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
                      <td colSpan="4" className="px-6 py-8 text-center text-secondary-500">ไม่มีข้อมูลออเดอร์ล่าสุด</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Menu (Grid) - Compact Version */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-lg font-bold text-secondary-900">เมนูลัด</h2>
            <div className="grid grid-cols-2 gap-4">
              {menuItems.slice(0, 6).map((item, index) => (
                <Link
                  href={item.href}
                  key={index}
                  className={`
                                        group bg-white rounded-xl p-4 border border-secondary-200 shadow-sm
                                        transition-all duration-200 hover:-translate-y-1 hover:shadow-md
                                        flex flex-col items-center text-center gap-3
                                        ${item.hoverBorder} hover:border-t-4
                                    `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color} transition-transform group-hover:scale-110`}>
                    <item.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                    {item.title.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/settings" className="block w-full py-3 bg-secondary-100 text-secondary-600 text-center rounded-xl font-medium hover:bg-secondary-200 transition-colors">
              ตั้งค่าระบบเพิ่มเติม
            </Link>
          </div>
        </div>
      </div>
    </AppLayout >
  )
}
