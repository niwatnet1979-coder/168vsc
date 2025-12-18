import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CustomerModal from './CustomerModal'
import {
    Save, Plus, Trash2, Calendar, MapPin, FileText, User, Search,
    ChevronDown, ChevronUp, X, Check, Truck, Wrench, Edit2, UserPlus,
    CreditCard, DollarSign, Percent, AlertCircle, Home, ArrowLeft, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, FileEdit, Camera, HelpCircle, Map, Globe, Users, Box, Palette, Package, UserCheck, Menu, Layers, Gem, Zap, Power, QrCode, Scaling, Lightbulb, Video
} from 'lucide-react'
import AppLayout from './AppLayout'
import { DataManager } from '../lib/dataManager'

import ProductModal from './ProductModal'
import SubJobModal from './SubJobModal'
import AddressSelector from './AddressSelector' // Import AddressSelector
import ContactSelector from './ContactSelector'
import ContactDisplayCard from './ContactDisplayCard'
import JobInfoCard from './JobInfoCard'
import PaymentEntryModal from './PaymentEntryModal'
import Card from './Card'
import { currency, calculateDistance, deg2rad, extractCoordinates } from '../lib/utils'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'
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

    // --- Form States ---
    const [customer, setCustomer] = useState({
        id: '', name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
        contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
        mediaSource: '', mediaSourceOther: ''
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


    const [jobInfo, setJobInfo] = useState({
        jobType: '',
        orderDate: new Date().toISOString().split('T')[0],
        appointmentDate: '',
        completionDate: '',
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        team: '',
        inspector1: { name: '', phone: '' },
        distance: '',
        description: '' // Added for job details/notes
    })

    const [items, setItems] = useState([])

    // Sync Job Info to Items (Real-time)
    useEffect(() => {
        setItems(prevItems => prevItems.map(item => ({
            ...item,
            subJob: {
                ...item.subJob,
                jobType: jobInfo.jobType,
                appointmentDate: jobInfo.appointmentDate,
                completionDate: jobInfo.completionDate,
                installLocationName: jobInfo.installLocationName,
                installAddress: jobInfo.installAddress,
                googleMapLink: jobInfo.googleMapLink,
                distance: jobInfo.distance,
                inspector1: jobInfo.inspector1,
                team: jobInfo.team,
                description: jobInfo.description // Use jobInfo.description directly
            }
        })))
    }, [jobInfo]) // Only jobInfo as dependency

    const [discount, setDiscount] = useState({ mode: 'percent', value: 0 })
    const [vatRate, setVatRate] = useState(0.07) // Default 0.07
    // Sync SubJobs with Main Job Info
    useEffect(() => {
        // If Main Job is 'installation' or 'delivery', force sync to all subjobs
        if (jobInfo.jobType === 'installation' || jobInfo.jobType === 'delivery') {
            setItems(prevItems => prevItems.map(item => ({
                ...item,
                subJob: {
                    ...item.subJob,
                    jobType: jobInfo.jobType,
                    appointmentDate: jobInfo.appointmentDate,
                    completionDate: jobInfo.completionDate,
                    installLocationName: jobInfo.installLocationName,
                    installAddress: jobInfo.installAddress,
                    googleMapLink: jobInfo.googleMapLink,
                    distance: jobInfo.distance,
                    inspector1: jobInfo.inspector1,
                    team: jobInfo.team,
                    // Description is NOT synced usually, but maybe for location? 
                    // Let's keep description independent or maybe sync if empty? 
                    // Requirement says: "take all values from main job info"
                    // So we sync everything except maybe description if we want per-item notes.
                    // "นำค่าทุกอย่างในข้อมูลงานหลักไปใช้" implies everything.
                    // But description (note) might be specific? 
                    // Let's assume description remains specific to the item unless we want to override it.
                    // User said "all values". Let's stick to the main structure fields.
                    // If description is "details", main job details might be "Whole project details".
                    // Sub job details might be "Fix this item".
                    // Let's NOT sync description for now as it's often item-specific.
                    // OR if user meant *everything*, we should sync description too.
                    // Given the prompt "นำค่าทุกอย่าง...ไปใช้", I will sync everything KEY to the job execution.
                    // Description is tricky. I'll leave description independent for now as it's often item-specific.
                    // Wait, Re-reading: "นำค่าทุกอย่างในข้อมูลงานหลักไปใช้ในข้อมูลงานย่อยทุกงาน"
                    // "All values". Okay, I will sync description too if it's safe, but usually note is item specific.
                    // Let's sync major fields: Dates, Team, Location, Type, Inspector.
                }
            })))
        }
    }, [
        jobInfo.jobType,
        jobInfo.appointmentDate,
        jobInfo.completionDate,
        jobInfo.installLocationName,
        jobInfo.installAddress,
        jobInfo.googleMapLink,
        jobInfo.distance,
        jobInfo.inspector1,
        jobInfo.team
    ])
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






    // Serialize jobInfo for proper change detection
    const jobInfoSerialized = useMemo(() => JSON.stringify(jobInfo), [
        jobInfo.jobType,
        jobInfo.appointmentDate,
        jobInfo.completionDate,
        jobInfo.installLocationName,
        jobInfo.installAddress,
        jobInfo.googleMapLink,
        jobInfo.distance,
        jobInfo.team,
        jobInfo.note
    ])

    // Sync Sub Jobs with Main Job Info
    useEffect(() => {
        console.log('[DEBUG] Sync SubJob useEffect triggered', { jobType: jobInfo.jobType, itemsCount: items.length })
        // Logic: specific types inherit from Main Job
        if (['installation', 'delivery'].includes(jobInfo.jobType) || !jobInfo.jobType) {
            setItems(prevItems => {
                const updated = prevItems.map(item => ({
                    ...item,
                    subJob: { // Ensure subJob object is included in payload
                        ...(item.subJob || {}), // Ensure item.subJob exists before spreading
                        jobType: jobInfo.jobType,
                        appointmentDate: jobInfo.appointmentDate,
                        completionDate: jobInfo.completionDate,
                        installLocationName: jobInfo.installLocationName,
                        installAddress: jobInfo.installAddress,
                        googleMapLink: jobInfo.googleMapLink,
                        distance: jobInfo.distance,
                        team: jobInfo.team,
                        description: jobInfo.note || item.subJob?.description // Sync note if available, else keep existing or empty
                    }
                }))
                console.log('[DEBUG] Updated items with subJob:', updated)
                return updated
            })
        }
    }, [jobInfoSerialized])

    // Load Existing Order
    useEffect(() => {
        const loadOrder = async () => {
            if (!router.isReady || !router.query.id) return

            try {
                // Fetch from Supabase
                const order = await DataManager.getOrderById(router.query.id)

                if (order) {
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
                    if (order.jobInfo) {
                        setJobInfo({
                            ...order.jobInfo,
                            description: order.jobInfo.description || ''
                        })
                    }

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
                        // Fetch all products to get images
                        const products = await DataManager.getProducts()

                        const itemsWithImages = order.items.map(item => {
                            // Try to find product and get image from variants
                            const product = products.find(p =>
                                p.uuid === item.product_id ||
                                p.product_code === item.product_code ||
                                p.product_code === item.code
                            )

                            if (product) {
                                // Sync missing fields from product to item (Normalization)
                                // This ensures consistent display between "New Item" and "Loaded Item"
                                return {
                                    ...item,
                                    product, // Attach full product object
                                    // Fallbacks if missing in order_item record
                                    material: item.material || product.material,
                                    category: item.category || product.category,
                                    subcategory: item.subcategory || product.subcategory,
                                    // Dimensions fallback (if not in item)
                                    length: item.length || product.length,
                                    width: item.width || product.width,
                                    height: item.height || product.height,
                                    // Image fallback
                                    image: item.image || product.variants?.[0]?.images?.[0] || null
                                }
                            }

                            return item
                        })

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

    // Distance Calculation
    useEffect(() => {
        const calculate = async () => {
            if (!jobInfo.googleMapLink) return;

            let coords = extractCoordinates(jobInfo.googleMapLink)

            // If direct extraction fails, try resolving short link
            if (!coords && jobInfo.googleMapLink.includes('goo.gl') || jobInfo.googleMapLink.includes('maps.app.goo.gl')) {
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
                const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
                setJobInfo(prev => ({ ...prev, distance: dist }))
            }
        }

        calculate()
    }, [jobInfo.googleMapLink])

    // Auto-repair incomplete jobInfo address from Customer data
    useEffect(() => {
        if (!jobInfo.installLocationName || !customer.addresses) return

        // If address seems incomplete (e.g. just a zipcode like "10210")
        const currentAddr = jobInfo.installAddress || ''
        const seemsIncomplete = currentAddr.length < 10 && /^\d+$/.test(currentAddr.replace(/\s/g, ''))

        if (seemsIncomplete) {
            // Find better address in customer data
            let match = customer.addresses.find(a =>
                a.label && a.label.trim().toLowerCase() === jobInfo.installLocationName.trim().toLowerCase()
            )

            // Fallback: match by zipcode if no label match
            if (!match && /^\d{5}$/.test(currentAddr.trim())) {
                match = customer.addresses.find(a => a.zipcode === currentAddr.trim())
            }

            if (match && match.address && match.address.length > currentAddr.length) {
                console.log('Auto-repairing incomplete address:', currentAddr, '->', match.address)
                setJobInfo(prev => ({
                    ...prev,
                    installAddress: match.address,
                    // Ensure map link is also recovered if missing or different
                    googleMapLink: match.googleMapsLink || prev.googleMapLink,
                }))

                // Also sync Tax Invoice Address if it matches the broken one or is linked
                // Also sync Tax Invoice Address if it matches the broken one or is linked
                setTaxInvoiceDeliveryAddress(prev => {
                    // Check if it looks like the stale address (short) and has same label
                    const isStale = (prev.address === currentAddr) ||
                        (prev.label && prev.label.trim() === jobInfo.installLocationName.trim() && prev.address && prev.address.length < 15);

                    const isLinked = prev.type === 'same' || isStale;

                    if (isLinked) {
                        return {
                            ...prev,
                            address: match.address,
                            googleMapLink: match.googleMapsLink || prev.googleMapLink,
                            // If we forced an update, it effectively becomes the same/linked
                            type: 'same'
                        }
                    }
                    return prev
                })
            }
        }
    }, [customer.addresses, jobInfo.installLocationName, jobInfo.installAddress])

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
                    setJobInfo(prev => ({
                        ...prev,
                        installLocationName: newAddr.label,
                        installAddress: fullAddress,
                        googleMapLink: newAddr.googleMapsLink,
                        distance: ''
                    }))
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
                    setJobInfo(prev => ({
                        ...prev,
                        inspector1: {
                            id: newContact.id,
                            name: newContact.name,
                            phone: newContact.phone || '',
                            email: newContact.email || '',
                            lineId: newContact.lineId || '',
                            position: newContact.position || '',
                            note: newContact.note || ''
                        }
                    }))
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
    const [showSubJobModal, setShowSubJobModal] = useState(false)
    const [currentSubJobItemIndex, setCurrentSubJobItemIndex] = useState(null)
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
            setLastCreatedProduct(savedProduct)
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
            // Sync main job info to sub job if not separate
            subJob: jobInfo.jobType !== 'separate' ? {
                ...(newItems[index].subJob || {}),
                jobType: jobInfo.jobType,
                appointmentDate: jobInfo.appointmentDate,
                completionDate: jobInfo.completionDate,
                installLocationName: jobInfo.installLocationName,
                installAddress: jobInfo.installAddress,
                googleMapLink: jobInfo.googleMapLink,
                distance: jobInfo.distance,
                team: jobInfo.team,
                description: jobInfo.note || newItems[index].subJob?.description
            } : (newItems[index].subJob || {})
        }
        setItems(newItems)
    }

    const handleSaveSubJob = (subJobData) => {
        if (currentSubJobItemIndex !== null) {
            const newItems = [...items]
            newItems[currentSubJobItemIndex] = {
                ...newItems[currentSubJobItemIndex],
                subJob: subJobData
            }
            setItems(newItems)
            setShowSubJobModal(false)
            setCurrentSubJobItemIndex(null)
        }
    }

    const handleSaveItem = (itemData) => {
        const newItems = [...items]
        if (editingItemIndex !== null) {
            newItems[editingItemIndex] = itemData
        } else {
            newItems.push(itemData)
        }
        setItems(newItems)
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

        // Correction: DataManager.getNextJobId returns the *next* ID string.
        // So lastJobNum should be that number - 1 ?? No, let's just use it as start.
        // Let's re-parse for safety.

        const itemsWithJobIds = items.map((item) => {
            // If item already has a jobId (e.g., when editing an existing order), keep it.
            if (item.subJob && item.subJob.jobId) {
                return item;
            }

            // Generate new ID
            const newJobId = `JB${(lastJobNum).toString().padStart(7, '0')}`
            lastJobNum++

            // Ensure subJob object exists
            const subJob = item.subJob || {}

            return {
                ...item,
                subJob: {
                    ...subJob,
                    jobId: newJobId, // Assign permanent Job ID
                    // Inherit from Main Job Info if subJob field is empty
                    jobType: subJob.jobType || jobInfo.jobType || 'installation',
                    appointmentDate: subJob.appointmentDate || jobInfo.appointmentDate || '',
                    completionDate: subJob.completionDate || jobInfo.completionDate || null,
                    // Add robust fallbacks
                    team: subJob.team || jobInfo.team || '',
                    description: subJob.description || jobInfo.description || '',
                    // Check both inspector1 (object) and inspector (potential legacy string or object)
                    inspector1: subJob.inspector1 || jobInfo.inspector1 || (jobInfo.inspector && typeof jobInfo.inspector === 'object' ? jobInfo.inspector : { name: jobInfo.inspector || '', phone: '' }) || null,
                    installAddress: subJob.installAddress || jobInfo.installAddress || '',
                    googleMapLink: subJob.googleMapLink || jobInfo.googleMapLink || '',
                    distance: subJob.distance || jobInfo.distance || null
                }
            }
        })

        const newOrder = {
            id: orderId,
            date: jobInfo.orderDate,
            customer: finalCustomer, // Object with ID and Name
            customerDetails: finalCustomer,
            items: itemsWithJobIds,
            total: total,
            status: 'Pending',
            jobInfo: jobInfo, // jobInfo.description already contains the note
            taxInvoice: taxInvoice,
            taxInvoiceDeliveryAddress: taxInvoiceDeliveryAddress,
            purchaserContact: purchaserContact,
            receiverContact: receiverContact,
            discount: discount,
            shippingFee: shippingFee,
            note: jobInfo.description, // Save description as note for backward compatibility
            paymentSchedule: paymentSchedule || [], // Ensure it exists
            // Map Installation Location as Delivery Address
            deliveryAddress: {
                id: jobInfo.installLocationId,
                address: jobInfo.installAddress,
                googleMapLink: jobInfo.googleMapLink,
                distance: jobInfo.distance
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
                                <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
                                    {router.query.id ? `แก้ไขออเดอร์ ${router.query.id}` : 'สร้างออเดอร์ใหม่'}
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
                                data={jobInfo}
                                onChange={setJobInfo}
                                customer={customer}
                                availableTeams={availableTeams}
                                note={jobInfo.description}
                                onNoteChange={(value) => setJobInfo(prev => ({ ...prev, description: value }))}
                                onAddNewAddress={handleAddNewInstallAddress}
                                onAddNewInspector={handleAddNewInspector}
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
                                                                    inv.companyName.toLowerCase().includes(taxInvoiceSearchTerm.toLowerCase()) ||
                                                                    inv.taxId.includes(taxInvoiceSearchTerm)
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
                                                    {(() => {
                                                        const addr = taxInvoice.address;
                                                        // Fallback logic for address display
                                                        if (typeof addr === 'string' && addr) return addr;
                                                        if (addr && typeof addr === 'object') {
                                                            const p = [];
                                                            if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`);
                                                            if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`);
                                                            if (addr.addrVillage) p.push(addr.addrVillage);
                                                            if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`);
                                                            if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`);
                                                            if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`);
                                                            if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`);
                                                            const prov = addr.province || addr.addrProvince || taxInvoice.province || taxInvoice.addrProvince;
                                                            if (prov) p.push(`จังหวัด ${prov}`);
                                                            const zip = addr.zipcode || addr.addrZipcode || taxInvoice.zipcode || taxInvoice.addrZipcode;
                                                            if (zip) p.push(zip);
                                                            const result = p.join(' ');
                                                            if (result) return result;
                                                        }
                                                        // Fallback: read from taxInvoice root level
                                                        const p = [];
                                                        if (taxInvoice.addrNumber) p.push(`เลขที่ ${taxInvoice.addrNumber}`);
                                                        if (taxInvoice.addrMoo) p.push(`หมู่ ${taxInvoice.addrMoo}`);
                                                        if (taxInvoice.addrVillage) p.push(taxInvoice.addrVillage);
                                                        if (taxInvoice.addrSoi) p.push(`ซอย ${taxInvoice.addrSoi}`);
                                                        if (taxInvoice.addrRoad) p.push(`ถนน ${taxInvoice.addrRoad}`);
                                                        if (taxInvoice.addrTambon) p.push(`ตำบล ${taxInvoice.addrTambon}`);
                                                        if (taxInvoice.addrAmphoe) p.push(`อำเภอ ${taxInvoice.addrAmphoe}`);

                                                        const prov = taxInvoice.province || taxInvoice.addrProvince;
                                                        if (prov) p.push(`จังหวัด ${prov}`);

                                                        const zip = taxInvoice.zipcode || taxInvoice.addrZipcode;
                                                        if (zip) p.push(zip);

                                                        return p.join(' ') || '-';
                                                    })()}
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
                                                ...(jobInfo.installAddress ? [{
                                                    label: 'ใช้ที่อยู่เดียวกับสถานที่ติดตั้ง/ขนส่ง',
                                                    address: jobInfo.installAddress,
                                                    googleMapLink: jobInfo.googleMapLink || '',
                                                    distance: jobInfo.distance || '',
                                                    isSpecial: true, // Marker for badging logic if we want to handle inside? Or just rely on label?
                                                    // Actually AddressSelector displays label/address.
                                                    // Value handling needs care.
                                                }] : []),
                                                ...(customer.addresses || [])
                                            ]}
                                            value={(() => {
                                                const isSame = taxInvoiceDeliveryAddress.type === 'same' || (jobInfo.installAddress && taxInvoiceDeliveryAddress.address === jobInfo.installAddress);
                                                return {
                                                    label: isSame ? (jobInfo.installLocationName || 'สถานที่ติดตั้ง/ขนส่ง') : taxInvoiceDeliveryAddress.label,
                                                    address: isSame ? (jobInfo.installAddress || '') : taxInvoiceDeliveryAddress.address,
                                                    googleMapLink: isSame ? (jobInfo.googleMapLink || '') : taxInvoiceDeliveryAddress.googleMapLink,
                                                    distance: isSame ? (jobInfo.distance || '') : taxInvoiceDeliveryAddress.distance,
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
                                                    // Or just infer "same" type if address matches jobInfo?
                                                    // Simplest: Check if address === jobInfo.installAddress?

                                                    const isSame = jobInfo.installAddress && newValue.address === jobInfo.installAddress;

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
                                                            if (obj.width || obj.length || obj.height) {
                                                                return { w: obj.width, l: obj.length, h: obj.height }
                                                            }
                                                            if (obj.dimensions) {
                                                                return { w: obj.dimensions.width, l: obj.dimensions.length, h: obj.dimensions.height }
                                                            }
                                                            return null
                                                        }

                                                        // Priority: Item -> Selected Variant -> Product -> First Variant
                                                        const dims = getDims(item) ||
                                                            getDims(item.selectedVariant) ||
                                                            getDims(item.product) ||
                                                            (item.product?.variants?.[0] ? getDims(item.product.variants[0]) : null)

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
                                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-600">
                                                {/* LEFT: Job Info: Inspector, Location */}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    {/* Inspector (Swapped from Row 4) */}
                                                    <div className="flex items-center gap-1">
                                                        <UserCheck size={12} />
                                                        <span>
                                                            {(item.subJob?.inspector1?.name || jobInfo.inspector1?.name) || '-'}
                                                            {(item.subJob?.inspector1?.phone || jobInfo.inspector1?.phone) && ` (${item.subJob?.inspector1?.phone || jobInfo.inspector1?.phone})`}
                                                        </span>
                                                    </div>

                                                    {((item.subJob?.distance || jobInfo.distance) || (item.subJob?.installLocationName || jobInfo.installLocationName)) && (
                                                        <div className="flex items-center gap-1 text-secondary-500">
                                                            {(item.subJob?.distance || jobInfo.distance) && <span>{item.subJob?.distance || jobInfo.distance} Km</span>}
                                                            {(item.subJob?.installLocationName || jobInfo.installLocationName) && <span>{item.subJob?.installLocationName || jobInfo.installLocationName}</span>}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={12} className="flex-shrink-0" />
                                                        <span>
                                                            {item.subJob?.installAddress || jobInfo.installAddress || item.subJob?.installLocationName || jobInfo.installLocationName || '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* RIGHT: Dates - Moved to Row 4 */}
                                            </div>

                                            {/* Row 4: Job Type, Team, Details & Dates */}
                                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-500">
                                                {/* LEFT Group: Job Type, Team, Details */}
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {/* Job Type */}
                                                    <div
                                                        className="flex items-center gap-1 cursor-pointer hover:text-primary-600 hover:bg-primary-50 p-1 -ml-1 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setCurrentSubJobItemIndex(idx)
                                                            setShowSubJobModal(true)
                                                        }}
                                                        title="แก้ไขข้อมูลงานย่อย"
                                                    >
                                                        {(item.subJob?.jobType || jobInfo.jobType) === 'delivery' ? <Truck size={14} /> : <Wrench size={14} />}
                                                    </div>

                                                    {/* Dates - Moved to 2nd position */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            <span>
                                                                {(item.subJob?.appointmentDate || jobInfo.appointmentDate)
                                                                    ? new Date(item.subJob?.appointmentDate || jobInfo.appointmentDate).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-green-700">
                                                            <CheckCircle size={12} />
                                                            <span>
                                                                {(item.subJob?.completionDate || jobInfo.completionDate)
                                                                    ? new Date(item.subJob?.completionDate || jobInfo.completionDate).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Team */}
                                                    <div className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        <span>{item.subJob?.team || jobInfo.team || '-'}</span>
                                                    </div>

                                                    {/* Details/Note */}
                                                    <div className="flex items-center gap-1 text-secondary-400">
                                                        <FileText size={12} />
                                                        <span className="truncate max-w-[300px]">
                                                            {item.subJob?.description || jobInfo.description || '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* RIGHT: Dates (Moved from Row 3) */}

                                            </div>

                                            {/* Row 5: SNs */}
                                            <div className="flex items-start gap-2 pt-1">
                                                <QrCode size={16} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex flex-wrap gap-2">
                                                    {['SN000000000001', 'SN000000000002', 'SN000000000003', 'SN000000000004'].map((sn, i) => (
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
                                onOpenSubJob={() => {
                                    if (editingItemIndex !== null) {
                                        setShowOrderItemModal(false)
                                        setCurrentSubJobItemIndex(editingItemIndex)
                                        setShowSubJobModal(true)
                                    } else {
                                        alert('กรุณาบันทึกรายการก่อนกำหนดข้อมูลงาน')
                                    }
                                }}
                                onAddNewProduct={() => setShowProductModal(true)}
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
                                                            {jobInfo.distance && (
                                                                <div className="flex justify-between pt-2 border-t border-secondary-200">
                                                                    <span className="font-medium">ระยะทางจากร้าน:</span>
                                                                    <span className="font-semibold text-success-600">📍 {jobInfo.distance}</span>
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
                    />

                    {/* Customer Add Modal */}
                    <CustomerModal
                        isOpen={showAddCustomerModal}
                        onClose={() => setShowAddCustomerModal(false)}
                        customer={null}
                        onSave={handleAddNewCustomer}
                    />

                    {/* Sub Job Modal */}
                    {showSubJobModal && (
                        <SubJobModal
                            isOpen={true}
                            onClose={() => setShowSubJobModal(false)}
                            item={items[currentSubJobItemIndex]}
                            onSave={handleSaveSubJob}
                            customer={customer}
                            availableTeams={availableTeams}
                            // Logic: Read-only if Installation or Delivery (Inherited)
                            readOnly={jobInfo.jobType === 'installation' || jobInfo.jobType === 'delivery'}
                        />
                    )}

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
