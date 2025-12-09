import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CustomerModal from './CustomerModal'
import {
    Save, Plus, Trash2, Calendar, MapPin, FileText, User, Search,
    ChevronDown, ChevronUp, X, Check, Truck, Wrench, Edit2, UserPlus,
    CreditCard, DollarSign, Percent, AlertCircle, Home, ArrowLeft, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, FileEdit, Camera, HelpCircle, Map, Globe, Users, Box, Palette, Package, UserCheck, Menu
} from 'lucide-react'
import AppLayout from './AppLayout'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'
import ProductModal from './ProductModal'
import SubJobModal from './SubJobModal'
import AddressCard from './AddressCard'
import ContactSelector from './ContactSelector'
import JobInfoCard from './JobInfoCard'
import PaymentEntryModal from './PaymentEntryModal'
import Card from './Card'
import { currency, calculateDistance, deg2rad, extractCoordinates } from '../lib/utils'
import OrderItemModal from './OrderItemModal'




function convertToEmbedUrl(url) {
    if (!url) return null

    // Extract coordinates from the URL
    const coords = extractCoordinates(url)
    if (coords) {
        // Create Google Maps embed URL with coordinates
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coords.lat},${coords.lon}&zoom=15`
    }

    // If no coordinates found, try to use the URL directly (might not work)
    return url
}

export default function OrderForm() {
    const router = useRouter()

    // --- Data Loading States ---
    const [customersData, setCustomersData] = useState([])
    const [productsData, setProductsData] = useState([])
    const [availableTeams, setAvailableTeams] = useState([])

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

    const [selectedContact, setSelectedContact] = useState(null)
    const [activeCustomerContact, setActiveCustomerContact] = useState(null)

    const [showTaxInvoiceDropdown, setShowTaxInvoiceDropdown] = useState(false)
    const [taxInvoiceSearchTerm, setTaxInvoiceSearchTerm] = useState('')
    const [showTaxAddressDropdown, setShowTaxAddressDropdown] = useState(false)
    const [taxAddressSearchTerm, setTaxAddressSearchTerm] = useState('')




    const [jobInfo, setJobInfo] = useState({
        jobType: 'installation',
        orderDate: new Date().toISOString().split('T')[0],
        appointmentDate: '',
        completionDate: '',
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        team: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' },
        distance: ''
    })

    const [items, setItems] = useState([])

    const [discount, setDiscount] = useState({ mode: 'percent', value: 0 })
    const [vatRate, setVatRate] = useState(0.07)
    const [deposit, setDeposit] = useState({ mode: 'percent', value: 50 })
    const [shippingFee, setShippingFee] = useState(0)
    const [note, setNote] = useState('')
    const [paymentSchedule, setPaymentSchedule] = useState([])

    // --- UI States ---
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const [activeSearchIndex, setActiveSearchIndex] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [showMapPopup, setShowMapPopup] = useState(false)
    const [selectedMapLink, setSelectedMapLink] = useState('')
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)
    const [showOrderItemModal, setShowOrderItemModal] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState(null)

    // --- Effects ---
    useEffect(() => {
        // Load Customers
        const savedCustomers = localStorage.getItem('customers_data')
        setCustomersData(savedCustomers ? JSON.parse(savedCustomers) : [])

        // Load Products
        const savedProducts = localStorage.getItem('products_data_v3') || localStorage.getItem('products_data')
        setProductsData(savedProducts ? JSON.parse(savedProducts) : [])

        // Load Teams
        const savedTeams = localStorage.getItem('team_data')
        if (savedTeams) {
            const members = JSON.parse(savedTeams)
            const teams = [...new Set(members.filter(m => m.teamType === 'QC' || m.teamType === 'ช่าง').map(m => m.team))]
            setAvailableTeams(teams)
        }
    }, [])




    // Sync Sub Jobs with Main Job Info
    useEffect(() => {
        if (jobInfo.jobType !== 'separate') {
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
                    inspector2: jobInfo.inspector2,
                    team: jobInfo.team,
                    description: jobInfo.note || item.subJob?.description // Sync note if available, else keep existing or empty
                }
            })))
        }
    }, [jobInfo])

    // Load Existing Order
    useEffect(() => {
        const generateOrderId = () => {
            const savedOrders = localStorage.getItem('orders_data')
            let newId = 'OD0000001' // Default starting ID

            if (savedOrders) {
                const orders = JSON.parse(savedOrders)
                if (orders.length > 0) {
                    // Extract numbers from existing IDs to find the max
                    const maxId = orders.reduce((max, order) => {
                        // Handle both old format (ORD-XXX) and new format (ODXXXXXXX)
                        const numStr = order.id.replace(/\D/g, '')
                        const num = parseInt(numStr, 10)
                        return num > max ? num : max
                    }, 0)

                    // Generate new ID with OD prefix and 7-digit padding
                    newId = `OD${(maxId + 1).toString().padStart(7, '0')}`
                }
            }
            return newId
        }
        if (router.query.id) {
            const savedOrders = localStorage.getItem('orders_data')
            if (savedOrders) {
                const order = JSON.parse(savedOrders).find(o => o.id === router.query.id)
                if (order) {
                    if (order.customerDetails) setCustomer(order.customerDetails)
                    if (order.taxInvoice) setTaxInvoice(order.taxInvoice)
                    if (order.jobInfo) setJobInfo(order.jobInfo)
                    if (order.items) setItems(order.items)
                    if (order.discount) setDiscount(order.discount)
                    if (order.deposit) setDeposit(order.deposit)
                    if (order.shippingFee) setShippingFee(order.shippingFee)
                    if (order.note) setNote(order.note)
                    if (order.activeCustomerContact) setActiveCustomerContact(order.activeCustomerContact)
                    if (order.selectedContact) setSelectedContact(order.selectedContact)
                    if (order.taxInvoiceDeliveryAddress) setTaxInvoiceDeliveryAddress(order.taxInvoiceDeliveryAddress)
                }
            }
        }
    }, [router.query.id])

    // Distance Calculation
    useEffect(() => {
        const coords = extractCoordinates(jobInfo.googleMapLink)
        if (coords) {
            const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
            setJobInfo(prev => ({ ...prev, distance: dist }))
        }
    }, [jobInfo.googleMapLink])

    // --- Handlers ---
    const handleSelectCustomer = (c) => {
        setCustomer({
            ...customer,
            ...c,
            contact1: c.contact1 ? {
                name: String(c.contact1.name || ''),
                phone: String(c.contact1.phone || ''),
                address: typeof c.contact1.address === 'string' ? c.contact1.address : (c.contact1.address ? JSON.stringify(c.contact1.address) : '')
            } : { name: '', phone: '', address: '' },
            contact2: c.contact2 ? {
                name: String(c.contact2.name || ''),
                phone: String(c.contact2.phone || ''),
                address: typeof c.contact2.address === 'string' ? c.contact2.address : (c.contact2.address ? JSON.stringify(c.contact2.address) : '')
            } : { name: '', phone: '', address: '' }
        })
        setShowCustomerDropdown(false)

        // Auto-fill address if available
        if (c.savedAddresses && c.savedAddresses.length > 0) {
            const addr = c.savedAddresses[0]
            setJobInfo(prev => ({
                ...prev,
                installLocationName: addr.name || '',
                installAddress: addr.address || '',
                googleMapLink: addr.mapLink || '',
                inspector1: addr.inspector1 || { name: '', phone: '' },
                inspector2: addr.inspector2 || { name: '', phone: '' }
            }))
        } else {
            // Reset job info if no address
            setJobInfo(prev => ({
                ...prev,
                installLocationName: '',
                installAddress: '',
                googleMapLink: '',
                inspector1: { name: '', phone: '' },
                inspector2: { name: '', phone: '' }
            }))
        }

        // Reset contacts
        setSelectedContact(null)
        setActiveCustomerContact(null)
    }

    const handleUpdateCustomer = (updatedCustomer) => {
        // Update local state
        setCustomer(prev => ({ ...prev, ...updatedCustomer }))

        // Update customers list in localStorage
        const updatedCustomersList = customersData.map(c =>
            c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
        )
        setCustomersData(updatedCustomersList)
        localStorage.setItem('customers_data', JSON.stringify(updatedCustomersList))

        setShowEditCustomerModal(false)
    }

    const handleAddNewCustomer = (newCustomerData) => {
        // Generate new customer ID
        const newId = 'CUST' + Date.now()
        const newCustomer = {
            ...newCustomerData,
            id: newId
        }

        // Add to customers list
        const updatedCustomersList = [...customersData, newCustomer]
        setCustomersData(updatedCustomersList)
        localStorage.setItem('customers_data', JSON.stringify(updatedCustomersList))

        // Auto-select the new customer
        setCustomer({
            ...newCustomer,
            contact1: newCustomer.contact1 || { name: '', phone: '' },
            contact2: newCustomer.contact2 || { name: '', phone: '' }
        })

        // Reset contacts
        setSelectedContact(null)
        setActiveCustomerContact(null)

        setShowAddCustomerModal(false)
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
        length: '', width: '', height: '', material: '', color: '', crystalColor: '',
        bulbType: '', light: '', remote: '', images: []
    })
    const [lastCreatedProduct, setLastCreatedProduct] = useState(null)

    const handleSaveNewProduct = (productData) => {
        if (!productData.id) {
            alert('กรุณากรอกรหัสสินค้า')
            return
        }

        // Save to localStorage
        const savedProducts = localStorage.getItem('products_data_v3')
        let products = savedProducts ? JSON.parse(savedProducts) : []

        // Check duplicate
        if (products.some(p => p.id === productData.id)) {
            alert('รหัสสินค้านี้มีอยู่แล้ว')
            return
        }

        const updatedProducts = [...products, productData]
        localStorage.setItem('products_data_v3', JSON.stringify(updatedProducts))

        // Update local state
        setProductsData(updatedProducts)

        // Close modal and reset
        setShowProductModal(false)
        setNewProduct({
            id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
            length: '', width: '', height: '', material: '', color: '', crystalColor: '',
            bulbType: '', light: '', remote: '', images: []
        })

        // Trigger auto-select in OrderItemModal
        setLastCreatedProduct(productData)
        if (editingItemIndex === null) {
            // If we were adding a new item, ensure the modal is open
            setShowOrderItemModal(true)
        }
    }

    const selectProduct = (index, product) => {
        const newItems = [...items]
        newItems[index] = {
            ...newItems[index],
            code: product.id,
            name: product.name,
            description: product.description || product.name,
            unitPrice: product.price || 0,
            image: product.images?.[0] || null,
            category: product.category,
            subcategory: product.subcategory,
            length: product.length, width: product.width, height: product.height,
            material: product.material, color: product.color,
            crystalColor: product.crystalColor,
            bulbType: product.bulbType, light: product.light,
            stock: product.stock,
            _searchTerm: undefined,
            showPopup: false
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

    const handleSaveOrder = () => {
        if (!customer.name) return alert('กรุณากรอกชื่อลูกค้า')
        if (items.length === 0 || !items[0].code) return alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

        // Determine customer ID (create new if needed)
        let actualCustomerId = customer.id

        if (!actualCustomerId) {
            const savedCustomers = localStorage.getItem('customers_data')
            const customers = savedCustomers ? JSON.parse(savedCustomers) : []

            // Generate new customer ID
            const newCustomerId = `CUST${Date.now()}`
            const newCustomer = {
                id: newCustomerId,
                name: customer.name,
                phone: customer.phone || '',
                email: customer.email || '',
                line: customer.line || '',
                facebook: customer.facebook || '',
                instagram: customer.instagram || '',
                address: customer.address || '',
                contact1: { name: '', phone: '' },
                contact2: { name: '', phone: '' },
                mediaSource: '',
                mediaSourceOther: '',
                taxInvoices: [],
                addresses: [],
                createdAt: new Date().toISOString()
            }

            customers.push(newCustomer)
            localStorage.setItem('customers_data', JSON.stringify(customers))

            // Update customer state with new ID
            setCustomer({ ...customer, id: newCustomerId })

            // Use the new ID for this save operation
            actualCustomerId = newCustomerId
        }

        const savedOrders = localStorage.getItem('orders_data')
        const orders = savedOrders ? JSON.parse(savedOrders) : []

        // Generate Order ID using the new format (OD0000001)
        const generateOrderId = () => {
            let newId = 'OD0000001' // Default starting ID

            if (savedOrders) {
                const existingOrders = JSON.parse(savedOrders)
                if (existingOrders.length > 0) {
                    // Extract numbers from existing IDs to find the max
                    const maxId = existingOrders.reduce((max, order) => {
                        // Handle both old format (ORD-XXX) and new format (ODXXXXXXX)
                        const numStr = order.id.replace(/\D/g, '')
                        const num = parseInt(numStr, 10)
                        return num > max ? num : max
                    }, 0)

                    // Generate new ID with OD prefix and 7-digit padding
                    newId = `OD${(maxId + 1).toString().padStart(7, '0')}`
                }
            }
            return newId
        }

        const orderId = router.query.id || generateOrderId()

        // Generate Job IDs for each item
        let lastJobNum = 0

        if (savedOrders) {
            const existingOrders = JSON.parse(savedOrders)
            existingOrders.forEach(o => {
                if (o.items) {
                    o.items.forEach(i => {
                        // Check subJob.jobId
                        if (i.subJob && i.subJob.jobId) {
                            const num = parseInt(i.subJob.jobId.replace(/\D/g, '') || '0', 10)
                            if (num > lastJobNum) lastJobNum = num
                        }
                    })
                }
            })
        }

        const itemsWithJobIds = items.map((item, index) => {
            // If item already has a jobId (e.g., when editing an existing order), keep it.
            // Otherwise, generate a new one.
            if (item.subJob && item.subJob.jobId) {
                return item;
            }

            lastJobNum++
            const newJobId = `JB${lastJobNum.toString().padStart(7, '0')}`

            // Ensure subJob object exists
            const subJob = item.subJob || {}

            return {
                ...item,
                subJob: {
                    ...subJob,
                    jobId: newJobId, // Assign permanent Job ID
                    // Inherit other props or set defaults if missing
                    jobType: subJob.jobType || 'installation',
                    appointmentDate: subJob.appointmentDate || '',
                    team: subJob.team || '',
                    description: subJob.description || '',
                    inspector1: subJob.inspector1 || null,
                    installAddress: subJob.installAddress || ''
                }
            }
        })

        const newOrder = {
            id: orderId,
            date: jobInfo.orderDate,
            customer: customer.name,
            customerDetails: customer,
            items: itemsWithJobIds, // Use items with Job IDs
            total: total,
            deposit: depositAmount,
            status: 'Pending',
            jobInfo: jobInfo,
            taxInvoice: taxInvoice,
            taxInvoiceDeliveryAddress: taxInvoiceDeliveryAddress,
            activeCustomerContact: activeCustomerContact ? {
                id: activeCustomerContact.id,
                name: activeCustomerContact.name,
                position: activeCustomerContact.position || '',
                phone: activeCustomerContact.phone || '',
                note: activeCustomerContact.note || ''
            } : null,
            selectedContact: selectedContact ? {
                id: selectedContact.id,
                name: selectedContact.name,
                position: selectedContact.position || '',
                phone: selectedContact.phone || '',
                note: selectedContact.note || ''
            } : null,
            discount: discount,
            shippingFee: shippingFee,
            note: note,
            createdAt: new Date().toISOString()
        }

        if (router.query.id) {
            const index = orders.findIndex(o => o.id === orderId)
            if (index !== -1) orders[index] = newOrder
            else orders.push(newOrder)
        } else {
            orders.push(newOrder)
        }

        localStorage.setItem('orders_data', JSON.stringify(orders))

        // Create Jobs in jobs_data
        const savedJobs = localStorage.getItem('jobs_data')
        const jobs = savedJobs ? JSON.parse(savedJobs) : []

        // Create a job for each item in the order
        itemsWithJobIds.forEach((item, index) => {
            if (!item.subJob || !item.subJob.jobId) return

            // Check if job already exists (for edit mode)
            const existingJobIndex = jobs.findIndex(j => j.id === item.subJob.jobId)

            const newJob = {
                id: item.subJob.jobId,
                orderId: orderId,
                customerId: actualCustomerId || null,
                customerName: customer.name,
                productId: item.code,
                productName: item.name,
                productImage: item.image || null,
                product: {
                    code: item.code,
                    name: item.name,
                    description: `${item.name} - จำนวน ${item.qty} ${item.unit || 'ชิ้น'}`,
                    image: item.image
                },
                jobType: item.subJob.jobType || 'ติดตั้ง',
                rawJobType: item.subJob.jobType || 'installation',
                jobDate: item.subJob.appointmentDate || jobInfo.orderDate,
                jobTime: '09:00', // Default time
                address: item.subJob.installAddress || customer.address || '',
                assignedTeam: item.subJob.team || '-',
                status: 'รอดำเนินการ',
                completionDate: null,
                signatureImage: null,
                installationPhotos: [],
                paymentSlipPhoto: null,
                notes: item.subJob.description || '',
                createdAt: new Date().toISOString()
            }

            if (existingJobIndex !== -1) {
                // Update existing job
                jobs[existingJobIndex] = newJob
            } else {
                // Add new job
                jobs.push(newJob)
            }
        })

        try {
            localStorage.setItem('jobs_data', JSON.stringify(jobs))
        } catch (error) {
            console.error('LocalStorage quota exceeded:', error)
            alert('พื้นที่จัดเก็บข้อมูลเต็ม ระบบจะทำการล้างข้อมูลเก่าบางส่วนและบันทึกใหม่')
            // Fallback: Clear old jobs if quota exceeded (Keep last 50)
            const recentJobs = jobs.slice(-50)
            try {
                localStorage.setItem('jobs_data', JSON.stringify(recentJobs))
            } catch (retryError) {
                alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาล้าง Cache หรือติดต่อผู้ดูแลระบบ')
                return
            }
        }

        // Use window.location.href for reliable navigation in static export mode
        window.location.href = '/orders'
    }

    // --- Calculations ---
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)
    const discountAmt = discount.mode === 'percent'
        ? (subtotal + Number(shippingFee)) * (Number(discount.value) / 100)
        : Number(discount.value)
    const afterDiscount = Math.max(0, subtotal + Number(shippingFee) - discountAmt)
    const vatAmt = afterDiscount * vatRate
    const total = afterDiscount + vatAmt
    const depositAmount = deposit.mode === 'percent'
        ? total * (Number(deposit.value) / 100)
        : Number(deposit.value)
    // Calculate total paid from payment schedule
    const totalPaid = paymentSchedule.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const outstanding = Math.max(0, total - totalPaid)

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
                                <div className="flex-1 space-y-6">
                                    {!customer.id ? (
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">ค้นหาลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3.5 text-secondary-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={customer.name || ''}
                                                    onChange={e => {
                                                        setCustomer({ ...customer, name: e.target.value })
                                                        setShowCustomerDropdown(true)
                                                    }}
                                                    onFocus={() => setShowCustomerDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-secondary-50"
                                                    placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                                />
                                                {showCustomerDropdown && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {customersData
                                                            .filter(c => !customer.name || c.name.toLowerCase().includes(customer.name.toLowerCase()) || (c.phone && c.phone.includes(customer.name)))
                                                            .map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        handleSelectCustomer(c)
                                                                        setShowCustomerDropdown(false)
                                                                    }}
                                                                    className="p-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                >
                                                                    <div className="font-bold text-secondary-900">{c.name}</div>
                                                                    <div className="text-xs text-secondary-500">{c.phone} {c.email ? `| ${c.email}` : ''}</div>
                                                                </div>
                                                            ))}
                                                        <div
                                                            onClick={() => {
                                                                setShowAddCustomerModal(true)
                                                                setShowCustomerDropdown(false)
                                                            }}
                                                            className="p-3 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 sticky bottom-0 border-t border-primary-100"
                                                        >
                                                            <UserPlus size={16} /> เพิ่มลูกค้าใหม่
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-secondary-400 mt-2 text-center">* คลิกที่ช่องค้นหาเพื่อเลือกข้อมูลหรือพิมพ์เพื่อค้นหา</p>
                                        </div>
                                    ) : null}


                                    {/* Customer Details Card */}
                                    {customer.id && (
                                        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-xl p-5 space-y-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                                            {/* Header with Name */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {String(customer.name).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-secondary-900 text-xl leading-tight">{String(customer.name)}</h3>
                                                        <p className="text-xs text-secondary-500 mt-0.5">รหัสลูกค้า: {customer.id || '-'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setCustomer({})}
                                                    className="text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Contact Information */}

                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                                    <div className="flex items-center gap-2 text-secondary-600">
                                                        <div className="w-6 h-6 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                                                            <Phone size={14} className="text-primary-600" />
                                                        </div>
                                                        <span className="font-medium text-secondary-900">{customer.phone || '-'}</span>
                                                    </div>

                                                    {customer.email && (
                                                        <div className="flex items-center gap-2 text-secondary-600">
                                                            <div className="w-6 h-6 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                                                                <Mail size={14} className="text-primary-600" />
                                                            </div>
                                                            <span className="font-medium text-secondary-900 truncate max-w-[200px]">{String(customer.email)}</span>
                                                        </div>
                                                    )}

                                                    {customer.line && (
                                                        <div className="flex items-center gap-2 text-secondary-600">
                                                            <div className="w-6 h-6 bg-[#06c755]/10 rounded flex items-center justify-center flex-shrink-0">
                                                                <MessageCircle size={14} className="text-[#06c755]" />
                                                            </div>
                                                            <span className="font-medium text-secondary-900 truncate max-w-[200px]">{customer.line}</span>
                                                        </div>
                                                    )}

                                                    {customer.facebook && (
                                                        <div className="flex items-center gap-2 text-secondary-600">
                                                            <div className="w-6 h-6 bg-[#1877F2]/10 rounded flex items-center justify-center flex-shrink-0">
                                                                <Facebook size={14} className="text-[#1877F2]" />
                                                            </div>
                                                            <span className="font-medium text-secondary-900 truncate max-w-[200px]">{customer.facebook}</span>
                                                        </div>
                                                    )}

                                                    {customer.instagram && (
                                                        <div className="flex items-center gap-2 text-secondary-600">
                                                            <div className="w-6 h-6 bg-[#E1306C]/10 rounded flex items-center justify-center flex-shrink-0">
                                                                <Instagram size={14} className="text-[#E1306C]" />
                                                            </div>
                                                            <span className="font-medium text-secondary-900 truncate max-w-[200px]">{customer.instagram}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {customer.address && (
                                                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mt-4">
                                                    <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">ที่อยู่</h4>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <MapPin size={16} className="text-primary-600" />
                                                        </div>
                                                        <p className="text-sm text-secondary-700 leading-relaxed">{customer.address}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer: Media Source */}
                                            {customer.mediaSource && (
                                                <div className="bg-primary-50/50 border-t border-primary-100 -mx-5 -mb-5 px-5 py-3 mt-5 rounded-b-xl flex items-center gap-3">
                                                    <span className="text-xs text-secondary-500 font-medium">รู้จักเราผ่าน:</span>
                                                    {(() => {
                                                        const options = [
                                                            { id: 'FB', label: 'Facebook', icon: Facebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/20' },
                                                            { id: 'LINE@', label: 'LINE@', icon: MessageCircle, color: 'text-[#06c755]', bg: 'bg-[#06c755]/10', border: 'border-[#06c755]/20' },
                                                            { id: 'GOOGLE', label: 'Google', icon: Globe, color: 'text-[#DB4437]', bg: 'bg-[#DB4437]/10', border: 'border-[#DB4437]/20' },
                                                            { id: 'OFFLINE', label: 'หน้าร้าน', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                                                            { id: 'FREND', label: 'เพื่อนแนะนำ', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                                                            { id: 'OTHER', label: 'อื่นๆ', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
                                                        ]
                                                        const option = options.find(o => o.id === customer.mediaSource)
                                                        if (!option) return null

                                                        const Icon = option.icon
                                                        const label = customer.mediaSource === 'OTHER' && customer.mediaSourceOther ? customer.mediaSourceOther : option.label

                                                        return (
                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${option.bg} ${option.border} ${option.color}`}>
                                                                <Icon size={12} />
                                                                <span>{label}</span>
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Contact Person Selection - Always Visible */}
                                    <div className="pt-2">
                                        <ContactSelector
                                            label="ผู้ติดต่อจัดซื้อ"
                                            contacts={customer.contacts || []}
                                            value={activeCustomerContact}
                                            onChange={setActiveCustomerContact}
                                            variant="blue"
                                            placeholder="ค้นหาผู้ติดต่อ..."
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Master Job Info - Mobile: 2, Desktop: 3 */}
                        <div className="order-2 md:order-3 flex flex-col h-full">
                            <JobInfoCard
                                className="h-full"
                                data={jobInfo}
                                onChange={setJobInfo}
                                customer={customer}
                                availableTeams={availableTeams}
                                note={note}
                                onNoteChange={setNote}
                            />
                        </div>

                        {/* Tax Invoice - Mobile: 3, Desktop: 2 */}
                        <div className="order-3 md:order-2 flex flex-col h-full">


                            {/* Tax Invoice */}
                            {/* Tax Invoice & Delivery Contact Card */}
                            <Card className="p-6 flex flex-col h-full">
                                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-primary-600" />
                                    ข้อมูลใบกำกับภาษี
                                </h2>

                                <div className="flex-1 space-y-6">
                                    {/* Tax Invoice Section - Always Visible Search if not selected */}
                                    {!taxInvoice.companyName ? (
                                        <div className="relative">
                                            <div className="mb-2">
                                                <label className="block text-sm font-medium text-secondary-700">ค้นหาใบกำกับภาษี</label>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 text-secondary-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={taxInvoiceSearchTerm}
                                                    onChange={(e) => {
                                                        setTaxInvoiceSearchTerm(e.target.value)
                                                        setShowTaxInvoiceDropdown(true)
                                                    }}
                                                    onFocus={() => setShowTaxInvoiceDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowTaxInvoiceDropdown(false), 200)}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
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
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    {/* Selected Details Card */}
                                    {taxInvoice.companyName && (
                                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-primary-100 mt-1">
                                                    <FileText size={24} className="text-primary-600" />
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    {/* Header: Company Name & Branch */}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="font-bold text-secondary-900 text-lg leading-tight">
                                                                    {taxInvoice.companyName}
                                                                </h3>
                                                                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                                                                    {taxInvoice.branch || 'สำนักงานใหญ่'}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-secondary-600 mt-1 flex items-center gap-2">
                                                                <span className="font-medium text-secondary-700">เลขผู้เสียภาษี:</span>
                                                                <span className="font-mono bg-white px-1.5 rounded border border-secondary-200">{taxInvoice.taxId}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setTaxInvoice({ companyName: '', branch: '', taxId: '', address: '', phone: '', email: '', deliveryAddress: '' })}
                                                            className="text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Addresses */}
                                                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-primary-200/50">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">ที่อยู่บริษัท</label>
                                                            <div className="text-sm text-secondary-800 leading-relaxed">
                                                                {(() => {
                                                                    const addr = taxInvoice.address;
                                                                    console.log('Tax Invoice Address:', JSON.stringify(addr, null, 2));
                                                                    console.log('Tax Invoice Full:', JSON.stringify(taxInvoice, null, 2));
                                                                    console.log('Address Type:', typeof addr);

                                                                    // Try string address first
                                                                    if (typeof addr === 'string' && addr) {
                                                                        return addr;
                                                                    }
                                                                    // Try address object
                                                                    else if (addr && typeof addr === 'object') {
                                                                        const p = [];
                                                                        if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`);
                                                                        if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`);
                                                                        if (addr.addrVillage) p.push(addr.addrVillage);
                                                                        if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`);
                                                                        if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`);
                                                                        if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`);
                                                                        if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`);
                                                                        if (addr.province) p.push(`จังหวัด ${addr.province}`);
                                                                        if (addr.zipcode) p.push(addr.zipcode);
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
                                                                    if (taxInvoice.province) p.push(`จังหวัด ${taxInvoice.province}`);
                                                                    if (taxInvoice.zipcode) p.push(taxInvoice.zipcode);
                                                                    return p.join(' ') || '-';
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tax Invoice Delivery Address Selection - Always Visible */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-secondary-700">
                                            ที่อยู่จัดส่งใบกำกับภาษี
                                        </label>

                                        {/* Dropdown */}
                                        {!taxInvoiceDeliveryAddress.address ? (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 text-secondary-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={taxAddressSearchTerm}
                                                    onChange={(e) => {
                                                        setTaxAddressSearchTerm(e.target.value)
                                                        setShowTaxAddressDropdown(true)
                                                    }}
                                                    onFocus={() => setShowTaxAddressDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowTaxAddressDropdown(false), 200)}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                                    placeholder="ค้นหาที่อยู่..."
                                                />
                                                {showTaxAddressDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {/* Option: Same as installation address */}
                                                        {jobInfo.installAddress && (
                                                            <div
                                                                onClick={() => {
                                                                    setTaxInvoiceDeliveryAddress({
                                                                        type: 'same',
                                                                        label: jobInfo.installLocationName || 'สถานที่ติดตั้ง/ขนส่ง',
                                                                        address: jobInfo.installAddress || '',
                                                                        googleMapLink: jobInfo.googleMapLink || '',
                                                                        distance: jobInfo.distance || ''
                                                                    });
                                                                    setTaxAddressSearchTerm('');
                                                                    setShowTaxAddressDropdown(false);
                                                                }}
                                                                className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                            >
                                                                <div className="font-medium text-secondary-900 text-sm">ใช้ที่อยู่เดียวกับสถานที่ติดตั้ง/ขนส่ง</div>
                                                                <div className="text-xs text-secondary-500 truncate">{jobInfo.installAddress}</div>
                                                            </div>
                                                        )}

                                                        {/* Options: Customer addresses */}
                                                        {customer.addresses
                                                            ?.filter(addr => {
                                                                const addressText = typeof addr.address === 'string' ? addr.address : '';
                                                                return addr.label.toLowerCase().includes(taxAddressSearchTerm.toLowerCase()) || addressText.includes(taxAddressSearchTerm);
                                                            })
                                                            .map((addr, index) => {
                                                                const addressText = typeof addr.address === 'string'
                                                                    ? addr.address
                                                                    : (addr.address || '');

                                                                // Helper to build address string if object
                                                                let fullAddress = addressText;
                                                                if (!fullAddress && typeof addr === 'object') {
                                                                    const p = [];
                                                                    if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`);
                                                                    if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`);
                                                                    if (addr.addrVillage) p.push(addr.addrVillage);
                                                                    if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`);
                                                                    if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`);
                                                                    if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`);
                                                                    if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`);
                                                                    if (addr.province) p.push(`จังหวัด ${addr.province}`);
                                                                    if (addr.zipcode) p.push(addr.zipcode);
                                                                    fullAddress = p.join(' ');
                                                                }

                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        onClick={() => {
                                                                            setTaxInvoiceDeliveryAddress({
                                                                                type: 'custom',
                                                                                label: addr.label || '',
                                                                                address: fullAddress,
                                                                                googleMapLink: addr.googleMapsLink || '',
                                                                                distance: addr.distance ? `${addr.distance.toFixed(2)} km` : ''
                                                                            });
                                                                            setTaxAddressSearchTerm('');
                                                                            setShowTaxAddressDropdown(false);
                                                                        }}
                                                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                    >
                                                                        <div className="font-medium text-secondary-900 text-sm">{addr.label}</div>
                                                                        <div className="text-xs text-secondary-500 truncate">{fullAddress}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Selected Address Display Card */}
                                        {taxInvoiceDeliveryAddress.address && (
                                            <AddressCard
                                                title={taxInvoiceDeliveryAddress.type === 'same' ? (jobInfo.installLocationName || 'สถานที่ติดตั้ง/ขนส่ง') : taxInvoiceDeliveryAddress.label}
                                                address={taxInvoiceDeliveryAddress.type === 'same' ? jobInfo.installAddress : taxInvoiceDeliveryAddress.address}
                                                mapLink={taxInvoiceDeliveryAddress.type === 'same' ? jobInfo.googleMapLink : taxInvoiceDeliveryAddress.googleMapLink}
                                                distance={taxInvoiceDeliveryAddress.type === 'same' ? jobInfo.distance : taxInvoiceDeliveryAddress.distance}
                                                onClear={() => setTaxInvoiceDeliveryAddress({ type: '', label: '', address: '', googleMapLink: '', distance: '' })}
                                                variant="primary"
                                                badge={taxInvoiceDeliveryAddress.type === 'same' ? (
                                                    <span className="px-2 py-0.5 bg-success-100 text-success-700 text-xs font-medium rounded-full border border-success-200">
                                                        ที่อยู่เดียวกัน
                                                    </span>
                                                ) : null}
                                            />
                                        )}
                                    </div>

                                    {/* Contact Selector - Delivery - Always Visible */}
                                    <div className="pt-2">
                                        <ContactSelector
                                            label="ผู้ติดต่อรับเอกสาร"
                                            contacts={customer.contacts || []}
                                            value={selectedContact}
                                            onChange={setSelectedContact}
                                            variant="blue"
                                            placeholder="ค้นหาผู้ติดต่อ..."
                                        />
                                    </div>

                                </div>

                            </Card>
                        </div>

                        {/* Payment Summary - Mobile: 4, Desktop: 4 */}
                        <div className="order-4 md:order-4 flex flex-col h-full">
                            <Card className="p-6 flex flex-col h-full">
                                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="text-primary-600" />
                                    สรุปยอดชำระ
                                </h2>

                                <div className="flex-1 space-y-5 text-sm">
                                    <div className="flex justify-between text-secondary-600">
                                        <span>รวมเป็นเงิน</span>
                                        <span>{currency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-secondary-600">
                                        <span>ค่าขนส่ง</span>
                                        <input
                                            type="number"
                                            value={shippingFee}
                                            onChange={e => setShippingFee(Number(e.target.value))}
                                            className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-secondary-600">
                                        <span>ส่วนลด</span>
                                        <div className="flex gap-1">
                                            <select
                                                value={discount.mode}
                                                onChange={e => setDiscount({ ...discount, mode: e.target.value })}
                                                className="border border-secondary-300 rounded text-xs px-1"
                                            >
                                                <option value="percent">%</option>
                                                <option value="amount">฿</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={discount.value}
                                                onChange={e => setDiscount({ ...discount, value: Number(e.target.value) })}
                                                className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-secondary-900 font-medium pt-3 border-t border-secondary-100">
                                        <span>หลังหักส่วนลด</span>
                                        <span>{currency(afterDiscount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-secondary-600">
                                        <span className="flex items-center gap-2">
                                            ภาษีมูลค่าเพิ่ม (7%)
                                            <input
                                                type="checkbox"
                                                checked={vatRate > 0}
                                                onChange={e => setVatRate(e.target.checked ? 0.07 : 0)}
                                                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </span>
                                        <span>{currency(vatAmt)}</span>
                                    </div>

                                    <div className="flex justify-between text-xl font-bold text-primary-700 pt-5 border-t border-secondary-200">
                                        <span>ยอดรวมทั้งสิ้น</span>
                                        <span>{currency(total)}</span>
                                    </div>

                                    {/* Payment Schedule List */}
                                    <div className="pt-5 border-t border-secondary-200">
                                        <h3 className="text-sm font-bold text-secondary-900 mb-4">รายการการชำระเงิน</h3>

                                        {/* Payment List */}
                                        {paymentSchedule.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                {paymentSchedule.map((payment, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setEditingPaymentIndex(index)
                                                            setShowPaymentModal(true)
                                                        }}
                                                        className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-200 cursor-pointer hover:bg-secondary-100 transition-colors shadow-sm hover:shadow-md duration-200"
                                                    >
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-medium">{payment.date || '-'}</span>
                                                            <span className="text-secondary-500">•</span>
                                                            <span className="text-secondary-600">{payment.paymentMethod || '-'}</span>
                                                        </div>
                                                        <span className="text-primary-600 font-bold text-sm">{currency(payment.amount || 0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Payment Button */}
                                        {paymentSchedule.length < 5 && (
                                            <button
                                                onClick={() => {
                                                    setEditingPaymentIndex(null)
                                                    setShowPaymentModal(true)
                                                }}
                                                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400"
                                            >
                                                <Plus size={16} />
                                                เพิ่มการชำระ
                                            </button>
                                        )}

                                        {/* Outstanding Balance - Moved below payment schedule */}
                                        <div className="flex justify-between text-secondary-900 font-bold text-sm mt-4 pt-5 border-t border-secondary-200">
                                            <span>รวมยอดค้างชำระ</span>
                                            <span>{currency(outstanding)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>


                    {/* Product List Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow duration-200">
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

                                    {/* RIGHT: Content */}
                                    <div className="flex-1 min-w-0 p-3 space-y-2">
                                        {/* Row 1: Header Info & Price */}
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-secondary-700">
                                                {/* Type/Category */}
                                                <span className="font-semibold text-primary-700 bg-primary-50 px-1.5 rounded">{item.category || '-'}</span>

                                                {/* Code */}
                                                <span className="font-mono text-secondary-500 bg-secondary-100 px-1.5 rounded text-[10px]">{item.code || '-'}</span>

                                                {/* Name */}
                                                <span className="font-bold text-secondary-900">{item.name || 'สินค้าใหม่'}</span>

                                                {/* Dimensions */}
                                                {(item.width || item.length || item.height) && (
                                                    <span className="text-secondary-600 font-medium">
                                                        {item.width ? `W:${item.width} ` : ''}
                                                        {item.length ? `L:${item.length} ` : ''}
                                                        {item.height ? `H:${item.height}` : ''}
                                                    </span>
                                                )}

                                                {/* Stock */}
                                                <span className={`px-1.5 rounded text-[10px] ${Number(item.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    Stock: {item.stock || 0}
                                                </span>
                                            </div>

                                            {/* Price Breakdown */}
                                            <div className="flex items-center gap-3 text-right">
                                                <div className="text-secondary-500 font-medium">
                                                    {currency(item.unitPrice || 0)}
                                                </div>
                                                <div className="text-secondary-400 text-[10px]">
                                                    x {item.qty || 1}
                                                </div>
                                                <div className="font-bold text-primary-700">
                                                    {currency((item.unitPrice || 0) * (item.qty || 0))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Specs */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-secondary-600 pl-6">
                                            {item.material && <span>วัสดุ: {item.material}</span>}
                                            {item.color && <span>สี: {item.color}</span>}
                                            {item.crystalColor && <span>สีคริสตัล: {item.crystalColor}</span>}
                                            {item.description && (
                                                <span className="text-secondary-500 truncate max-w-[300px]" title={item.description}>
                                                    รายละเอียด: {item.description}
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className="group/job -ml-2 pl-2 rounded-lg cursor-pointer hover:bg-secondary-50 transition-colors border border-transparent hover:border-secondary-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCurrentSubJobItemIndex(idx)
                                                setShowSubJobModal(true)
                                            }}
                                        >
                                            {/* Row 3: Job / Transport Info */}
                                            <div className="flex flex-wrap items-center justify-between gap-y-1 pt-2 border-t border-dashed border-secondary-200">
                                                <div className="flex items-center gap-4">
                                                    {/* Job Type */}
                                                    <div className="flex items-center gap-1.5 text-secondary-700 font-medium">
                                                        {item.subJob?.jobType === 'delivery' ? <Truck size={14} /> : <Wrench size={14} />}
                                                        <span>{item.subJob?.jobType === 'delivery' ? 'ประเภทงาน: ขนส่ง' : 'ประเภทงาน: ติดตั้ง'}</span>
                                                    </div>

                                                    {/* Team */}
                                                    <div className="flex items-center gap-1.5 text-secondary-600">
                                                        <Users size={14} />
                                                        <span>ทีม: {item.subJob?.team || '-'}</span>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="flex items-center gap-4 text-secondary-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>วันที่นัดหมาย:</span>
                                                        <span className="font-medium text-secondary-900">
                                                            {item.subJob?.appointmentDate ? new Date(item.subJob.appointmentDate).toLocaleDateString('th-TH') : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span>วันที่สำเร็จ:</span>
                                                        <span className="font-medium text-green-700">
                                                            {item.subJob?.completionDate ? new Date(item.subJob.completionDate).toLocaleDateString('th-TH') : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 4: Location / Inspector / Details */}
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-secondary-600">
                                                {/* Location */}
                                                <div className="flex items-center gap-1.5 max-w-[30%]">
                                                    <MapPin size={14} className="flex-shrink-0" />
                                                    <span className="truncate" title={item.subJob?.installLocationName || item.subJob?.installAddress}>
                                                        สถานที่: {item.subJob?.installLocationName || (item.subJob?.installAddress ? 'ตามที่อยู่' : '-')}
                                                    </span>
                                                </div>

                                                {/* Inspector */}
                                                <div className="flex items-center gap-1.5">
                                                    <UserCheck size={14} className="flex-shrink-0" />
                                                    <span>ผู้ตรวจงาน: {item.subJob?.inspector1?.name || '-'}{item.subJob?.inspector1?.tel ? `, ${item.subJob.inspector1.tel}` : ''}</span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <FileText size={14} className="flex-shrink-0" />
                                                    <span className="truncate" title={item.subJob?.description}>รายละเอียด: {item.subJob?.description || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 5: Mock SNs */}
                                        <div className="flex flex-wrap gap-2 pl-6 pt-1">
                                            {['SN000000000001', 'SN000000000002', 'SN000000000003', 'SN000000000004'].map((sn, i) => (
                                                <span key={i} className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {sn}
                                                </span>
                                            ))}
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
                                className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 rounded-xl hover:bg-primary-50 transition-colors"
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
                        onClose={() => setShowEditCustomerModal(false)}
                        customer={customer}
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
                    <SubJobModal
                        isOpen={showSubJobModal}
                        onClose={() => setShowSubJobModal(false)}
                        item={currentSubJobItemIndex !== null ? items[currentSubJobItemIndex] : null}
                        onSave={handleSaveSubJob}
                        customer={customer}
                        availableTeams={availableTeams}
                        readOnly={jobInfo.jobType !== 'separate'}
                    />

                    {/* Payment Entry Modal */}
                    {/* Payment Entry Modal */}
                    <PaymentEntryModal
                        isOpen={showPaymentModal}
                        onClose={() => {
                            setShowPaymentModal(false)
                            setEditingPaymentIndex(null)
                        }}
                        onSave={(paymentData) => {
                            // Calculate base amount for percentage (total minus other payments, excluding current if editing)
                            const otherPaymentsTotal = paymentSchedule.reduce((sum, p, idx) => {
                                // Exclude the payment being edited
                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) {
                                    return sum
                                }
                                return sum + (parseFloat(p.amount) || 0)
                            }, 0)
                            const baseAmount = total - otherPaymentsTotal

                            const calculatedAmount = paymentData.amountMode === 'percent'
                                ? (baseAmount * (parseFloat(paymentData.percentValue) || 0)) / 100
                                : parseFloat(paymentData.amount) || 0

                            if (editingPaymentIndex !== null) {
                                // Edit existing payment
                                const newSchedule = [...paymentSchedule]
                                newSchedule[editingPaymentIndex] = {
                                    ...paymentData,
                                    amount: calculatedAmount
                                }
                                setPaymentSchedule(newSchedule)
                            } else {
                                // Add new payment
                                setPaymentSchedule([...paymentSchedule, {
                                    ...paymentData,
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
                            return total - otherPaymentsTotal
                        })()}
                        isEditing={editingPaymentIndex !== null}
                    />
                </div >
            </div >
        </AppLayout >
    )
}
