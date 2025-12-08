import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import CustomerModal from '../components/CustomerModal'

import {
    Search,
    UserPlus,
    Edit2,
    Trash2,
    Users,
    Phone,
    Mail,
    MessageCircle,
    Facebook,
    Instagram,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw,
    User,
    FileText,
    MapPin,
    Plus,
    Building2,
    Home,
    Menu
} from 'lucide-react'

export default function CustomersPage() {
    const [customers, setCustomers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState('customer')
    const itemsPerPage = 10

    // Customer Info
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
        line: '',
        facebook: '',
        instagram: '',
        mediaSource: '',
        mediaSourceOther: '',
        contact1: { name: '', phone: '' },
        contact2: { name: '', phone: '' }
    })

    // Tax Invoice Info (Multiple)
    const [taxInvoices, setTaxInvoices] = useState([
        { id: 1, companyName: '', taxId: '', address: '' }
    ])

    // Installation/Delivery Addresses (Multiple)
    const [addresses, setAddresses] = useState([
        {
            id: 1,
            label: '',
            address: '',
            province: '',
            postalCode: '',
            inspector1: { name: '', phone: '' },
            inspector2: { name: '', phone: '' },
            googleMapsLink: '',
            distance: null
        }
    ])

    // Helper function to extract coordinates from Google Maps link
    const extractCoordinatesFromLink = (link) => {
        if (!link) return null

        // Pattern 1: https://maps.google.com/?q=13.7563,100.5018
        const pattern1 = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
        const match1 = link.match(pattern1)
        if (match1) {
            return { lat: parseFloat(match1[1]), lon: parseFloat(match1[2]) }
        }

        // Pattern 2: https://www.google.com/maps/@13.7563,100.5018,17z
        const pattern2 = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
        const match2 = link.match(pattern2)
        if (match2) {
            return { lat: parseFloat(match2[1]), lon: parseFloat(match2[2]) }
        }

        // Pattern 3: https://www.google.com/maps/place/.../@13.7563,100.5018
        const pattern3 = /@(-?\d+\.?\d*),(-?\d+\.?\d*),/
        const match3 = link.match(pattern3)
        if (match3) {
            return { lat: parseFloat(match3[1]), lon: parseFloat(match3[2]) }
        }

        return null
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Shop coordinates (from mockData.js)
    const SHOP_LAT = 13.9647757
    const SHOP_LON = 100.6203268


    // Load data
    useEffect(() => {
        const savedData = localStorage.getItem('customers_data')
        if (savedData) {
            setCustomers(JSON.parse(savedData))
        } else {
            setCustomers([])
            localStorage.setItem('customers_data', JSON.stringify([]))
        }
    }, [])

    // Save data
    useEffect(() => {
        if (customers.length > 0) {
            localStorage.setItem('customers_data', JSON.stringify(customers))
        }
    }, [customers])

    const handleAdd = () => {
        setEditingCustomer(null)
        setActiveTab('customer')
        setCustomerData({
            name: '',
            phone: '',
            email: '',
            line: '',
            facebook: '',
            instagram: '',
            mediaSource: '',
            mediaSourceOther: '',
            contact1: { name: '', phone: '' },
            contact2: { name: '', phone: '' }
        })
        setTaxInvoices([{ id: 1, companyName: '', taxId: '', address: '' }])
        setAddresses([{ id: 1, label: '', address: '', province: '', postalCode: '', contactName: '', contactPhone: '' }])
        setShowModal(true)
    }

    const handleEdit = (customer) => {
        setEditingCustomer(customer)
        setActiveTab('customer')
        setCustomerData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            line: customer.line || '',
            facebook: customer.facebook || '',
            instagram: customer.instagram || '',
            mediaSource: customer.mediaSource || '',
            mediaSourceOther: customer.mediaSourceOther || '',
            contact1: customer.contact1 || { name: '', phone: '' },
            contact2: customer.contact2 || { name: '', phone: '' }
        })
        setTaxInvoices(customer.taxInvoices && customer.taxInvoices.length > 0
            ? customer.taxInvoices
            : [{ id: 1, companyName: '', taxId: '', address: '' }])
        setAddresses(customer.addresses && customer.addresses.length > 0
            ? customer.addresses.map(addr => ({
                ...addr,
                inspector1: addr.inspector1 || { name: '', phone: '' },
                inspector2: addr.inspector2 || { name: '', phone: '' },
                googleMapsLink: addr.googleMapsLink || '',
                distance: addr.distance || null
            }))
            : [{
                id: 1,
                label: '',
                address: '',
                province: '',
                postalCode: '',
                inspector1: { name: '', phone: '' },
                inspector2: { name: '', phone: '' },
                googleMapsLink: '',
                distance: null
            }])
        setShowModal(true)
    }

    const handleDelete = (id) => {
        if (confirm('คุณต้องการลบข้อมูลลูกค้านี้หรือไม่?')) {
            setCustomers(customers.filter(c => c.id !== id))
        }
    }

    const handleSave = () => {
        if (!customerData.name || !customerData.phone) {
            alert('กรุณากรอกชื่อและเบอร์โทรศัพท์')
            return
        }

        const customerToSave = {
            ...customerData,
            taxInvoices: taxInvoices.filter(t => t.companyName || t.taxId || t.address),
            addresses: addresses.filter(a => a.address || a.label)
        }

        if (editingCustomer) {
            setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...customerToSave, id: c.id } : c))
        } else {
            const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1
            setCustomers([...customers, { ...customerToSave, id: newId }])
        }
        setShowModal(false)
    }

    // Tax Invoice Functions
    const addTaxInvoice = () => {
        const newId = taxInvoices.length > 0 ? Math.max(...taxInvoices.map(t => t.id)) + 1 : 1
        setTaxInvoices([...taxInvoices, { id: newId, companyName: '', taxId: '', address: '' }])
    }

    const removeTaxInvoice = (id) => {
        if (taxInvoices.length > 1) {
            setTaxInvoices(taxInvoices.filter(t => t.id !== id))
        }
    }

    // Helper to format address from granular fields
    const formatAddress = (data, prefix = '') => {
        const parts = []
        if (data[`${prefix}addrNumber`]) parts.push(`เลขที่ ${data[`${prefix}addrNumber`]}`)
        if (data[`${prefix}addrMoo`]) parts.push(`หมู่ ${data[`${prefix}addrMoo`]}`)
        if (data[`${prefix}addrVillage`]) parts.push(`${data[`${prefix}addrVillage`]}`)
        if (data[`${prefix}addrSoi`]) parts.push(`ซอย ${data[`${prefix}addrSoi`]}`)
        if (data[`${prefix}addrRoad`]) parts.push(`ถนน ${data[`${prefix}addrRoad`]}`)
        if (data[`${prefix}addrTambon`]) parts.push(`แขวง/ตำบล ${data[`${prefix}addrTambon`]}`)
        if (data[`${prefix}addrAmphoe`]) parts.push(`เขต/อำเภอ ${data[`${prefix}addrAmphoe`]}`)
        if (data[`${prefix}addrProvince`]) parts.push(`จังหวัด ${data[`${prefix}addrProvince`]}`)
        if (data[`${prefix}addrZipcode`]) parts.push(`${data[`${prefix}addrZipcode`]}`)
        return parts.join(' ')
    }

    const updateTaxInvoice = (id, field, value) => {
        setTaxInvoices(taxInvoices.map(t => {
            if (t.id === id) {
                const updated = { ...t, [field]: value }

                // Auto-update full address string if granular fields change
                if (field.startsWith('addr')) {
                    updated.address = formatAddress(updated)
                }
                // Auto-update delivery address string if granular fields change
                if (field.startsWith('deliveryAddr')) {
                    updated.deliveryAddress = formatAddress(updated, 'delivery')
                }

                return updated
            }
            return t
        }))
    }

    // Address Functions
    const addAddress = () => {
        const newId = addresses.length > 0 ? Math.max(...addresses.map(a => a.id)) + 1 : 1
        setAddresses([...addresses, {
            id: newId,
            label: '',
            address: '',
            // Granular fields
            addrNumber: '', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: '',
            addrTambon: '', addrAmphoe: '', addrProvince: '', addrZipcode: '',
            province: '',
            postalCode: '',
            inspector1: { name: '', phone: '' },
            inspector2: { name: '', phone: '' },
            googleMapsLink: '',
            distance: null
        }])
    }

    const removeAddress = (id) => {
        if (addresses.length > 1) {
            setAddresses(addresses.filter(a => a.id !== id))
        }
    }

    const updateAddress = (id, field, value) => {
        setAddresses(addresses.map(a => {
            if (a.id === id) {
                const updated = { ...a, [field]: value }

                // Auto-update full address string if granular fields change
                if (field.startsWith('addr')) {
                    updated.address = formatAddress(updated)
                    // Also update legacy province/postalCode if available
                    if (field === 'addrProvince') updated.province = value
                    if (field === 'addrZipcode') updated.postalCode = value
                }

                // If updating Google Maps link, calculate distance
                if (field === 'googleMapsLink') {
                    const coords = extractCoordinatesFromLink(value)
                    if (coords) {
                        const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
                        updated.distance = dist
                    } else {
                        updated.distance = null
                    }
                }

                return updated
            }
            return a
        }))
    }

    const handleResetData = () => {
        if (confirm('คุณต้องการรีเซ็ตข้อมูลลูกค้าทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            setCustomers([])
            localStorage.setItem('customers_data', JSON.stringify([]))
            alert('รีเซ็ตข้อมูลลูกค้าเรียบร้อยแล้ว')
        }
    }

    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.toLowerCase()
        return (
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.phone && c.phone.toLowerCase().includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term))
        )
    })

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const tabs = [
        { id: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
        { id: 'tax', label: 'ข้อมูลใบกำกับภาษี', icon: FileText },
        { id: 'address', label: 'ที่อยู่ติดตั้ง/จัดส่ง', icon: MapPin }
    ]

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                    <Users className="text-primary-600" size={28} />
                                    จัดการลูกค้า
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">ทั้งหมด {filteredCustomers.length} รายการ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleResetData}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 font-medium"
                            >
                                <RotateCcw size={18} />
                                Reset Data
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                            >
                                <UserPlus size={18} />
                                เพิ่มลูกค้าใหม่
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>จัดการลูกค้า - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, เบอร์โทร, หรืออีเมล..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                        className="w-full pl-11 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">ชื่อลูกค้า</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">เบอร์โทร</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Social</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">ผู้ติดต่อ</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">สื่อ</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedCustomers.length > 0 ? (
                                    paginatedCustomers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-secondary-900">{customer.name}</div>
                                                    {customer.email && (
                                                        <span className="text-xs text-secondary-500 flex items-center gap-1 mt-1">
                                                            <Mail size={12} /> {customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-secondary-700">
                                                    <Phone size={14} className="text-secondary-400" />
                                                    {customer.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {customer.line && (
                                                        <span className="p-1.5 bg-[#06c755]/10 text-[#06c755] rounded-lg" title={`Line: ${customer.line}`}>
                                                            <MessageCircle size={16} />
                                                        </span>
                                                    )}
                                                    {customer.facebook && (
                                                        <span className="p-1.5 bg-[#1877f2]/10 text-[#1877f2] rounded-lg" title={`FB: ${customer.facebook}`}>
                                                            <Facebook size={16} />
                                                        </span>
                                                    )}
                                                    {customer.instagram && (
                                                        <span className="p-1.5 bg-[#e4405f]/10 text-[#e4405f] rounded-lg" title={`IG: ${customer.instagram}`}>
                                                            <Instagram size={16} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">
                                                    {customer.contact1?.name ? (
                                                        <div className="flex flex-col">
                                                            <span>{customer.contact1.name}</span>
                                                            <span className="text-xs text-secondary-400">{customer.contact1.phone}</span>
                                                        </div>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                                                    {customer.mediaSource === 'อื่นๆระบุ' ? customer.mediaSourceOther : (customer.mediaSource || '-')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลลูกค้า</p>
                                                <p className="text-sm text-secondary-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มลูกค้าใหม่</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between bg-secondary-50">
                            <div className="text-sm text-secondary-600">
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} จาก {filteredCustomers.length} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium text-secondary-700 px-2">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Customer Modal */}
            <CustomerModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                customer={editingCustomer}
                onSave={(savedCustomer) => {
                    if (editingCustomer) {
                        // Update existing customer
                        const updatedCustomers = customers.map(c =>
                            c.id === editingCustomer.id ? { ...c, ...savedCustomer } : c
                        )
                        setCustomers(updatedCustomers)
                        localStorage.setItem('customers_data', JSON.stringify(updatedCustomers))
                    } else {
                        // Add new customer
                        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1
                        const newCustomer = { ...savedCustomer, id: newId }
                        const updatedCustomers = [...customers, newCustomer]
                        setCustomers(updatedCustomers)
                        localStorage.setItem('customers_data', JSON.stringify(updatedCustomers))
                    }
                    setShowModal(false)
                    setEditingCustomer(null)
                }}
            />
        </AppLayout>
    )
}
