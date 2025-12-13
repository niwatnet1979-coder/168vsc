import { useState, useEffect } from 'react'
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
    Upload
} from 'lucide-react'
import JobInfoCard from '../../components/JobInfoCard'
import OrderItemModal from '../../components/OrderItemModal'
import PaymentSummaryCard from '../../components/PaymentSummaryCard'
import PaymentEntryModal from '../../components/PaymentEntryModal'

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
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('customer')

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)

    useEffect(() => {
        if (!id) return

        const loadJobDetails = async () => {
            try {
                // Get job from DataManager (Async) - now includes all joined data
                const jobs = await DataManager.getJobs()
                const foundJob = jobs.find(j => j.id === id)

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
                        <Link href="/mobile-jobs-v2" className="mt-4 inline-block text-primary-600 hover:underline">
                            กลับไปหน้า Mobile Jobs
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
        { id: 'other', label: 'อื่นๆ', icon: FileText }
    ]

    return (
        <ProtectedRoute>
            <AppLayout>
                <Head>
                    <title>Job {job.id} - Mobile Jobs</title>
                </Head>

                <div className="space-y-4 pb-20">
                    {/* Header */}
                    <div className="sticky top-0 bg-secondary-50 z-10 pb-4">
                        <Link href="/mobile-jobs-v2" className="inline-flex items-center text-secondary-500 hover:text-primary-600 mb-2">
                            <ArrowLeft size={20} className="mr-2" />
                            กลับ
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900">{job.id}</h1>
                                <p className="text-sm text-secondary-500">Order: {job.orderId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {job.rawJobType === 'installation' ? (
                                    <Wrench size={20} className="text-primary-600" />
                                ) : (
                                    <Truck size={20} className="text-warning-600" />
                                )}
                                <span className="text-sm font-medium">{job.jobType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'border-primary-600 text-primary-600 bg-primary-50'
                                            : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Icon size={16} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                            {/* Tab 1: Sub Job Details (Replaced Customer Info) */}
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

                            {/* Tab 2: Product Details (Replaced with Edit Component) */}
                            {activeTab === 'product' && (
                                <div className="h-[600px]">
                                    <OrderItemModal
                                        isOpen={true}
                                        onClose={() => { }}
                                        isInline={true}
                                        isEditing={true}
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
                                            // In a real scenario, this would call DataManager.updateJobProduct or similar
                                            alert('บันทึกข้อมูลแล้ว (Simulation)')
                                        }}
                                        productsData={[]} // Let it fetch or pass if available? passing empty array forces it to fetch if logic allows, or we relies on item.code to fetch
                                    />
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
                                        discount={job.order?.discount || { mode: 'percent', value: 0 }}
                                        vatRate={0.07}
                                        paymentSchedule={job.order?.paymentSchedule || []}
                                        readOnly={false}
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

                            {/* Tab 4: Other */}
                            {activeTab === 'other' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-secondary-900 mb-4">ข้อมูลอื่นๆ</h2>
                                    <div className="text-center py-8 text-secondary-500">
                                        <p>ยังไม่มีข้อมูล</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
