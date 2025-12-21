import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CustomerModal from './CustomerModal'
import {
    Save, Plus, Trash2, Calendar, MapPin, FileText, User, Search,
    ChevronDown, ChevronUp, X, Check, Truck, Wrench, Edit2, UserPlus,
    CreditCard, DollarSign, Percent, AlertCircle, Home, ArrowLeft, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, FileEdit, Camera, HelpCircle, Map, Globe, Users, Box, Palette, Package, UserCheck, Menu, Layers, Gem, Zap, Power, QrCode, Scaling, Lightbulb, Video, List, Copy
} from 'lucide-react'
import AppLayout from './AppLayout'
import { DataManager } from '../lib/dataManager'

import ProductModal from './ProductModal'

import AddressSelector from './AddressSelector' // Import AddressSelector
import ContactSelector from './ContactSelector'
import ContactDisplayCard from './ContactDisplayCard'
import JobInfoCard from './JobInfoCard'
import PaymentEntryModal from './PaymentEntryModal'
import Card from './Card'
import { currency, calculateDistance, deg2rad, extractCoordinates, SHOP_LAT, SHOP_LON, formatAddress } from '../lib/utils'

import OrderItemModal from './OrderItemModal'
import PaymentSummaryCard from './PaymentSummaryCard'

function convertToEmbedUrl(url) {
    if (!url) return null
    const coords = extractCoordinates(url)
    if (coords) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coords.lat},${coords.lon}&zoom=15`
    }
    return url
}

export default function OrderForm() {
    const router = useRouter()

    // --- Data Loading States ---
    const [customersData, setCustomersData] = useState([])
    const [productsData, setProductsData] = useState([])
    const [availableTeams, setAvailableTeams] = useState([])
    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState([])
    const [orderNumber, setOrderNumber] = useState('')

    // --- Form States ---
    const [customer, setCustomer] = useState({
        id: '', name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
        contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
        mediaSource: ''
    })

    const [taxInvoice, setTaxInvoice] = useState({
        companyName: '', branch: '', taxId: '', address: '', phone: '', email: '', deliveryAddress: ''
    })

    const [taxInvoiceDeliveryAddress, setTaxInvoiceDeliveryAddress] = useState({
        type: '', // 'same' | 'custom'
        label: '',
        address: ''
    })

    const [receiverContact, setReceiverContact] = useState(null)
    const [purchaserContact, setPurchaserContact] = useState(null)

    const [showTaxInvoiceDropdown, setShowTaxInvoiceDropdown] = useState(false)
    const [taxInvoiceSearchTerm, setTaxInvoiceSearchTerm] = useState('')
    const [showTaxAddressDropdown, setShowTaxAddressDropdown] = useState(false)
    const [taxAddressSearchTerm, setTaxAddressSearchTerm] = useState('')


    const [items, setItems] = useState([])
    const [selectedItemIndex, setSelectedItemIndex] = useState(0) // Default to first item
    const [selectedJobIndex, setSelectedJobIndex] = useState(0) // Default to first job

    // General Job Info (Fallback when no items exist)
    const [generalJobInfo, setGeneralJobInfo] = useState({
        jobType: 'installation',
        appointmentDate: null,
        completionDate: null,
        description: '',
        team: '',
        inspector1: null,
        installLocationId: null,
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        distance: ''
    })


    // Derived Job Info Data from Selected Item
    const currentJobInfo = useMemo(() => {
        if (items.length > 0 && items[selectedItemIndex]) {
            const item = items[selectedItemIndex]
            console.log('[Order] currentJobInfo - Selected item:', {
                itemId: item.id,
                itemName: item.name,
                jobsCount: item.jobs?.length || 0,
                jobs: item.jobs,
                selectedJobIndex
            })

            // Use selected job from the jobs array (source of truth)
            if (item.jobs && item.jobs[selectedJobIndex]) {
                const job = item.jobs[selectedJobIndex]
                console.log('[Order] currentJobInfo - Using job:', {
                    jobId: job.id,
                    jobType: job.job_type || job.jobType,
                    team: job.assigned_team || job.team,
                    appointmentDate: job.appointment_date || job.appointmentDate
                })

                return {
                    ...job,
                    // Map snake_case from DB to camelCase for UI if needed
                    // Robust mapping for JobInfoCard resilience
                    jobType: job.jobType || job.job_type || 'installation',
                    job_type: job.jobType || job.job_type || 'installation',

                    team: job.team || job.assigned_team || '',
                    assigned_team: job.team || job.assigned_team || '',

                    appointmentDate: job.appointmentDate || job.appointment_date || null,
                    appointment_date: job.appointmentDate || job.appointment_date || null,

                    completionDate: job.completionDate || job.completion_date || null,
                    completion_date: job.completionDate || job.completion_date || null,

                    description: job.description || job.notes || '',
                    notes: job.description || job.notes || '',

                    installLocationId: job.installLocationId || job.site_address_id,
                    installLocationName: job.installLocationName || job.site_address_name,
                    installAddress: job.installAddress || job.site_address_content,
                    googleMapLink: job.googleMapLink || job.site_google_map_link,
                    distance: job.distance || job.site_distance,

                    // IMPORTANT: Respect an explicitly cleared inspector (inspector1: null).
                    // If we fallback to siteInspectorRecord after clearing, it looks like the click did nothing.
                    inspector1: ('inspector1' in job) ? job.inspector1 : job.siteInspectorRecord,

                    // Map Service Fee ID for UI
                    serviceFeeId: job.serviceFeeId || job.team_payment_batch_id || null
                }
            }
            // If no jobs exist, return empty object (will use generalJobInfo as fallback in JobInfoCard)
            console.log('[Order] currentJobInfo - No job found at index', selectedJobIndex, 'for item', item.id)
            return {}
        }
        // Fallback: Return General Job Info if NO ITEMS exist
        console.log('[Order] currentJobInfo - No items, using generalJobInfo')
        return generalJobInfo
    }, [items, selectedItemIndex, selectedJobIndex, generalJobInfo])

    // --- 1:N Job Management State ---
    const [editingJobIndex, setEditingJobIndex] = useState(null) // Index of job in 'item.jobs' we are editing (null = adding new)
    const [showJobDropdown, setShowJobDropdown] = useState(false)
    const [showItemDropdown, setShowItemDropdown] = useState(false)

    // Handlers for Job Info
    const handleJobInfoUpdate = (updates) => {
        if (items.length === 0) {
            // Update General Job Info
            setGeneralJobInfo(prev => ({ ...prev, ...updates }))
            return
        }

        setItems(prev => {
            const newItems = [...prev]
            if (newItems[selectedItemIndex]) {
                const updatedItem = { ...newItems[selectedItemIndex] }

                // Ensure jobs array exists
                if (!updatedItem.jobs) {
                    updatedItem.jobs = []
                }

                // Update the specific job in the jobs array
                if (updatedItem.jobs[selectedJobIndex]) {
                    // Update existing job
                    updatedItem.jobs[selectedJobIndex] = {
                        ...updatedItem.jobs[selectedJobIndex],
                        ...updates
                    }
                } else {
                    // Create new job if it doesn't exist
                    updatedItem.jobs[selectedJobIndex] = {
                        jobType: 'installation',
                        ...updates
                    }
                }

                newItems[selectedItemIndex] = updatedItem
            }
            return newItems
        })
    }

    const handleAddJobToItem = () => {
        if (selectedItemIndex === null || !items[selectedItemIndex]) return

        setItems(prev => {
            const newItems = [...prev]
            const currentItem = newItems[selectedItemIndex]

            // Create new job object with default values
            const newJob = {
                id: null, // New job
                order_item_id: currentItem.id,
                jobType: 'installation',
                assigned_team: null,
                appointment_date: new Date().toISOString(),
                completion_date: null,
                notes: '',
                status: 'pending'
            }

            // Ensure jobs array exists
            const existingJobs = currentItem.jobs || []

            // Add new job to the end
            const updatedJobs = [...existingJobs, newJob]
            newItems[selectedItemIndex] = {
                ...currentItem,
                jobs: updatedJobs
            }

            // Side effect to update index (using a timeout for state batching safety)
            setTimeout(() => setSelectedJobIndex(updatedJobs.length - 1), 0)

            return newItems
        })
    }

    const handleDeleteJobFromItem = (jobIdx) => {
        if (selectedItemIndex === null || !items[selectedItemIndex]) return
        const currentItem = items[selectedItemIndex]
        const jobToDelete = currentItem.jobs?.[jobIdx]

        if (!confirm(`ยืนยันลบงานลำดับที่ ${jobIdx + 1} (${jobToDelete?.id?.slice(-12) || 'New Job'})?`)) return

        setItems(prev => {
            const newItems = [...prev]
            const updatedItem = { ...newItems[selectedItemIndex] }

            // Filter out the job
            const updatedJobs = (updatedItem.jobs || []).filter((_, idx) => idx !== jobIdx)
            updatedItem.jobs = updatedJobs

            let nextIndex = selectedJobIndex
            // Fix: If we delete the currently selected job, or a job before it, adjust the index
            if (selectedJobIndex === jobIdx) {
                // If we deleted the last job, move to the new last job, or 0
                nextIndex = Math.max(0, updatedJobs.length - 1)
                setSelectedJobIndex(nextIndex)
            } else if (selectedJobIndex > jobIdx) {
                // If we deleted a job before the current one, decrement index to keep pointing at same job
                nextIndex = selectedJobIndex - 1
                setSelectedJobIndex(nextIndex)
            }

            // No subJob sync needed - jobs array is the source of truth

            newItems[selectedItemIndex] = updatedItem
            return newItems
        })
    }

    const handleShareJobInfo = () => {
        if (!currentJobInfo) return
        if (confirm('คุณต้องการใช้ข้อมูลงานนี้กับสินค้าทุกรายการในออเดอร์ทางใช่หรือไม่?')) {
            // Prepare shared data object
            const sharedData = {
                jobType: currentJobInfo.jobType,
                appointmentDate: currentJobInfo.appointmentDate,
                completionDate: currentJobInfo.completionDate,
                installLocationId: currentJobInfo.installLocationId,
                installLocationName: currentJobInfo.installLocationName,
                installAddress: currentJobInfo.installAddress,
                googleMapLink: currentJobInfo.googleMapLink,
                distance: currentJobInfo.distance,
                inspector1: currentJobInfo.inspector1,
                team: currentJobInfo.team,
                description: currentJobInfo.description
            }

            setItems(prev => prev.map(item => {
                // Update ALL jobs in the jobs array (not just jobs[0])
                let newJobs = [...(item.jobs || [])]

                if (newJobs.length > 0) {
                    // Update every job in the array
                    newJobs = newJobs.map(job => ({
                        ...job,
                        ...sharedData
                    }))
                } else {
                    // If no jobs exist, create one with shared data
                    newJobs = [{
                        jobType: 'installation',
                        ...sharedData
                    }]
                }

                return {
                    ...item,
                    jobs: newJobs
                }
            }))
        }
    }
    const [discount, setDiscount] = useState({ mode: 'percent', value: 0 })
    const [vatRate, setVatRate] = useState(0.07) // Default 0.07
    const [vatIncluded, setVatIncluded] = useState(true) // Default INVAT
    const [shippingFee, setShippingFee] = useState(0)

    const [paymentSchedule, setPaymentSchedule] = useState([])

    // --- UI States ---
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const [activeSearchIndex, setActiveSearchIndex] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [showMapPopup, setShowMapPopup] = useState(false)
    const [selectedMapLink, setSelectedMapLink] = useState('')
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
    const [customerModalTab, setCustomerModalTab] = useState('customer')
    const [addingContactFor, setAddingContactFor] = useState(null) // 'activeCustomerContact' or 'selectedContact'
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)
    const [showOrderItemModal, setShowOrderItemModal] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState(null)

    const [promptpayQr, setPromptpayQr] = useState('')

    // --- Effects ---
    useEffect(() => {
        const loadData = async () => {
            // Load Customers
            const customers = await DataManager.getCustomers()
            setCustomersData(customers)

            // Load Products
            const products = await DataManager.getProducts()
            setProductsData(products)

            // Load Teams (filtered by team_type = ช่าง or QC)
            const teams = await DataManager.getAvailableTeams()
            setAvailableTeams(teams)

            // Load Settings for PromptPay QR
            try {
                const settings = await DataManager.getSettings()
                if (settings?.promptpayQr) {
                    setPromptpayQr(settings.promptpayQr)
                }
            } catch (err) {
                console.error('Error loading settings:', err)
            }
        }
        loadData()

        // Realtime Subscription for Stock Updates
        const channel = DataManager.supabase
            .channel('order_form_stock_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'order_items' },
                () => {
                    console.log('Realtime: order_items changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_transactions' },
                () => {
                    console.log('Realtime: inventory changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'product_variants' },
                () => {
                    console.log('Realtime: variants changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .subscribe()

        return () => {
            DataManager.supabase.removeChannel(channel)
        }
    }, [])

    // Fetch other outstanding orders
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
    }, [customer?.id, router.query.id])








    // Load Existing Order
    useEffect(() => {
        const loadOrder = async () => {
            if (!router.isReady || !router.query.id) return

            try {
                // Fetch from Supabase
                const order = await DataManager.getOrderById(router.query.id)

                if (order) {
                    setOrderNumber(order.orderNumber || order.order_number || order.id)
                    // Use joined customer data directly (No need to re-fetch)
                    if (order.customer && order.customer.id) {
                        // Normalize relational data field names if needed (e.g. taxInvoices vs tax_invoice_info)
                        // But getOrderById now maps them to: addresses, contacts, taxInvoices
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
                    if (order.taxInvoice) setTaxInvoice(order.taxInvoice)


                    // Infer vatIncluded mode
                    if (order.total && order.items && order.vatRate > 0) {
                        try {
                            const rawSub = order.items.reduce((s, i) => s + (Number(i.qty || 0) * Number(item_price_fix(i) || 0)), 0)
                            // Helper for price (handle old/new structure if needed, but assuming unitPrice)
                            // actually simpler:
                            const rSub = order.items.reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.unitPrice) || Number(i.price) || 0)), 0)

                            const ship = Number(order.shippingFee || 0)

                            let discAmt = 0
                            if (order.discount) {
                                discAmt = order.discount.mode === 'percent'
                                    ? (rSub + ship) * (Number(order.discount.value) / 100)
                                    : Number(order.discount.value)
                            }
                            const afterDisc = Math.max(0, rSub + ship - discAmt)

                            // Compare total
                            // If Total approx AfterDiscount => INVAT
                            // If Total approx AfterDiscount * (1+vat) => EXVAT

                            const diffInvat = Math.abs(Number(order.total) - afterDisc)
                            const diffExvat = Math.abs(Number(order.total) - (afterDisc * (1 + Number(order.vatRate))))

                            if (diffExvat < diffInvat && diffExvat < 5) { // 5 baht tolerance
                                setVatIncluded(false)
                            } else {
                                setVatIncluded(true)
                            }
                        } catch (e) { console.warn('Error inferring vat mode', e) }
                    } else if (order.vatRate > 0) {
                        // If no items or calc fail, default true?
                        setVatIncluded(true)
                    }

                    // Load items and fetch product images
                    if (order.items) {
                        // Debug: Log items with jobs before mapping
                        console.log('[Order] Loading items with jobs:', order.items.map(item => ({
                            id: item.id,
                            name: item.name,
                            jobsCount: item.jobs?.length || 0,
                            jobs: item.jobs
                        })))

                        // Fetch all products to get images
                        const products = await DataManager.getProducts()

                        const itemsWithImages = order.items.map(item => {
                            // Try to find product and get image from variants
                            const product = products.find(p =>
                                p.uuid === item.product_id ||
                                p.product_code === item.product_code ||
                                p.product_code === item.code
                            )

                            // CRITICAL: Preserve jobs BEFORE any mapping to prevent override
                            const preservedJobs = item.jobs || []

                            if (product) {
                                // Sync missing fields from product to item (Normalization)
                                // This ensures consistent display between "New Item" and "Loaded Item"
                                const mappedItem = {
                                    ...item,
                                    product, // Attach full product object
                                    // CRITICAL: Explicitly preserve jobs array from loaded order (AFTER spread to override any undefined)
                                    jobs: preservedJobs,
                                    // Use jobs array directly (no subJob needed)
                                    // jobs array is already loaded from DataManager
                                    // Fallbacks if missing in order_item record
                                    material: item.material || product.material,
                                    category: item.category || product.category,
                                    subcategory: item.subcategory || product.subcategory,
                                    // Dimensions fallback (if not in item)
                                    length: item.length || product.length,
                                    width: item.width || product.width,
                                    height: item.height || product.height,
                                    // Image fallback
                                    image: item.image || product.variants?.[0]?.images?.[0] || null,
                                    // Variant Mapping
                                    selectedVariant: item.variant || null,
                                    variant_id: item.product_variant_id || item.variant?.id || null,
                                    variantId: item.product_variant_id || item.variant?.id || null
                                }

                                console.log('[Order] Mapped item with jobs:', {
                                    itemId: mappedItem.id,
                                    itemName: mappedItem.name,
                                    jobsCount: mappedItem.jobs?.length || 0,
                                    jobs: mappedItem.jobs
                                })

                                return mappedItem
                            }

                            // CRITICAL: Also preserve jobs for items without product match
                            const mappedItemWithoutProduct = {
                                ...item,
                                jobs: preservedJobs
                            }

                            console.log('[Order] Mapped item (no product) with jobs:', {
                                itemId: mappedItemWithoutProduct.id,
                                itemName: mappedItemWithoutProduct.name,
                                jobsCount: mappedItemWithoutProduct.jobs?.length || 0,
                                jobs: mappedItemWithoutProduct.jobs
                            })

                            return mappedItemWithoutProduct
                        })

                        // Debug: Log items after mapping to verify jobs are preserved
                        console.log('[Order] Items after mapping:', itemsWithImages.map(item => ({
                            id: item.id,
                            name: item.name,
                            jobsCount: item.jobs?.length || 0,
                            jobs: item.jobs
                        })))

                        setItems(itemsWithImages)
                    }

                    if (order.discount) setDiscount(order.discount)
                    if (order.shippingFee) setShippingFee(order.shippingFee)
                    setPurchaserContact(order.purchaserContact || order.activeCustomerContact || null)
                    setReceiverContact(order.receiverContact || order.selectedContact || null)
                    if (order.taxInvoiceDeliveryAddress) setTaxInvoiceDeliveryAddress(order.taxInvoiceDeliveryAddress)
                    // Load payment schedule
                    if (order.paymentSchedule) setPaymentSchedule(order.paymentSchedule)
                } else {
                    console.warn(`Order ${router.query.id} not found in database.`)
                    // Optional: Redirect or show error, but preventing crash is priority
                }
            } catch (error) {
                console.error("Error loading order:", error)
            }
        }

        loadOrder()
    }, [router.isReady, router.query.id])

    // Initial load effect: Default to latest job of the selected item
    useEffect(() => {
        if (items && items[selectedItemIndex]?.jobs?.length > 0) {
            const jobCount = items[selectedItemIndex].jobs.length
            setSelectedJobIndex(jobCount - 1)
        }
    }, [items?.length]) // Triggered when items are fetched/loaded


    // Auto-calculate Distance for Selected Job
    useEffect(() => {
        const calculate = async () => {
            if (!currentJobInfo?.googleMapLink) return;
            // Distinct check to avoid loop if distance is already set
            if (currentJobInfo.distance) return;

            let coords = extractCoordinates(currentJobInfo.googleMapLink)

            // If direct extraction fails, try resolving short link
            if (!coords && (currentJobInfo.googleMapLink.includes('goo.gl') || currentJobInfo.googleMapLink.includes('maps.app.goo.gl'))) {
                try {
                    const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(currentJobInfo.googleMapLink)}`)
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
                const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
                // Format as string with unit for consistency with modal
                handleJobInfoUpdate({ distance: `${dist} km` })
            }
        }

        calculate()
    }, [currentJobInfo?.googleMapLink, currentJobInfo?.distance])


    // --- Handlers ---
    const handleSelectCustomer = (c) => {
        setCustomer({
            ...customer,
            ...c,
            // Ensure arrays exist
            contacts: Array.isArray(c.contacts) ? c.contacts : [],
            addresses: Array.isArray(c.addresses) ? c.addresses : [],
            taxInvoices: Array.isArray(c.taxInvoices) ? c.taxInvoices : []
        })
        setShowCustomerDropdown(false)

        // Reset contacts
        setReceiverContact(null)
        setPurchaserContact(null)
    }

    const handleUpdateCustomer = async (updatedCustomer) => {
        // Check if we were adding a contact and find the new one
        let addedContact = null
        if (addingContactFor) {
            const prevIds = (customer.contacts || []).map(c => c.id)
            const newContacts = updatedCustomer.contacts || []
            // Find contact that wasn't in previous list. If multiple, take the last one.
            // Or if simple addition, it's likely the last one.
            addedContact = newContacts.find(c => !prevIds.includes(c.id)) || newContacts[newContacts.length - 1]
        }

        // Update local state
        setCustomer(prev => ({ ...prev, ...updatedCustomer }))

        // Save to Supabase
        await DataManager.saveCustomer(updatedCustomer)

        // Refresh list
        const customers = await DataManager.getCustomers()
        setCustomersData(customers)

        // Auto-select if we were adding a contact
        if (addingContactFor && addedContact) {
            if (addingContactFor === 'purchaserContact') {
                setPurchaserContact(addedContact)
            } else if (addingContactFor === 'receiverContact') {
                setReceiverContact(addedContact)
            }
        }

        // Check for new TAX INVOICE
        const prevTaxInvoices = customer.taxInvoices || []
        const newTaxInvoices = updatedCustomer.taxInvoices || []
        if (newTaxInvoices.length > prevTaxInvoices.length && addingContactFor === 'taxInvoice') {
            // Find the new tax invoice (simple diff by ID check or taking the last one)
            // Assuming the new one is added to the end or has a new ID
            const newInv = newTaxInvoices.find(n => !prevTaxInvoices.some(p => p.id === n.id))
            if (newInv) {
                setTaxInvoice({
                    ...newInv,
                    branch: newInv.branch || 'สำนักงานใหญ่',
                    phone: updatedCustomer.phone || '',
                    email: updatedCustomer.email || ''
                })
            }
        }

        // Check for new ADDRESS
        const prevAddresses = customer.addresses || []
        const newAddresses = updatedCustomer.addresses || []
        if (newAddresses.length > prevAddresses.length && addingContactFor === 'taxInvoiceDeliveryAddress') {
            const newAddr = newAddresses.find(n => !prevAddresses.some(p => p.id === n.id))
            if (newAddr) {
                // Helper to format address string (copied from AddressSelector logic essentially or simplified)
                let fullAddress = newAddr.address
                if (!fullAddress && typeof newAddr === 'object') {
                    const p = []
                    if (newAddr.addrNumber) p.push(`เลขที่ ${newAddr.addrNumber}`)
                    if (newAddr.addrRoad) p.push(`ถ. ${newAddr.addrRoad}`)
                    if (newAddr.addrTambon) p.push(`ต. ${newAddr.addrTambon}`)
                    if (newAddr.province) p.push(`จ. ${newAddr.province}`)
                    if (newAddr.zipcode) p.push(newAddr.zipcode)
                    fullAddress = p.join(' ')
                }

                if (addingContactFor === 'taxInvoiceDeliveryAddress') {
                    setTaxInvoiceDeliveryAddress({
                        type: 'custom',
                        label: newAddr.label,
                        address: fullAddress,
                        googleMapLink: newAddr.googleMapsLink,
                        distance: ''
                    })
                } else if (addingContactFor === 'installAddress') {
                    handleJobInfoUpdate({
                        installLocationName: newAddr.label,
                        installAddress: fullAddress,
                        googleMapLink: newAddr.googleMapsLink,
                        distance: ''
                    })
                }
            }
        }

        // Check for new INSPECTOR / PURCHASER / RECEIVER (Contact)
        const prevContacts = customer.contacts || []
        const newContacts = updatedCustomer.contacts || []
        if (newContacts.length > prevContacts.length && addingContactFor) {
            const newContact = newContacts.find(n => !prevContacts.some(p => p.id === n.id))
            if (newContact) {
                if (addingContactFor === 'inspector') {
                    handleJobInfoUpdate({
                        inspector1: {
                            id: newContact.id,
                            name: newContact.name,
                            phone: newContact.phone || '',
                            email: newContact.email || '',
                            lineId: newContact.lineId || '',
                            position: newContact.position || '',
                            note: newContact.note || ''
                        }
                    })
                } else if (addingContactFor === 'purchaserContact') {
                    setPurchaserContact({
                        id: newContact.id,
                        name: newContact.name,
                        phone: newContact.phone || '',
                        email: newContact.email || '',
                        lineId: newContact.lineId || '',
                        position: newContact.position || '',
                        note: newContact.note || ''
                    })
                } else if (addingContactFor === 'receiverContact') {
                    setReceiverContact({
                        id: newContact.id,
                        name: newContact.name,
                        phone: newContact.phone || '',
                        email: newContact.email || '',
                        lineId: newContact.lineId || '',
                        position: newContact.position || '',
                        note: newContact.note || ''
                    })
                }
            }
        }

        // Reset states
        setAddingContactFor(null)
        setCustomerModalTab('customer')
        setShowEditCustomerModal(false)
    }

    const handleAddNewCustomer = async (newCustomerData) => {
        // Generate new customer generated by Supabase or keep local ID logic
        // But for consistency let's use a temporary ID or just pass it and let saveCustomer handle it.
        // If we want immediate UI update we might want to wait for save to return.

        const savedCustomer = await DataManager.saveCustomer(newCustomerData)
        if (savedCustomer) {
            // Refresh list
            const customers = await DataManager.getCustomers()
            setCustomersData(customers)

            // Auto-select the new customer
            setCustomer({
                ...savedCustomer,
                contact1: savedCustomer.contact1 || { name: '', phone: '' },
                contact2: savedCustomer.contact2 || { name: '', phone: '' }
            })
            // Reset contacts
            setReceiverContact(null)
            setPurchaserContact(null)

            setShowAddCustomerModal(false)
        } else {
            alert('ไม่สามารถเพิ่มลูกค้าได้')
        }
    }

    const handleDeleteCustomer = async (customerId) => {
        try {
            const success = await DataManager.deleteCustomer(customerId)
            if (success) {
                // Refresh list
                const customers = await DataManager.getCustomers()
                setCustomersData(customers)

                // Clear selected customer if it was the deleted one
                if (customer?.id === customerId) {
                    setCustomer({
                        id: '', name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
                        contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
                        mediaSource: ''
                    })
                    setReceiverContact(null)
                    setPurchaserContact(null)
                    setTaxInvoice({ companyName: '', branch: '', taxId: '', address: '', phone: '', email: '', deliveryAddress: '' })
                    setTaxInvoiceDeliveryAddress({ type: '', label: '', address: '' })
                }
                setShowEditCustomerModal(false)
            } else {
                alert('ไม่สามารถลบลูกค้าได้')
            }
        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาดในการลบลูกค้า')
        }
    }

    const handleAddNewContact = (type) => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มผู้ติดต่อ')
        setCustomerModalTab('contacts')
        // type: 'activeCustomerContact' | 'selectedContact'
        setAddingContactFor(type)
        setShowEditCustomerModal(true)
    }

    const handleAddNewTaxInvoice = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มใบกำกับภาษี')
        setCustomerModalTab('tax')
        setAddingContactFor('taxInvoice')
        setShowEditCustomerModal(true)
    }

    const handleAddNewAddress = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มที่อยู่')
        setCustomerModalTab('address')
        setAddingContactFor('taxInvoiceDeliveryAddress')
        setShowEditCustomerModal(true)
    }

    const handleAddNewInstallAddress = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มสถานที่ติดตั้ง')
        setCustomerModalTab('address')
        setAddingContactFor('installAddress')
        setShowEditCustomerModal(true)
    }

    const handleAddNewInspector = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มผู้ตรวจงาน')
        setCustomerModalTab('contacts')
        setAddingContactFor('inspector')
        setShowEditCustomerModal(true)
    }

    const handleSearchProduct = (index, term) => {
        const newItems = [...items]
        newItems[index]._searchTerm = term
        newItems[index].showPopup = true  // Auto-show popup when typing
        setItems(newItems)
        setActiveSearchIndex(index)

        // Debug logging
        console.log('=== SEARCH DEBUG ===')
        console.log('Search term:', term)
        console.log('Products data length:', productsData.length)
        console.log('Popup should show:', newItems[index].showPopup)

        if (term.trim()) {
            const lowerTerm = term.toLowerCase()
            const results = productsData.filter(p => {
                // Deep search: Convert entire object to string to search everywhere (including nested props)
                return JSON.stringify(p).toLowerCase().includes(lowerTerm)
            })

            // Debugging
            console.log(`Searching for: "${lowerTerm}", Found: ${results.length} items from ${productsData.length} total products`)
            console.log('First 3 results:', results.slice(0, 3))
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }

    // Quick Add Product State
    const [showProductModal, setShowProductModal] = useState(false)

    const [newProduct, setNewProduct] = useState({
        id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
        length: '', width: '', height: '', material: '', color: '',
        images: []
    })
    const [lastCreatedProduct, setLastCreatedProduct] = useState(null)

    const handleSaveNewProduct = async (productData) => {
        if (!productData.product_code && !productData.id) {
            alert('กรุณากรอกรหัสสินค้า')
            return
        }

        const savedProduct = await DataManager.saveProduct(productData)
        if (savedProduct) {
            // Refresh list
            const products = await DataManager.getProducts()
            setProductsData(products)

            // Close modal and reset
            setShowProductModal(false)
            setNewProduct({
                id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
                length: '', width: '', height: '', material: '', color: '',
                images: []
            })

            // Trigger auto-select in OrderItemModal
            // Use the full product object from refetched list to ensure variants are present
            const fullSavedProduct = products.find(p => p.id === savedProduct.id || p.uuid === savedProduct.uuid || p.product_code === savedProduct.product_code)
            setLastCreatedProduct(fullSavedProduct || savedProduct)
            if (editingItemIndex === null) {
                // If we were adding a new item, ensure the modal is open
                setShowOrderItemModal(true)
            }
        } else {
            alert('บันทึกสินค้าไม่สำเร็จ')
        }
    }

    const selectProduct = (index, product) => {
        const newItems = [...items]
        // Use first variant's price as default
        const defaultPrice = product.variants?.[0]?.price || 0

        newItems[index] = {
            ...newItems[index],
            code: product.product_code,
            name: product.name,
            description: product.description || product.name,
            unitPrice: defaultPrice,
            image: product.variants?.[0]?.images?.[0] || null,
            category: product.category,
            subcategory: product.subcategory,
            length: product.length, width: product.width, height: product.height,
            material: product.material,
            stock: product.variants?.[0]?.stock || 0,
            _searchTerm: undefined,
            showPopup: false,
            // Sync main job info to jobs array if not separate
            jobs: currentJobInfo.jobType !== 'separate' ? (() => {
                const existingJobs = newItems[index].jobs || []
                if (existingJobs.length > 0) {
                    // Update first job with current job info
                    return existingJobs.map((job, idx) =>
                        idx === 0 ? {
                            ...job,
                            jobType: currentJobInfo.jobType,
                            appointmentDate: currentJobInfo.appointmentDate,
                            completionDate: currentJobInfo.completionDate,
                            installLocationName: currentJobInfo.installLocationName,
                            installAddress: currentJobInfo.installAddress,
                            googleMapLink: currentJobInfo.googleMapLink,
                            distance: currentJobInfo.distance,
                            team: currentJobInfo.team,
                            description: currentJobInfo.note || job.description
                        } : job
                    )
                } else {
                    // Create new job with current job info
                    return [{
                        jobType: currentJobInfo.jobType,
                        appointmentDate: currentJobInfo.appointmentDate,
                        completionDate: currentJobInfo.completionDate,
                        installLocationName: currentJobInfo.installLocationName,
                        installAddress: currentJobInfo.installAddress,
                        googleMapLink: currentJobInfo.googleMapLink,
                        distance: currentJobInfo.distance,
                        team: currentJobInfo.team,
                        description: currentJobInfo.note || ''
                    }]
                }
            })() : (newItems[index].jobs || [])
        }
        setItems(newItems)
    }




    const handleSaveItem = (itemData) => {
        if (editingItemIndex !== null) {
            // Edit existing
            const newItems = [...items]
            newItems[editingItemIndex] = itemData
            setItems(newItems)
        } else {
            // Add new
            // Check if this is the FIRST item. If so, inherit General Job Info
            let newItem = { ...itemData }
            if (items.length === 0) {
                console.log('Attaching General Job Info to First Item', generalJobInfo)

                // Merge into first job if exists
                if (newItem.jobs && newItem.jobs.length > 0) {
                    newItem.jobs[0] = { ...newItem.jobs[0], ...generalJobInfo }
                } else {
                    // Create a default job with general job info
                    newItem.jobs = [{
                        jobType: 'installation',
                        ...generalJobInfo
                    }]
                }
            }

            setItems([...items, newItem])
            // setSelectedItemIndex(items.length) // Select the new item - this is not defined in the original context
        }
        setShowOrderItemModal(false)
        setEditingItemIndex(null)
    }

    const handleDeleteItem = () => {
        if (editingItemIndex !== null) {
            const newItems = items.filter((_, i) => i !== editingItemIndex)
            setItems(newItems)
            setShowOrderItemModal(false)
        }
    }

    const handleSaveOrder = async () => {
        // Show confirmation dialog
        const confirmed = window.confirm('ต้องการบันทึกออเดอร์นี้หรือไม่?')
        if (!confirmed) return

        if (!customer.name) return alert('กรุณากรอกชื่อลูกค้า')
        // if (items.length === 0) return alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

        console.log('[OrderForm] Saving order with items:', items)
        console.log('[OrderForm] First item structure:', items[0])

        // Determine customer ID (create new if needed)
        let actualCustomerId = customer.id
        let finalCustomer = customer

        if (!actualCustomerId) {
            // Generate temporary ID or let saveCustomer handle it.
            // If we save now, we get a real ID.
            const newCustomerData = {
                ...customer,
                id: 'CUST' + Date.now(), // Temporary ID if needed by saveCustomer logic, or let it generate
                contacts: customer.contacts || [] // Ensure contacts array exists
            }

            const savedC = await DataManager.saveCustomer(newCustomerData)
            if (savedC) {
                actualCustomerId = savedC.id
                finalCustomer = savedC
                setCustomer(savedC) // Update state
            } else {
                return alert('ไม่สามารถบันทึกข้อมูลลูกค้าได้')
            }
        }

        // Generate Order ID
        let orderId = router.query.id
        if (!orderId) {
            orderId = await DataManager.getNextOrderId()
        }

        // Generate Job IDs for items needing them
        // Fetch the next available Job ID base
        // Note: This is slightly risky for concurrency if high traffic, but sufficient for now.
        // A better approach would be letting the DB generate IDs, but we need them for the UI/JSON structure.
        let nextJobIdBase = await DataManager.getNextJobId() // e.g. JB0000005
        let lastJobNum = parseInt(nextJobIdBase.replace(/\D/g, '') || '0', 10)

        // If we are getting the *next* ID, we should start using it. 
        // But getNextJobId implementation returns "next" (max + 1) already.
        // Wait, getting it once is fine, but if we have multiple items we need to increment.
        // And we need to be careful not to reuse an ID if it's already in the DB (race condition).
        // For this single user app, it's fine.

        // However, if we are EDITING, we might already have Job IDs.
        // The implementation in DataManager.getNextJobId returns Max + 1.
        // If we need 3 IDs, we use Max+1, Max+2, Max+3.
        // So start counting from lastJobNum.

        // Let's re-parse for safety.

        // Define Main Job Info for Order Level Fallback (using first item's first job)
        const mainJobInfo = items.length > 0 && items[0].jobs && items[0].jobs[0]
            ? items[0].jobs[0]
            : generalJobInfo;

        // Prepare items with jobs array (no subJob needed)
        const itemsWithJobs = items.map((item) => {
            // Ensure jobs array exists
            const itemJobs = item.jobs || []

            // If no jobs exist, create a default one
            if (itemJobs.length === 0) {
                return {
                    ...item,
                    jobs: [{
                        jobType: 'installation',
                        status: 'รอดำเนินการ',
                        sequence_number: 1
                    }]
                }
            }

            // Return item with jobs array as-is
            return item
        })

        const newOrder = {
            id: orderId,
            date: mainJobInfo.appointmentDate || mainJobInfo.appointment_date || new Date().toISOString(),
            customer: finalCustomer, // Object with ID and Name
            customerDetails: finalCustomer,
            items: itemsWithJobs, // Use items with jobs array directly
            total: total,
            status: 'Pending',
            jobInfo: mainJobInfo, // Save main job info for backward compatibility
            taxInvoice: taxInvoice,
            taxInvoiceDeliveryAddress: (taxInvoiceDeliveryAddress && taxInvoiceDeliveryAddress.address) ? taxInvoiceDeliveryAddress : null,
            purchaserContact: purchaserContact,
            receiverContact: receiverContact,
            discount: discount,
            shippingFee: shippingFee,
            note: mainJobInfo.description || mainJobInfo.notes || '',
            paymentSchedule: paymentSchedule || [], // Ensure it exists
            // Map Installation Location as Delivery Address
            deliveryAddress: {
                id: mainJobInfo.installLocationId || mainJobInfo.site_address_id,
                address: mainJobInfo.installAddress || mainJobInfo.site_address_content,
                googleMapLink: mainJobInfo.googleMapLink || mainJobInfo.site_google_map_link,
                distance: mainJobInfo.distance || mainJobInfo.site_distance
            }
        }

        const result = await DataManager.saveOrder(newOrder)

        if (result === true) {
            window.location.href = '/orders'
        } else {
            console.error('Save failed result:', result)
            alert('บันทึกออเดอร์ไม่สำเร็จ: ' + (result?.message || 'ไม่ทราบสาเหตุ'))
        }
    }

    // --- Calculations ---
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)
    const discountAmt = discount.mode === 'percent'
        ? (subtotal + Number(shippingFee)) * (Number(discount.value) / 100)
        : Number(discount.value)
    const afterDiscount = Math.max(0, subtotal + Number(shippingFee) - discountAmt)

    // VAT Calculation
    let vatAmt = 0
    if (vatRate > 0) {
        if (vatIncluded) {
            // Inclusive: Base = After / (1+rate) -> VAT = After - Base
            const base = afterDiscount / (1 + Number(vatRate))
            vatAmt = afterDiscount - base
        } else {
            // Exclusive: VAT = After * rate
            vatAmt = afterDiscount * Number(vatRate)
        }
    }

    // Total Calculation
    // If INVAT: Total = AfterDiscount (VAT is inside)
    // If EXVAT: Total = AfterDiscount + VAT
    const total = vatIncluded ? afterDiscount : (afterDiscount + vatAmt)
    // Calculate total paid from payment schedule
    const totalPaid = paymentSchedule.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const outstanding = Math.max(0, total - totalPaid)

    const renderContactDetails = (contact) => {
        if (!contact || !contact.name) return null;
        return (
            <div className="mt-2 pt-2 border-t border-secondary-100 space-y-1.5 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Row 2: Name & Position */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-secondary-900">{contact.name}</span>
                    {contact.position && (
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                            {contact.position}
                        </span>
                    )}
                </div>

                {/* Row 3: Phone | Email | Line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-600">
                    {contact.phone && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors">
                            <Phone size={11} className="text-secondary-400 shrink-0" />
                            <span>{contact.phone}</span>
                        </div>
                    )}
                    {contact.email && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <Mail size={11} className="text-secondary-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{contact.email}</span>
                        </div>
                    )}
                    {(contact.lineId || contact.line) && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <MessageCircle size={11} className="text-[#06c755] shrink-0" />
                            <span className="font-medium text-[#06c755]">{contact.lineId || contact.line}</span>
                        </div>
                    )}
                </div>

                {/* Row 4: Note */}
                {contact.note && (
                    <div className="flex items-start gap-1.5 mt-1 bg-secondary-50/80 p-2 rounded-md border border-dashed border-secondary-200">
                        <span className="text-[10px] font-bold text-secondary-500 whitespace-nowrap mt-0.5">Note:</span>
                        <span className="text-[11px] text-secondary-700 leading-relaxed italic">{contact.note}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <FileEdit className="text-primary-600 hidden sm:block" size={32} />
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {(() => {
                                        const idToDisplay = orderNumber || router.query.id
                                        const formatId = (id) => {
                                            if (!id) return ''
                                            if (String(id).length > 20) return `OD${String(id).slice(-6)}`
                                            return `#${id}`
                                        }
                                        return router.query.id
                                            ? `แก้ไขออเดอร์ ${formatId(idToDisplay)}`
                                            : `สร้างออเดอร์ใหม่ ${formatId(orderNumber)}`
                                    })()}
                                </h1>
                                <p className="text-xs sm:text-sm text-secondary-500 hidden sm:block">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างใบเสนอราคา/ออเดอร์</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button onClick={() => router.push('/orders')} className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-secondary-600 hover:bg-secondary-50 rounded-lg font-medium transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleSaveOrder} className="px-4 py-1.5 sm:px-6 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-colors text-sm sm:text-base">
                                <Save size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                                บันทึก
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <div className="min-h-screen bg-secondary-50 pb-20 pt-6">
                <div className="space-y-6">

                    {/* 2x2 Grid Section - Flexible Height, Equal per Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {/* Customer Info - Mobile: 1, Desktop: 1 */}
                        <div className="order-1 md:order-1 flex flex-col h-full">
                            {/* Customer Info */}
                            <Card className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                        <User className="text-primary-600" />
                                        ข้อมูลลูกค้า
                                    </h2>
                                    {customer.id && (
                                        <button
                                            onClick={() => setShowEditCustomerModal(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            แก้ไข
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    {!customer.id ? (
                                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                            <div className="relative">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">ค้นหาลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
                                                <div className="relative">
                                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                    <input
                                                        type="text"
                                                        value={customer.name || ''}
                                                        onChange={e => {
                                                            setCustomer({ ...customer, name: e.target.value })
                                                            setShowCustomerDropdown(true)
                                                        }}
                                                        onFocus={() => setShowCustomerDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                                                        placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                                    />
                                                    {showCustomerDropdown && (
                                                        <div className="absolute z-20 w-full mt-2 left-0 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            {customersData
                                                                .filter(c => !customer.name || c.name.toLowerCase().includes(customer.name.toLowerCase()) || (c.phone && c.phone.includes(customer.name)))
                                                                .map(c => (
                                                                    <div
                                                                        key={c.id}
                                                                        onClick={() => {
                                                                            handleSelectCustomer(c)
                                                                            setShowCustomerDropdown(false)
                                                                        }}
                                                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                    >
                                                                        <div className="font-medium text-secondary-900 text-sm">{c.name}</div>
                                                                        <div className="text-xs text-secondary-500">{c.phone} {c.email ? `| ${c.email}` : ''}</div>
                                                                    </div>
                                                                ))}
                                                            <div
                                                                onClick={() => {
                                                                    setShowAddCustomerModal(true)
                                                                    setShowCustomerDropdown(false)
                                                                }}
                                                                className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 sticky bottom-0 border-t border-primary-100"
                                                            >
                                                                <UserPlus size={16} /> เพิ่มลูกค้าใหม่
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}


                                    {/* Customer Details Card - Click to re-select */}
                                    {customer.id && (
                                        <div
                                            onClick={() => setCustomer({})}
                                            className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md space-y-2 cursor-pointer group"
                                            title="คลิกเพื่อเปลี่ยนลูกค้า"
                                        >
                                            {/* Header: Name, Code */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">{String(customer.name)}</h3>
                                                            {customer.mediaSource && (
                                                                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-medium rounded border border-primary-200">
                                                                    {(() => {
                                                                        const options = [
                                                                            { id: 'facebook', label: 'Facebook', icon: <Facebook size={10} /> },
                                                                            { id: 'line', label: 'Line', icon: <MessageCircle size={10} /> },
                                                                            { id: 'google', label: 'Google', icon: <Search size={10} /> },
                                                                            { id: 'tiktok', label: 'Tiktok', icon: <Video size={10} /> },
                                                                            { id: 'instagram', label: 'Instagram', icon: <Instagram size={10} /> },
                                                                            { id: 'walkin', label: 'Walk-in', icon: <User size={10} /> },
                                                                            { id: 'referral', label: 'บอกต่อ', icon: <Users size={10} /> },
                                                                            { id: 'other', label: 'อื่นๆ', icon: <Globe size={10} /> }
                                                                        ];
                                                                        const source = options.find(o => o.id === customer.mediaSource);
                                                                        return (
                                                                            <span className="flex items-center gap-1">
                                                                                {source?.icon}
                                                                                {source?.label || customer.mediaSource}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-secondary-500 mt-0.5 font-mono">CODE: {customer.id || '-'}</p>
                                                    </div>
                                                </div>
                                                {/* Hidden indicator that appears on hover could be nice, or just rely on cursor pointer */}
                                            </div>

                                            {/* Contact Grid - Compact */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                                                <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                                    <Phone size={12} className="text-secondary-400 shrink-0" />
                                                    <span className="truncate">{customer.phone || '-'}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                                        <Mail size={12} className="text-secondary-400 shrink-0" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                )}
                                                {customer.line && (
                                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                                        <MessageCircle size={12} className="text-[#06c755] shrink-0" />
                                                        <span className="truncate">{customer.line.replace(/^(Line|ID):?\s*/i, '')}</span>
                                                    </div>
                                                )}
                                                {customer.facebook && (
                                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                                        <Facebook size={12} className="text-[#1877F2] shrink-0" />
                                                        <span className="truncate">{customer.facebook.replace(/^(FB|Facebook):?\s*/i, '')}</span>
                                                    </div>
                                                )}
                                                {customer.instagram && (
                                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                                        <Instagram size={12} className="text-[#E1306C] shrink-0" />
                                                        <span className="truncate">{customer.instagram.replace(/^(IG|Instagram):?\s*/i, '')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Address removed as per request */}
                                        </div>
                                    )}

                                    {/* Contact Person Selection - Always Visible */}
                                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                        <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ติดต่อจัดซื้อ</label>
                                        {!purchaserContact ? (
                                            <ContactSelector
                                                label={null}
                                                contacts={customer.contacts || []}
                                                value={purchaserContact}
                                                onChange={setPurchaserContact}
                                                variant="seamless"
                                                placeholder="ค้นหาผู้ติดต่อ..."
                                                onAddNew={() => handleAddNewContact('purchaserContact')}
                                            />
                                        ) : (
                                            <ContactDisplayCard
                                                contact={purchaserContact}
                                                onClick={() => setPurchaserContact(null)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Master Job Info - Mobile: 2, Desktop: 3 */}
                        <div className="order-3 md:order-4 flex flex-col h-full">
                            <JobInfoCard
                                className="h-full"
                                title="ข้อมูลงาน"
                                data={currentJobInfo}
                                onChange={handleJobInfoUpdate}
                                customer={customer}
                                availableTeams={availableTeams}
                                note={currentJobInfo.description}
                                onNoteChange={(value) => handleJobInfoUpdate({ description: value })}
                                onAddNewAddress={handleAddNewInstallAddress}
                                onAddNewInspector={handleAddNewInspector}
                                excludeJobTypes={['separate']}
                                actions={
                                    <div className="flex items-center gap-1.5">
                                        {/* Item Selector */}
                                        {/* Custom Item Selector */}
                                        <div className="relative">
                                            <div
                                                onClick={() => setShowItemDropdown(!showItemDropdown)}
                                                className="flex items-center gap-1.5 bg-white border border-secondary-200 rounded-md px-2 py-1 cursor-pointer hover:border-primary-400 transition-colors focus-within:ring-1 focus-within:ring-primary-500 min-w-[120px]"
                                            >
                                                <span className="text-[10px] font-bold text-secondary-500">{selectedItemIndex + 1}</span>
                                                <Package size={12} className="text-secondary-400" />
                                                <span className="text-[10px] text-secondary-700 flex-1 truncate">
                                                    {items[selectedItemIndex]?.id && String(items[selectedItemIndex].id).length > 20 ? `IT${String(items[selectedItemIndex].id).slice(-6)}` : (items[selectedItemIndex]?.id || 'New Item')}
                                                </span>
                                                <ChevronDown size={10} className={`text-secondary-400 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
                                            </div>

                                            {showItemDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setShowItemDropdown(false)}
                                                    ></div>
                                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-secondary-200 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <div className="max-h-48 overflow-y-auto">
                                                            {items.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        setSelectedItemIndex(idx)
                                                                        const jobCount = items[idx]?.jobs?.length || 0
                                                                        // If jobs exist, select the last job (latest), otherwise select index 0
                                                                        setSelectedJobIndex(jobCount > 0 ? jobCount - 1 : 0)
                                                                        setShowItemDropdown(false)
                                                                    }}
                                                                    className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${selectedItemIndex === idx ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-secondary-50 text-secondary-700'}`}
                                                                >
                                                                    <span className="w-4 text-center text-[10px] font-bold text-secondary-400">{idx + 1}</span>
                                                                    <span className="font-mono">{item.id && String(item.id).length > 20 ? `IT${String(item.id).slice(-6)}` : (item.id || 'New Item')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Custom Job Selector */}
                                        <div className="relative">
                                            <div
                                                onClick={() => setShowJobDropdown(!showJobDropdown)}
                                                className="flex items-center gap-1.5 bg-white border border-secondary-200 rounded-md px-2 py-1 cursor-pointer hover:border-primary-400 transition-colors focus-within:ring-1 focus-within:ring-primary-500 min-w-[120px]"
                                            >
                                                <span className="text-[10px] font-bold text-secondary-500">{selectedJobIndex + 1}</span>
                                                <Wrench size={12} className="text-secondary-400" />
                                                <span className="text-[10px] text-secondary-700 flex-1 truncate">
                                                    {(() => {
                                                        const item = items[selectedItemIndex]
                                                        if (!item) return 'New'

                                                        const jobs = item.jobs || []

                                                        // If jobs exist, try to get the selected job or the last job
                                                        if (jobs.length > 0) {
                                                            // Try selected index first
                                                            const selectedJob = jobs[selectedJobIndex]
                                                            if (selectedJob && selectedJob.id) {
                                                                return selectedJob.id.length > 20 ? `JB${selectedJob.id.slice(-6)}` : selectedJob.id
                                                            }

                                                            // If selected index is out of bounds, use the last job
                                                            const lastJob = jobs[jobs.length - 1]
                                                            if (lastJob && lastJob.id) {
                                                                return lastJob.id.length > 20 ? `JB${lastJob.id.slice(-6)}` : lastJob.id
                                                            }

                                                            // If jobs exist but no ID, show "New"
                                                            return 'New'
                                                        }

                                                        // No jobs exist, show "New"
                                                        return 'New'
                                                    })()}
                                                </span>
                                                <ChevronDown size={10} className={`text-secondary-400 transition-transform ${showJobDropdown ? 'rotate-180' : ''}`} />
                                            </div>

                                            {showJobDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setShowJobDropdown(false)}
                                                    ></div>
                                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-secondary-200 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <div className="max-h-48 overflow-y-auto">
                                                            {(items[selectedItemIndex]?.jobs || []).map((job, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`group px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${selectedJobIndex === idx ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-secondary-50 text-secondary-700'}`}
                                                                    onClick={() => {
                                                                        setSelectedJobIndex(idx)
                                                                        // IMPORTANT: Do not call handleJobInfoUpdate() here.
                                                                        // Selecting a job should only change selection; updating can accidentally
                                                                        // overwrite another job due to async state updates (stale selectedJobIndex).
                                                                        setShowJobDropdown(false)
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <span className="w-4 text-center text-[10px] font-bold text-secondary-400">{idx + 1}</span>
                                                                        <span className="font-mono">{job.id && String(job.id).length > 20 ? `JB${String(job.id).slice(-6)}` : (job.id || 'New Job')}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleDeleteJobFromItem(idx)
                                                                        }}
                                                                        className="p-1 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                                                        title="ลบงานนี้"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div
                                                            onClick={() => {
                                                                handleAddJobToItem()
                                                                setShowJobDropdown(false)
                                                            }}
                                                            className="px-3 py-2 bg-primary-50 text-primary-600 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-primary-100 border-t border-primary-100 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                            เพิ่มงานใหม่
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {(() => {
                                            const canShare = items.every(item => !item.jobs || item.jobs.length <= 1)
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={canShare ? handleShareJobInfo : null}
                                                    disabled={!canShare}
                                                    className={`p-1 rounded border transition-colors ${canShare
                                                        ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 shadow-sm'
                                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                                        }`}
                                                    title={canShare ? "ใช้ข้อมูลงานนี้ร่วมกันกับสินค้าทุกรายการ" : "ไม่สามารถใช้ร่วมกันได้เนื่องจากบางรายการมีหลายงาน"}
                                                >
                                                    <div className="flex items-center gap-1 px-1">
                                                        <Copy size={12} />
                                                        <span className="text-[10px] font-medium">ใช้ร่วมกัน</span>
                                                    </div>
                                                </button>
                                            )
                                        })()}
                                    </div>
                                }
                            />
                        </div>

                        {/* Tax Invoice - Mobile: 3, Desktop: 2 */}
                        <div className="order-4 md:order-2 flex flex-col h-full">


                            {/* Tax Invoice */}
                            {/* Tax Invoice & Delivery Contact Card */}
                            <Card className="p-6 flex flex-col h-full">
                                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-primary-600" />
                                    ข้อมูลใบกำกับภาษี
                                </h2>

                                <div className="flex-1 space-y-3">
                                    {/* Tax Invoice Section - Always Visible Search if not selected */}
                                    {!taxInvoice.companyName ? (
                                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                            <div className="relative">
                                                <div className="mb-2">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">ค้นหาใบกำกับภาษี</label>
                                                </div>
                                                <div className="relative">
                                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                    <input
                                                        type="text"
                                                        value={taxInvoiceSearchTerm}
                                                        onChange={(e) => {
                                                            setTaxInvoiceSearchTerm(e.target.value)
                                                            setShowTaxInvoiceDropdown(true)
                                                        }}
                                                        onFocus={() => setShowTaxInvoiceDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowTaxInvoiceDropdown(false), 200)}
                                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                                                        placeholder="ค้นหาใบกำกับภาษี (ชื่อบริษัท / เลขผู้เสียภาษี)..."
                                                    />
                                                </div>
                                                {showTaxInvoiceDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {customer.taxInvoices && customer.taxInvoices.length > 0 ? (
                                                            customer.taxInvoices
                                                                .filter(inv =>
                                                                    (inv.companyName || '').toLowerCase().includes(taxInvoiceSearchTerm.toLowerCase()) ||
                                                                    (inv.taxId || '').includes(taxInvoiceSearchTerm)
                                                                )
                                                                .map((inv, index) => (
                                                                    <div
                                                                        key={index}
                                                                        onClick={() => {
                                                                            setTaxInvoice({
                                                                                ...inv,
                                                                                branch: inv.branch || 'สำนักงานใหญ่',
                                                                                phone: customer.phone || '',
                                                                                email: customer.email || ''
                                                                            });
                                                                            setTaxInvoiceSearchTerm('');
                                                                            setShowTaxInvoiceDropdown(false);
                                                                        }}
                                                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                    >
                                                                        <div className="font-medium text-secondary-900 text-sm">{inv.companyName}</div>
                                                                        <div className="text-xs text-secondary-500">
                                                                            {inv.taxId} {inv.branch ? `| ${inv.branch}` : ''}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-sm text-secondary-500 text-center">ไม่มีข้อมูลใบกำกับภาษี</div>
                                                        )}
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handleAddNewTaxInvoice()
                                                                setShowTaxInvoiceDropdown(false)
                                                            }}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 border-t border-primary-100 sticky bottom-0"
                                                        >
                                                            <Plus size={16} /> เพิ่มใบกำกับภาษีใหม่
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Selected Details Card - Click to re-select */}
                                    {taxInvoice.companyName && (
                                        <div
                                            onClick={() => setTaxInvoice({ companyName: '', branch: '', taxId: '', address: '', phone: '', email: '', deliveryAddress: '' })}
                                            className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md cursor-pointer group"
                                            title="คลิกเพื่อเปลี่ยนใบกำกับภาษี"
                                        >
                                            {/* Header: Company Name & Branch */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                                                            {taxInvoice.companyName}
                                                        </h4>
                                                        <span className="px-1.5 py-0.5 bg-secondary-100 text-secondary-700 text-[10px] font-medium rounded border border-secondary-200">
                                                            {taxInvoice.branch || 'สำนักงานใหญ่'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-secondary-500 mt-1 flex items-center gap-2">
                                                        <span className="font-medium">เลขผู้เสียภาษี:</span>
                                                        <span className="px-1.5 py-0.5 bg-white text-secondary-700 text-[10px] font-mono font-medium rounded border border-secondary-200">{taxInvoice.taxId}</span>
                                                    </div>
                                                </div>
                                                {/* Button removed as per request */}
                                            </div>

                                            {/* Addresses */}
                                            <div>
                                                <label className="block text-xs font-semibold text-secondary-500 mb-1">ที่อยู่บริษัท</label>
                                                <div className="text-xs text-secondary-800 leading-relaxed">
                                                    {formatAddress(taxInvoice.address, taxInvoice)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tax Invoice Delivery Address Selection - Always Visible */}
                                    <div className="space-y-3">
                                        {/* Address Selector Component */}
                                        <AddressSelector
                                            label="ที่อยู่จัดส่งใบกำกับภาษี"
                                            addresses={[
                                                // Function to construct options including "Same as Install"
                                                ...(currentJobInfo.installAddress ? [{
                                                    label: 'ใช้ที่อยู่เดียวกับสถานที่ติดตั้ง/ขนส่ง',
                                                    address: currentJobInfo.installAddress,
                                                    googleMapLink: currentJobInfo.googleMapLink || '',
                                                    distance: currentJobInfo.distance || '',
                                                    isSpecial: true, // Marker for badging logic if we want to handle inside? Or just rely on label?
                                                    // Actually AddressSelector displays label/address.
                                                    // Value handling needs care.
                                                }] : []),
                                                ...(customer.addresses || [])
                                            ]}
                                            value={(() => {
                                                const isSame = taxInvoiceDeliveryAddress.type === 'same' || (currentJobInfo.installAddress && taxInvoiceDeliveryAddress.address === currentJobInfo.installAddress);
                                                return {
                                                    label: isSame ? (currentJobInfo.installLocationName || 'สถานที่ติดตั้ง/ขนส่ง') : taxInvoiceDeliveryAddress.label,
                                                    address: isSame ? (currentJobInfo.installAddress || '') : taxInvoiceDeliveryAddress.address,
                                                    googleMapLink: isSame ? (currentJobInfo.googleMapLink || '') : taxInvoiceDeliveryAddress.googleMapLink,
                                                    distance: isSame ? (currentJobInfo.distance || '') : taxInvoiceDeliveryAddress.distance,
                                                    badge: isSame ? (
                                                        <span className="px-1.5 py-0.5 bg-success-50 text-success-700 text-[10px] font-medium rounded border border-success-200">
                                                            ที่อยู่เดียวกัน
                                                        </span>
                                                    ) : null
                                                };
                                            })()}
                                            onChange={(newValue) => {
                                                if (newValue) {
                                                    // Detect if "Same as Install" was selected
                                                    // Simple check: label matches? Or add ID?
                                                    // The 'newValue' comes from the option object passed in.
                                                    // If we add extra props to option, they come back?
                                                    // My AddressSelector implementation passes `addr` back in handleSelect.
                                                    // So if I add `type: 'same'` to the option, it comes back!

                                                    // Wait, AddressSelector reconstructs the object in onChange({ label, address... })
                                                    // It doesn't pass the raw object fully?
                                                    // Let's check AddressSelector.jsx:
                                                    // onChange({ label: addr.label..., address: fullAddress..., ... })
                                                    // It constructs a NEW object. It loses custom props like 'type' or 'isSpecial'.

                                                    // FIX: I should rely on value comparison or update AddressSelector to pass original object?
                                                    // Or just infer "same" type if address matches currentJobInfo?
                                                    // Simplest: Check if address === currentJobInfo.installAddress?

                                                    const isSame = currentJobInfo.installAddress && newValue.address === currentJobInfo.installAddress;

                                                    setTaxInvoiceDeliveryAddress({
                                                        type: isSame ? 'same' : 'custom',
                                                        label: newValue.label,
                                                        address: newValue.address,
                                                        googleMapLink: newValue.googleMapLink,
                                                        distance: newValue.distance
                                                    });
                                                } else {
                                                    setTaxInvoiceDeliveryAddress({
                                                        type: '',
                                                        label: '',
                                                        address: '',
                                                        googleMapLink: '',
                                                        distance: ''
                                                    });
                                                }
                                            }}
                                            addressClassName="text-xs"
                                            placeholder="ค้นหาที่อยู่..."
                                            onAddNew={handleAddNewAddress}
                                        />
                                    </div>

                                    {/* Contact Selector - Delivery - Always Visible */}
                                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                        <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ติดต่อรับเอกสาร</label>
                                        {!receiverContact ? (
                                            <ContactSelector
                                                label={null}
                                                contacts={customer.contacts || []}
                                                value={receiverContact}
                                                onChange={setReceiverContact}
                                                variant="seamless"
                                                placeholder="ค้นหาผู้ติดต่อ..."
                                                onAddNew={() => handleAddNewContact('receiverContact')}
                                            />
                                        ) : (
                                            <ContactDisplayCard
                                                contact={receiverContact}
                                                onClick={() => setReceiverContact(null)}
                                            />
                                        )}
                                    </div>

                                </div>

                            </Card>
                        </div>

                        {/* Payment Summary - Mobile: 4, Desktop: 4 */}
                        <div className="order-5 md:order-5 flex flex-col h-full">
                            <div className="h-full">
                                <PaymentSummaryCard
                                    subtotal={subtotal}
                                    shippingFee={shippingFee}
                                    onShippingFeeChange={setShippingFee}
                                    discount={discount}
                                    onDiscountChange={setDiscount}
                                    vatRate={vatRate}
                                    onVatRateChange={setVatRate}
                                    paymentSchedule={paymentSchedule}
                                    readOnly={false}
                                    hideControls={true}
                                    promptpayQr={promptpayQr}
                                    onAddPayment={() => {
                                        setEditingPaymentIndex(null)
                                        setShowPaymentModal(true)
                                    }}
                                    onEditPayment={(index) => {
                                        setEditingPaymentIndex(index)
                                        setShowPaymentModal(true)
                                    }}
                                    otherOutstandingOrders={otherOutstandingOrders}
                                    vatIncluded={vatIncluded}
                                    onVatIncludedChange={setVatIncluded}
                                    className="h-full"
                                />
                            </div>
                        </div>

                        {/* Product List Section */}
                        <div className="order-2 md:order-3 col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                    <FileText className="text-primary-600" />
                                    รายการสินค้า
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative flex bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer text-xs"
                                        onClick={() => {
                                            setEditingItemIndex(idx)
                                            setShowOrderItemModal(true)
                                        }}
                                    >
                                        {/* LEFT: Image (Fixed Aspect) */}
                                        <div className="w-24 bg-gray-50 flex items-center justify-center border-r border-secondary-100 flex-shrink-0 relative">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package size={24} className="text-secondary-300" />
                                            )}
                                            {/* Index Badge */}
                                            <div className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm z-10">
                                                {idx + 1}
                                            </div>
                                        </div>

                                        {/* RIGHT: Content 5 Rows Redesign */}
                                        {/* RIGHT: Content 5 Rows Redesign */}
                                        <div className="flex-1 min-w-0 p-3 space-y-3">
                                            {/* Row 1: Header Info & Price */}
                                            <div className="flex justify-between items-start gap-2 w-full">
                                                {/* LEFT: Product Info */}
                                                <div className="flex flex-wrap items-center gap-2 min-w-0">

                                                    {/* Category */}
                                                    {(item.category || item.subcategory) && (
                                                        <span className="text-secondary-500 font-medium text-xs">
                                                            {item.category?.startsWith('01') || item.category?.startsWith('02') ? item.category.substring(2) : item.category}
                                                            {item.subcategory ? ` / ${item.subcategory}` : ''}
                                                        </span>
                                                    )}
                                                    {/* Code Badge */}
                                                    <span className="bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500">
                                                        {item.code || '-'}
                                                    </span>
                                                    {/* Name */}
                                                    <span className="text-sm font-bold text-secondary-900 truncate">{item.name || 'สินค้าใหม่'}</span>

                                                    {/* Price & Stock - Moved from Right */}
                                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                                        <div className="flex items-center gap-1">
                                                            <div className="text-secondary-500 font-medium text-[11px]">
                                                                {currency(item.unitPrice || 0)}
                                                            </div>
                                                            <div className="text-secondary-400 text-[10px]">
                                                                x {item.qty || 1}
                                                            </div>
                                                            <div className="font-bold text-primary-700 text-[11px] ml-1">
                                                                {currency((item.unitPrice || 0) * (item.qty || 0))}
                                                            </div>
                                                        </div>
                                                        <span className={`px-1.5 rounded text-[10px] ${Number(item.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            Stock: {item.stock || 0}
                                                        </span>
                                                        {item.id && typeof item.id === 'string' && item.id.length > 20 && (
                                                            <span className="bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500 ml-1">
                                                                IT{item.id.slice(-6)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* RIGHT: Stock & Price */}

                                            </div>

                                            {/* Row 2: Specs & Description */}
                                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-600">
                                                {/* LEFT: Specs */}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    {/* Dimensions - Moved from Row 1 */}
                                                    {item.material && (
                                                        <div className="flex items-center gap-1" title="วัสดุ">
                                                            <Layers size={12} />
                                                            <span>{item.material}</span>
                                                        </div>
                                                    )}
                                                    {/* Dimensions */}
                                                    {(() => {
                                                        const getDims = (obj) => {
                                                            if (!obj) return null
                                                            // 1. Try parsed dimensions object (from DataManager)
                                                            if (obj.dimensions) {
                                                                return { w: obj.dimensions.width, l: obj.dimensions.length, h: obj.dimensions.height }
                                                            }
                                                            // 2. Try parsing 'size' string (Raw DB format)
                                                            if (obj.size && typeof obj.size === 'string') {
                                                                const parts = obj.size.split('x').map(p => parseInt(p) || 0)
                                                                if (parts.length >= 3) return { l: parts[0], w: parts[1], h: parts[2] }
                                                            }
                                                            // 3. Try legacy individual fields
                                                            if (obj.width || obj.length || obj.height) {
                                                                return { w: obj.width, l: obj.length, h: obj.height }
                                                            }
                                                            return null
                                                        }

                                                        // Priority: Selected Variant (Golden Source) -> Product -> Item (Fallback/Legacy)
                                                        const dims = getDims(item.selectedVariant) ||
                                                            getDims(item.product) ||
                                                            (item.product?.variants?.[0] ? getDims(item.product.variants[0]) : null) ||
                                                            getDims(item)

                                                        if (dims && (dims.w || dims.l || dims.h)) {
                                                            return (
                                                                <div className="flex items-center gap-1" title="ขนาด">
                                                                    <Scaling size={12} />
                                                                    <span>
                                                                        {dims.l ? `${dims.l}x` : ''}
                                                                        {dims.w ? `${dims.w}x` : ''}
                                                                        {dims.h ? `${dims.h}` : ''}
                                                                        {' cm'}
                                                                    </span>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    })()}
                                                    {/* Color - Show variant color if selected, otherwise product color */}
                                                    {(item.selectedVariant?.color || item.color) && (
                                                        <div className="flex items-center gap-1" title="สี">
                                                            <Palette size={12} />
                                                            <span>{item.selectedVariant?.color || item.color}</span>
                                                        </div>
                                                    )}
                                                    {/* Crystal Data */}
                                                    {(item.selectedVariant?.crystalColor || item.crystalColor) && (
                                                        <div className="flex items-center gap-1" title="สีคริสตัล">
                                                            <Gem size={12} />
                                                            <span>{item.selectedVariant?.crystalColor || item.crystalColor}</span>
                                                        </div>
                                                    )}
                                                    {(item.light || item.lightColor) && (
                                                        <div className="flex items-center gap-1" title="แสงไฟ">
                                                            <Zap size={12} />
                                                            <span>
                                                                {item.light}
                                                                {item.light && item.lightColor && ' '}
                                                                {item.lightColor}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.remote && (
                                                        <div className="flex items-center gap-1" title="รีโมท">
                                                            <Power size={12} />
                                                            <span>{item.remote}</span>
                                                        </div>
                                                    )}
                                                    {item.bulbType && (
                                                        <div className="flex items-center gap-1" title="ขั้วหลอด">
                                                            <Lightbulb size={12} />
                                                            <span>{item.bulbType}</span>
                                                        </div>
                                                    )}
                                                    {/* Description / Remark - Moved to follow Bulb Type */}
                                                    {(item.remark || item.description) && (
                                                        <div className="flex items-center gap-1 text-secondary-500" title="หมายเหตุ">
                                                            <FileText size={12} />
                                                            <span className="truncate max-w-[200px]">
                                                                {item.remark || item.description}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* RIGHT: Description */}

                                            </div>

                                            {/* Row 3: Job Info & Dates */}
                                            {/* Row 3: Job Info & Dates */}
                                            {(() => {
                                                // Get latest job (last job in array, sorted by sequence_number)
                                                const latestJob = item.jobs && item.jobs.length > 0
                                                    ? item.jobs[item.jobs.length - 1]
                                                    : item.latestJob || null

                                                return (
                                                    <div className="flex justify-between items-center gap-4 text-xs text-secondary-600">
                                                        {/* LEFT: Job Info: Inspector, Location */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            {/* Inspector (Swapped from Row 4) */}
                                                            <div className="flex items-center gap-1">
                                                                <UserCheck size={12} />
                                                                <span>
                                                                    {(latestJob?.inspector1?.name) || '-'}
                                                                    {(latestJob?.inspector1?.phone) && ` (${latestJob?.inspector1?.phone})`}
                                                                </span>
                                                            </div>

                                                            {(latestJob?.distance || latestJob?.installLocationName) && (
                                                                <div className="flex items-center gap-1 text-secondary-500">
                                                                    {latestJob?.distance && <span>{latestJob?.distance} Km</span>}
                                                                    {latestJob?.installLocationName && <span>{latestJob?.installLocationName}</span>}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={12} className="flex-shrink-0" />
                                                                <span>
                                                                    {latestJob?.installAddress || latestJob?.installLocationName || '-'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT: Dates - Moved to Row 4 */}
                                                    </div>
                                                )
                                            })()}

                                            {/* Row 4: Job Type, Team, Details & Dates */}
                                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-500">
                                                {/* LEFT Group: Job Type, Team, Details */}
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {(() => {
                                                        // Get latest job (last job in array, sorted by sequence_number)
                                                        const latestJob = item.jobs && item.jobs.length > 0
                                                            ? item.jobs[item.jobs.length - 1]
                                                            : item.latestJob || null

                                                        return (
                                                            <>
                                                                {/* Job Type */}
                                                                <div
                                                                    className="flex items-center gap-1 p-1 -ml-1 rounded text-secondary-500"
                                                                    title="ประเภทงาน"
                                                                >
                                                                    {(latestJob?.jobType || latestJob?.job_type) === 'delivery' ? <Truck size={14} /> : <Wrench size={14} />}
                                                                </div>

                                                                {/* Dates - Moved to 2nd position */}
                                                                <div className="flex items-center gap-3">
                                                                    {/* Job Sequence Indicator */}
                                                                    {/* Job Sequence Indicator (Click to Open List) */}
                                                                    <div
                                                                        className="flex items-center gap-1 text-secondary-500 font-medium text-[11px] bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-100"
                                                                    >
                                                                        <List size={10} />
                                                                        <span>{item.latestJobIndex || item.jobs?.length || 1}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar size={12} />
                                                                        <span>
                                                                            {(latestJob?.appointmentDate || latestJob?.appointment_date)
                                                                                ? new Date(latestJob?.appointmentDate || latestJob?.appointment_date).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                                : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-green-700">
                                                                        <CheckCircle size={12} />
                                                                        <span>
                                                                            {(latestJob?.completionDate || latestJob?.completion_date)
                                                                                ? new Date(latestJob?.completionDate || latestJob?.completion_date).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                                : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Team */}
                                                                <div className="flex items-center gap-1">
                                                                    <Users size={12} />
                                                                    <span>{latestJob?.team || latestJob?.assigned_team || '-'}</span>
                                                                </div>

                                                                {/* Details/Note */}
                                                                <div className="flex items-center gap-1 text-secondary-400">
                                                                    <FileText size={12} />
                                                                    <span className="truncate max-w-[300px]">
                                                                        {latestJob?.description || latestJob?.notes || '-'}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )
                                                    })()}
                                                </div>

                                                {/* RIGHT: Dates (Moved from Row 3) */}

                                            </div>

                                            {/* Row 5: SNs */}
                                            <div className="flex items-start gap-2 pt-1">
                                                <QrCode size={16} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex flex-wrap gap-2">
                                                    {item.serialNumbers && item.serialNumbers.length > 0 && item.serialNumbers.map((sn, i) => (
                                                        <span key={i} className="text-[10px] font-mono bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                            {sn}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button */}
                                <button
                                    onClick={() => {
                                        setEditingItemIndex(null)
                                        setShowOrderItemModal(true)
                                    }}
                                    className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    <Plus size={18} />
                                    เพิ่มรายการสินค้า
                                </button>
                            </div>

                            {/* Order Item Modal */}
                            <OrderItemModal
                                isOpen={showOrderItemModal}
                                onClose={() => setShowOrderItemModal(false)}
                                onSave={handleSaveItem}
                                onDelete={handleDeleteItem}
                                item={editingItemIndex !== null ? items[editingItemIndex] : null}
                                productsData={productsData}
                                isEditing={editingItemIndex !== null}

                                onAddNewProduct={() => {
                                    setNewProduct({
                                        id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
                                        length: '', width: '', height: '', material: '', color: '',
                                        images: []
                                    })
                                    setShowProductModal(true)
                                }}
                                onEditProduct={(product) => {
                                    setNewProduct(product)
                                    setShowProductModal(true)
                                }}
                                lastCreatedProduct={lastCreatedProduct}
                                onConsumeLastCreatedProduct={() => setLastCreatedProduct(null)}
                            />
                        </div >
                    </div>

                    {/* Map Popup Modal */}
                    {
                        showMapPopup && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
                                        <h3 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                                            <MapPin className="text-primary-600" size={28} />
                                            ตำแหน่งที่อยู่
                                        </h3>
                                        <button
                                            onClick={() => setShowMapPopup(false)}
                                            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 rounded-full transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Map Content */}
                                    <div className="p-8 flex flex-col items-center justify-center space-y-6">
                                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                                            <MapPin size={48} className="text-primary-600" />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <h4 className="text-xl font-bold text-secondary-900">เปิดดูแผนที่</h4>
                                            <p className="text-secondary-600">คลิกปุ่มด้านล่างเพื่อเปิดดูตำแหน่งใน Google Maps</p>
                                        </div>

                                        {(() => {
                                            const coords = extractCoordinates(selectedMapLink)
                                            if (coords) {
                                                return (
                                                    <div className="bg-secondary-50 p-4 rounded-lg w-full">
                                                        <div className="text-sm text-secondary-600 space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Latitude:</span>
                                                                <span className="font-mono">{coords.lat}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Longitude:</span>
                                                                <span className="font-mono">{coords.lon}</span>
                                                            </div>
                                                            {currentJobInfo.distance && (
                                                                <div className="flex justify-between pt-2 border-t border-secondary-200">
                                                                    <span className="font-medium">ระยะทาง:</span>
                                                                    <span className="font-semibold text-success-600">📍 {currentJobInfo.distance}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}

                                        <a
                                            href={selectedMapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
                                        >
                                            <MapPin size={20} />
                                            เปิดใน Google Maps
                                        </a>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50 flex justify-end">
                                        <button
                                            onClick={() => setShowMapPopup(false)}
                                            className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors font-medium"
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {/* Quick Add Product Modal */}
                    <ProductModal
                        isOpen={showProductModal}
                        onClose={() => setShowProductModal(false)}
                        product={newProduct}
                        onSave={handleSaveNewProduct}
                        existingProducts={productsData}
                    />

                    {/* Customer Edit Modal */}
                    <CustomerModal
                        isOpen={showEditCustomerModal}
                        onClose={() => {
                            setShowEditCustomerModal(false)
                            setCustomerModalTab('customer')
                            setAddingContactFor(null)
                        }}
                        customer={customer}
                        initialTab={customerModalTab}
                        onSave={handleUpdateCustomer}
                        onDelete={handleDeleteCustomer}
                    />

                    {/* Customer Add Modal */}
                    <CustomerModal
                        isOpen={showAddCustomerModal}
                        onClose={() => setShowAddCustomerModal(false)}
                        customer={null}
                        onSave={handleAddNewCustomer}
                    />


                    {/* Sub Job Modal (Enhanced for List Support) */}


                    {/* Payment Entry Modal */}
                    {/* Payment Entry Modal */}
                    <PaymentEntryModal
                        isOpen={showPaymentModal}
                        onClose={() => {
                            setShowPaymentModal(false)
                            setEditingPaymentIndex(null)
                        }}
                        onSave={async (paymentData) => {
                            // Upload slip if it's a File object
                            let slipUrl = paymentData.slip
                            if (paymentData.slip && paymentData.slip instanceof File) {
                                console.log('[OrderFormClean] Uploading payment slip...')
                                const paymentIndex = editingPaymentIndex !== null ? editingPaymentIndex : paymentSchedule.length
                                // Use existing orderId or generate temporary one for new orders
                                const uploadOrderId = router.query.id || `TEMP-${Date.now()}`
                                slipUrl = await DataManager.uploadPaymentSlip(paymentData.slip, uploadOrderId, paymentIndex)
                                if (!slipUrl) {
                                    alert('ไม่สามารถอัพโหลดรูปสลิปได้ กรุณาลองใหม่อีกครั้ง')
                                    return
                                }
                                console.log('[OrderFormClean] Slip uploaded:', slipUrl)
                            }

                            // Calculate amount based on mode
                            const otherPaymentsTotal = paymentSchedule.reduce((sum, p, idx) => {
                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) {
                                    return sum
                                }
                                return sum + (parseFloat(p.amount) || 0)
                            }, 0)
                            const totalOther = otherOutstandingOrders.reduce((s, o) => s + (Number(o.outstanding) || 0), 0)
                            const remainingForThis = (total + totalOther) - otherPaymentsTotal
                            const calculatedAmount = paymentData.amountMode === 'percent'
                                ? (remainingForThis * (parseFloat(paymentData.percentValue) || 0)) / 100
                                : parseFloat(paymentData.amount) || 0

                            if (editingPaymentIndex !== null) {
                                // Edit existing payment
                                const newSchedule = [...paymentSchedule]
                                newSchedule[editingPaymentIndex] = {
                                    ...paymentData,
                                    slip: slipUrl, // Store URL instead of File
                                    amount: calculatedAmount
                                }
                                setPaymentSchedule(newSchedule)
                            } else {
                                // Add new payment
                                setPaymentSchedule([...paymentSchedule, {
                                    ...paymentData,
                                    slip: slipUrl, // Store URL instead of File
                                    amount: calculatedAmount
                                }])
                            }
                        }}
                        onDelete={() => {
                            if (editingPaymentIndex !== null) {
                                setPaymentSchedule(paymentSchedule.filter((_, i) => i !== editingPaymentIndex))
                            }
                        }}
                        payment={editingPaymentIndex !== null ? paymentSchedule[editingPaymentIndex] : null}
                        remainingBalance={(() => {
                            // Calculate remaining balance excluding the payment being edited
                            const otherPaymentsTotal = paymentSchedule.reduce((sum, p, idx) => {
                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) {
                                    return sum
                                }
                                return sum + (parseFloat(p.amount) || 0)
                            }, 0)
                            const totalOther = otherOutstandingOrders.reduce((s, o) => s + (Number(o.outstanding) || 0), 0)
                            return (total + totalOther) - otherPaymentsTotal
                        })()}
                        isEditing={editingPaymentIndex !== null}
                        paymentCount={paymentSchedule.length}
                    />
                </div >
            </div >
        </AppLayout >
    )
}
