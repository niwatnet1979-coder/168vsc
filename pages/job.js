import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    ArrowLeft,
    Save,
    Printer,
    Briefcase,
    Package,
    CreditCard,
    ClipboardCheck,
    Edit
} from 'lucide-react'

// Import Components
import JobInfoCard from '../components/JobInfoCard'
import ProductDetailView from '../components/ProductDetailView'
import PaymentSummaryCard from '../components/PaymentSummaryCard'
import JobCompletionView from '../components/JobCompletionView'
import CustomerInfoCard from '../components/CustomerInfoCard'
import Card from '../components/Card'

const formatDateForInput = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '' // Invalid date
    const pad = (n) => n < 10 ? '0' + n : n
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function JobDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState([])
    const [promptpayQr, setPromptpayQr] = useState('')

    // Ref for JobCompletionView
    const completionRef = useRef(null)

    useEffect(() => {
        const loadJobDetails = async () => {
            if (!id) return
            try {
                // Fetch all jobs to ensure we get joined data (customer, order, product) consistent with mobile view
                const jobs = await DataManager.getJobs()
                const foundJob = jobs.find(j => j.id === id)

                if (foundJob) {
                    setJob({
                        ...foundJob,
                        uniqueId: foundJob.id
                    })

                    // Fetch other orders for outstanding balance
                    if (foundJob.customerId) {
                        const customerOrders = await DataManager.getOrdersByCustomerId(foundJob.customerId)
                        const other = customerOrders
                            .filter(o => o.id !== foundJob.orderId)
                            .map(o => {
                                const paid = o.paymentSchedule?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
                                const total = Number(o.totalAmount) || 0
                                return {
                                    id: o.id,
                                    total,
                                    paid,
                                    outstanding: Math.max(0, total - paid)
                                }
                            })
                            .filter(o => o.outstanding > 0)
                        setOtherOutstandingOrders(other)
                        setOtherOutstandingOrders(other)
                    }

                    // Fetch Settings for QR Code
                    const settings = await DataManager.getSettings()
                    if (settings && settings.promptpayQr) {
                        setPromptpayQr(settings.promptpayQr)
                    }
                }
            } catch (error) {
                console.error("Error loading job:", error)
            } finally {
                setLoading(false)
            }
        }
        loadJobDetails()
    }, [id])

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </AppLayout>
        )
    }

    if (!job) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h1 className="text-2xl font-bold text-secondary-900">ไม่พบข้อมูลงาน</h1>
                    <Link href="/jobs" className="mt-4 text-primary-600 hover:underline">กลับไปหน้าคิวงาน</Link>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout renderHeader={({ setIsSidebarOpen }) => (
            <div className="bg-white border-b border-secondary-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/jobs" className="p-2 -ml-2 text-secondary-500 hover:text-secondary-900 rounded-full hover:bg-secondary-100 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                                {job.uniqueId}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${job.status === 'เสร็จสิ้น' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-primary-50 text-primary-700 border-primary-100'}`}>
                                    {job.status}
                                </span>
                            </h1>
                            <div className="text-xs text-secondary-500 flex items-center gap-2">
                                <span>Order ID: <Link href={`/order?id=${job.orderId}`} className="hover:underline hover:text-primary-600">{job.orderId}</Link></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/order?id=${job.orderId}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                        >
                            <Edit size={16} />
                            แก้ไข
                        </Link>
                    </div>
                </div>
            </div>
        )}>
            <Head>
                <title>รายละเอียดงาน {job.uniqueId} - 168VSC System</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Customer Info Card - Added based on request */}
                <CustomerInfoCard customer={job.customer} />

                <div className="space-y-6">

                    {/* 2. Product Info (Now 2nd) */}
                    <ProductDetailView
                        product={{
                            ...job.product,
                            productName: job.product?.name || job.productName,
                            productId: job.product?.id || job.productId,
                            price: job.product?.price || 0,
                            variants: job.product?.variants || [],
                        }}
                        hideEditButton={true}
                    />

                    {/* 1. Job Info (Now 3rd) */}
                    <JobInfoCard
                        title="ข้อมูลงานย่อย"
                        data={{
                            jobType: job.rawJobType || job.jobType,
                            appointmentDate: formatDateForInput(job.appointmentDate || job.jobDate),
                            completionDate: formatDateForInput(job.completionDate),
                            installLocationName: job.order?.job_info?.installLocationName || '',
                            installAddress: job.address,
                            googleMapLink: job.googleMapLink || '',
                            distance: job.distance || '',
                            inspector1: { name: job.inspector || '', phone: '' }, // Fallback since inspector1 might not be in joined job directly
                            team: job.assignedTeam
                        }}
                        customer={job.customer}
                        readOnly={true}
                        showHeader={true}
                    />

                    {/* 3. Payment Info */}
                    <PaymentSummaryCard
                        subtotal={
                            job.order?.items?.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0) ||
                            job.order?.total || 0
                        }
                        shippingFee={job.order?.shippingFee || 0}
                        discount={job.order?.discount || { mode: 'percent', value: 0 }}
                        paymentSchedule={job.order?.paymentSchedule || []}
                        readOnly={true}
                        otherOutstandingOrders={otherOutstandingOrders}
                        hideControls={true}
                        promptpayQr={promptpayQr}
                    />

                    {/* 4. Completion Info */}
                    <Card
                        title={(
                            <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                <ClipboardCheck className="text-primary-600" size={24} />
                                บันทึกงาน
                            </h2>
                        )}
                        actions={(
                            <button
                                onClick={() => completionRef.current?.triggerSave()}
                                className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-1"
                            >
                                <Save size={16} />
                                บันทึก
                            </button>
                        )}
                        className="md:p-6" // Match styling of others
                    >
                        <JobCompletionView
                            ref={completionRef}
                            job={job}
                            onSave={() => router.reload()}
                        />
                    </Card>

                </div>
            </div>
        </AppLayout>
    )
}
