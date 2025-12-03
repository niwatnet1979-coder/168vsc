import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CustomerModal from './CustomerModal'
import {
    Save, Plus, Trash2, Calendar, MapPin, FileText, User, Search,
    ChevronDown, ChevronUp, X, Check, Truck, Wrench, Edit2, UserPlus,
    CreditCard, DollarSign, Percent, AlertCircle, Home, ArrowLeft, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, FileEdit, Camera, HelpCircle
} from 'lucide-react'
import { MOCK_CUSTOMERS_DATA, MOCK_PRODUCTS_DATA, SHOP_LAT, SHOP_LON } from '../lib/mockData'
import ProductModal from './ProductModal'
import SubJobModal from './SubJobModal'

// --- Helper Functions ---
function currency(n) {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function extractCoordinates(url) {
    if (!url) return null
    const match = url.match(/@([-0-9.]+),([-0-9.]+)/)
    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
    const matchQ = url.match(/[?&]q=([-0-9.]+),([-0-9.]+)/)
    if (matchQ) return { lat: parseFloat(matchQ[1]), lon: parseFloat(matchQ[2]) }
    const matchSearch = url.match(/\/search\/([-0-9.]+),([-0-9.]+)/)
    if (matchSearch) return { lat: parseFloat(matchSearch[1]), lon: parseFloat(matchSearch[2]) }
    const matchDir = url.match(/\/dir\/.*\/([-0-9.]+),([-0-9.]+)/)
    if (matchDir) return { lat: parseFloat(matchDir[1]), lon: parseFloat(matchDir[2]) }
    return null
}

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

    const [jobInfo, setJobInfo] = useState({
        jobType: 'installation',
        orderDate: new Date().toISOString().split('T')[0],
        appointmentDate: '',
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        team: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' },
        distance: ''
    })

    const [items, setItems] = useState([{
        code: '', name: '', description: '', qty: 1, unitPrice: 0,
        image: null, category: '', subcategory: '',
        length: '', width: '', height: '', material: '', color: '',
        light: '', bulbType: '', crystalColor: '', remote: '',
        _searchTerm: ''
    }])

    const [discount, setDiscount] = useState({ mode: 'percent', value: 0 })
    const [vatRate, setVatRate] = useState(0.07)
    const [deposit, setDeposit] = useState({ mode: 'percent', value: 50 })
    const [shippingFee, setShippingFee] = useState(0)
    const [note, setNote] = useState('')

    // --- UI States ---
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const [activeSearchIndex, setActiveSearchIndex] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [showMapPopup, setShowMapPopup] = useState(false)
    const [selectedMapLink, setSelectedMapLink] = useState('')
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)

    // --- Effects ---
    useEffect(() => {
        // Load Customers
        const savedCustomers = localStorage.getItem('customers_data')
        setCustomersData(savedCustomers ? JSON.parse(savedCustomers) : MOCK_CUSTOMERS_DATA)

        // Load Products
        const savedProducts = localStorage.getItem('products_data_v3') || localStorage.getItem('products_data')
        setProductsData(savedProducts ? JSON.parse(savedProducts) : MOCK_PRODUCTS_DATA)

        // Load Teams
        const savedTeams = localStorage.getItem('team_data')
        if (savedTeams) {
            const members = JSON.parse(savedTeams)
            const teams = [...new Set(members.filter(m => m.teamType === 'QC' || m.teamType === 'ช่าง').map(m => m.team))]
            setAvailableTeams(teams)
        }
    }, [])

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
                googleMapLink: addr.mapLink || ''
            }))
        }
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
        alert('เพิ่มสินค้าเรียบร้อยแล้ว')
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
            bulbType: product.bulbType, light: product.light,
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

    const handleSaveOrder = () => {
        if (!customer.name) return alert('กรุณากรอกชื่อลูกค้า')
        if (items.length === 0 || !items[0].code) return alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

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
    const outstanding = Math.max(0, total - depositAmount)

    return (
        <div className="min-h-screen bg-secondary-50 pb-20">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileEdit className="text-primary-600" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900">
                                {router.query.id ? `แก้ไขออเดอร์ ${router.query.id}` : 'สร้างออเดอร์ใหม่'}
                            </h1>
                            <p className="text-sm text-secondary-500">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างใบเสนอราคา/ออเดอร์</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/orders')} className="px-4 py-2 text-secondary-600 hover:bg-white/50 rounded-lg font-medium transition-colors">
                            ยกเลิก
                        </button>
                        <button onClick={handleSaveOrder} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-colors">
                            <Save size={20} />
                            บันทึก
                        </button>
                    </div>
                </div>

                {/* 2x2 Grid Section - Flexible Height, Equal per Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Row 1, Col 1: Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col">
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
                        <div className="flex-1 space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ค้นหาลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                    <input
                                        type="text"
                                        value={customer.name}
                                        onChange={e => {
                                            setCustomer({ ...customer, name: e.target.value })
                                            setShowCustomerDropdown(true)
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onClick={() => setShowCustomerDropdown(true)}
                                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="คลิกเพื่อเลือกหรือพิมพ์เพื่อค้นหา..."
                                    />
                                </div>
                                {showCustomerDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {customersData
                                            .filter(c => !customer.name || c.name.toLowerCase().includes(customer.name.toLowerCase()))
                                            .map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                >
                                                    <div className="font-medium text-secondary-900">{c.name}</div>
                                                    <div className="text-xs text-secondary-500">{c.phone}</div>
                                                </div>
                                            ))}
                                        <div
                                            onClick={() => setShowAddCustomerModal(true)}
                                            className="px-4 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100"
                                        >
                                            <UserPlus size={16} /> เพิ่มลูกค้าใหม่
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* Customer Details Card */}
                            {customer.name && (
                                <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-xl p-5 space-y-4">
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
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 space-y-2.5">
                                        <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">ข้อมูลติดต่อ</h4>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Phone size={16} className="text-primary-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-secondary-500">โทรศัพท์</p>
                                                    <p className="text-sm font-medium text-secondary-900 truncate">{customer.phone || '-'}</p>
                                                </div>
                                            </div>
                                            {customer.email && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Mail size={16} className="text-primary-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-secondary-500">อีเมล</p>
                                                        <p className="text-sm font-medium text-secondary-900 truncate">{String(customer.email)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Social Media */}
                                    {(customer.line || customer.facebook || customer.instagram) && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                                            <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">โซเชียลมีเดีย</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {customer.line && (
                                                    <div className="flex items-center gap-2 bg-[#06c755] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                                        <MessageCircle size={14} />
                                                        <span>Line: {String(customer.line)}</span>
                                                    </div>
                                                )}
                                                {customer.facebook && (
                                                    <div className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                                        <Facebook size={14} />
                                                        <span>FB: {String(customer.facebook)}</span>
                                                    </div>
                                                )}
                                                {customer.instagram && (
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                                        <Instagram size={14} />
                                                        <span>IG: {String(customer.instagram)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Row 1, Col 2: Tax Invoice */}
                    {customer.name && customersData.find(c => c.name === customer.name)?.taxInvoices?.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <FileText className="text-primary-600" />
                                ข้อมูลใบกำกับภาษี
                            </h2>

                            <div className="flex-1 space-y-4">
                                {/* Dropdown */}
                                <div className="relative">
                                    <select
                                        value={customersData.find(c => c.name === customer.name)?.taxInvoices?.findIndex(
                                            inv => inv.companyName === taxInvoice.companyName && inv.taxId === taxInvoice.taxId
                                        ) !== -1
                                            ? customersData.find(c => c.name === customer.name)?.taxInvoices?.findIndex(
                                                inv => inv.companyName === taxInvoice.companyName && inv.taxId === taxInvoice.taxId
                                            )
                                            : ''}
                                        onChange={(e) => {
                                            const idx = e.target.value;
                                            if (idx !== '') {
                                                const invoice = customersData.find(c => c.name === customer.name).taxInvoices[idx];
                                                setTaxInvoice({
                                                    companyName: invoice.companyName || '',
                                                    taxId: invoice.taxId || '',
                                                    address: invoice.address || '',
                                                    branch: invoice.branch || 'สำนักงานใหญ่',
                                                    phone: customer.phone || '',
                                                    email: customer.email || '',
                                                    deliveryAddress: invoice.address || ''
                                                });
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                                    >
                                        <option value="">-- เลือกใบกำกับภาษี --</option>
                                        {customersData.find(c => c.name === customer.name)?.taxInvoices?.map((inv, index) => (
                                            <option key={index} value={index}>
                                                {inv.companyName} ({inv.taxId})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                                </div>

                                {/* Selected Details Card */}
                                {taxInvoice.companyName && (
                                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-primary-100 mt-1">
                                                <FileText size={24} className="text-primary-600" />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                {/* Header: Company Name & Branch */}
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

                                                {/* Addresses */}
                                                <div className="grid grid-cols-1 gap-4 pt-3 border-t border-primary-200/50">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">ที่อยู่บริษัท</label>
                                                        <div className="text-sm text-secondary-800 leading-relaxed">
                                                            {typeof taxInvoice.address === 'string' ? taxInvoice.address : JSON.stringify(taxInvoice.address)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">ที่อยู่จัดส่งเอกสาร</label>
                                                        <div className="text-sm text-secondary-800 leading-relaxed">
                                                            {typeof (taxInvoice.deliveryAddress || taxInvoice.address) === 'string'
                                                                ? (taxInvoice.deliveryAddress || taxInvoice.address)
                                                                : JSON.stringify(taxInvoice.deliveryAddress || taxInvoice.address)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Row 2, Col 1: Master Job */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col">
                        <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                            <Wrench className="text-primary-600" />
                            ข้อมูลงานหลัก
                        </h2>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทงาน</label>
                                    <select
                                        value={jobInfo.jobType}
                                        onChange={e => setJobInfo({ ...jobInfo, jobType: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="installation">งานติดตั้ง (Installation)</option>
                                        <option value="delivery">ส่งของ (Delivery)</option>
                                        <option value="separate">งานแยก (Separate)</option>
                                    </select>
                                </div>
                                <div>

                                    <label className="block text-sm font-medium text-secondary-700 mb-1">วันที่นัดหมาย</label>
                                    <input
                                        type="datetime-local"
                                        value={jobInfo.appointmentDate}
                                        onChange={e => setJobInfo({ ...jobInfo, appointmentDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">สถานที่ติดตั้ง / จัดส่ง</label>

                                    {/* Address Dropdown */}
                                    <div className="relative mb-3">
                                        <select
                                            value={customersData.find(c => c.name === customer.name)?.addresses?.findIndex(
                                                addr => addr.label === jobInfo.installLocationName && addr.address === jobInfo.installAddress
                                            ) !== -1
                                                ? customersData.find(c => c.name === customer.name)?.addresses?.findIndex(
                                                    addr => addr.label === jobInfo.installLocationName && addr.address === jobInfo.installAddress
                                                )
                                                : ''}
                                            onChange={(e) => {
                                                const idx = e.target.value;
                                                if (idx !== '') {
                                                    const addr = customersData.find(c => c.name === customer.name).addresses[idx];
                                                    setJobInfo({
                                                        ...jobInfo,
                                                        installLocationName: addr.label || '',
                                                        installAddress: addr.address || '',
                                                        googleMapLink: addr.googleMapsLink || '',
                                                        distance: addr.distance ? `${addr.distance.toFixed(2)} km` : '',
                                                        inspector1: addr.inspector1 ? {
                                                            name: String(addr.inspector1.name || ''),
                                                            phone: String(addr.inspector1.phone || ''),
                                                            address: typeof addr.inspector1.address === 'string' ? addr.inspector1.address : (addr.inspector1.address ? JSON.stringify(addr.inspector1.address) : '')
                                                        } : { name: '', phone: '', address: '' },
                                                        inspector2: addr.inspector2 ? {
                                                            name: String(addr.inspector2.name || ''),
                                                            phone: String(addr.inspector2.phone || ''),
                                                            address: typeof addr.inspector2.address === 'string' ? addr.inspector2.address : (addr.inspector2.address ? JSON.stringify(addr.inspector2.address) : '')
                                                        } : { name: '', phone: '', address: '' }
                                                    });
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                                        >
                                            <option value="">-- เลือกสถานที่ติดตั้ง / จัดส่ง --</option>
                                            {customersData.find(c => c.name === customer.name)?.addresses?.map((addr, index) => (
                                                <option key={index} value={index}>
                                                    {addr.label} - {addr.address}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                                    </div>

                                    {/* Selected Address Details Card */}
                                    {jobInfo.installAddress && (
                                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-primary-100 mt-1">
                                                    <MapPin size={24} className="text-primary-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-secondary-900 text-lg">
                                                            {jobInfo.installLocationName || 'สถานที่ติดตั้ง'}
                                                        </h3>
                                                        {jobInfo.distance && (
                                                            <span className="px-2 py-0.5 bg-success-100 text-success-700 text-xs font-medium rounded-full border border-success-200">
                                                                📍 {jobInfo.distance}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-secondary-800 leading-relaxed mb-3">
                                                        {jobInfo.installAddress}
                                                    </div>

                                                    {/* Google Map Link */}
                                                    <div className="mb-3">
                                                        <label className="block text-xs font-medium text-primary-700 mb-1">
                                                            Google Map Link
                                                        </label>
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={jobInfo.googleMapLink}
                                                            onClick={() => {
                                                                if (jobInfo.googleMapLink) {
                                                                    window.open(jobInfo.googleMapLink, '_blank');
                                                                }
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border border-primary-200 rounded-md focus:ring-2 focus:ring-primary-500 ${jobInfo.googleMapLink ? 'cursor-pointer text-primary-700 bg-white hover:bg-primary-50 hover:border-primary-300' : 'bg-primary-50/50 text-primary-400 cursor-not-allowed'}`}
                                                            placeholder="ไม่มีลิงก์ Google Map"
                                                        />
                                                    </div>



                                                    {/* Inspectors */}
                                                    {(jobInfo.inspector1?.name || jobInfo.inspector2?.name) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-primary-200/50">
                                                            {jobInfo.inspector1?.name && (
                                                                <div className="flex flex-col gap-1 text-sm">
                                                                    <span className="text-xs font-semibold text-primary-700">ผู้ติดต่อ 1</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} className="text-primary-500" />
                                                                        <span className="font-medium text-secondary-900">{String(jobInfo.inspector1.name)}</span>
                                                                        {jobInfo.inspector1.phone && (
                                                                            <span className="text-secondary-600">({String(jobInfo.inspector1.phone)})</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {jobInfo.inspector2?.name && (
                                                                <div className="flex flex-col gap-1 text-sm">
                                                                    <span className="text-xs font-semibold text-primary-700">ผู้ติดต่อ 2</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} className="text-primary-500" />
                                                                        <span className="font-medium text-secondary-900">{String(jobInfo.inspector2.name)}</span>
                                                                        {jobInfo.inspector2.phone && (
                                                                            <span className="text-secondary-600">({String(jobInfo.inspector2.phone)})</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="pt-4 border-t border-secondary-200">
                                <label className="block text-sm font-medium text-secondary-700 mb-2">รายละเอียด</label>
                                <textarea
                                    rows={6}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                />
                            </div>

                            {/* Team Selection */}
                            <div className="pt-4">
                                <label className="block text-sm font-medium text-secondary-700 mb-2">ทีม</label>
                                <div className="relative">
                                    <select
                                        value={jobInfo.team}
                                        onChange={(e) => setJobInfo({ ...jobInfo, team: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                                    >
                                        <option value="">-- เลือกทีม --</option>
                                        {availableTeams.map((team, idx) => (
                                            <option key={idx} value={team}>{team}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Row 2, Col 2: Payment Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col">
                        <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                            <CreditCard className="text-primary-600" />
                            สรุปยอดชำระ
                        </h2>

                        <div className="flex-1 space-y-3 text-sm">
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
                                        className="w-20 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-secondary-900 font-medium pt-2 border-t border-secondary-100">
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

                            <div className="flex justify-between text-xl font-bold text-primary-700 pt-4 border-t border-secondary-200">
                                <span>ยอดรวมทั้งสิ้น</span>
                                <span>{currency(total)}</span>
                            </div>

                            <div className="pt-4 border-t border-secondary-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-secondary-700 font-medium">มัดจำ</span>
                                    <div className="flex gap-1">
                                        <select
                                            value={deposit.mode}
                                            onChange={e => setDeposit({ ...deposit, mode: e.target.value })}
                                            className="border border-secondary-300 rounded text-xs px-1"
                                        >
                                            <option value="percent">%</option>
                                            <option value="amount">฿</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={deposit.value}
                                            onChange={e => setDeposit({ ...deposit, value: Number(e.target.value) })}
                                            className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-secondary-600 text-sm">
                                    <span>ยอดมัดจำที่ต้องชำระ</span>
                                    <span className="font-medium">{currency(depositAmount)}</span>
                                </div>
                                <div className="flex justify-between text-secondary-900 font-bold text-sm">
                                    <span>ยอดคงเหลือ (ชำระวันงาน)</span>
                                    <span>{currency(total - depositAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>


                {/* Bottom Section: Items Table */}
                < div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-visible" >
                    <div className="p-6 border-b border-secondary-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                            <FileText className="text-primary-600" />
                            รายการสินค้า
                        </h2>
                        <button
                            onClick={() => setItems([...items, { code: '', qty: 1, unitPrice: 0 }])}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Plus size={18} /> เพิ่มรายการ
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase w-16">#</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-600 uppercase w-20">งานย่อย</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">สินค้า / รายละเอียด</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase w-24">จำนวน</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase w-32">ราคา/หน่วย</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase w-32">รวม</th>
                                    <th className="px-4 py-3 text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-secondary-50/50">
                                        <td className="px-4 py-3 text-center text-secondary-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-center">
                                            {jobInfo.jobType === 'installation' && (
                                                <div className="flex justify-center" title="งานติดตั้ง">
                                                    <Wrench size={18} className="text-secondary-400" />
                                                </div>
                                            )}
                                            {jobInfo.jobType === 'delivery' && (
                                                <div className="flex justify-center" title="จัดส่ง">
                                                    <Truck size={18} className="text-secondary-400" />
                                                </div>
                                            )}
                                            {jobInfo.jobType === 'separate' && (
                                                <button
                                                    onClick={() => {
                                                        setCurrentSubJobItemIndex(idx)
                                                        setShowSubJobModal(true)
                                                    }}
                                                    className={`flex justify-center w-full hover:bg-secondary-100 p-1 rounded transition-colors ${item.subJob ? 'text-primary-600' : 'text-secondary-400'}`}
                                                    title={item.subJob ? "แก้ไขข้อมูลงานย่อย" : "เพิ่มข้อมูลงานย่อย"}
                                                >
                                                    {item.subJob ? (
                                                        item.subJob.jobType === 'delivery' ? <Truck size={18} /> : <Wrench size={18} />
                                                    ) : <HelpCircle size={18} />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 relative">
                                            <div className="flex items-center gap-2">
                                                <Search size={16} className="text-secondary-400 absolute left-7 top-1/2 -translate-y-1/2 z-10" />
                                                <input
                                                    type="text"
                                                    value={item._searchTerm !== undefined ? item._searchTerm : (item.code ? `${item.code} - ${item.description}` : '')}
                                                    onChange={(e) => {
                                                        console.log('onChange triggered! Value:', e.target.value);
                                                        handleSearchProduct(idx, e.target.value);
                                                    }}
                                                    onFocus={() => {
                                                        const newItems = [...items];
                                                        newItems[idx].showPopup = true;
                                                        setItems(newItems);
                                                    }}
                                                    className="w-full pl-9 pr-4 py-2 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                                                    placeholder="ค้นหารหัสสินค้า หรือ ชื่อสินค้า..."
                                                />
                                            </div>
                                            {/* Product Search Popup */}
                                            {item.showPopup && (
                                                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => {
                                                    const newItems = [...items];
                                                    newItems[idx].showPopup = false;
                                                    setItems(newItems);
                                                }}>
                                                    <div
                                                        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* Header */}
                                                        <div className="px-4 py-3 border-b border-secondary-200 bg-primary-50">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h3 className="font-bold text-secondary-900">เลือกสินค้า</h3>
                                                                <button
                                                                    onClick={() => {
                                                                        const newItems = [...items];
                                                                        newItems[idx].showPopup = false;
                                                                        setItems(newItems);
                                                                    }}
                                                                    className="text-secondary-500 hover:text-secondary-700"
                                                                >
                                                                    <X size={20} />
                                                                </button>
                                                            </div>
                                                            {/* Search input inside popup */}
                                                            <div className="relative">
                                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                                                <input
                                                                    type="text"
                                                                    value={item._searchTerm || ''}
                                                                    onChange={(e) => {
                                                                        const newItems = [...items];
                                                                        newItems[idx]._searchTerm = e.target.value;
                                                                        setItems(newItems);
                                                                    }}
                                                                    placeholder="ค้นหารหัสสินค้า หรือ ชื่อสินค้า..."
                                                                    className="w-full pl-9 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Product List */}
                                                        <div className="flex-1 overflow-y-auto">
                                                            {productsData
                                                                .filter(p => {
                                                                    if (!item._searchTerm) return true;
                                                                    const lowerTerm = item._searchTerm.toLowerCase();
                                                                    return JSON.stringify(p).toLowerCase().includes(lowerTerm);
                                                                })
                                                                .map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            selectProduct(idx, p);
                                                                        }}
                                                                        className="px-4 py-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                    >
                                                                        <div className="grid grid-cols-1 gap-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-bold text-primary-700 text-sm">{String(p.id || '')}</span>
                                                                                <span className="text-xs font-medium text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
                                                                                    {String(p.category || 'ทั่วไป')}
                                                                                </span>
                                                                            </div>
                                                                            {p.description && typeof p.description === 'string' && (
                                                                                <div className="text-xs text-secondary-900 font-medium line-clamp-2">
                                                                                    {p.description}
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center justify-between pt-1">
                                                                                <span className="font-bold text-success-600 text-sm">{currency(p.price)}</span>
                                                                                <span className="text-xs text-secondary-500">คงเหลือ: {p.stock || 0}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>

                                                        {/* Footer - Add New Product */}
                                                        <div
                                                            className="px-4 py-3 bg-secondary-50 text-primary-600 cursor-pointer font-medium flex items-center justify-center gap-2 border-t border-secondary-200 hover:bg-primary-100"
                                                            onClick={() => {
                                                                setNewProduct({
                                                                    id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
                                                                    length: '', width: '', height: '', material: '', color: '', crystalColor: '',
                                                                    bulbType: '', light: '', remote: '', images: []
                                                                });
                                                                setShowProductModal(true);
                                                            }}
                                                        >
                                                            <Plus size={16} />
                                                            เพิ่มสินค้าใหม่
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={e => {
                                                    const newItems = [...items]
                                                    newItems[idx].qty = Number(e.target.value)
                                                    setItems(newItems)
                                                }}
                                                className="w-full px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 text-sm text-right"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={e => {
                                                    const newItems = [...items]
                                                    newItems[idx].unitPrice = Number(e.target.value)
                                                    setItems(newItems)
                                                }}
                                                className="w-full px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 text-sm text-right"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-secondary-900">
                                            {currency(item.qty * item.unitPrice)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    const newItems = items.filter((_, i) => i !== idx)
                                                    setItems(newItems.length ? newItems : [{ code: '', qty: 1, unitPrice: 0 }])
                                                }}
                                                className="text-secondary-400 hover:text-danger-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                customersData={customersData}
                customerName={customer.name}
                availableTeams={availableTeams}
            />
        </div >
    )
}
