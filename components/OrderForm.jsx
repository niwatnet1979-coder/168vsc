import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
    Home, ArrowLeft, Save, UserPlus, Search, MapPin, Calendar,
    X, Plus, Trash2, Truck, Wrench, FileText, CreditCard,
    User, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react'
import { MOCK_CUSTOMERS_DATA, MOCK_PRODUCTS_DATA, SHOP_LAT, SHOP_LON } from '../lib/mockData'

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
        name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
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
            contact1: c.contact1 || { name: '', phone: '' },
            contact2: c.contact2 || { name: '', phone: '' }
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

    const handleSearchProduct = (index, term) => {
        const newItems = [...items]
        newItems[index]._searchTerm = term
        setItems(newItems)
        setActiveSearchIndex(index)

        if (term.trim()) {
            const lowerTerm = term.toLowerCase()
            const results = productsData.filter(p => {
                // Deep search: Convert entire object to string to search everywhere (including nested props)
                return JSON.stringify(p).toLowerCase().includes(lowerTerm)
            }).slice(0, 10)

            // Debugging
            console.log(`Searching for: "${lowerTerm}", Found: ${results.length} items from ${productsData.length} total products`)
            setSearchResults(results)
        } else {
            setSearchResults([])
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
            bulbType: product.bulbType, light: product.light,
            _searchTerm: ''
        }
        setItems(newItems)
        setActiveSearchIndex(null)
    }

    const handleSaveOrder = () => {
        if (!customer.name) return alert('กรุณากรอกชื่อลูกค้า')
        if (items.length === 0 || !items[0].code) return alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

        const savedOrders = localStorage.getItem('orders_data')
        const orders = savedOrders ? JSON.parse(savedOrders) : []

        const orderId = router.query.id || `ORD-${String(orders.length + 1).padStart(3, '0')}`

        const newOrder = {
            id: orderId,
            date: jobInfo.orderDate,
            customer: customer.name,
            customerDetails: customer,
            items: items,
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
        alert('บันทึกออเดอร์เรียบร้อย')
        router.push('/orders')
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
            {/* Header */}
            <div className="bg-white border-b border-secondary-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-secondary-100 rounded-lg text-secondary-600 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900">
                                {router.query.id ? `แก้ไขออเดอร์ ${router.query.id}` : 'สร้างออเดอร์ใหม่'}
                            </h1>
                            <p className="text-sm text-secondary-500">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างใบเสนอราคา/ออเดอร์</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/orders')} className="px-4 py-2 text-secondary-600 hover:bg-secondary-100 rounded-lg font-medium transition-colors">
                            ยกเลิก
                        </button>
                        <button onClick={handleSaveOrder} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-colors">
                            <Save size={20} />
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Customer Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <User className="text-primary-600" />
                                ข้อมูลลูกค้า
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
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
                                                onClick={() => router.push(`/customers/new?returnUrl=${router.asPath}`)}
                                                className="px-4 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100"
                                            >
                                                <UserPlus size={16} /> เพิ่มลูกค้าใหม่
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Details Card */}
                                {customer.name && (
                                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            {/* Main Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="text-primary-600" size={20} />
                                                    <h3 className="font-bold text-secondary-900 text-lg">{customer.name}</h3>
                                                </div>
                                                <div className="space-y-1 text-sm text-secondary-700">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-secondary-500" />
                                                        <span>{customer.phone || '-'}</span>
                                                    </div>
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} className="text-secondary-500" />
                                                            <span>{customer.email}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Social Media */}
                                                <div className="flex items-center gap-3 mt-3">
                                                    {customer.line && (
                                                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                            <MessageCircle size={12} /> Line: {customer.line}
                                                        </div>
                                                    )}
                                                    {customer.facebook && (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                            <Facebook size={12} /> FB: {customer.facebook}
                                                        </div>
                                                    )}
                                                    {customer.instagram && (
                                                        <div className="flex items-center gap-1 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                                            <Instagram size={12} /> IG: {customer.instagram}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contacts */}
                                            {(customer.contact1?.name || customer.contact2?.name) && (
                                                <div className="flex-1 md:border-l md:border-primary-200 md:pl-4 space-y-3">
                                                    <h4 className="font-semibold text-secondary-900 text-sm mb-2">ผู้ติดต่อ</h4>
                                                    {customer.contact1?.name && (
                                                        <div className="bg-white p-2 rounded border border-secondary-200 text-sm">
                                                            <div className="font-medium text-secondary-900">{customer.contact1.name}</div>
                                                            <div className="text-secondary-500 text-xs">{customer.contact1.phone}</div>
                                                        </div>
                                                    )}
                                                    {customer.contact2?.name && (
                                                        <div className="bg-white p-2 rounded border border-secondary-200 text-sm">
                                                            <div className="font-medium text-secondary-900">{customer.contact2.name}</div>
                                                            <div className="text-secondary-500 text-xs">{customer.contact2.phone}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tax Invoice Selection - Show when customer has tax invoices */}
                        {customer.name && customersData.find(c => c.name === customer.name)?.taxInvoices?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-primary-600" />
                                    เลือกข้อมูลใบกำกับภาษี
                                </h2>

                                <div className="space-y-4">
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-primary-200/50">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">ที่อยู่บริษัท</label>
                                                            <div className="text-sm text-secondary-800 leading-relaxed">
                                                                {taxInvoice.address}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">ที่อยู่จัดส่งเอกสาร</label>
                                                            <div className="text-sm text-secondary-800 leading-relaxed">
                                                                {taxInvoice.deliveryAddress || taxInvoice.address}
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

                        {/* Master Job */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <Wrench className="text-primary-600" />
                                ข้อมูลงานหลัก
                            </h2>
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
                                        type="date"
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
                                                        inspector1: addr.inspector1 || { name: '', phone: '' },
                                                        inspector2: addr.inspector2 || { name: '', phone: '' }
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
                                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
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

                                                    {/* Inspectors */}
                                                    {(jobInfo.inspector1?.name || jobInfo.inspector2?.name) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-primary-200/50">
                                                            {jobInfo.inspector1?.name && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <User size={14} className="text-secondary-500" />
                                                                    <span className="font-medium text-secondary-700">{jobInfo.inspector1.name}</span>
                                                                    <span className="text-secondary-500">({jobInfo.inspector1.phone})</span>
                                                                </div>
                                                            )}
                                                            {jobInfo.inspector2?.name && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <User size={14} className="text-secondary-500" />
                                                                    <span className="font-medium text-secondary-700">{jobInfo.inspector2.name}</span>
                                                                    <span className="text-secondary-500">({jobInfo.inspector2.phone})</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Google Map Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={jobInfo.googleMapLink}
                                            onClick={() => {
                                                if (jobInfo.googleMapLink) {
                                                    window.open(jobInfo.googleMapLink, '_blank');
                                                }
                                            }}
                                            className={`w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 ${jobInfo.googleMapLink ? 'cursor-pointer text-primary-600 hover:bg-primary-50 hover:border-primary-300' : 'bg-secondary-50 text-secondary-400 cursor-not-allowed'}`}
                                            placeholder="เลือกสถานที่เพื่อแสดง Google Map Link"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-visible">
                            <div className="p-6 border-b border-secondary-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                                    <FileText className="text-primary-600" />
                                    รายการสินค้า
                                </h2>
                                <button
                                    onClick={() => setItems([...items, { code: '', qty: 1, unitPrice: 0, _searchTerm: '' }])}
                                    className="text-primary-600 hover:bg-primary-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                >
                                    + เพิ่มรายการ
                                </button>
                            </div>
                            <div className="overflow-visible">
                                <table className="w-full min-w-[800px]">
                                    <thead className="bg-secondary-50 border-b border-secondary-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase w-16">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">รหัสสินค้า / รายละเอียด</th>
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
                                                <td className="px-4 py-3 relative">
                                                    <input
                                                        type="text"
                                                        value={item._searchTerm !== undefined ? item._searchTerm : (item.code ? `${item.code} - ${item.name || item.description}` : '')}
                                                        onChange={e => handleSearchProduct(idx, e.target.value)}
                                                        onFocus={() => handleSearchProduct(idx, item._searchTerm || '')}
                                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                                        placeholder="ค้นหารหัสสินค้า หรือ ชื่อสินค้า..."
                                                    />
                                                    {activeSearchIndex === idx && searchResults.length > 0 && (
                                                        <div className="absolute z-50 left-0 top-full mt-1 w-96 bg-white border border-secondary-200 rounded-xl shadow-xl max-h-80 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                                            {searchResults.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => selectProduct(idx, p)}
                                                                    className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-0 group transition-colors"
                                                                >
                                                                    <div className="grid grid-cols-1 gap-0.5">
                                                                        {/* Line 1: Code */}
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-primary-700 text-sm">{p.id}</span>
                                                                            <span className="text-xs font-medium text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">{p.category || 'ทั่วไป'}</span>
                                                                        </div>
                                                                        {/* Line 2: Name */}
                                                                        <div className="text-sm text-secondary-900 font-medium truncate" title={p.name}>
                                                                            {p.name}
                                                                        </div>
                                                                        {/* Line 3: Price */}
                                                                        <div className="text-xs text-secondary-600 flex items-center gap-2">
                                                                            <span className="font-semibold text-success-600">{currency(p.price)}</span>
                                                                            <span className="text-secondary-400">/ {p.unit || 'ชิ้น'}</span>
                                                                        </div>
                                                                        {/* Line 4: Stock/Details */}
                                                                        <div className="text-[10px] text-secondary-400 flex items-center gap-2 truncate">
                                                                            <span>คงเหลือ: {p.stock || 0}</span>
                                                                            <span>•</span>
                                                                            <span>{p.brand || '-'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div
                                                                className="px-4 py-3 bg-secondary-50 text-primary-600 cursor-pointer text-sm font-medium hover:bg-primary-50 flex items-center justify-center gap-2 border-t border-secondary-200 sticky bottom-0"
                                                                onClick={() => window.open('/products', '_blank')}
                                                            >
                                                                <Plus size={16} />
                                                                เพิ่มสินค้าใหม่
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
                        </div>
                    </div>

                    {/* Right Column (Summary) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <CreditCard className="text-primary-600" />
                                สรุปยอดชำระ
                            </h2>

                            <div className="space-y-3 text-sm">
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
                                                className="w-20 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-secondary-600 text-sm">
                                        <span>ยอดมัดจำที่ต้องชำระ</span>
                                        <span>{currency(depositAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-danger-600 font-bold mt-2">
                                        <span>ยอดคงเหลือ (ชำระวันงาน)</span>
                                        <span>{currency(outstanding)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4">หมายเหตุ</h2>
                            <textarea
                                rows={4}
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                placeholder="รายละเอียดเพิ่มเติม..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Popup Modal */}
            {showMapPopup && (
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
            )}
        </div>
    )
}
