import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { DataManager } from '../../lib/dataManager'
import { Printer, MapPin, Phone, Calendar, CheckSquare } from 'lucide-react'

export default function JobOrderPage() {
    const router = useRouter()
    const { orderId } = router.query
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState(null)

    useEffect(() => {
        if (!router.isReady) return
        loadData()
    }, [router.isReady, orderId])

    const loadData = async () => {
        try {
            setLoading(true)
            if (orderId) {
                const data = await DataManager.getOrderById(orderId)
                if (data) setOrder(data)
            }
        } catch (error) {
            console.error("Error loading job order:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!order) return <div className="p-8 text-center">Order not found</div>

    // Helper to get installation/onsite contacts
    const onsiteContacts = order.onsiteContacts || []
    // If no onsite contacts, fallback to customer/receiver
    if (onsiteContacts.length === 0) {
        if (order.receiverContact) onsiteContacts.push(order.receiverContact)
        else if (order.customerContact) onsiteContacts.push(order.customerContact)
    }

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white font-sans text-sm">
            <Head>
                <title>ใบงานติดตั้ง (Job Order) - {order.id}</title>
            </Head>

            {/* Controls */}
            <div className="print:hidden bg-white border-b p-4 sticky top-0 z-10 shadow-sm mb-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-gray-800">ใบงานติดตั้ง (Installation Job Order)</h1>
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* A4 Page */}
            <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-lg print:shadow-none print:m-0 min-h-[297mm]">

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black mb-1">ใบงานติดตั้ง / ส่งสินค้า</h1>
                        <h2 className="text-lg font-bold text-gray-600">INSTALLATION JOB ORDER</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold font-mono">{order.id}</div>
                        <div className="text-gray-600">วันที่สร้าง: {new Date().toLocaleDateString('th-TH')}</div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Left: Customer & Location */}
                    <div>
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 flex items-center gap-2">
                            <MapPin size={16} /> ข้อมูลหน้างาน (Site Info)
                        </h3>
                        <div className="space-y-2 text-gray-800">
                            <div>
                                <span className="font-semibold">ลูกค้า:</span> {typeof order.customer === 'object' ? order.customer.name : order.customer}
                            </div>
                            <div>
                                <span className="font-semibold">สถานที่ติดตั้ง:</span>
                                <div className="pl-4 border-l-2 border-gray-200 mt-1">
                                    {typeof order.address === 'object' ? order.address.address : (order.address || '-')}
                                </div>
                            </div>
                            {order.locationUrl && (
                                <div className="mt-2 text-xs text-blue-600 truncate">
                                    <a href={order.locationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                                        <MapPin size={12} /> Google Maps Link
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Contact & Date */}
                    <div>
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 flex items-center gap-2">
                            <Phone size={16} /> ผู้ติดต่อหน้างาน (Site Contact)
                        </h3>
                        <div className="space-y-3">
                            {onsiteContacts.map((c, i) => (
                                <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="font-semibold">{c.name}</div>
                                    <div className="text-lg font-bold text-black">{c.phone}</div>
                                </div>
                            ))}
                            <div className="mt-4">
                                <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 flex items-center gap-2">
                                    <Calendar size={16} /> วันนัดหมาย (Appointment)
                                </h3>
                                <div className="text-lg font-bold">
                                    {order.appointmentDate ? new Date(order.appointmentDate).toLocaleDateString('th-TH', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    }) : 'ยังไม่ระบุ'}
                                </div>
                                {order.appointmentTime && <div>เวลา: {order.appointmentTime}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Checklist */}
                <div className="mb-8">
                    <h3 className="font-bold bg-gray-100 p-2 mb-0 border border-gray-300 flex items-center gap-2">
                        <CheckSquare size={16} /> รายการสินค้าและการดำเนินการ (Checklist)
                    </h3>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-300 p-2 w-12 text-center">#</th>
                                <th className="border border-gray-300 p-2 text-left">รายละเอียดสินค้า (Product)</th>
                                <th className="border border-gray-300 p-2 w-20 text-center">จำนวน</th>
                                <th className="border border-gray-300 p-2 w-32 text-center">หมายเหตุ</th>
                                <th className="border border-gray-300 p-2 w-24 text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-gray-300 p-2">
                                        <div className="font-semibold">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.code} {item.dimensions ? `(${item.dimensions})` : ''}</div>
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">{item.qty}</td>
                                    <td className="border border-gray-300 p-2"></td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        <div className="w-4 h-4 border border-gray-400 mx-auto rounded-sm"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notes */}
                <div className="mb-8 border border-gray-300 rounded p-4 h-32">
                    <div className="font-bold mb-2">บันทึกเพิ่มเติมจากช่าง / หมายเหตุหน้างาน:</div>
                    <div className="border-b border-gray-200 mt-6 dashed"></div>
                    <div className="border-b border-gray-200 mt-6 dashed"></div>
                    <div className="border-b border-gray-200 mt-6 dashed"></div>
                </div>

                {/* Signatures */}
                <div className="flex gap-8 mt-auto pt-8 break-inside-avoid">
                    <div className="flex-1 border border-gray-300 p-4 text-center h-40 flex flex-col justify-between">
                        <div className="text-center font-bold">ลูกค้า / ผู้รับสินค้า</div>
                        <div>
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <div className="text-xs">(ลงชื่อ)</div>
                        </div>
                        <div className="text-left text-xs mt-2">
                            วันที่: .......................................
                        </div>
                    </div>
                    <div className="flex-1 border border-gray-300 p-4 text-center h-40 flex flex-col justify-between">
                        <div className="text-center font-bold">ช่างผู้ติดตั้ง / ผู้ส่งสินค้า</div>
                        <div>
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <div className="text-xs">(ลงชื่อ)</div>
                        </div>
                        <div className="text-left text-xs mt-2">
                            วันที่: .......................................
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    )
}
