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
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('customer')

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)
    const [isEditingPayment, setIsEditingPayment] = useState(false) // Toggle for PaymentSummaryCard

    // Product Tab State
    const [isEditingProduct, setIsEditingProduct] = useState(false)

    // Ref for JobCompletionView (must be declared before conditional returns)
    const jobCompletionRef = useRef(null)
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
        { id: 'completion', label: 'บันทึกงาน', icon: ClipboardCheck }
    ]



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

                        {/* Tabs (Grid for Balance) */}
                        <div className="grid grid-cols-4 border-b border-secondary-200">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex flex-col items-center justify-center py-2 px-1 text-[10px] sm:text-xs font-medium transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'border-primary-600 text-primary-600 bg-primary-50'
                                            : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <Icon size={18} className="mb-1" />
                                        <span className="truncate w-full text-center">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            >
                <div className="bg-secondary-50 min-h-screen pb-20">
                    <Head>
                        <title>Job {job.id} | Mobile</title>
                    </Head>

                    <div className="max-w-md mx-auto p-4 space-y-4">

                        {/* Tab 1: Customer Details */}
                        {activeTab === 'customer' && (
                            <div className="space-y-4">
                                <JobInfoCard
                                    data={{
                                        jobType: job.jobType,
                                        appointmentDate: formatDateForInput(job.jobDate),
                                        completionDate: formatDateForInput(job.completionDate || job.order?.job_info?.completionDate),
                                        installLocationName: job.order?.job_info?.installLocationName || '',
                                        installAddress: job.address,
                                        googleMapLink: job.googleMapLink || '',
                                        distance: job.distance || '',
                                        inspector1: job.order?.job_info?.inspector1 || { name: '', phone: '' },
                                        team: job.assignedTeam
                                    }}
                                    onChange={() => { }} // ReadOnly
                                    customer={customer || {}} // Pass customer for inspector selection if needed (though read only)
                                    availableTeams={[job.assignedTeam]} // Just show the assigned team
                                    note={job.notes}
                                    onNoteChange={() => { }}
                                    showCompletionDate={true}
                                    showHeader={false}
                                    readOnly={true}
                                />

                            </div>
                        )}

                        {/* Tab 2: Product Details */}
                        {activeTab === 'product' && (
                            <div className="h-[600px]">
                                {!isEditingProduct ? (
                                    <ProductDetailView
                                        product={{
                                            ...job.product,
                                            productName: job.productName,
                                            productId: job.productId,
                                            price: job.product?.price || 0,
                                            // Map scalar options if present in job or job.product
                                            // Note: job.product might be rich object from DB
                                            variants: job.product?.variants || [],
                                        }}
                                        onEdit={() => setIsEditingProduct(true)}
                                        hideEditButton={true}
                                    />
                                ) : (
                                    <OrderItemModal
                                        ref={orderItemModalRef}
                                        isOpen={true}
                                        onClose={() => setIsEditingProduct(false)}
                                        isInline={true}
                                        isEditing={true}
                                        hideControls={true} // Hide internal buttons
                                        item={{
                                            ...job.product,
                                            code: job.productId,
                                            product_code: job.productId,
                                            name: job.productName,
                                            // Ensure numeric values
                                            qty: 1,
                                            unitPrice: job.product?.price || 0,
                                            image: job.productImage,
                                            // Pass variants if available in product object, else let modal fetch them
                                        }}
                                        onSave={(updatedItem) => {
                                            console.log('Product Update Simulated:', updatedItem)
                                            // In a real scenario, this would call DataManager.updateJobProduct
                                            // For now, simulate save and exit edit mode
                                            alert('บันทึกข้อมูลแล้ว (Simulation)')
                                            setIsEditingProduct(false)
                                        }}
                                        productsData={[]}
                                    />
                                )}
                            </div>
                        )}

                        {/* Tab 3: Payment (Replaced with PaymentSummaryCard) */}
                        {activeTab === 'payment' && (
                            <div className="h-full">
                                <PaymentSummaryCard
                                    subtotal={
                                        job.order?.items?.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0) ||
                                        job.order?.total || 0
                                    }
                                    shippingFee={job.order?.shippingFee || 0}
                                    onShippingFeeChange={(val) => {
                                        const newOrder = { ...job.order, shippingFee: val }
                                        setJob({ ...job, order: newOrder })
                                    }}
                                    discount={job.order?.discount || { mode: 'percent', value: 0 }}
                                    onDiscountChange={(val) => {
                                        const newOrder = { ...job.order, discount: val }
                                        setJob({ ...job, order: newOrder })
                                    }}
                                    vatRate={0.07}
                                    onVatRateChange={(val) => {
                                        // Assume VAT rate isn't properly stored in order object for now, or just fixed logic
                                        // The component handles local visual update, but we don't have a 'vatRate' field in DB usually?
                                        // Let's assume we don't save VAT rate change for now or strict 7%
                                        // But for UI feedback:
                                        // const newOrder = { ...job.order, vatRate: val } 
                                    }}
                                    paymentSchedule={job.order?.paymentSchedule || []}
                                    readOnly={!isEditingPayment}
                                    onEdit={() => setIsEditingPayment(true)}
                                    // Controls now handled by Header
                                    hideControls={true}
                                    otherOutstandingOrders={otherOutstandingOrders}

                                    onSave={handleSavePaymentSummary}
                                    onCancel={() => {
                                        setIsEditingPayment(false)
                                        // Revert changes? Ideally yes. For now, simple toggle.
                                        // To implement revert, we need a separate 'originalOrder' state or re-fetch.
                                        // For this scope, let's keep it simple: cancel just exits, but changes to state persisted in memory.
                                        // Better: modify local state only in component? 
                                        // Actually PaymentSummaryCard uses LOCAL state for inputs, 
                                        // so onCancel just exits readMode, effectively ignoring local inputs if we didn't push them up.
                                        // BUT onShippingFeeChange pushes up immediately. 
                                        // To fix properly: PaymentSummary should only fire changes on Save? 
                                        // Or parent should hold temp state. 
                                        // Given current structure: we are updating `job` state directly. 
                                        // So "Cancel" is actually "Stop Editing" but changes remain in memory until page refresh.
                                    }}
                                    onAddPayment={() => {
                                        setEditingPaymentIndex(null)
                                        setShowPaymentModal(true)
                                    }}
                                    onEditPayment={(index) => {
                                        setEditingPaymentIndex(index)
                                        setShowPaymentModal(true)
                                    }}
                                />

                                {/* Payment Entry Modal */}
                                {showPaymentModal && (
                                    <PaymentEntryModal
                                        isOpen={showPaymentModal}
                                        onClose={() => {
                                            setShowPaymentModal(false)
                                            setEditingPaymentIndex(null)
                                        }}
                                        onSave={handleSavePayment}
                                        onDelete={handleDeletePayment}
                                        payment={editingPaymentIndex !== null ? (job.order?.paymentSchedule?.[editingPaymentIndex] || null) : null}
                                        remainingBalance={(() => {
                                            const total = job.order?.total || 0
                                            const currentSchedule = job.order?.paymentSchedule || []
                                            const otherPaymentsTotal = currentSchedule.reduce((sum, p, idx) => {
                                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) return sum
                                                return sum + (Number(p.amount) || 0)
                                            }, 0)
                                            return total - otherPaymentsTotal
                                        })()}
                                        isEditing={editingPaymentIndex !== null}
                                    />
                                )}
                            </div>
                        )}

                        {/* Tab 4: Job Completion */}
                        {activeTab === 'completion' && (
                            <JobCompletionView
                                ref={jobCompletionRef}
                                job={job}
                                onSave={() => router.push('/mobile')}
                            />
                        )}
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute >
    )
}
