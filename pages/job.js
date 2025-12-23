import React, { useState, useEffect, useRef, useMemo } from 'react'
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
    Edit,
    Users,
    AlertCircle
} from 'lucide-react'

import JobInfoCard from '../components/JobInfoCard'
import ProductCard from '../components/ProductCard'
import OrderItemModal from '../components/OrderItemModal'
import PaymentSummaryCard from '../components/PaymentSummaryCard'
import PaymentEntryModal from '../components/PaymentEntryModal'
import JobInspectorView from '../components/JobInspectorView'
import JobCompletionView from '../components/JobCompletionView'
import CustomerModal from '../components/CustomerModal'
import ProductModal from '../components/ProductModal'
import { calculateDistance, extractCoordinates, formatDateForInput, formatDateForSave, SHOP_LAT, SHOP_LON } from '../lib/utils' // Import utils

export default function JobDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [job, setJob] = useState(null)
    const [customer, setCustomer] = useState(null)
    const [product, setProduct] = useState(null)
    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState([])
    const [promptpayQr, setPromptpayQr] = useState(null)
    const [shopCoords, setShopCoords] = useState({ lat: SHOP_LAT, lon: SHOP_LON })
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

    // Customer Modal State
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
    const [customerModalTab, setCustomerModalTab] = useState('info')
    const [addingContactFor, setAddingContactFor] = useState(null)

    // Job Info Edit State
    const [jobInfo, setJobInfo] = useState(null) // Local state for editing
    const [isJobInfoDirty, setIsJobInfoDirty] = useState(false)

    // Product Modal State
    const [showProductModal, setShowProductModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)

    // Memoize product item to prevent infinite re-renders in OrderItemModal
    const memoizedProductItem = useMemo(() => {
        if (!product || !job) return null
        return {
            ...product,
            product_id: product?.id || job.productId,
            code: product?.product_code || job.productId,
            name: product?.name || job.productName,
            unitPrice: product?.unitPrice || 0,
            qty: product?.qty || 1,
        }
    }, [product?.id, product?.unitPrice, product?.qty, job?.productId, job?.productName])

    // Sync job info to local state when loaded
    useEffect(() => {
        if (job) {
            setJobInfo({
                id: job.id,
                orderId: job.orderId,
                jobType: job.jobType || 'installation',
                appointmentDate: formatDateForInput(job.appointmentDate), // Format for input
                completionDate: formatDateForInput(job.completionDate),   // Format for input
                installLocationName: job.installLocationName || '',
                installAddress: job.installAddress || job.address || '',
                installLocationId: job.siteAddressRecord?.id, // Ensure ID is mapped if available
                googleMapLink: job.googleMapLink || '',
                distance: job.distance || '',
                inspector1: job.inspector1 || { name: job.inspector || '', phone: '' },
                siteInspectorRecord: job.siteInspectorRecord,
                site_inspector_id: job.site_inspector_id,
                team: job.team || '',
                note: job.note || '',
                serviceFeeId: job.serviceFeeId || job.teamPaymentBatchId
            })
        }
    }, [job])

    // Load Settings for Shop Coordinates on mount
    useEffect(() => {
        DataManager.getSettings().then(settings => {
            if (settings?.systemOptions?.shopLat && settings?.systemOptions?.shopLon) {
                setShopCoords({
                    lat: parseFloat(settings.systemOptions.shopLat),
                    lon: parseFloat(settings.systemOptions.shopLon)
                })
            }
        })
    }, []) // Run once on mount

    // Auto-calculate Distance (Parity with Order.jsx)
    useEffect(() => {
        const calculate = async () => {
            if (!jobInfo?.googleMapLink) return;
            // Only calculate if distance is missing
            if (jobInfo.distance) return;

            let coords = extractCoordinates(jobInfo.googleMapLink)

            // If direct extraction fails, try resolving short link
            if (!coords && (jobInfo.googleMapLink.includes('goo.gl') || jobInfo.googleMapLink.includes('maps.app.goo.gl'))) {
                try {
                    const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(jobInfo.googleMapLink)}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data.url) {
                            coords = extractCoordinates(data.url)
                        }
                    }
                } catch (error) {
                    console.error('Error resolving map link:', error)
                }
            }

            if (coords) {
                const dist = calculateDistance(shopCoords.lat, shopCoords.lon, coords.lat, coords.lon)
                // Update local state WITH formatted distance
                handleJobInfoUpdate({ distance: `${dist} km` })
            }
        }

        calculate()
    }, [jobInfo?.googleMapLink, jobInfo?.distance, shopCoords])

    const handleJobInfoUpdate = (updates) => {
        setJobInfo(prev => ({ ...prev, ...updates }))
        setIsJobInfoDirty(true)
    }

    const handleSaveJobInfo = async () => {
        if (!jobInfo || !job) return

        try {
            setLoading(true)
            const payload = {
                job_type: jobInfo.jobType,
                appointment_date: formatDateForSave(jobInfo.appointmentDate), // Convert to ISO/UTC
                completion_date: formatDateForSave(jobInfo.completionDate),   // Convert to ISO/UTC
                // install_location_name: jobInfo.installLocationName, // Removed: Relies on site_address_id (SSOT)
                // install_address: jobInfo.installAddress, // Removed: Relies on site_address_id (SSOT)
                // google_map_link: jobInfo.googleMapLink, // Removed: Stored in customer_addresses now
                // distance: jobInfo.distance ? parseFloat(jobInfo.distance.toString().replace(' km', '')) : null, // (Pending DB Migration)
                // Team
                assigned_team: jobInfo.team,
                // Inspector (link by ID if available)
                site_inspector_id: jobInfo.site_inspector_id || null, // Ensure explicit null if empty
                // site_inspector_name: jobInfo.inspector1?.name || '', // Removed: Relies on site_inspector_id relation
                // Address (link by ID if available)
                site_address_id: jobInfo.installLocationId || null, // Ensure explicit null if empty
                notes: jobInfo.note
            }

            console.log('Saving Job Info Payload:', payload) // Debug log
            console.log('Appointment Date (Raw):', jobInfo.appointmentDate)
            console.log('Appointment Date (Formatted):', payload.appointment_date)

            await DataManager.updateJob(job.id, payload)

            // Special Logic: If Job has a Linked Address, Update its Distance/Map Link in Master Data
            if (jobInfo.installLocationId && jobInfo.distance) {
                // Parse distance from string "XX.XX km" -> XX.XX
                const distVal = parseFloat(jobInfo.distance.toString().replace(' km', ''))

                await DataManager.updateCustomerAddress(jobInfo.installLocationId, {
                    distance: distVal,
                    google_maps_link: jobInfo.googleMapLink
                })
            }

            // Reload to refresh data and reset dirty state
            await loadJobDetails()
            setIsJobInfoDirty(false)
            setLoading(false)
            alert('บันทึกข้อมูลเรียบร้อย')
        } catch (error) {
            console.error('Error saving job info:', error)
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
            setLoading(false)
        }
    }

    const handleAddNewInstallAddress = () => {
        if (!customer?.id) return alert('ไม่พบข้อมูลลูกค้า')
        setCustomerModalTab('address')
        setAddingContactFor('installAddress')
        setShowEditCustomerModal(true)
    }

    const handleAddNewInspector = () => {
        if (!customer?.id) return alert('ไม่พบข้อมูลลูกค้า')
        setCustomerModalTab('contacts')
        setAddingContactFor('inspector')
        setShowEditCustomerModal(true)
    }

    const tabs = [
        { id: 'customer', label: 'ข้อมูลงาน', icon: Wrench },
        { id: 'product', label: 'ข้อมูลสินค้า', icon: Package },
        { id: 'payment', label: 'การชำระเงิน', icon: CreditCard },
        { id: 'team_payment', label: 'ค่าแรงช่าง', icon: Users },
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

            // Construct product with selectedVariant pre-populated
            const productWithVariant = foundJob.product ? {
                ...foundJob.product,
                selectedVariant: foundJob.product.variant_id ? {
                    id: foundJob.product.variant_id,
                    sku: foundJob.product.sku,
                    color: foundJob.product.color,
                    crystal_color: foundJob.product.crystalColor,
                    price: foundJob.product.unitPrice,
                    images: foundJob.product.images || []
                } : null
            } : null

            setProduct(productWithVariant)

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

    const handleEditProduct = (productData) => {
        setEditingProduct(productData)
        setShowProductModal(true)
    }

    const handleAddNewProduct = () => {
        setEditingProduct({
            id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
            length: '', width: '', height: '', material: '', color: '',
            images: []
        })
        setShowProductModal(true)
    }

    const handleSaveProduct = async (productData) => {
        try {
            console.log('[JobPage] Saving product:', productData)
            const result = await DataManager.saveProduct(productData)
            if (result.success) {
                setShowProductModal(false)
                setEditingProduct(null)
                // Reload job to get updated product/variants
                loadJobDetails()
            } else {
                alert(result.error || 'ไม่สามารถบันทึกสินค้าได้')
            }
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

                        {/* Job Info: Save */}
                        {activeTab === 'customer' && (
                            <button
                                type="button"
                                onClick={handleSaveJobInfo}
                                disabled={!isJobInfoDirty}
                                className={`text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-sm transition-opacity ${isJobInfoDirty ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                บันทึก
                            </button>
                        )}

                        {/* Edit Order Button (always visible) */}
                        {activeTab !== 'product' && activeTab !== 'completion' && activeTab !== 'inspection' && activeTab !== 'customer' && (
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
                {activeTab === 'customer' && jobInfo && (
                    <JobInfoCard
                        title="ข้อมูลงาน"
                        data={jobInfo}
                        onChange={handleJobInfoUpdate}
                        customer={customer}
                        availableTeams={availableTeams}
                        readOnly={false}
                        note={jobInfo.note || ''}
                        onNoteChange={(val) => handleJobInfoUpdate({ note: val })}
                        onAddNewAddress={handleAddNewInstallAddress}
                        onAddNewInspector={handleAddNewInspector}
                    />
                )}

                {activeTab === 'product' && memoizedProductItem && (
                    <div className="pb-8">
                        <OrderItemModal
                            ref={orderItemModalRef}
                            isOpen={true}
                            onClose={() => { }}
                            onSave={handleSaveProductItem}
                            item={memoizedProductItem}
                            isEditing={true}
                            isInline={true}
                            hideControls={true}
                            onEditProduct={handleEditProduct}
                            onAddNewProduct={handleAddNewProduct}
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

                {activeTab === 'team_payment' && (
                    <div className="bg-white rounded-xl border border-secondary-200 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-secondary-900">ข้อมูลการจ่ายค่าแรงช่าง</h2>
                        </div>

                        {job.teamPaymentBatch ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-secondary-50 rounded-lg">
                                        <div className="text-sm text-secondary-500 mb-1">Batch ID</div>
                                        <div className="font-mono font-medium text-secondary-900">{job.teamPaymentBatchId}</div>
                                    </div>
                                    <div className="p-4 bg-secondary-50 rounded-lg">
                                        <div className="text-sm text-secondary-500 mb-1">สถานะ</div>
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${job.teamPaymentBatch.status === 'paid' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                                            }`}>
                                            {job.teamPaymentBatch.status === 'paid' ? 'จ่ายแล้ว' : 'รอจ่าย'}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-secondary-50 rounded-lg">
                                        <div className="text-sm text-secondary-500 mb-1">ยอดรวม (Batch)</div>
                                        <div className="font-bold text-primary-600">฿{job.teamPaymentBatch.total?.toLocaleString() || '-'}</div>
                                    </div>
                                    <div className="p-4 bg-secondary-50 rounded-lg">
                                        <div className="text-sm text-secondary-500 mb-1">วันที่สร้าง</div>
                                        <div className="text-secondary-900">{formatDateForInput(job.teamPaymentBatch.created_at)}</div>
                                    </div>
                                </div>

                                {job.teamPaymentBatch.slip_image && (
                                    <div className="mt-4">
                                        <div className="text-sm text-secondary-500 mb-2">สลิปการโอน</div>
                                        <div className="rounded-lg border border-secondary-200 overflow-hidden max-w-sm">
                                            <img src={job.teamPaymentBatch.slip_image} alt="Payment Slip" className="w-full h-auto" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-secondary-500 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-200">
                                <AlertCircle size={48} className="mx-auto text-secondary-300 mb-4" />
                                <div className="flex flex-col items-center gap-2">
                                    <p className="font-medium text-secondary-900">ยังไม่มีข้อมูลการจ่ายค่าแรง</p>
                                    <p className="text-sm">งานนี้ยังไม่ได้ถูกรวมในรอบการจ่ายเงิน (Batch)</p>
                                </div>
                            </div>
                        )}
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

            {/* Customer Modal for Adding Address/Inspector */}
            {showEditCustomerModal && customer && (
                <CustomerModal
                    isOpen={showEditCustomerModal}
                    customer={customer}
                    initialTab={customerModalTab}
                    onClose={() => setShowEditCustomerModal(false)}
                    onSave={async (updatedCustomer) => {
                        console.log('Saving updated customer...', updatedCustomer)
                        // CRITICAL: Must save to DB to get real UUIDs for new addresses/contacts
                        const savedCustomer = await DataManager.saveCustomer(updatedCustomer)

                        if (!savedCustomer) {
                            alert('ไม่สามารถบันทึกข้อมูลลูกค้าได้')
                            return
                        }

                        console.log('Customer saved:', savedCustomer)

                        // Update local state with REAL data (UUIDs)
                        setCustomer(savedCustomer)
                        setShowEditCustomerModal(false)

                        // Handle auto-selection after adding
                        if (addingContactFor === 'installAddress') {
                            // Find the newly added address (naive: last one, or match by label/fields?)
                            // Using last one is decent for "Just Added" flow
                            const newAddr = savedCustomer.addresses?.[savedCustomer.addresses.length - 1]
                            if (newAddr) {
                                handleJobInfoUpdate({
                                    installLocationId: newAddr.id, // Now a valid UUID
                                    installLocationName: newAddr.label,
                                    installAddress: newAddr.address,
                                    googleMapLink: newAddr.googleMapsLink,
                                    distance: newAddr.distance,
                                    siteAddressRecord: newAddr // Store full record
                                })
                            }
                        } else if (addingContactFor === 'inspector') {
                            const newContact = savedCustomer.contacts?.[savedCustomer.contacts.length - 1]
                            if (newContact) {
                                handleJobInfoUpdate({
                                    inspector1: newContact,
                                    site_inspector_id: newContact.id, // Now a valid UUID
                                    siteInspectorRecord: newContact
                                })
                            }
                        }

                        // Reload job details to ensure fresh data -> REMOVED because it overwrites the local state update (auto-selection)
                        // await loadJobDetails()
                    }}
                />
            )}

        </AppLayout>
    )
}
