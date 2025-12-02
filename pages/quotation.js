import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import Quotation from '../components/Quotation'
import {
  FileText,
  Search,
  Plus,
  Printer,
  Eye,
  Calendar,
  User,
  DollarSign,
  MoreHorizontal,
  X
} from 'lucide-react'

export default function QuotationPage() {
  const [quotations, setQuotations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Load data from LocalStorage and transform to Quotation format
  useEffect(() => {
    const loadQuotations = () => {
      const savedOrders = localStorage.getItem('orders_data')
      if (savedOrders) {
        const orders = JSON.parse(savedOrders)

        // Transform Orders to Quotations
        const transformedQuotations = orders.map(order => {
          // Calculate valid until date (15 days after order date)
          const orderDate = new Date(order.date)
          const validUntilDate = new Date(orderDate)
          validUntilDate.setDate(validUntilDate.getDate() + 15)

          return {
            id: order.id, // Use Order ID as base
            quotationNumber: `Q-${order.id.replace('ORD-', '')}`,
            date: order.date,
            validUntil: validUntilDate.toISOString().split('T')[0],
            status: order.status === 'Completed' ? 'Approved' : 'Pending', // Map status
            total: order.total || 0,

            // Data structure for Quotation Component
            company: {
              name: 'บริษัท 168 ไลท์ติ้ง แอนด์ เบดดิ้ง จำกัด',
              address: 'เลขที่ 168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
              taxId: '0135566027619',
              phone: '084-282-9465',
              email: 'LINE@: @interior-lighting',
              branch: 'สำนักงานใหญ่',
              vatRegistered: true
            },
            customer: {
              name: order.customer || 'ลูกค้าทั่วไป',
              contact1: { name: order.customer, phone: order.phone || '-' },
              address: order.address || '-',
              invoiceName: order.customer,
              invoiceTaxId: order.taxId || '-'
            },
            items: Array.isArray(order.items) ? order.items.map(item => ({
              description: item.name,
              qty: item.qty || 1,
              unitPrice: item.price || 0
            })) : [],
            jobType: 'installation', // Default
            terms: 'ระยะเวลาการส่งสินค้า 7-14 วันหลังวางมัดจำ 50%. การรับประกันสินค้า 1 ปีตามเงื่อนไขของผู้ผลิต. ราคานี้ยังไม่รวมค่าขนส่ง (ถ้ามี) เว้นแต่ระบุไว้เป็นอย่างอื่น.',
            qr: {
              image: '/qr.png',
              title: '168 อินทีเรีย ไลท์ติ้ง',
              account: 'ชื่อบัญชี: บจก. 168 ไลท์ติ้ง แอนด์ เบดดิ้ง',
              reference: `REF-${order.id}`
            },
            installation: {
              appointmentDate: '-',
              onsiteContacts: []
            }
          }
        })

        // Sort by date desc
        transformedQuotations.sort((a, b) => new Date(b.date) - new Date(a.date))
        setQuotations(transformedQuotations)
      }
    }

    loadQuotations()
  }, [])

  const filteredQuotations = quotations.filter(q =>
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewQuotation = (quotation) => {
    setSelectedQuotation(quotation)
    setShowModal(true)
  }

  return (
    <AppLayout>
      <Head>
        <title>ใบเสนอราคา (Quotations) - 168VSC System</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
              <FileText className="text-primary-600" size={32} />
              ใบเสนอราคา (Quotations)
            </h1>
            <p className="text-secondary-500 mt-1">จัดการและสร้างใบเสนอราคาสำหรับลูกค้า</p>
          </div>
          <Link href="/orders" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30">
            <Plus size={18} />
            สร้างใบเสนอราคาใหม่
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ใบเสนอราคา, ชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">เลขที่เอกสาร</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ลูกค้า</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">วันหมดอายุ</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">ยอดรวม</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredQuotations.length > 0 ? (
                  filteredQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary-500" />
                          <span className="font-mono text-sm font-medium text-primary-600">{q.quotationNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {q.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">{q.customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {q.validUntil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-secondary-900">฿{q.total.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${q.status === 'Approved' ? 'bg-success-100 text-success-700' :
                            q.status === 'Pending' ? 'bg-warning-100 text-warning-700' :
                              'bg-secondary-100 text-secondary-700'
                          }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewQuotation(q)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-secondary-300 text-secondary-700 text-xs font-medium rounded-lg hover:bg-secondary-50 transition-colors shadow-sm"
                        >
                          <Eye size={14} />
                          ดูเอกสาร
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={48} className="text-secondary-300 mb-4" />
                        <p className="text-lg font-medium text-secondary-900">ไม่พบใบเสนอราคา</p>
                        <p className="text-sm text-secondary-500 mt-1">สร้างใบเสนอราคาใหม่จากหน้าออเดอร์</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quotation Preview Modal */}
      {showModal && selectedQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-none print:max-h-none print:h-auto">
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50 print:hidden">
              <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                ตัวอย่างใบเสนอราคา: {selectedQuotation.quotationNumber}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-secondary-200"
                  title="พิมพ์"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-secondary-100 p-6 print:p-0 print:bg-white print:overflow-visible">
              <div className="bg-white shadow-lg mx-auto print:shadow-none print:mx-0" style={{ maxWidth: '210mm' }}>
                <Quotation data={selectedQuotation} />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
