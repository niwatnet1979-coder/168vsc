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
  ArrowRight
} from 'lucide-react'

export default function Home() {
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
    <AppLayout>
      <Head>
        <title>168APP Admin Dashboard</title>
      </Head>

      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-3xl font-bold text-secondary-900">
            ยินดีต้อนรับสู่ 168VSC System
          </h1>
          <p className="text-lg text-secondary-500">
            ระบบจัดการร้านค้าครบวงจร จัดการทุกอย่างได้ในที่เดียว
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <Link
              href={item.href}
              key={index}
              className={`
                group bg-white rounded-2xl p-6 border border-secondary-200 shadow-sm
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                flex flex-col gap-4 relative overflow-hidden
                ${item.hoverBorder} hover:border-t-4
              `}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color} transition-transform group-hover:scale-110`}>
                <item.icon size={28} strokeWidth={2} />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-secondary-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Arrow Icon (Bottom Right) */}
              <div className="absolute bottom-4 right-4 text-secondary-300 transform translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
