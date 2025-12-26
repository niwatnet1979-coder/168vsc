import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { DataManager } from '../lib/dataManager'
import { extractCoordinates, calculateDistance, SHOP_LAT, SHOP_LON } from '../lib/utils'

/**
 * Custom hook to handle all data loading and initialization for Order component
 * Consolidates all useEffect blocks related to:
 * - Loading other outstanding orders
 * - Fetching order data
 * - Initializing selected job index
 * - Auto-calculating distance
 */
export function useOrderLoader({
    customer,
    items,
    selectedItemIndex,
    setOtherOutstandingOrders,
    setOrderNumber,
    setCustomer,
    setTaxInvoice,
    setTaxInvoiceDeliveryAddress,
    setItems,
    setGeneralJobInfo,
    setInitialOrderData,
    setDiscount,
    setVatRate,
    setVatIncluded,
    setShippingFee,
    setPaymentSchedule,
    setSelectedItemIndex,
    setSelectedJobIndex,
    setReceiverContact,
    setPurchaserContact
}) {
    const router = useRouter()

    // Load Other Outstanding Orders for Customer
    useEffect(() => {
        const loadOtherOrders = async () => {
            if (customer?.id) {
                try {
                    const orders = await DataManager.getOrdersByCustomerId(customer.id)
                    const currentOrderId = router.query.id || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : '')

                    const otherOutstanding = orders
                        .filter(o => o.id !== currentOrderId)
                        .map(o => {
                            const paid = (o.paymentSchedule || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                            const total = Number(o.totalAmount) || 0
                            return {
                                id: o.id,
                                total: total,
                                paid: paid,
                                outstanding: Math.max(0, total - paid)
                            }
                        })
                        .filter(o => o.outstanding > 0)

                    setOtherOutstandingOrders(otherOutstanding)
                } catch (err) {
                    console.error('Error loading other orders:', err)
                }
            }
        }
        loadOtherOrders()
    }, [customer?.id, router.query.id, setOtherOutstandingOrders])

    // Fetch Order Data (Complete Implementation)
    const fetchOrderData = useCallback(async (targetId) => {
        const idToLoad = targetId || router.query.id
        if (!router.isReady || !idToLoad) return

        try {
            // Fetch from Supabase
            const order = await DataManager.getOrderById(idToLoad)

            if (order) {
                // FIX: Use ID only, removed legacy order_number support
                setOrderNumber(order.id)

                // Use joined customer data directly
                if (order.customer && order.customer.id) {
                    setCustomer(order.customer)
                } else if (order.customerDetails) {
                    // Legacy Fallback
                    if (order.customerDetails.id) {
                        const fullCustomer = await DataManager.getCustomerById(order.customerDetails.id)
                        setCustomer(fullCustomer || order.customerDetails)
                    } else {
                        setCustomer(order.customerDetails)
                    }
                }

                // Tax Invoice
                if (order.taxInvoice) {
                    const loadedTax = order.taxInvoice
                    setTaxInvoice({
                        ...loadedTax,
                        company: loadedTax.company || loadedTax.companyName || '',
                    })
                }

                // Receiver Contact
                if (order.receiverContact) {
                    const rc = Array.isArray(order.receiverContact) ? order.receiverContact[0] : order.receiverContact
                    setReceiverContact(rc)
                }

                // Purchaser Contact  
                if (order.purchaserContact) {
                    const pc = Array.isArray(order.purchaserContact) ? order.purchaserContact[0] : order.purchaserContact
                    setPurchaserContact(pc)
                }
                if (order.purchaserContact) {
                    const pc = Array.isArray(order.purchaserContact) ? order.purchaserContact[0] : order.purchaserContact
                    setPurchaserContact(pc)
                }

                // FIX: Load Addresses with IDs
                if (order.taxInvoiceDeliveryAddress) {
                    setTaxInvoiceDeliveryAddress({
                        id: order.taxInvoiceDeliveryAddress.id,
                        label: order.taxInvoiceDeliveryAddress.label,
                        address: order.taxInvoiceDeliveryAddress.address,
                        googleMapLink: order.taxInvoiceDeliveryAddress.google_maps_link || order.taxInvoiceDeliveryAddress.googleMapLink,
                        distance: order.taxInvoiceDeliveryAddress.distance
                    })
                }

                if (order.deliveryAddress) {
                    // Similar logic if deliveryAddress state exists in context
                }

                // FIX: Load Pricing & Payment Data
                if (typeof order.shipping_fee !== 'undefined' || typeof order.shippingFee !== 'undefined') {
                    setShippingFee(Number(order.shipping_fee) || Number(order.shippingFee) || 0)
                }

                if (order.discount) {
                    setDiscount({
                        mode: order.discount.mode || 'percent',
                        value: Number(order.discount.value) || 0
                    })
                }

                if (typeof order.vat_rate !== 'undefined' || typeof order.vatRate !== 'undefined') {
                    setVatRate(Number(order.vat_rate) || Number(order.vatRate) || 0)
                }

                // Infer vatIncluded mode
                if (order.total && order.items && order.vatRate > 0) {
                    try {
                        const rSub = order.items.reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.unitPrice) || Number(i.price) || 0)), 0)
                        const ship = Number(order.shippingFee || 0)

                        let discAmt = 0
                        if (order.discount) {
                            discAmt = order.discount.mode === 'percent'
                                ? (rSub + ship) * (Number(order.discount.value) / 100)
                                : Number(order.discount.value)
                        }
                        const afterDisc = Math.max(0, rSub + ship - discAmt)

                        const diffInvat = Math.abs(Number(order.total) - afterDisc)
                        const diffExvat = Math.abs(Number(order.total) - (afterDisc * (1 + Number(order.vatRate))))

                        if (diffExvat < diffInvat && diffExvat < 5) {
                            setVatIncluded(false)
                        } else {
                            setVatIncluded(true)
                        }
                    } catch (e) { console.warn('Error inferring vat mode', e) }
                } else if (order.vatRate > 0) {
                    setVatIncluded(true)
                }

                // Load items and fetch product images
                let processedItems = []
                if (order.items) {
                    console.log('[Order] Loading items with jobs:', order.items.map(item => ({
                        id: item.id,
                        name: item.name,
                        jobsCount: item.jobs?.length || 0,
                        jobs: item.jobs
                    })))

                    // Fetch all products to get images
                    const products = await DataManager.getProducts()

                    processedItems = order.items.map(item => {
                        const product = products.find(p =>
                            p.uuid === item.product_id ||
                            p.product_code === item.product_code ||
                            p.product_code === item.code
                        )

                        // CRITICAL: Preserve jobs BEFORE any mapping
                        const preservedJobs = item.jobs || []

                        // Normalize fields (snake_case -> camelCase)
                        const normalizedItem = {
                            ...item,
                            // FIX: Ensure unitPrice and qty are populated
                            unitPrice: Number(item.unitPrice || item.unit_price || item.price || 0),
                            price: Number(item.unitPrice || item.unit_price || item.price || 0),
                            qty: Number(item.qty || item.quantity || 1), // Map quantity to qty
                        }

                        if (product) {
                            const mappedItem = {
                                ...normalizedItem,
                                product,
                                jobs: preservedJobs,
                                material: item.material || product.material,
                                category: item.category || product.category,
                                subcategory: item.subcategory || product.subcategory,
                                length: item.length || product.length,
                                width: item.width || product.width,
                                height: item.height || product.height,
                                // FIX: Prioritize selected variant image, then item image, then default variant image
                                image: (() => {
                                    // 1. If item has a specific variant linked, try to find that variant's image
                                    if (item.product_variant_id && product.variants) {
                                        const linkedVariant = product.variants.find(v => v.id === item.product_variant_id)
                                        if (linkedVariant?.images?.[0]) return linkedVariant.images[0]
                                    }
                                    // 2. Use item's saved image or default product image
                                    return item.image || product.variants?.[0]?.images?.[0] || null
                                })(),
                                selectedVariant: item.variant || null,
                                variant_id: item.product_variant_id || item.variant?.id || null,
                                variantId: item.product_variant_id || item.variant?.id || null,
                                light: item.light || item.bulbType || null,
                                lightColor: item.light_color || item.lightColor || null,
                                bulbType: item.light || item.bulbType || null
                            }

                            console.log('[Order] Mapped item with jobs:', {
                                itemId: mappedItem.id,
                                itemName: mappedItem.name,
                                jobsCount: mappedItem.jobs?.length || 0,
                                jobs: mappedItem.jobs
                            })

                            return mappedItem
                        }

                        return { ...item, jobs: preservedJobs }
                    })

                    console.log('[Order] Items after mapping:', processedItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        jobsCount: item.jobs?.length || 0,
                        jobs: item.jobs
                    })))

                    setItems(processedItems)
                }

                // Payment & Pricing
                const loadedDiscount = order.discount || {
                    mode: order.discount_mode || 'percent',
                    value: Number(order.discount_value) || 0
                }
                setDiscount(loadedDiscount)

                if (order.shippingFee) setShippingFee(order.shippingFee)
                if (order.taxInvoiceDeliveryAddress) setTaxInvoiceDeliveryAddress(order.taxInvoiceDeliveryAddress)
                if (order.paymentSchedule) setPaymentSchedule(order.paymentSchedule)

                // FIX: Populate General Job Info from first job if available
                // or fall back to order columns
                let jobInfo = {
                    jobType: order.job_type || '', // From order column
                    team: '',
                    appointmentDate: '',
                    completionDate: '',
                    notes: '',
                    // Address
                    installLocationId: null,
                    installLocationName: '',
                    installAddress: '',
                    googleMapLink: '',
                    distance: '',
                    // Inspector
                    inspector1: null,
                }

                if (order.jobs && order.jobs.length > 0) {
                    const mainJob = order.jobs[0] // Use first job as main
                    console.log('[useOrderLoader] Main Job Data:', mainJob)
                    console.log('[useOrderLoader] Inspector Record:', mainJob.siteInspectorRecord)
                    console.log('[useOrderLoader] Team Payment ID:', mainJob.team_payment_id)
                    jobInfo = {
                        ...jobInfo,
                        id: mainJob.id,
                        uniqueId: mainJob.id,
                        orderId: mainJob.order_id,

                        team: mainJob.team || '',
                        jobType: mainJob.job_type || jobInfo.jobType,
                        appointmentDate: mainJob.appointment_date,
                        completionDate: mainJob.completion_date,
                        notes: mainJob.notes,
                        teamPaymentId: mainJob.team_payment_id,

                        // Location
                        locationId: mainJob.siteAddressRecord?.id || mainJob.location_id || null,
                        installLocationName: mainJob.siteAddressRecord?.label || '',
                        installAddress: mainJob.siteAddressRecord?.address || '',
                        googleMapLink: mainJob.siteAddressRecord?.maps || '',
                        distance: mainJob.distance || mainJob.siteAddressRecord?.distance || '',

                        // Inspector
                        inspectorId: mainJob.siteInspectorRecord?.id || mainJob.inspector_id || null,
                        inspector: mainJob.siteInspectorRecord ? {
                            id: mainJob.siteInspectorRecord.id,
                            name: mainJob.siteInspectorRecord.name,
                            phone: mainJob.siteInspectorRecord.phone,
                            email: mainJob.siteInspectorRecord.email,
                            line: mainJob.siteInspectorRecord.line || mainJob.siteInspectorRecord.lineId || mainJob.siteInspectorRecord.line_id, // Standardized to 'line'
                            position: mainJob.siteInspectorRecord.position,
                            note: mainJob.siteInspectorRecord.note
                        } : null
                    }
                }

                setGeneralJobInfo(jobInfo)

                // Store initial data
                setInitialOrderData({
                    customer: order.customer || order.customerDetails || { id: '', name: '', phone: '', email: '' },
                    items: processedItems || [],
                    taxInvoice: order.taxInvoice || { company: '', branch: '', taxId: '', address: '' },
                    taxInvoiceDeliveryAddress: order.taxInvoiceDeliveryAddress || { type: '', label: '', address: '' },
                    discount: loadedDiscount,
                    shippingFee: order.shippingFee || 0,
                    paymentSchedule: order.paymentSchedule || [],
                    generalJobInfo: jobInfo // Add to initial data
                })
            } else {
                console.warn(`Order ${idToLoad} not found in database.`)
            }
        } catch (error) {
            console.error("Error loading order:", error)
        }
    }, [
        router.isReady,
        router.query.id,
        setOrderNumber,
        setCustomer,
        setTaxInvoice,
        setTaxInvoiceDeliveryAddress,
        setItems,
        setGeneralJobInfo,
        setInitialOrderData,
        setDiscount,
        setVatRate,
        setVatIncluded,
        setShippingFee,
        setPaymentSchedule,
        setSelectedItemIndex,
        setReceiverContact,
        setPurchaserContact
    ])

    // Trigger fetch on mount/route change
    useEffect(() => {
        fetchOrderData()
    }, [fetchOrderData])

    // Initialize selected job index to latest job
    /* 
    FIX: Disabled auto-select as it interferes with manual selection logic
    useEffect(() => {
        if (items && items[selectedItemIndex]?.jobs?.length > 0) {
            const jobCount = items[selectedItemIndex].jobs.length
            setSelectedJobIndex(jobCount - 1)
        }
    }, [items?.length, selectedItemIndex, setSelectedJobIndex])
    */

    // Return fetchOrderData for external use (e.g., after save)
    return {
        fetchOrderData
    }
}
