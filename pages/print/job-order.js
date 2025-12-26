import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { DataManager } from '../../lib/dataManager'
import { Printer, MapPin, Phone, Calendar, CheckSquare } from 'lucide-react'

export default function JobOrderPage() {
    const router = useRouter()
    const { orderId, jobId } = router.query
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState(null)

    useEffect(() => {
        if (!router.isReady) return
        loadData()
    }, [router.isReady, orderId, jobId])

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

    // Helper to get formatted date and address from jobs
    const getJobInfo = () => {
        let info = {
            appointmentDate: null,
            installAddress: null,
            locationUrl: null,
            jobType: 'installation', // Default
            team: null
        }

        if (order.jobs && order.jobs.length > 0) {
            let targetJob = null

            // If jobId is provided, prioritize that specific job
            if (jobId) {
                targetJob = order.jobs.find(j => String(j.id) === String(jobId))
            }

            // If no specific job found or requested, valid fallback logic
            if (!targetJob) {
                // Find first job with appointment date
                const jobWithDate = order.jobs.find(j => j.appointmentDate || j.appointment_date)
                if (jobWithDate) {
                    info.appointmentDate = new Date(jobWithDate.appointmentDate || jobWithDate.appointment_date)
                }

                // Find first job with address
                const jobWithAddr = order.jobs.find(j => j.installAddress || j.install_address || j.location_id)
                if (jobWithAddr) targetJob = jobWithAddr
            }

            if (targetJob) {
                // Set date from target job if we haven't already set it via fallback
                if (!info.appointmentDate && (targetJob.appointmentDate || targetJob.appointment_date)) {
                    info.appointmentDate = new Date(targetJob.appointmentDate || targetJob.appointment_date)
                }

                // Set address from target job
                if (targetJob.siteAddressRecord) {
                    info.installAddress = targetJob.siteAddressRecord.address || targetJob.siteAddressRecord.name
                    info.locationUrl = targetJob.siteAddressRecord.google_maps_link || targetJob.siteAddressRecord.maps
                } else {
                    info.installAddress = targetJob.installAddress || targetJob.install_address
                    info.locationUrl = targetJob.googleMapLink || targetJob.google_map_link || targetJob.locationUrl || targetJob.location_url
                }

                // Set Job Type & Team
                if (targetJob.jobType || targetJob.job_type) {
                    info.jobType = targetJob.jobType || targetJob.job_type
                }
                if (targetJob.team || targetJob.assignedTeam || targetJob.assigned_team) {
                    info.team = targetJob.team || targetJob.assignedTeam || targetJob.assigned_team
                }
            }
        }
        return info
    }
    const { appointmentDate, installAddress, locationUrl, jobType, team } = getJobInfo()

    // Address Fallback hierarchy
    const displayAddress = installAddress ||
        (order.deliveryAddress?.address) ||
        (typeof order.address === 'object' ? order.address.address : order.address) ||
        '-'
    const displayLocationUrl = locationUrl ||
        order.locationUrl ||
        order.deliveryAddress?.maps ||
        order.deliveryAddress?.google_maps_link

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
                        <h2 className="text-lg font-bold text-gray-600 uppercase">
                            {jobType === 'delivery' ? 'DELIVERY JOB ORDER' : 'INSTALLATION JOB ORDER'}
                            {team ? ` (${team})` : ''}
                        </h2>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold font-mono">{order.id}</div>
                        <div className="text-gray-600">วันที่นัดหมาย: {appointmentDate ? appointmentDate.toLocaleDateString('th-TH', { timeZone: 'UTC' }) : '-'}</div>
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
                                    {displayAddress}
                                </div>
                            </div>
                            {displayLocationUrl && (
                                <div className="mt-2 text-xs text-blue-600 truncate">
                                    <a href={displayLocationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
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
                                    {appointmentDate ? appointmentDate.toLocaleDateString('th-TH', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                        timeZone: 'UTC'
                                    }) : 'ยังไม่ระบุ'}
                                </div>
                                {appointmentDate && (
                                    <div className="mt-1 font-medium">
                                        เวลา: {appointmentDate.toLocaleTimeString('th-TH', {
                                            hour: '2-digit', minute: '2-digit',
                                            timeZone: 'UTC'
                                        })} น.
                                    </div>
                                )}
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
                            {order.items?.filter(item => {
                                // If no jobId is specified, show all items
                                if (!jobId) return true
                                // If jobId is specified, only show items that have this job
                                if (item.jobs && item.jobs.length > 0) {
                                    return item.jobs.some(j => String(j.id) === String(jobId))
                                }
                                return false
                            }).map((item, idx) => {
                                // Find the relevant job to show remarks
                                let relevantJob = null
                                if (item.jobs && item.jobs.length > 0) {
                                    if (jobId) {
                                        relevantJob = item.jobs.find(j => String(j.id) === String(jobId))
                                    } else {
                                        relevantJob = item.jobs[0]
                                    }
                                }

                                return (
                                    <tr key={idx}>
                                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                        <td className="border border-gray-300 p-2">
                                            <div className="font-semibold">{item.product?.name || item.name || 'สินค้าไม่ระบุชื่อ'}</div>
                                            <div className="text-xs text-gray-500">
                                                {item.sku || item.variant?.sku || item.product?.product_code || item.code || '-'}
                                                {item.dimensions ? ` (${item.dimensions})` : ''}
                                                {item.variant?.color ? ` สี: ${item.variant.color}` : ''}
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-2 text-center">{item.qty || item.quantity || 1}</td>
                                        <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                            {relevantJob ? (relevantJob.summary || relevantJob.note || relevantJob.description || '') : ''}
                                        </td>
                                        <td className="border border-gray-300 p-2 text-center">
                                            <div className="w-4 h-4 border border-gray-400 mx-auto rounded-sm"></div>
                                        </td>
                                    </tr>
                                )
                            })}
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
