import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import ProtectedRoute from '../../components/ProtectedRoute'
import AppLayout from '../../components/AppLayout'
import { DataManager } from '../../lib/dataManager'
import {
    ArrowLeft,
    Package,
    CreditCard,
    FileText,
    Wrench,
    Truck,
    Camera,
    Upload,
    ClipboardCheck
} from 'lucide-react'
import JobInfoCard from '../../components/JobInfoCard'
import OrderItemModal from '../../components/OrderItemModal'
import PaymentSummaryCard from '../../components/PaymentSummaryCard'
import PaymentEntryModal from '../../components/PaymentEntryModal'

import ProductDetailView from '../../components/ProductDetailView'
import JobInspectorView from '../../components/JobInspectorView'
import JobCompletionView from '../../components/JobCompletionView'

const formatDateForInput = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '' // Invalid date
    const pad = (n) => n < 10 ? '0' + n : n
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function MobileJobDetail() {
    const router = useRouter()
    const { id } = router.query
    const { data: session } = useSession()

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
    const [isEditingPayment, setIsEditingPayment] = useState(false) // Toggle for PaymentSummaryCard

    // Product Tab State
    const [isEditingProduct, setIsEditingProduct] = useState(false)

    // Ref for views
    const jobCompletionRef = useRef(null)
    const jobInspectorRef = useRef(null)
    const orderItemModalRef = useRef(null)

    const loadJobDetails = async () => {
        if (!id) return
        try {
            // Get job from DataManager (Async) - now includes all joined data
            const jobs = await DataManager.getJobs()
            const foundJob = jobs.find(j => j.id === id)

            if (!foundJob) {
                setLoading(false)
                return
            }

            // Fetch other orders for this customer (for outstanding balance check)
            let otherOutstanding = []
            if (foundJob.customerId) {
                const customerOrders = await DataManager.getOrdersByCustomerId(foundJob.customerId)
                otherOutstanding = customerOrders
                    .filter(o => o.id !== foundJob.orderId) // Exclude current order
                    .map(o => {
                        const paid = o.paymentSchedule.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                        const total = Number(o.totalAmount) || 0
                        return {
                            id: o.id,
                            total: total,
                            paid: paid,
                            outstanding: Math.max(0, total - paid)
                        }
                    })
                    .filter(o => o.outstanding > 0) // Only show if debt exists
            }
            setOtherOutstandingOrders(otherOutstanding)

            if (!foundJob) {
                setLoading(false)
                return
            }

            setJob(foundJob)
            // Use joined data from DataManager
            setCustomer(foundJob.customer)
            setProduct(foundJob.product)

            // Fetch Settings
            const settings = await DataManager.getSettings()
            if (settings && settings.promptpayQr) {
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
        // Upload slip if it's a File object
        if (paymentData.slip && paymentData.slip instanceof File) {
            try {
                const paymentIndex = editingPaymentIndex !== null ? editingPaymentIndex : (job.order.paymentSchedule?.length || 0)
                // Use job.order.id for upload
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

        // Calculate amount just like in OrderForm
        const otherPaymentsTotal = currentSchedule.reduce((sum, p, idx) => {
            if (editingPaymentIndex !== null && idx === editingPaymentIndex) return sum
            return sum + (Number(p.amount) || 0)
        }, 0)

        const remainingForThis = totalOrderAmount - otherPaymentsTotal
        const calculatedAmount = paymentData.amountMode === 'percent'
            ? (remainingForThis * (parseFloat(paymentData.percentValue) || 0)) / 100
            : parseFloat(paymentData.amount) || 0

        const finalPaymentData = {
            ...paymentData,
            slip: slipUrl,
            amount: calculatedAmount
        }

        if (editingPaymentIndex !== null) {
            newSchedule[editingPaymentIndex] = finalPaymentData
        } else {
            newSchedule.push(finalPaymentData)
        }

        // Optimistic update
        const updatedOrder = { ...job.order, paymentSchedule: newSchedule }
        const updatedJob = { ...job, order: updatedOrder }
        setJob(updatedJob)

        // Persist to DB
        // We only update the order's payment schedule
        // DataManager.saveOrder expects full order data. 
        // We should ensure we pass enough data directly or if saveOrder handles partial updates.
        // saveOrder logic: upsert into orders.
        try {
            await DataManager.saveOrder(updatedOrder)
            setShowPaymentModal(false)
            setEditingPaymentIndex(null)
        } catch (error) {
            console.error('Error saving payment:', error)
            alert('บันทึกข้อมูลไม่สำเร็จ')
            // Revert on error? For now just alert.
        }
    }

    const handleSavePaymentSummary = async () => {
        try {
            // Save current job.order state to DB
            // DataManager.saveOrder takes specific fields or full object?
            // Usually upsert.
            await DataManager.saveOrder(job.order)
            setIsEditingPayment(false)
        } catch (error) {
            console.error('Error saving payment summary:', error)
            alert('บันทึกข้อมูลไม่สำเร็จ')
        }
    }

    const handleDeletePayment = async () => {
        if (editingPaymentIndex === null || !job.order) return

        const newSchedule = job.order.paymentSchedule.filter((_, i) => i !== editingPaymentIndex)

        // Optimistic update
        const updatedOrder = { ...job.order, paymentSchedule: newSchedule }
        const updatedJob = { ...job, order: updatedOrder }
        setJob(updatedJob)

        try {
            await DataManager.saveOrder(updatedOrder)
            setShowPaymentModal(false)
            setEditingPaymentIndex(null)
        } catch (error) {
            console.error('Error deleting payment:', error)
            alert('ลบข้อมูลไม่สำเร็จ')
        }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    if (!job) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="text-center py-12">
                        <p className="text-secondary-500">ไม่พบข้อมูลงาน</p>
                        <Link href="/mobile" className="mt-4 inline-block text-primary-600 hover:underline">
                            กลับไปหน้า Mobile
                        </Link>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    const tabs = [
        { id: 'customer', label: 'ข้อมูลงานย่อย', icon: Wrench },
        { id: 'product', label: 'ข้อมูลสินค้า', icon: Package },
        { id: 'payment', label: 'การชำระเงิน', icon: CreditCard },
        { id: 'completion', label: 'บันทึกงาน', icon: Camera },
        { id: 'inspection', label: 'ตรวจรับงาน', icon: ClipboardCheck }
    ]



    const handleSaveProductItem = async (updatedItem) => {
        try {
            const itemIndex = job.order?.items?.findIndex(i =>
                i.subJob?.jobId === job.id ||
                i.code === product.code
            )

            if (itemIndex === -1) throw new Error('Could not find item to update')

            const cleanOrderItems = job.order.items.map(i => ({ ...i }))
            cleanOrderItems[itemIndex] = {
                ...cleanOrderItems[itemIndex],
                ...updatedItem,
                subJob: cleanOrderItems[itemIndex].subJob
            }

            const updatedOrder = {
                ...job.order,
                items: cleanOrderItems,
            }

            await DataManager.saveOrder(updatedOrder)
            setIsEditingProduct(false)
            loadJobDetails()
        } catch (e) {
            console.error(e)
            alert('เกิดข้อผิดพลาดในการบันทึกสินค้า')
        }
    }

    return (
        <ProtectedRoute>
            <AppLayout
                renderHeader={({ setIsSidebarOpen }) => (
                    <div className="bg-white sticky top-0 z-30 shadow-sm">
                        {/* Top Header */}
                        <header className="h-16 border-b border-secondary-200 relative flex items-center justify-between px-4">
                            {/* Left: Menu */}
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg z-10"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <div className="sr-only">Menu</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                            </button>

                            {/* Center: Title */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none">
                                <h1 className="text-base font-bold text-secondary-900 leading-tight">{job.id}</h1>
                                <p className="text-[10px] text-secondary-500">Order: {job.orderId}</p>
                            </div>

                            {/* Right: Actions (Save/Edit) */}
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

                                {/* Payment: Edit / Save / Cancel */}
                                {activeTab === 'payment' && (
                                    <>
                                        {!isEditingPayment ? (
                                            <button
                                                onClick={() => setIsEditingPayment(true)}
                                                className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm"
                                            >
                                                แก้ไข
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditingPayment(false)}
                                                    className="text-xs font-bold text-secondary-700 bg-white border border-secondary-300 hover:bg-secondary-50 px-3 py-1.5 rounded-lg shadow-sm"
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    onClick={handleSavePaymentSummary}
                                                    className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm"
                                                >
                                                    บันทึก
                                                </button>
                                            </div>
                                        )}
                                    </>
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
                                        className={`flex-1 min-w-[80px] py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium border-b-2 transition-colors whitespace-nowrap px-2 ${isActive
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
                                    activeTab === 'inspection' ? 'ตรวจรับงาน' : 'บันทึกงาน'}
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
                <main className="max-w-md mx-auto pb-24 pt-4 px-4">
                    {activeTab === 'customer' && (
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
                                inspector1: { name: job.inspector || '', phone: '' },
                                team: job.assignedTeam
                            }}
                            customer={customer}
                            readOnly={true}
                        />
                    )}

                    <ProductDetailView
                        ref={orderItemModalRef} // Use the same ref approach for imperative save
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

                    {activeTab === 'payment' && (
                        <div className="space-y-4">
                            <PaymentSummaryCard
                                subtotal={customer?.orders?.find(o => o.id === job.orderId)?.total || job.order?.total || 0}
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
        </ProtectedRoute>
    )
}
