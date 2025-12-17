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
import ProductCard from '../components/ProductCard'
import OrderItemModal from '../components/OrderItemModal'
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
    const [availableTeams, setAvailableTeams] = useState([])

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
            // Use getJobById directly for robust data (including fallback matching)
            const foundJob = await DataManager.getJobById(id)

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

            // Fetch Available Teams
            const teams = await DataManager.getAvailableTeams()
            setAvailableTeams(teams)

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
                            <div className="flex gap-2">
                                <button
                                    // Cancel - just reload or do nothing if inline? 
                                    // If we want to revert changes, we might need a reset method or just re-mount.
                                    // For now, let's just make it do nothing or maybe refresh?
                                    // Actually user asked for "Cancel" button.
                                    // Since it's inline, "Cancel" might mean "Reset form" or "Go back".
                                    // Let's assume it renders "Cancel" but maybe it just resets?
                                    // Or if it's strictly editing, maybe we reload the data?
                                    // Let's try to reload the job details to reset data.
                                    onClick={loadJobDetails}
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

                        {/* Edit Order Button (always visible) */}
                        {activeTab !== 'product' && activeTab !== 'completion' && activeTab !== 'inspection' && (
                            <Link
                                href={`/order?id=${job.orderId}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                            >
                                <Edit size={14} />
                                <span className="hidden sm:inline">แก้ไขออเดอร์</span>
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
                        activeTab === 'product' ? 'แก้ไขรายการสินค้า' :
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
                            jobType: job.jobType || 'installation',
                            appointmentDate: formatDateForInput(job.appointmentDate),
                            completionDate: formatDateForInput(job.completionDate),
                            installLocationName: job.installLocationName || '',
                            installAddress: job.installAddress || job.address || '',
                            googleMapLink: job.googleMapLink || '',
                            distance: job.distance || '',
                            inspector1: job.inspector1 || { name: job.inspector || '', phone: '' },
                            inspector2: { name: '', phone: '' }, // Ensure we have a default
                            team: job.team || ''
                        }}
                        customer={customer}
                        availableTeams={availableTeams}
                        readOnly={true}
                        note={job.note || ''}
                    />
                )}

                {activeTab === 'product' && (
                    <div className="pb-8">
                        <OrderItemModal
                            ref={orderItemModalRef} // Attach ref!
                            isOpen={true}
                            onClose={() => { }}
                            onSave={handleSaveProductItem}
                            item={{
                                ...product,
                                product_id: product?.id || job.productId,
                                code: product?.product_code || job.productId,
                                name: product?.name || job.productName,
                                unitPrice: product?.price || 0,
                                qty: product?.qty || 1,
                            }}
                            isEditing={true}
                            isInline={true}
                            hideControls={true} // Hide footer buttons
                        />
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="space-y-4">
                        <PaymentSummaryCard
                            subtotal={job.order?.total || 0} // This might need to be re-calculated if API doesn't send raw subtotal
                            // If API sends 'total' as final grand total, we need to verify structure.
                            // Assuming job.order has standard fields: total (subtotal), shippingFee, discount, paymentSchedule

                            // Better mapping if we have the full object:
                            // In DataManager, 'orders' table usually has: total_amount, deposit? 
                            // The refactored 'Order' component logic usually calculates these on the fly from items.
                            // But here we might rely on saved fields or calculate them if we have items.
                            // For now, let's pass what we have and assume DataManager provides it.

                            // Note: If fields are missing in DB, we might default them.
                            shippingFee={job.order?.shippingFee || 0}
                            discount={job.order?.discount || { mode: 'percent', value: 0 }}
                            vatRate={job.order?.vatRate ?? 0.07}
                            vatIncluded={job.order?.vatIncluded ?? true}

                            paymentSchedule={job.order?.paymentSchedule || []}

                            readOnly={true} // Main summary is read-only here, but we allow adding payments via Modal

                            otherOutstandingOrders={otherOutstandingOrders}
                            promptpayQr={promptpayQr}

                            hideControls={true} // Hide unnecessary Save/Cancel for the card itself
                            showAddButton={true} // Show "Add Payment" button inside the card

                            onAddPayment={() => {
                                setEditingPaymentIndex(null)
                                setShowPaymentModal(true)
                            }}

                            onEditPayment={(index) => {
                                setEditingPaymentIndex(index)
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
