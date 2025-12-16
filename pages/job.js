import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import {
    ArrowLeft,
    Package,
    CreditCard,
    Wrench,
    Camera,
    ClipboardCheck,
    Edit
} from 'lucide-react'
import JobInfoCard from '../components/JobInfoCard'
import ProductDetailView from '../components/ProductDetailView'
import PaymentSummaryCard from '../components/PaymentSummaryCard'
import PaymentEntryModal from '../components/PaymentEntryModal'
import JobInspectorView from '../components/JobInspectorView'
import JobCompletionView from '../components/JobCompletionView'

const formatDateForInput = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    const pad = (n) => n < 10 ? '0' + n : n
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function JobDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [job, setJob] = useState(null)
    const [customer, setCustomer] = useState(null)
    const [product, setProduct] = useState(null)
    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState([])
    const [promptpayQr, setPromptpayQr] = useState('')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('customer')

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)
    const [isEditingPayment, setIsEditingPayment] = useState(false)

    // Product Tab State
    const [isEditingProduct, setIsEditingProduct] = useState(false)

    // Refs
    const jobCompletionRef = useRef(null)
    const jobInspectorRef = useRef(null)
    const orderItemModalRef = useRef(null)

    const tabs = [
        { id: 'customer', label: 'ข้อมูลงานย่อย', icon: Wrench },
        { id: 'product', label: 'ข้อมูลสินค้า', icon: Package },
        { id: 'payment', label: 'การชำระเงิน', icon: CreditCard },
        { id: 'inspection', label: 'รูปภาพและวีดีโอ', icon: Camera },
        { id: 'completion', label: 'ตรวจสอบงาน', icon: ClipboardCheck }
    ]

    const loadJobDetails = async () => {
        if (!id) return
        try {
            const jobs = await DataManager.getJobs()
            const foundJob = jobs.find(j => j.id === id)

            if (!foundJob) {
                setLoading(false)
                return
            }

            // Fetch other orders for outstanding balance
            let otherOutstanding = []
            if (foundJob.customerId) {
                const customerOrders = await DataManager.getOrdersByCustomerId(foundJob.customerId)
                otherOutstanding = customerOrders
                    .filter(o => o.id !== foundJob.orderId)
                    .map(o => {
                        const paid = o.paymentSchedule?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
                        const total = Number(o.total) || 0
                        return {
                            id: o.id,
                            total: total,
                            paid: paid,
                            outstanding: Math.max(0, total - paid)
                        }
                    })
                    .filter(o => o.outstanding > 0)
            }
            setOtherOutstandingOrders(otherOutstanding)

            setJob(foundJob)
            setCustomer(foundJob.customer)
            setProduct(foundJob.product)

            // Fetch Settings
            const settings = await DataManager.getSettings()
            if (settings?.promptpayQr) {
                setPromptpayQr(settings.promptpayQr)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading job details:', error)
            setLoading(false)
        }
    }

    useEffect(() => {
        loadJobDetails()
    }, [id])

    const handleSavePayment = async (paymentData) => {
        if (!job || !job.order) return

        let slipUrl = paymentData.slip
        if (paymentData.slip && paymentData.slip instanceof File) {
            try {
                const paymentIndex = editingPaymentIndex !== null ? editingPaymentIndex : (job.order.paymentSchedule?.length || 0)
                slipUrl = await DataManager.uploadPaymentSlip(paymentData.slip, job.order.id, paymentIndex)
            } catch (error) {
                console.error('Error uploading slip:', error)
                alert('ไม่สามารถอัพโหลดรูปสลิปได้')
                return
            }
        }

        const currentSchedule = job.order.paymentSchedule || []
        let newSchedule = [...currentSchedule]

        const totalOrderAmount = job.order.total || 0
        const otherPaymentsTotal = currentSchedule.reduce((sum, p, idx) => {
            if (editingPaymentIndex !== null && idx === editingPaymentIndex) return sum
            return sum + (Number(p.amount) || 0)
        }, 0)

        const remainingForThis = totalOrderAmount - otherPaymentsTotal
        const finalAmount = paymentData.amount || remainingForThis

        const newPayment = {
            date: paymentData.date,
            amount: finalAmount,
            method: paymentData.method,
            slip: slipUrl,
            receiverSignature: paymentData.receiverSignature,
            payerSignature: paymentData.payerSignature,
            paidBy: paymentData.paidBy
        }

        if (editingPaymentIndex !== null) {
            newSchedule[editingPaymentIndex] = newPayment
        } else {
            newSchedule.push(newPayment)
        }

        try {
            await DataManager.updateOrder(job.order.id, { paymentSchedule: newSchedule })
            setShowPaymentModal(false)
            setEditingPaymentIndex(null)
            loadJobDetails()
        } catch (error) {
            console.error('Error saving payment:', error)
            alert('เกิดข้อผิดพลาดในการบันทึกการชำระเงิน')
        }
    }

    const handleDeletePayment = async () => {
        if (!job || !job.order || editingPaymentIndex === null) return

        const currentSchedule = job.order.paymentSchedule || []
        const newSchedule = currentSchedule.filter((_, idx) => idx !== editingPaymentIndex)

        try {
            await DataManager.updateOrder(job.order.id, { paymentSchedule: newSchedule })
            setShowPaymentModal(false)
            setEditingPaymentIndex(null)
            loadJobDetails()
        } catch (error) {
            console.error('Error deleting payment:', error)
            alert('เกิดข้อผิดพลาดในการลบการชำระเงิน')
        }
    }

    const handleSaveProductItem = async (itemData) => {
        try {
            await DataManager.updateOrder(job.order.id, { items: [itemData] })
            setIsEditingProduct(false)
            loadJobDetails()
        } catch (e) {
            console.error(e)
            alert('เกิดข้อผิดพลาดในการบันทึกสินค้า')
        }
    }

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
            <div className="bg-white sticky top-0 z-30 shadow-sm">
                {/* Top Header */}
                <header className="h-16 border-b border-secondary-200 relative flex items-center justify-between px-4">
                    {/* Left: Back Button */}
                    <Link
                        href="/jobs"
                        className="p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg z-10 flex items-center gap-1"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-xs font-medium">Back</span>
                    </Link>

                    {/* Center: Title */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none">
                        <h1 className="text-base font-bold text-secondary-900 leading-tight">{job.id}</h1>
                        <p className="text-[10px] text-secondary-500">Order: {job.orderId}</p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2 z-10">
                        {/* Completion: Save */}
                        <button
                            onClick={() => jobCompletionRef.current?.triggerSave()}
                            className={`text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm transition-opacity ${activeTab === 'completion' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}
                        >
                            บันทึก
                        </button>

                        {/* Inspection: Save */}
                        <button
                            onClick={() => jobInspectorRef.current?.triggerSave()}
                            className={`text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm transition-opacity ${activeTab === 'inspection' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}
                        >
                            บันทึก
                        </button>

                        {/* Product: Edit / Save / Cancel */}
                        {activeTab === 'product' && (
                            <>
                                {!isEditingProduct ? (
                                    <button
                                        onClick={() => setIsEditingProduct(true)}
                                        className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm"
                                    >
                                        แก้ไข
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditingProduct(false)}
                                            className="text-xs font-bold text-secondary-700 bg-white border border-secondary-300 hover:bg-secondary-50 px-3 py-1.5 rounded-lg shadow-sm"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            onClick={() => orderItemModalRef.current?.triggerSave()}
                                            className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm"
                                        >
                                            บันทึก
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Edit Order Button (always visible) */}
                        {activeTab !== 'product' && activeTab !== 'completion' && activeTab !== 'inspection' && (
                            <Link
                                href={`/order-sa?id=${job.orderId}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                            >
                                <Edit size={14} />
                                แก้ไขออเดอร์
                            </Link>
                        )}
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-secondary-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[100px] py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium border-b-2 transition-colors whitespace-nowrap px-2 ${isActive
                                    ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                                    }`}
                            >
                                <Icon size={isActive ? 20 : 18} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )}>
            <Head>
                <title>
                    {job.id} - {activeTab === 'customer' ? 'ข้อมูลงาน' :
                        activeTab === 'product' ? 'ข้อมูลสินค้า' :
                            activeTab === 'payment' ? 'การชำระเงิน' :
                                activeTab === 'inspection' ? 'รูปภาพและวีดีโอ' : 'ตรวจสอบงาน'}
                </title>
            </Head>

            <PaymentEntryModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false)
                    setEditingPaymentIndex(null)
                }}
                payment={editingPaymentIndex !== null ? job.order?.paymentSchedule?.[editingPaymentIndex] : null}
                onSave={handleSavePayment}
                onDelete={handleDeletePayment}
            />

            {/* Content Area */}
            <main className="max-w-4xl mx-auto pb-24 pt-4 px-4">
                {activeTab === 'customer' && (
                    <JobInfoCard
                        title="ข้อมูลงานย่อย"
                        data={{
                            jobType: job.order?.job_info?.jobType || job.rawJobType || job.jobType,
                            appointmentDate: formatDateForInput(job.order?.job_info?.appointmentDate || job.appointmentDate || job.jobDate),
                            completionDate: formatDateForInput(job.order?.job_info?.completionDate || job.completionDate),
                            installLocationName: job.order?.job_info?.installLocationName || '',
                            installAddress: job.order?.job_info?.installAddress || job.address,
                            googleMapLink: job.order?.job_info?.googleMapLink || job.googleMapLink || '',
                            distance: job.order?.job_info?.distance || job.distance || '',
                            inspector1: job.order?.job_info?.inspector1 || { name: job.inspector || '', phone: '' },
                            inspector2: job.order?.job_info?.inspector2 || { name: '', phone: '' },
                            team: job.order?.job_info?.team || job.assignedTeam || job.team || ''
                        }}
                        customer={customer}
                        readOnly={true}
                    />
                )}

                {activeTab === 'product' && (
                    <ProductDetailView
                        ref={orderItemModalRef}
                        product={{
                            ...product,
                            productName: product?.name || job.productName,
                            productId: product?.id || job.productId,
                            price: product?.price || 0,
                            variants: product?.variants || [],
                        }}
                        isEditing={isEditingProduct}
                        onSave={handleSaveProductItem}
                        onEdit={() => setIsEditingProduct(true)}
                        hideEditButton={true}
                    />
                )}

                {activeTab === 'payment' && (
                    <div className="space-y-4">
                        <PaymentSummaryCard
                            subtotal={job.order?.total || 0}
                            shippingFee={job.order?.shippingFee || 0}
                            discount={job.order?.discount || { mode: 'percent', value: 0 }}
                            paymentSchedule={job.order?.paymentSchedule || []}
                            onEdit={() => setIsEditingPayment(true)}
                            readOnly={true}
                            otherOutstandingOrders={otherOutstandingOrders}
                            promptpayQr={promptpayQr}
                            hideControls={true}
                            showAddButton={true}
                            onAddPayment={() => {
                                setEditingPaymentIndex(null)
                                setShowPaymentModal(true)
                            }}
                        />
                    </div>
                )}

                {activeTab === 'completion' && (
                    <JobCompletionView
                        ref={jobCompletionRef}
                        job={job}
                        onSave={() => loadJobDetails()}
                    />
                )}

                {activeTab === 'inspection' && (
                    <JobInspectorView
                        ref={jobInspectorRef}
                        job={job}
                        onSave={() => loadJobDetails()}
                    />
                )}
            </main>

        </AppLayout>
    )
}
