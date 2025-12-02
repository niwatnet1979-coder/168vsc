import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
    Home, ArrowLeft, Save, UserPlus, Search, MapPin, Calendar,
    X, Plus, Trash2, Truck, Wrench, FileText, CreditCard,
    User, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, AlertCircle
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
            const results = productsData.filter(p =>
                p.id.toLowerCase().includes(lowerTerm) ||
                p.name.toLowerCase().includes(lowerTerm) ||
                (p.category && p.category.toLowerCase().includes(lowerTerm))
            ).slice(0, 10)
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
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
                                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="ค้นหาลูกค้า..."
                                        />
                                    </div>
                                    {showCustomerDropdown && customer.name && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customersData
                                                .filter(c => c.name.toLowerCase().includes(customer.name.toLowerCase()))
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
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทรศัพท์</label>
                                    <input
                                        type="text"
                                        value={customer.phone}
                                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                {/* Social Media & Contacts can be added here similarly */}
                            </div>
                        </div>

                        {/* Job Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <Wrench className="text-primary-600" />
                                ข้อมูลงาน / การจัดส่ง
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
                                        <option value="pickup">รับเอง (Pickup)</option>
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
                                    <textarea
                                        rows={2}
                                        value={jobInfo.installAddress}
                                        onChange={e => setJobInfo({ ...jobInfo, installAddress: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="ที่อยู่..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Google Map Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={jobInfo.googleMapLink}
                                            onChange={e => setJobInfo({ ...jobInfo, googleMapLink: e.target.value })}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="https://maps.google.com/..."
                                        />
                                        {jobInfo.distance && (
                                            <div className="flex-shrink-0 px-4 py-2 bg-secondary-100 rounded-lg text-secondary-700 font-medium">
                                                {jobInfo.distance} km
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
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
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead className="bg-secondary-50 border-b border-secondary-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase w-16">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase w-32">รหัสสินค้า</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">รายละเอียด</th>
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
                                                        value={item._searchTerm || item.code}
                                                        onChange={e => handleSearchProduct(idx, e.target.value)}
                                                        className="w-full px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                                                        placeholder="ค้นหา..."
                                                    />
                                                    {activeSearchIndex === idx && searchResults.length > 0 && (
                                                        <div className="absolute z-20 left-0 top-full mt-1 w-64 bg-white border border-secondary-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                            {searchResults.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => selectProduct(idx, p)}
                                                                    className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 text-sm"
                                                                >
                                                                    <div className="font-bold text-primary-600">{p.id}</div>
                                                                    <div className="text-secondary-600 truncate">{p.name}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={e => {
                                                            const newItems = [...items]
                                                            newItems[idx].description = e.target.value
                                                            setItems(newItems)
                                                        }}
                                                        className="w-full px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                                                    />
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
        </div>
    )
}
